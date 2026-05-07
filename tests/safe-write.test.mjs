import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const safeWritePath = path.join(repoRoot, "scripts", "lib", "safe-write.mjs");

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-safe-write-"));
}

function writeConfig(projectRoot, config = {}) {
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    JSON.stringify(
      {
        version: 1,
        projectType: "document-corpus",
        adminRoot: ".project-wiki/admin",
        backupRoot: ".project-wiki/backups",
        rawSourceRoots: ["docs"],
        writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups/**"],
        ...config,
      },
      null,
      2,
    ),
  );
}

function writeText(projectRoot, relativePath, content) {
  const filePath = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function readJson(projectRoot, relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, relativePath), "utf8"),
  );
}

function snapshotEntries(projectRoot) {
  const entries = [];
  walkSnapshot(projectRoot, projectRoot, entries);
  return entries.sort();
}

function walkSnapshot(root, currentPath, entries) {
  for (const entry of fs.readdirSync(currentPath).sort()) {
    const absolutePath = path.join(currentPath, entry);
    const relativePath = path
      .relative(root, absolutePath)
      .replaceAll(path.sep, "/");
    const stat = fs.lstatSync(absolutePath);
    if (stat.isDirectory()) {
      entries.push(`${relativePath}/`);
      walkSnapshot(root, absolutePath, entries);
      continue;
    }

    entries.push(`${relativePath}:${stat.size}`);
  }
}

async function loadSafeWrite() {
  const moduleUrl = pathToFileURL(safeWritePath);
  moduleUrl.search = `cacheBust=${Date.now()}-${Math.random()}`;
  return import(moduleUrl.href);
}

function reviewOperation(extra = {}) {
  return {
    type: "review_queue_append",
    actor: "local-admin",
    entry: {
      title: "Retitle topic",
      targetPath: ".project-wiki/wiki/topic.md",
      summary: "Suggest a clearer topic category.",
      evidence: [{ path: "docs/source.md", quote: "Alpha" }],
    },
    ...extra,
  };
}

function overrideOperation(extra = {}) {
  return {
    type: "manual_override_append",
    actor: "local-admin",
    entry: {
      targetPath: ".project-wiki/wiki/topic.md",
      field: "category",
      value: "reference",
      reason: "Manual curation decision.",
    },
    ...extra,
  };
}

test("preview for review queue is read-only and returns affected files", async () => {
  const { previewCurationOperation } = await loadSafeWrite();
  const projectRoot = makeProject();
  writeText(projectRoot, "docs/source.md", "Alpha source\n");
  writeConfig(projectRoot);
  const before = snapshotEntries(projectRoot);

  const preview = previewCurationOperation(projectRoot, reviewOperation());

  assert.equal(preview.ok, true);
  assert.equal(preview.operation.type, "review_queue_append");
  assert.match(preview.previewId, /^[a-f0-9]{64}$/);
  assert.ok(
    preview.affectedFiles.some(
      (file) => file.path === ".project-wiki/admin/review-queue.json",
    ),
  );
  assert.ok(
    preview.affectedFiles.some(
      (file) => file.path === ".project-wiki/admin/admin-log.md",
    ),
  );
  assert.ok(
    preview.backupsPlanned.some(
      (file) => file.sourcePath === ".project-wiki/admin/admin-log.md",
    ),
  );
  assert.deepEqual(snapshotEntries(projectRoot), before);
});

test("preview for manual overrides is read-only and returns affected files", async () => {
  const { previewCurationOperation } = await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  const before = snapshotEntries(projectRoot);

  const preview = previewCurationOperation(projectRoot, overrideOperation());

  assert.equal(preview.ok, true);
  assert.equal(preview.operation.type, "manual_override_append");
  assert.ok(
    preview.affectedFiles.some(
      (file) => file.path === ".project-wiki/admin/manual-overrides.json",
    ),
  );
  assert.deepEqual(snapshotEntries(projectRoot), before);
});

test("apply requires confirmation and matching preview id", async () => {
  const { applyCurationOperation, previewCurationOperation } =
    await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  const operation = reviewOperation();
  const preview = previewCurationOperation(projectRoot, operation);
  const before = snapshotEntries(projectRoot);

  assert.throws(
    () =>
      applyCurationOperation(projectRoot, {
        operation,
        previewId: preview.previewId,
      }),
    /CURATION_CONFIRMATION_REQUIRED/,
  );
  assert.throws(
    () =>
      applyCurationOperation(projectRoot, {
        operation,
        confirmed: true,
        previewId: "0".repeat(64),
      }),
    /CURATION_PREVIEW_MISMATCH/,
  );
  assert.deepEqual(snapshotEntries(projectRoot), before);
});

test("apply appends review queue creates backup and writes admin log", async () => {
  const { applyCurationOperation, previewCurationOperation } =
    await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  const operation = reviewOperation();
  const preview = previewCurationOperation(projectRoot, operation);

  const result = applyCurationOperation(projectRoot, {
    operation,
    confirmed: true,
    previewId: preview.previewId,
  });

  assert.equal(result.ok, true);
  assert.equal(result.applied, true);
  const queue = readJson(projectRoot, ".project-wiki/admin/review-queue.json");
  assert.equal(queue.items.length, 1);
  assert.equal(queue.items[0].title, "Retitle topic");
  assert.match(
    fs.readFileSync(
      path.join(projectRoot, ".project-wiki/admin/admin-log.md"),
      "utf8",
    ),
    /review_queue_append/,
  );
  assert.ok(
    snapshotEntries(projectRoot).some(
      (entry) =>
        entry.includes(".project-wiki/backups/") &&
        entry.includes("review-queue.json.missing.json"),
    ),
  );
});

test("apply appends manual overrides and detects stale preview", async () => {
  const { applyCurationOperation, previewCurationOperation } =
    await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  const operation = overrideOperation();
  const preview = previewCurationOperation(projectRoot, operation);
  writeText(
    projectRoot,
    ".project-wiki/admin/manual-overrides.json",
    JSON.stringify({ overrides: [] }, null, 2),
  );

  assert.throws(
    () =>
      applyCurationOperation(projectRoot, {
        operation,
        confirmed: true,
        previewId: preview.previewId,
      }),
    /CURATION_PREVIEW_STALE/,
  );

  const freshPreview = previewCurationOperation(projectRoot, operation);
  const result = applyCurationOperation(projectRoot, {
    operation,
    confirmed: true,
    previewId: freshPreview.previewId,
  });

  assert.equal(result.ok, true);
  const overrides = readJson(
    projectRoot,
    ".project-wiki/admin/manual-overrides.json",
  );
  assert.equal(overrides.overrides.length, 1);
  assert.equal(overrides.overrides[0].field, "category");
});

test("apply rejects backup config drift after preview", async () => {
  const { applyCurationOperation, previewCurationOperation } =
    await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    backupRoot: ".project-wiki/backups-a",
    writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups-a/**"],
  });
  const operation = reviewOperation();
  const preview = previewCurationOperation(projectRoot, operation);
  writeConfig(projectRoot, {
    backupRoot: ".project-wiki/backups-b",
    writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups-b/**"],
  });

  assert.throws(
    () =>
      applyCurationOperation(projectRoot, {
        operation,
        confirmed: true,
        previewId: preview.previewId,
      }),
    /CURATION_PREVIEW_STALE/,
  );
});

test("apply rejects write whitelist drift after preview", async () => {
  const { applyCurationOperation, previewCurationOperation } =
    await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  const operation = overrideOperation();
  const preview = previewCurationOperation(projectRoot, operation);
  writeConfig(projectRoot, {
    writeWhitelist: [
      ".project-wiki/admin/**",
      ".project-wiki/backups/**",
      ".project-wiki/other/**",
    ],
  });

  assert.throws(
    () =>
      applyCurationOperation(projectRoot, {
        operation,
        confirmed: true,
        previewId: preview.previewId,
      }),
    /CURATION_PREVIEW_STALE/,
  );
});

test("apply rejects preview reuse across project roots", async () => {
  const { applyCurationOperation, previewCurationOperation } =
    await loadSafeWrite();
  const sourceRoot = makeProject();
  const targetRoot = makeProject();
  writeConfig(sourceRoot);
  writeConfig(targetRoot);
  const operation = overrideOperation();
  const preview = previewCurationOperation(sourceRoot, operation);

  assert.throws(
    () =>
      applyCurationOperation(targetRoot, {
        operation,
        confirmed: true,
        previewId: preview.previewId,
      }),
    /CURATION_PREVIEW_STALE/,
  );
});

test("preview diff shows duplicate appended curation payload", async () => {
  const { previewCurationOperation } = await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  const operation = overrideOperation();
  writeText(
    projectRoot,
    ".project-wiki/admin/manual-overrides.json",
    `${JSON.stringify({ overrides: [operation.entry] }, null, 2)}\n`,
  );

  const preview = previewCurationOperation(projectRoot, operation);
  const overrideFile = preview.affectedFiles.find(
    (file) => file.path === ".project-wiki/admin/manual-overrides.json",
  );

  assert.ok(overrideFile);
  assert.match(overrideFile.diff, /^-  \]/m);
  assert.match(
    overrideFile.diff,
    /\+      "targetPath": "\.project-wiki\/wiki\/topic\.md",/,
  );
});

test("safe-write rejects malformed json insufficient whitelist and unknown operations", async () => {
  const { applyCurationOperation, previewCurationOperation } =
    await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  writeText(
    projectRoot,
    ".project-wiki/admin/review-queue.json",
    "{ invalid json",
  );

  assert.throws(
    () => previewCurationOperation(projectRoot, reviewOperation()),
    /CURATION_JSON_INVALID/,
  );

  const noWhitelistRoot = makeProject();
  writeConfig(noWhitelistRoot, { writeWhitelist: [".project-wiki/wiki/**"] });
  assert.throws(
    () => previewCurationOperation(noWhitelistRoot, reviewOperation()),
    /CURATION_TARGET_NOT_WHITELISTED/,
  );

  const unknownRoot = makeProject();
  writeConfig(unknownRoot);
  assert.throws(
    () => previewCurationOperation(unknownRoot, { type: "raw_source_edit" }),
    /CURATION_OPERATION_UNSUPPORTED/,
  );

  const before = snapshotEntries(projectRoot);
  assert.throws(
    () =>
      applyCurationOperation(projectRoot, {
        operation: reviewOperation(),
        confirmed: true,
        previewId: "0".repeat(64),
      }),
    /CURATION_PREVIEW_MISMATCH/,
  );
  assert.deepEqual(snapshotEntries(projectRoot), before);
});

test("safe-write rejects curation roots overlapping raw source roots", async () => {
  const { previewCurationOperation } = await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    adminRoot: "docs",
    backupRoot: ".project-wiki/backups",
    rawSourceRoots: ["docs"],
    writeWhitelist: ["docs/**", ".project-wiki/backups/**"],
  });

  assert.throws(
    () => previewCurationOperation(projectRoot, reviewOperation()),
    /CURATION_ROOT_OVERLAPS_SOURCE/,
  );
});

test("safe-write rejects primitive existing curation json roots", async () => {
  const { previewCurationOperation } = await loadSafeWrite();
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  writeText(projectRoot, ".project-wiki/admin/review-queue.json", "null");

  assert.throws(
    () => previewCurationOperation(projectRoot, reviewOperation()),
    /CURATION_JSON_SHAPE_INVALID/,
  );
});
