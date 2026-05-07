#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { Buffer } from "node:buffer";
import { inspectAdapterStatus } from "./lib/adapter-status.mjs";
import { inspectExportPlan } from "./lib/export-plan.mjs";
import { inspectGraphCompilePlan } from "./lib/graph-compile-plan.mjs";
import { inspectSourceNormalizationImportPlan } from "./lib/source-normalization-import-plan.mjs";
import {
  applyCurationOperation,
  previewCurationOperation,
  SafeWriteError,
} from "./lib/safe-write.mjs";
import {
  errorToHealth,
  isInsideRoot,
  loadProjectBinding,
  RuntimeConfigError,
} from "./lib/runtime-config.mjs";

const DEFAULT_HOST = "127.0.0.1";
const WRITE_TOKEN_HEADER = "x-project-wiki-admin-token";
const writeToken = crypto.randomBytes(32).toString("hex");
const PREVIEW_LIMIT = 40_000;
const MAX_GRAPH_BYTES = 500_000;
const MAX_LIST_ITEMS = 500;
const MAX_WALK_DEPTH = 8;
const SEARCH_LIMIT = 20;
const SEARCH_FILE_LIMIT = 200;
const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".mdx",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
]);

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  process.stdout.write(
    `project-wiki local Admin runtime\n\nUsage:\n  node scripts/admin.mjs <target-project> [--host 127.0.0.1] [--port 0]\n\nOptions:\n  --host  Only 127.0.0.1 is allowed.\n  --port  Local port; use 0 to select a free port.\n\nThe runtime exposes read-only inspection endpoints and token-protected append-only curation endpoints. It does not open a browser and uses no external dependencies.\n`,
  );
  process.exit(0);
}

if (args.host !== DEFAULT_HOST) {
  console.error("ADMIN_HOST_NOT_LOOPBACK");
  process.exit(1);
}

const projectRootInput = args.projectRoot ?? process.cwd();
let serverOrigin = null;
const server = http.createServer((request, response) => {
  if (!isExpectedHost(request)) {
    writeJson(response, 403, { ok: false, error: "ADMIN_HOST_REJECTED" });
    return;
  }

  handleRequest(request, response, projectRootInput).catch((error) => {
    const status = errorStatus(error);
    writeJson(response, status, {
      ok: false,
      error: errorCode(error),
    });
  });
});

server.listen(args.port, DEFAULT_HOST, () => {
  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : args.port;
  serverOrigin = `http://${DEFAULT_HOST}:${port}`;
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      event: "admin:ready",
      host: DEFAULT_HOST,
      port,
      url: `${serverOrigin}/admin`,
      readOnlyInspection: true,
      writeMode: "append-only-curation",
      writeTokenRequired: true,
      writeToken,
    })}\n`,
  );
});

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}

function errorStatus(error) {
  if (error instanceof HttpError || error instanceof SafeWriteError) {
    return error.status;
  }

  return 500;
}

function errorCode(error) {
  if (error instanceof HttpError) {
    return error.message;
  }

  if (error instanceof SafeWriteError) {
    return error.code;
  }

  return "INTERNAL_ERROR";
}

function isExpectedHost(request) {
  if (!serverOrigin) return false;
  const expectedHost = new URL(serverOrigin).host;
  return request.headers.host === expectedHost;
}

function requireSameOriginJsonRequest(request) {
  const contentType = request.headers["content-type"] ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "CONTENT_TYPE_JSON_REQUIRED");
  }

  const origin = request.headers.origin;
  if (origin && origin !== serverOrigin) {
    throw new HttpError(403, "ADMIN_ORIGIN_REJECTED");
  }

  const secFetchSite = request.headers["sec-fetch-site"];
  if (
    secFetchSite &&
    !["same-origin", "same-site", "none"].includes(secFetchSite)
  ) {
    throw new HttpError(403, "ADMIN_ORIGIN_REJECTED");
  }
}

function requireWriteRequest(request) {
  requireSameOriginJsonRequest(request);

  const token = request.headers[WRITE_TOKEN_HEADER];
  if (token !== writeToken) {
    throw new HttpError(403, "ADMIN_WRITE_TOKEN_REQUIRED");
  }
}

function parseArgs(values) {
  const parsed = {
    host: DEFAULT_HOST,
    port: 0,
    projectRoot: null,
    help: false,
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--help" || value === "-h") {
      parsed.help = true;
      continue;
    }

    if (value === "--host") {
      parsed.host = values[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (value === "--port") {
      const portValue = Number(values[index + 1]);
      if (!Number.isInteger(portValue) || portValue < 0 || portValue > 65535) {
        console.error("ADMIN_PORT_INVALID");
        process.exit(1);
      }
      parsed.port = portValue;
      index += 1;
      continue;
    }

    if (value.startsWith("--")) {
      console.error("ADMIN_OPTION_UNKNOWN");
      process.exit(1);
    }

    if (!parsed.projectRoot) {
      parsed.projectRoot = value;
      continue;
    }

    console.error("ADMIN_TOO_MANY_ARGUMENTS");
    process.exit(1);
  }

  return parsed;
}

async function handleRequest(request, response, projectRoot) {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");

  if (url.pathname === "/") {
    redirect(response, "/admin");
    return;
  }

  if (request.method === "GET" && url.pathname === "/admin") {
    writeText(response, 200, "text/html; charset=utf-8", ADMIN_HTML);
    return;
  }

  if (request.method === "GET" && url.pathname === "/admin/app.js") {
    writeText(response, 200, "application/javascript; charset=utf-8", ADMIN_JS);
    return;
  }

  if (request.method === "GET" && url.pathname === "/admin/style.css") {
    writeText(response, 200, "text/css; charset=utf-8", ADMIN_CSS);
    return;
  }

  if (url.pathname.startsWith("/api/kb/admin/")) {
    await handleApi(request, response, url, projectRoot);
    return;
  }

  writeJson(response, 404, { ok: false, error: "NOT_FOUND" });
}

async function handleApi(request, response, url, projectRoot) {
  const method = request.method ?? "GET";
  const pathName = url.pathname;

  if (pathName === "/api/kb/admin/curation/preview" && method === "POST") {
    requireWriteRequest(request);
    const body = await readRequestJson(request);
    writeJson(
      response,
      200,
      previewCurationOperation(projectRoot, body.operation),
    );
    return;
  }

  if (pathName === "/api/kb/admin/curation/apply" && method === "POST") {
    requireWriteRequest(request);
    const body = await readRequestJson(request);
    writeJson(response, 200, applyCurationOperation(projectRoot, body));
    return;
  }

  if (pathName.startsWith("/api/kb/admin/curation/") && method !== "POST") {
    writeJson(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (method !== "GET" && pathName !== "/api/kb/admin/test-query") {
    writeJson(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (pathName === "/api/kb/admin/health" && method === "GET") {
    writeJson(response, 200, healthResponse(projectRoot));
    return;
  }

  if (pathName === "/api/kb/admin/summary" && method === "GET") {
    writeJson(response, 200, summaryResponse(projectRoot));
    return;
  }

  if (pathName === "/api/kb/admin/tree" && method === "GET") {
    writeJson(response, 200, treeResponse(projectRoot));
    return;
  }

  if (pathName === "/api/kb/admin/items" && method === "GET") {
    writeJson(response, 200, itemsResponse(projectRoot));
    return;
  }

  if (pathName.startsWith("/api/kb/admin/item/") && method === "GET") {
    const id = safeDecodePathSegment(
      pathName.slice("/api/kb/admin/item/".length),
    );
    writeJson(response, 200, previewResponse(projectRoot, "wiki", id));
    return;
  }

  if (pathName.startsWith("/api/kb/admin/source/") && method === "GET") {
    const id = safeDecodePathSegment(
      pathName.slice("/api/kb/admin/source/".length),
    );
    writeJson(response, 200, previewResponse(projectRoot, "source", id));
    return;
  }

  if (pathName === "/api/kb/admin/test-query" && method === "POST") {
    requireSameOriginJsonRequest(request);
    const body = await readRequestJson(request);
    writeJson(response, 200, testQueryResponse(projectRoot, body));
    return;
  }

  if (pathName === "/api/kb/admin/test-query") {
    writeJson(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (pathName === "/api/kb/admin/adapters" && method === "GET") {
    writeJson(response, 200, adapterStatusResponse(projectRoot));
    return;
  }

  if (pathName === "/api/kb/admin/adapters") {
    writeJson(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (
    pathName === "/api/kb/admin/source-normalization/import-plan" &&
    method === "GET"
  ) {
    writeJson(
      response,
      200,
      sourceNormalizationImportPlanResponse(projectRoot),
    );
    return;
  }

  if (pathName === "/api/kb/admin/source-normalization/import-plan") {
    writeJson(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (pathName === "/api/kb/admin/graph/compile-plan" && method === "GET") {
    writeJson(response, 200, graphCompilePlanResponse(projectRoot));
    return;
  }

  if (pathName === "/api/kb/admin/export/plan" && method === "GET") {
    writeJson(response, 200, exportPlanResponse(projectRoot));
    return;
  }

  if (pathName === "/api/kb/admin/export/plan") {
    writeJson(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (pathName === "/api/kb/admin/graph" && method === "GET") {
    writeJson(response, 200, graphResponse(projectRoot));
    return;
  }

  writeJson(response, 404, { ok: false, error: "NOT_FOUND" });
}

function exportPlanResponse(projectRoot) {
  try {
    return inspectExportPlan(projectRoot);
  } catch (error) {
    if (!(error instanceof RuntimeConfigError)) {
      throw error;
    }

    const health = errorToHealth(error);
    return {
      ok: true,
      readOnly: true,
      phase: "p4_4_export_planning",
      inspectionLevel: 1,
      projectRoot: health.projectRoot,
      binding: {
        status: health.status,
        config: health.config,
        errors: health.errors,
      },
      adapter: unavailableAdapterStatus("export"),
      artifacts: { existing: [], truncated: false },
      plan: {
        planningOnly: true,
        executionEnabled: false,
        exportEndpointAvailable: false,
        exportAllowed: false,
        exportWriteEnabled: false,
        writeEnabled: false,
        dependencyInstallEnabled: false,
        publisherCommandEnabled: false,
        uploadEnabled: false,
        serverStartEnabled: false,
        target: { value: null, source: "default", confirmed: false },
        profile: { value: null, source: "default", confirmed: false },
        sourceScope: { status: "needs_confirmation", roots: [] },
        outputRoot: { path: null, safe: false, willWrite: false },
        rollback: { strategy: null, confirmed: false, willWrite: false },
        dependencyBoundary: {
          requiredToExecute: 3,
          toolchain: null,
          installAllowed: false,
          dependencyInstallAllowed: false,
          commandExecutionAllowed: false,
          publisherCommandAllowed: false,
          uploadAllowed: false,
          serverStartAllowed: false,
          exportAllowed: false,
          allowedNow: [],
          blockedUntilConfirmation: [],
        },
        confirmationGates: [],
      },
      summary: {
        adapterState: "env_unavailable",
        target: null,
        profile: null,
        outputRoot: null,
        outputRootSafe: false,
        existingArtifacts: 0,
        heavyActionsAvailable: false,
        exportAllowed: false,
        executionAllowed: false,
        writeAllowed: false,
        dependencyInstallAllowed: false,
        commandExecutionAllowed: false,
        uploadAllowed: false,
        serverStartAllowed: false,
        confirmationRequired: true,
      },
      warnings: [],
      nonGoals: [
        "NO_EXPORT_EXECUTION",
        "NO_EXPORT_WRITES",
        "NO_DEPENDENCY_INSTALL",
        "NO_COMMAND_EXECUTION",
        "NO_PUBLISHER_COMMANDS",
        "NO_UPLOAD",
        "NO_SERVER_START",
      ],
    };
  }
}

function graphCompilePlanResponse(projectRoot) {
  try {
    return inspectGraphCompilePlan(projectRoot);
  } catch (error) {
    if (!(error instanceof RuntimeConfigError)) {
      throw error;
    }

    const health = errorToHealth(error);
    return {
      ok: true,
      readOnly: true,
      phase: "p4_3_graph_compile_planning",
      inspectionLevel: 1,
      projectRoot: health.projectRoot,
      binding: {
        status: health.status,
        config: health.config,
        errors: health.errors,
      },
      adapter: unavailableAdapterStatus("graph"),
      artifacts: { existing: [], truncated: false },
      plan: {
        planningOnly: true,
        executionEnabled: false,
        compileEndpointAvailable: false,
        graphWriteEnabled: false,
        dependencyInstallEnabled: false,
        serverStartEnabled: false,
        schemaProfile: {
          value: "auto",
          source: "adapter_readiness.metadata.schemaProfile",
          confirmed: false,
          durableTruth: false,
        },
        sourceScope: {
          status: "needs_confirmation",
          roots: [],
          existingGraphArtifactsAreEvidenceOnly: true,
        },
        confidencePolicy: {
          labels: ["EXTRACTED", "INFERRED", "AMBIGUOUS"],
          inferredRelationshipsDurable: false,
          ambiguousRelationshipsDurable: false,
          requiresEvidenceForExtracted: true,
          reviewRequiredFor: ["INFERRED", "AMBIGUOUS"],
        },
        artifactTarget: {
          graphJson: { path: null, willWrite: false },
          graphReport: { path: null, willWrite: false },
        },
        dependencyBoundary: {
          requiredToExecute: 3,
          installAllowed: false,
          commandExecutionAllowed: false,
          externalProviderAllowed: false,
          mcpServerStartAllowed: false,
          allowedNow: [],
          blockedUntilConfirmation: [],
        },
        confirmationGates: [],
      },
      summary: {
        adapterState: "env_unavailable",
        schemaProfile: "auto",
        sourceRoots: 0,
        existingArtifacts: 0,
        plannedTargets: 2,
        heavyActionsAvailable: false,
        compileAllowed: false,
        confirmationRequired: true,
      },
      warnings: [],
      nonGoals: [
        "NO_GRAPH_COMPILE",
        "NO_DEPENDENCY_INSTALL",
        "NO_COMMAND_EXECUTION",
        "NO_GRAPH_WRITES",
        "NO_CACHE_WRITES",
        "NO_SERVER_START",
        "NO_MCP_START",
        "NO_DURABLE_INFERRED_TRUTH",
      ],
    };
  }
}

function sourceNormalizationImportPlanResponse(projectRoot) {
  try {
    return inspectSourceNormalizationImportPlan(projectRoot);
  } catch (error) {
    if (!(error instanceof RuntimeConfigError)) {
      throw error;
    }

    const health = errorToHealth(error);
    return {
      ok: true,
      readOnly: true,
      phase: "p4_2_source_normalization_import_planning",
      inspectionLevel: 1,
      projectRoot: health.projectRoot,
      binding: {
        status: health.status,
        config: health.config,
        errors: health.errors,
      },
      adapter: unavailableAdapterStatus("retain-pdf"),
      manifest: {
        path: null,
        exists: false,
        artifactCount: 0,
        truncated: false,
      },
      plan: {
        planningOnly: true,
        executionEnabled: false,
        applyEndpointAvailable: false,
        sourceRegistryWriteEnabled: false,
        wikiWriteEnabled: false,
        proposedRegistryTarget: { path: null, willWrite: false },
        candidates: [],
        excluded: [],
      },
      summary: {
        manifestArtifacts: 0,
        importCandidates: 0,
        importable: 0,
        excluded: 0,
        missing: 0,
        unsafe: 0,
        heavyActionsAvailable: false,
      },
      warnings: [],
      nonGoals: [
        "NO_OCR",
        "NO_CONVERSION",
        "NO_UPLOAD",
        "NO_DEPENDENCY_INSTALL",
        "NO_COMMAND_EXECUTION",
        "NO_DURABLE_WRITES",
        "NO_SOURCE_REGISTRY_WRITES",
        "NO_WIKI_WRITES",
      ],
    };
  }
}

function adapterStatusResponse(projectRoot) {
  try {
    return inspectAdapterStatus(projectRoot);
  } catch (error) {
    if (!(error instanceof RuntimeConfigError)) {
      throw error;
    }

    const health = errorToHealth(error);
    const adapters = {
      sourceNormalization: unavailableAdapterStatus("retain-pdf"),
      graph: unavailableAdapterStatus("graph"),
      export: unavailableAdapterStatus("export"),
    };
    return {
      ok: true,
      readOnly: true,
      phase: "p4_adapter_readiness",
      inspectionLevel: 0,
      projectRoot: health.projectRoot,
      binding: {
        status: health.status,
        config: health.config,
        errors: health.errors,
      },
      adapters,
      summary: {
        configured: [],
        attention: ["sourceNormalization", "graph", "export"],
        heavyActionsAvailable: false,
      },
      warnings: [],
    };
  }
}

function unavailableAdapterStatus(adapterId) {
  return {
    adapterId,
    state: "env_unavailable",
    executionEnabled: false,
    dependencyLevelToExecute: 3,
    artifacts: [],
    warnings: [],
    confirmationRequiredBefore: [],
    nextSteps: [
      "Resolve project binding configuration before adapter readiness checks.",
    ],
  };
}

function healthResponse(projectRoot) {
  const binding = safeBinding(projectRoot);
  return {
    ok: true,
    service: "project-wiki-admin",
    readOnlyInspection: true,
    writeMode: "append-only-curation",
    writeTokenRequired: true,
    projectRoot: binding.health.projectRoot,
    features: {
      sourceNormalizationImportPlanning: true,
      adapterStatus: true,
      adapterExecution: false,
      graphCompilePlanning: true,
      graphCompile: false,
      exportPlanning: true,
      import: false,
      ocr: false,
      export: false,
      writeEndpoints: "append-only-curation",
      writeTokenRequired: true,
    },
    health: binding.health,
  };
}

function summaryResponse(projectRoot) {
  const binding = safeBinding(projectRoot);
  return {
    ok: true,
    readOnly: true,
    projectRoot: binding.health.projectRoot,
    status: binding.health.status,
    projectType: binding.health.projectType ?? {
      value: null,
      recognized: false,
    },
    config: binding.health.config,
    paths: binding.health.paths ?? {},
    rawSourceRoots: binding.health.rawSourceRoots ?? [],
    writeWhitelist: binding.health.writeWhitelist ?? {
      values: [],
      empty: true,
    },
    warnings: binding.health.warnings ?? [],
    nextSteps: binding.health.nextSteps ?? [],
  };
}

function treeResponse(projectRoot) {
  const binding = safeBinding(projectRoot);
  return {
    ok: true,
    readOnly: true,
    items: listReadableItems(binding).map(toTreeItem),
  };
}

function itemsResponse(projectRoot) {
  const binding = safeBinding(projectRoot);
  return {
    ok: true,
    readOnly: true,
    items: listReadableItems(binding),
  };
}

function previewResponse(projectRoot, kind, id) {
  if (!isSafeId(id)) {
    throw new HttpError(400, "INVALID_ITEM_ID");
  }

  const binding = safeBinding(projectRoot);
  const item = listReadableItems(binding).find(
    (entry) => entry.kind === kind && entry.id === id,
  );
  if (!item) {
    throw new HttpError(404, "ITEM_NOT_FOUND");
  }

  const absolutePath = path.join(binding.projectRoot, item.path);
  const content = readPreview(absolutePath, binding.projectRoot);
  return {
    ok: true,
    readOnly: true,
    id: item.id,
    kind: item.kind,
    path: item.path,
    encoding: "utf8",
    truncated: content.truncated,
    content: content.value,
  };
}

function testQueryResponse(projectRoot, body) {
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) {
    throw new HttpError(400, "QUERY_REQUIRED");
  }

  const binding = safeBinding(projectRoot);
  const lowerQuery = query.toLowerCase();
  const results = [];

  for (const item of listReadableItems(binding).slice(0, SEARCH_FILE_LIMIT)) {
    if (results.length >= SEARCH_LIMIT) break;
    const absolutePath = path.join(binding.projectRoot, item.path);
    let content;
    try {
      content = readPreview(absolutePath, binding.projectRoot).value;
    } catch {
      continue;
    }
    const index = content.toLowerCase().indexOf(lowerQuery);
    if (index === -1) continue;

    const start = Math.max(0, index - 80);
    const end = Math.min(content.length, index + query.length + 160);
    results.push({
      id: item.id,
      kind: item.kind,
      path: item.path,
      content: content.slice(start, end),
    });
  }

  return {
    ok: true,
    readOnly: true,
    query,
    results,
  };
}

function graphResponse(projectRoot) {
  const binding = safeBinding(projectRoot);
  if (!binding.paths?.adminRoot?.exists || !binding.paths.adminRoot.valid) {
    return {
      ok: true,
      readOnly: true,
      state: "empty_result",
      artifacts: {},
    };
  }

  const graphJsonPath = path.join(
    binding.paths.adminRoot.resolved,
    "graph.json",
  );
  const graphReportPath = path.join(
    binding.paths.adminRoot.resolved,
    "GRAPH_REPORT.md",
  );
  const artifacts = {};

  if (safeReadableFile(graphJsonPath, binding.projectRoot, MAX_GRAPH_BYTES)) {
    const graphJson = readPreview(
      graphJsonPath,
      binding.projectRoot,
      MAX_GRAPH_BYTES,
    );
    try {
      artifacts.graphJson = {
        path: toRelative(binding.projectRoot, graphJsonPath),
        data: JSON.parse(graphJson.value),
        truncated: graphJson.truncated,
      };
    } catch {
      artifacts.graphJson = {
        path: toRelative(binding.projectRoot, graphJsonPath),
        error: "INVALID_JSON",
      };
    }
  }

  if (safeReadableFile(graphReportPath, binding.projectRoot)) {
    artifacts.graphReport = {
      path: toRelative(binding.projectRoot, graphReportPath),
      content: readPreview(graphReportPath, binding.projectRoot).value,
    };
  }

  return {
    ok: true,
    readOnly: true,
    state: Object.keys(artifacts).length > 0 ? "configured" : "empty_result",
    artifacts,
  };
}

function safeBinding(projectRoot) {
  try {
    return loadProjectBinding(projectRoot);
  } catch (error) {
    if (!(error instanceof RuntimeConfigError)) {
      throw error;
    }

    return {
      health: errorToHealth(error),
      projectRoot: error.details.projectRoot,
      config: null,
      paths: null,
      rawSourceRoots: [],
      writeWhitelist: [],
    };
  }
}

function listReadableItems(binding) {
  if (!binding.config || !binding.paths) {
    return [];
  }

  const roots = [
    { kind: "wiki", root: binding.paths.wikiRoot },
    ...binding.rawSourceRoots.map((root) => ({ kind: "source", root })),
  ];
  const items = [];

  for (const { kind, root } of roots) {
    if (!root?.exists || !root.valid) continue;
    for (const absolutePath of walkReadableFiles(
      root.resolved,
      binding.projectRoot,
      MAX_LIST_ITEMS - items.length,
    )) {
      const stat = fs.statSync(absolutePath);
      const relativePath = toRelative(binding.projectRoot, absolutePath);
      items.push({
        id: encodeId(relativePath),
        kind,
        path: relativePath,
        type: "file",
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      });
      if (items.length >= MAX_LIST_ITEMS) break;
    }
    if (items.length >= MAX_LIST_ITEMS) break;
  }

  return items.sort((left, right) => left.path.localeCompare(right.path));
}

function walkReadableFiles(root, projectRoot, remaining) {
  if (!isInsideRoot(root, projectRoot) || remaining <= 0) {
    return [];
  }

  const results = [];
  walk(root, projectRoot, results, 0, remaining);
  return results;
}

function walk(currentPath, projectRoot, results, depth, limit) {
  if (results.length >= limit || depth > MAX_WALK_DEPTH) {
    return;
  }

  let stat;
  try {
    stat = fs.lstatSync(currentPath);
  } catch {
    return;
  }

  if (stat.isSymbolicLink()) {
    return;
  }

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(currentPath).sort()) {
      if (results.length >= limit) break;
      walk(
        path.join(currentPath, entry),
        projectRoot,
        results,
        depth + 1,
        limit,
      );
    }
    return;
  }

  if (!stat.isFile() || stat.size > PREVIEW_LIMIT * 5) {
    return;
  }

  if (!ALLOWED_EXTENSIONS.has(path.extname(currentPath).toLowerCase())) {
    return;
  }

  const realPath = fs.realpathSync.native(currentPath);
  if (isInsideRoot(realPath, projectRoot)) {
    results.push(realPath);
  }
}

function toTreeItem(item) {
  return {
    id: item.id,
    kind: item.kind,
    path: item.path,
    type: item.type,
  };
}

function readPreview(absolutePath, projectRoot, maxBytes = PREVIEW_LIMIT) {
  if (!safeReadableFile(absolutePath, projectRoot, maxBytes * 5)) {
    throw new HttpError(404, "ITEM_NOT_FOUND");
  }

  const file = fs.openSync(absolutePath, "r");
  try {
    const stat = fs.fstatSync(file);
    const realPath = fs.realpathSync.native(absolutePath);
    if (
      !stat.isFile() ||
      stat.size > maxBytes * 5 ||
      !isInsideRoot(realPath, projectRoot)
    ) {
      throw new HttpError(404, "ITEM_NOT_FOUND");
    }

    const length = Math.min(stat.size, maxBytes);
    const buffer = Buffer.alloc(length);
    fs.readSync(file, buffer, 0, length, 0);
    return {
      value: buffer.toString("utf8"),
      truncated: stat.size > maxBytes,
    };
  } finally {
    fs.closeSync(file);
  }
}

function safeReadableFile(
  absolutePath,
  projectRoot,
  maxBytes = PREVIEW_LIMIT * 5,
) {
  if (
    !isInsideRoot(absolutePath, projectRoot) ||
    !fs.existsSync(absolutePath)
  ) {
    return false;
  }

  const stat = fs.lstatSync(absolutePath);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.size > maxBytes) {
    return false;
  }

  return isInsideRoot(fs.realpathSync.native(absolutePath), projectRoot);
}

function safeDecodePathSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new HttpError(400, "INVALID_ITEM_ID");
  }
}

function encodeId(relativePath) {
  return Buffer.from(relativePath, "utf8").toString("base64url");
}

function isSafeId(id) {
  if (!id || id.includes("/") || id.includes("\\") || id.includes("..")) {
    return false;
  }

  try {
    return Buffer.from(id, "base64url").toString("base64url") === id;
  } catch {
    return false;
  }
}

function toRelative(projectRoot, absolutePath) {
  return path.relative(projectRoot, absolutePath).replaceAll(path.sep, "/");
}

async function readRequestJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
    if (body.length > 20_000) {
      throw new HttpError(413, "REQUEST_TOO_LARGE");
    }
  }

  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, "INVALID_JSON");
  }
}

function responseHeaders(contentType) {
  return {
    "content-type": contentType,
    "cache-control": "no-store",
    "content-security-policy":
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "DENY",
  };
}

function writeJson(response, status, value) {
  response.writeHead(
    status,
    responseHeaders("application/json; charset=utf-8"),
  );
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function writeText(response, status, contentType, value) {
  response.writeHead(status, responseHeaders(contentType));
  response.end(value);
}

function redirect(response, location) {
  response.writeHead(302, { location });
  response.end();
}

const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project Wiki Admin</title>
  <link rel="stylesheet" href="/admin/style.css">
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">Read-only inspection UI</p>
      <h1>Project Wiki Admin</h1>
      <p>Inspect binding state, wiki/source structure, evidence previews, and local query coverage. P3 curation writes are available only through token-protected append-only APIs.</p>
    </header>
    <section class="grid">
      <article><h2>Health</h2><pre id="health">Loading...</pre></article>
      <article><h2>Structure</h2><ul id="tree"></ul></article>
    </section>
    <section>
      <h2>Preview</h2>
      <pre id="preview">Select an item below.</pre>
    </section>
    <section>
      <h2>Test Query</h2>
      <form id="query-form"><input id="query" placeholder="Search local wiki/source text"><button>Search</button></form>
      <pre id="results"></pre>
    </section>
  </main>
  <script src="/admin/app.js"></script>
</body>
</html>`;

const ADMIN_JS = `const root = "";
const health = document.querySelector("#health");
const tree = document.querySelector("#tree");
const preview = document.querySelector("#preview");
const results = document.querySelector("#results");

async function json(path, options) {
  const response = await fetch(root + path, options);
  return response.json();
}

async function load() {
  const healthBody = await json("/api/kb/admin/health");
  health.textContent = JSON.stringify(healthBody.health, null, 2);

  const treeBody = await json("/api/kb/admin/tree");
  tree.textContent = "";
  for (const item of treeBody.items) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.kind + " · " + item.path;
    button.addEventListener("click", () => showPreview(item));
    li.append(button);
    tree.append(li);
  }
}

async function showPreview(item) {
  const prefix = item.kind === "source" ? "/api/kb/admin/source/" : "/api/kb/admin/item/";
  const body = await json(prefix + encodeURIComponent(item.id));
  preview.textContent = body.ok ? body.content : JSON.stringify(body, null, 2);
}

document.querySelector("#query-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = await json("/api/kb/admin/test-query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: document.querySelector("#query").value }),
  });
  results.textContent = JSON.stringify(body.results ?? body, null, 2);
});

load().catch((error) => {
  health.textContent = String(error);
});`;

const ADMIN_CSS = `:root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
body { margin: 0; background: #0f172a; color: #e2e8f0; }
main { max-width: 1120px; margin: 0 auto; padding: 40px 24px; }
header, article, section { background: #111827; border: 1px solid #334155; border-radius: 18px; padding: 24px; margin-bottom: 20px; }
h1 { margin: 0 0 12px; font-size: clamp(32px, 5vw, 56px); }
h2 { margin-top: 0; }
pre { overflow: auto; white-space: pre-wrap; background: #020617; border-radius: 12px; padding: 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 0; background: transparent; border: 0; }
ul { list-style: none; padding: 0; }
li { margin: 8px 0; }
button { cursor: pointer; border: 1px solid #38bdf8; background: #082f49; color: #e0f2fe; border-radius: 10px; padding: 8px 12px; }
input { width: min(520px, 80%); border: 1px solid #475569; border-radius: 10px; padding: 10px 12px; margin-right: 8px; }
.eyebrow { color: #67e8f9; text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }`;
