import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isInsideRoot, loadProjectBinding } from "./runtime-config.mjs";

const SUPPORTED_OPERATIONS = new Set([
  "review_queue_append",
  "manual_override_append",
]);
const MAX_ENTRY_BYTES = 50_000;
const MAX_PREVIEWS = 100;
const PREVIEW_TTL_MS = 10 * 60 * 1000;
const issuedPreviews = new Map();

export class SafeWriteError extends Error {
  constructor(code, status = 400, details = {}) {
    super(code);
    this.name = "SafeWriteError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function previewCurationOperation(projectRootInput, operation) {
  pruneIssuedPreviews();
  const binding = loadProjectBinding(projectRootInput);
  const normalizedOperation = normalizeOperation(operation);
  const previewId = crypto.randomBytes(32).toString("hex");
  const issuedAt = new Date().toISOString();
  const plan = buildPlan(binding, normalizedOperation, previewId, issuedAt);

  issuedPreviews.set(previewId, {
    operationHash: hashJson(normalizedOperation),
    planHash: hashIssuedPlan(binding, plan),
    issuedAt,
    expiresAt: Date.now() + PREVIEW_TTL_MS,
    affectedFiles: plan.affectedFiles.map(toIssuedFileRecord),
  });

  return {
    ok: true,
    readOnly: true,
    previewId,
    operationId: plan.operationId,
    operation: normalizedOperation,
    affectedFiles: plan.affectedFiles.map(toPublicAffectedFile),
    backupsPlanned: plan.backupsPlanned,
    applyRequires: {
      confirmed: true,
      previewId,
    },
  };
}

export function applyCurationOperation(projectRootInput, request) {
  pruneIssuedPreviews();
  if (!request?.confirmed) {
    throw new SafeWriteError("CURATION_CONFIRMATION_REQUIRED", 400);
  }

  if (
    typeof request.previewId !== "string" ||
    !/^[a-f0-9]{64}$/.test(request.previewId)
  ) {
    throw new SafeWriteError("CURATION_PREVIEW_MISMATCH", 409);
  }

  const issued = issuedPreviews.get(request.previewId);
  if (!issued) {
    throw new SafeWriteError("CURATION_PREVIEW_MISMATCH", 409);
  }

  const binding = loadProjectBinding(projectRootInput);
  const normalizedOperation = normalizeOperation(request.operation);
  if (hashJson(normalizedOperation) !== issued.operationHash) {
    throw new SafeWriteError("CURATION_PREVIEW_MISMATCH", 409);
  }

  const plan = buildPlan(
    binding,
    normalizedOperation,
    request.previewId,
    issued.issuedAt,
  );
  if (
    issued.planHash !== hashIssuedPlan(binding, plan) ||
    !sameIssuedFiles(issued.affectedFiles, plan.affectedFiles)
  ) {
    throw new SafeWriteError("CURATION_PREVIEW_STALE", 409);
  }

  const written = [];
  for (const file of plan.affectedFiles) {
    createBackup(file, plan.operationId, binding.projectRoot);
    atomicWrite(file.absolutePath, file.nextContent, binding.projectRoot);
    written.push({
      path: file.path,
      backupPath: file.backupPath,
      bytesWritten: Buffer.byteLength(file.nextContent, "utf8"),
    });
  }

  issuedPreviews.delete(request.previewId);
  return {
    ok: true,
    applied: true,
    operationId: plan.operationId,
    written,
    logPath: toRelative(binding.projectRoot, adminLogPath(binding)),
  };
}

function buildPlan(binding, operation, previewId, issuedAt) {
  requireWritableBinding(binding);
  const target = targetForOperation(binding, operation.type);
  const current = readJsonArtifact(target.absolutePath, target.emptyValue);
  const nextValue = appendEntry(
    current.value,
    target.collectionKey,
    operation.entry,
  );
  const nextContent = `${JSON.stringify(nextValue, null, 2)}\n`;
  const operationId = hashJson({
    operation,
    previewId,
    target: target.relativePath,
  });
  const targetFile = affectedFile(
    binding,
    target.relativePath,
    target.absolutePath,
    current.content,
    nextContent,
    current.exists,
    operationId,
  );

  const logAbsolutePath = adminLogPath(binding);
  const logRelativePath = toRelative(binding.projectRoot, logAbsolutePath);
  ensureWritableTarget(binding, logAbsolutePath, logRelativePath);
  const logCurrent = readTextArtifact(logAbsolutePath);
  const logBackupPath = backupPathFor(
    binding,
    operationId,
    logRelativePath,
    logCurrent.exists,
  );
  const logEntry = makeAdminLogEntry(issuedAt, operation, operationId, [
    { path: targetFile.path, backupPath: targetFile.backupPath },
    { path: logRelativePath, backupPath: logBackupPath.relativePath },
  ]);
  const logFile = affectedFile(
    binding,
    logRelativePath,
    logAbsolutePath,
    logCurrent.content,
    `${logCurrent.content}${logEntry}`,
    logCurrent.exists,
    operationId,
    logBackupPath,
  );
  const affectedFiles = [targetFile, logFile];

  return {
    operationId,
    affectedFiles,
    backupsPlanned: affectedFiles.map((file) => ({
      sourcePath: file.path,
      backupPath: file.backupPath,
    })),
  };
}

function affectedFile(
  binding,
  relativePath,
  absolutePath,
  baseContent,
  nextContent,
  existed,
  operationId,
  providedBackupPath,
) {
  const backupPath =
    providedBackupPath ??
    backupPathFor(binding, operationId, relativePath, existed);
  return {
    path: relativePath,
    absolutePath,
    baseContent,
    nextContent,
    baseHash: hashText(baseContent),
    nextHash: hashText(nextContent),
    action: existed ? "append" : "create",
    backupPath: backupPath.relativePath,
    backupAbsolutePath: backupPath.absolutePath,
    existed,
  };
}

function normalizeOperation(operation) {
  if (!operation || typeof operation !== "object" || Array.isArray(operation)) {
    throw new SafeWriteError("CURATION_OPERATION_INVALID", 400);
  }

  if (!SUPPORTED_OPERATIONS.has(operation.type)) {
    throw new SafeWriteError("CURATION_OPERATION_UNSUPPORTED", 400);
  }

  const actor = normalizeString(operation.actor, "actor", "local-admin");
  const entry = normalizeEntry(operation.entry);
  return {
    type: operation.type,
    actor,
    entry,
  };
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new SafeWriteError("CURATION_ENTRY_INVALID", 400);
  }

  const encoded = JSON.stringify(entry);
  if (Buffer.byteLength(encoded, "utf8") > MAX_ENTRY_BYTES) {
    throw new SafeWriteError("CURATION_ENTRY_TOO_LARGE", 413);
  }

  return JSON.parse(encoded);
}

function normalizeString(value, field, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    throw new SafeWriteError("CURATION_FIELD_INVALID", 400, { field });
  }

  return value.replace(/[\r\n]/g, " ").slice(0, 200);
}

function requireWritableBinding(binding) {
  if (!binding.config) {
    throw new SafeWriteError("CURATION_BINDING_REQUIRED", 400);
  }

  if (!binding.writeWhitelist || binding.writeWhitelist.length === 0) {
    throw new SafeWriteError("CURATION_WRITE_WHITELIST_REQUIRED", 403);
  }

  for (const record of [binding.paths.adminRoot, binding.paths.backupRoot]) {
    if (!record?.valid) {
      throw new SafeWriteError("CURATION_TARGET_INVALID", 403);
    }
  }

  rejectRootOverlaps(binding);
}

function rejectRootOverlaps(binding) {
  const writeRoots = [binding.paths.adminRoot, binding.paths.backupRoot];
  const protectedRoots = [binding.paths.wikiRoot, ...binding.rawSourceRoots];
  for (const writeRoot of writeRoots) {
    for (const protectedRoot of protectedRoots) {
      if (!writeRoot?.resolved || !protectedRoot?.resolved) continue;
      if (pathsOverlap(writeRoot.resolved, protectedRoot.resolved)) {
        throw new SafeWriteError("CURATION_ROOT_OVERLAPS_SOURCE", 403, {
          writeRoot: writeRoot.path,
          protectedRoot: protectedRoot.path,
        });
      }
    }
  }
}

function pathsOverlap(left, right) {
  return isInsideRoot(left, right) || isInsideRoot(right, left);
}

function targetForOperation(binding, type) {
  if (type === "review_queue_append") {
    return targetRecord(binding, "review-queue.json", "items", { items: [] });
  }

  return targetRecord(binding, "manual-overrides.json", "overrides", {
    overrides: [],
  });
}

function targetRecord(binding, fileName, collectionKey, emptyValue) {
  const absolutePath = path.join(binding.paths.adminRoot.resolved, fileName);
  const relativePath = toRelative(binding.projectRoot, absolutePath);
  ensureWritableTarget(binding, absolutePath, relativePath);
  return {
    absolutePath,
    relativePath,
    collectionKey,
    emptyValue,
  };
}

function ensureWritableTarget(binding, absolutePath, relativePath) {
  if (!isInsideRoot(absolutePath, binding.projectRoot)) {
    throw new SafeWriteError("CURATION_TARGET_OUTSIDE_PROJECT", 403);
  }

  if (hasUnsafePath(relativePath)) {
    throw new SafeWriteError("CURATION_TARGET_INVALID", 403);
  }

  inspectExistingPath(absolutePath, binding.projectRoot);
  if (!matchesWriteWhitelist(relativePath, binding.writeWhitelist)) {
    throw new SafeWriteError("CURATION_TARGET_NOT_WHITELISTED", 403, {
      path: relativePath,
    });
  }
}

function readJsonArtifact(absolutePath, emptyValue) {
  if (!fs.existsSync(absolutePath)) {
    return {
      exists: false,
      content: "",
      value: emptyValue,
    };
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  try {
    return {
      exists: true,
      content,
      value: JSON.parse(content),
    };
  } catch {
    throw new SafeWriteError("CURATION_JSON_INVALID", 400);
  }
}

function readTextArtifact(absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return { exists: false, content: "" };
  }

  return { exists: true, content: fs.readFileSync(absolutePath, "utf8") };
}

function appendEntry(value, collectionKey, entry) {
  if (Array.isArray(value)) {
    return [...value, entry];
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeWriteError("CURATION_JSON_SHAPE_INVALID", 400);
  }

  if (value[collectionKey] === undefined) {
    return {
      ...value,
      [collectionKey]: [entry],
    };
  }

  if (Array.isArray(value[collectionKey])) {
    return {
      ...value,
      [collectionKey]: [...value[collectionKey], entry],
    };
  }

  throw new SafeWriteError("CURATION_JSON_SHAPE_INVALID", 400);
}

function backupPathFor(binding, operationId, sourceRelativePath, existed) {
  const suffix = existed ? "" : ".missing.json";
  const relativePath = `${binding.paths.backupRoot.path}/${operationId}/${sourceRelativePath}${suffix}`;
  const absolutePath = path.join(binding.projectRoot, relativePath);
  ensureWritableTarget(binding, absolutePath, relativePath);
  return { absolutePath, relativePath };
}

function createBackup(file, operationId, projectRoot) {
  fs.mkdirSync(path.dirname(file.backupAbsolutePath), { recursive: true });
  inspectExistingPath(path.dirname(file.backupAbsolutePath), projectRoot);
  if (file.existed) {
    inspectExistingPath(file.absolutePath, projectRoot);
    fs.copyFileSync(
      file.absolutePath,
      file.backupAbsolutePath,
      fs.constants.COPYFILE_EXCL,
    );
    return;
  }

  atomicWrite(
    file.backupAbsolutePath,
    `${JSON.stringify(
      {
        missing: true,
        operationId,
        originalPath: file.path,
      },
      null,
      2,
    )}\n`,
    projectRoot,
  );
}

function makeAdminLogEntry(issuedAt, operation, operationId, written) {
  return [
    `## ${issuedAt} ${operationId}`,
    `- type: ${operation.type}`,
    `- actor: ${JSON.stringify(operation.actor)}`,
    `- written: ${written.map((file) => file.path).join(", ")}`,
    `- backups: ${written.map((file) => file.backupPath).join(", ")}`,
    "",
  ].join("\n");
}

function adminLogPath(binding) {
  return path.join(binding.paths.adminRoot.resolved, "admin-log.md");
}

function atomicWrite(absolutePath, content, projectRoot) {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  inspectExistingPath(path.dirname(absolutePath), projectRoot);
  const tempPath = path.join(
    path.dirname(absolutePath),
    `.${path.basename(absolutePath)}.${crypto.randomBytes(12).toString("hex")}.tmp`,
  );
  fs.writeFileSync(tempPath, content, { flag: "wx", mode: 0o600 });
  inspectExistingPath(path.dirname(absolutePath), projectRoot);
  fs.renameSync(tempPath, absolutePath);
}

function inspectExistingPath(absolutePath, projectRoot) {
  const parts = path
    .relative(projectRoot, absolutePath)
    .split(path.sep)
    .filter(Boolean);
  let current = projectRoot;
  for (const part of parts) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) return;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new SafeWriteError("CURATION_TARGET_SYMLINK", 403);
    }
    if (!isInsideRoot(fs.realpathSync.native(current), projectRoot)) {
      throw new SafeWriteError("CURATION_TARGET_OUTSIDE_PROJECT", 403);
    }
  }
}

function matchesWriteWhitelist(relativePath, writeWhitelist) {
  return writeWhitelist.some((pattern) =>
    matchesPattern(relativePath, pattern),
  );
}

function matchesPattern(relativePath, pattern) {
  if (pattern.endsWith("/**")) {
    const base = pattern.slice(0, -3);
    return relativePath === base || relativePath.startsWith(`${base}/`);
  }

  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    const rest = relativePath.startsWith(`${base}/`)
      ? relativePath.slice(base.length + 1)
      : null;
    return rest !== null && !rest.includes("/");
  }

  return relativePath === pattern;
}

function hasUnsafePath(value) {
  return (
    path.isAbsolute(value) ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith("//") ||
    value.startsWith("\\\\") ||
    value.split("/").includes("..")
  );
}

function pruneIssuedPreviews() {
  const now = Date.now();
  for (const [previewId, preview] of issuedPreviews.entries()) {
    if (preview.expiresAt < now) {
      issuedPreviews.delete(previewId);
    }
  }

  while (issuedPreviews.size > MAX_PREVIEWS) {
    const oldest = issuedPreviews.keys().next().value;
    issuedPreviews.delete(oldest);
  }
}

function sameIssuedFiles(issuedFiles, affectedFiles) {
  const nextFiles = affectedFiles.map(toIssuedFileRecord);
  return JSON.stringify(issuedFiles) === JSON.stringify(nextFiles);
}

function hashIssuedPlan(binding, plan) {
  return hashJson({
    projectRoot: binding.projectRoot,
    adminRoot: binding.paths.adminRoot.path,
    backupRoot: binding.paths.backupRoot.path,
    wikiRoot: binding.paths.wikiRoot.path,
    rawSourceRoots: binding.rawSourceRoots.map((root) => root.path),
    writeWhitelist: binding.writeWhitelist,
    affectedFiles: plan.affectedFiles.map(toIssuedFileRecord),
  });
}

function toIssuedFileRecord(file) {
  return {
    path: file.path,
    backupPath: file.backupPath,
    baseHash: file.baseHash,
    nextHash: file.nextHash,
  };
}

function hashText(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashJson(value) {
  return hashText(JSON.stringify(value));
}

function toPublicAffectedFile(file) {
  return {
    path: file.path,
    action: file.action,
    baseHash: file.baseHash,
    nextHash: file.nextHash,
    diff: makeDiff(file.baseContent, file.nextContent),
  };
}

function makeDiff(before, after) {
  const beforeLines = before ? before.trimEnd().split("\n") : [];
  const afterLines = after.trimEnd().split("\n");
  let sharedPrefixLength = 0;
  const maxPrefixLength = Math.min(beforeLines.length, afterLines.length);
  while (
    sharedPrefixLength < maxPrefixLength &&
    beforeLines[sharedPrefixLength] === afterLines[sharedPrefixLength]
  ) {
    sharedPrefixLength += 1;
  }

  return [
    ...beforeLines.slice(0, sharedPrefixLength).map((line) => ` ${line}`),
    ...beforeLines.slice(sharedPrefixLength).map((line) => `-${line}`),
    ...afterLines.slice(sharedPrefixLength).map((line) => `+${line}`),
  ].join("\n");
}

function toRelative(projectRoot, absolutePath) {
  return path.relative(projectRoot, absolutePath).replaceAll(path.sep, "/");
}
