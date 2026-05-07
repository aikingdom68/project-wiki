import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJsonArtifact, safeArtifactPath } from "./adapter-status.mjs";
import { loadProjectBinding } from "./runtime-config.mjs";

const PHASE = "p4_2_source_normalization_import_planning";
const RETAIN_PDF_CONFIRMATION_GATES = [
  "copying sources",
  "converting documents",
  "running OCR",
  "calling external providers",
  "uploading files",
  "writing source registry entries",
  "writing wiki or knowledge-object files",
  "writing durable KB artifacts",
];
const NON_GOALS = [
  "NO_OCR",
  "NO_CONVERSION",
  "NO_UPLOAD",
  "NO_DEPENDENCY_INSTALL",
  "NO_COMMAND_EXECUTION",
  "NO_DURABLE_WRITES",
  "NO_SOURCE_REGISTRY_WRITES",
  "NO_WIKI_WRITES",
];
const IMPORTABLE_TYPES = new Set([
  "markdown",
  "md",
  "markdown/full.md",
  "normalized_document_json",
  "document.v1.json",
  "document_json",
]);
const SUPPORTING_TYPES = new Set([
  "normalization_report_json",
  "layout_json",
  "events_jsonl",
  "image",
  "images",
]);
const EXCLUDED_TYPES = new Set(["markdown_bundle_zip", "zip", "pdf"]);

export function inspectSourceNormalizationImportPlan(projectRootInput) {
  const binding = loadProjectBinding(projectRootInput);
  const base = {
    ok: true,
    readOnly: true,
    phase: PHASE,
    inspectionLevel: 1,
    projectRoot: binding.projectRoot,
    binding: {
      status: binding.health.status,
      config: binding.health.config,
    },
  };

  if (!binding.config) {
    return response(
      base,
      unavailableAdapter("env_unavailable"),
      emptyManifest(),
      emptyPlan(binding),
      {
        warnings: [],
      },
    );
  }

  const config = binding.config.optionalAdapters?.retainPdf;
  if (!config || !Object.hasOwn(config, "manifestPath")) {
    return response(
      base,
      unavailableAdapter("not_installed"),
      emptyManifest(),
      emptyPlan(binding),
      {
        warnings: [],
        nextSteps: [
          "Configure optionalAdapters.retainPdf.manifestPath before source normalization import planning.",
        ],
      },
    );
  }

  const manifest = readJsonArtifact(
    binding,
    config.manifestPath,
    "optionalAdapters.retainPdf.manifestPath",
  );

  if (manifest.status === "unsafe") {
    return response(
      base,
      unavailableAdapter("unsupported", [`UNSAFE_PATH: ${manifest.path}`]),
      {
        path: manifest.path,
        exists: false,
        artifactCount: 0,
        truncated: false,
      },
      emptyPlan(binding),
      { warnings: [`UNSAFE_PATH: ${manifest.path}`] },
    );
  }

  if (manifest.status === "missing") {
    return response(
      base,
      unavailableAdapter("empty_result"),
      {
        path: manifest.path,
        exists: false,
        artifactCount: 0,
        truncated: false,
      },
      emptyPlan(binding),
      { warnings: [] },
    );
  }

  if (manifest.status === "invalid") {
    return response(
      base,
      unavailableAdapter("runtime_failed", [manifest.error]),
      { path: manifest.path, exists: true, artifactCount: 0, truncated: false },
      emptyPlan(binding),
      { warnings: [manifest.error] },
    );
  }

  const artifacts = extractArtifacts(manifest.data);
  const builtPlan = buildPlan(binding, manifest.path, artifacts);
  const warnings = hasCommandFields(manifest.data)
    ? ["COMMAND_FIELD_IGNORED"]
    : [];
  return response(
    base,
    unavailableAdapter("configured", warnings),
    {
      path: manifest.path,
      exists: true,
      artifactCount: artifacts.length,
      truncated: false,
    },
    builtPlan,
    { warnings },
  );
}

function response(base, adapter, manifest, plan, extra = {}) {
  return {
    ...base,
    adapter: {
      ...adapter,
      nextSteps: extra.nextSteps ?? adapter.nextSteps,
    },
    manifest,
    plan,
    summary: summarizePlan(manifest, plan),
    warnings: extra.warnings ?? [],
    nonGoals: NON_GOALS,
  };
}

function unavailableAdapter(state, warnings = []) {
  return {
    adapterId: "retain-pdf",
    state,
    executionEnabled: false,
    dependencyLevelToExecute: 3,
    artifacts: [],
    warnings,
    confirmationRequiredBefore: RETAIN_PDF_CONFIRMATION_GATES,
    nextSteps: [],
  };
}

function emptyManifest() {
  return { path: null, exists: false, artifactCount: 0, truncated: false };
}

function emptyPlan(binding) {
  return {
    planningOnly: true,
    executionEnabled: false,
    applyEndpointAvailable: false,
    sourceRegistryWriteEnabled: false,
    wikiWriteEnabled: false,
    proposedRegistryTarget: {
      path: binding.paths?.adminRoot?.path
        ? `${binding.paths.adminRoot.path}/source-registry.json`
        : null,
      willWrite: false,
    },
    candidates: [],
    excluded: [],
  };
}

function extractArtifacts(manifest) {
  if (Array.isArray(manifest)) return manifest;
  if (Array.isArray(manifest?.artifacts)) return manifest.artifacts;
  return [];
}

function buildPlan(binding, manifestPath, artifacts) {
  const plan = emptyPlan(binding);
  for (const artifact of artifacts) {
    const entry = normalizeArtifact(artifact);
    const checked = classifyArtifact(binding, entry);
    if (!checked.importable) {
      plan.excluded.push(checked);
      continue;
    }

    const id = makeSourceId(manifestPath, checked.artifactPath);
    plan.candidates.push({
      id,
      artifactPath: checked.artifactPath,
      artifactType: checked.artifactType,
      exists: checked.exists,
      safe: true,
      importable: true,
      sourceRole: "primary_normalized_source",
      proposedSourceId: id,
      proposedRegistryEntry: {
        source_id: id,
        source_type: "normalized_document",
        adapter: "retain-pdf",
        artifact_path: checked.artifactPath,
        import_status: "planned_only",
        review_status: "needs_review",
      },
      ...(entry.title ? { title: entry.title } : {}),
      ...(entry.sourceId ? { sourceId: entry.sourceId } : {}),
      ...(entry.sourcePath ? { sourcePath: entry.sourcePath } : {}),
      ...(entry.sha256 ? { sha256: entry.sha256 } : {}),
    });
  }
  return plan;
}

function normalizeArtifact(value) {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    artifactPath: firstString(
      artifact.path,
      artifact.relativePath,
      artifact.file,
      artifact.outputPath,
    ),
    artifactType: normalizeType(
      firstString(artifact.type, artifact.kind, artifact.artifact_type),
    ),
    title: firstString(artifact.title),
    sourceId: firstString(artifact.sourceId),
    sourcePath: firstString(artifact.sourcePath),
    sha256: firstString(artifact.sha256),
  };
}

function firstString(...values) {
  return values.find((value) => typeof value === "string") ?? null;
}

function normalizeType(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "unknown";
}

function classifyArtifact(binding, entry) {
  if (!entry.artifactPath) {
    return excluded(entry, "ARTIFACT_PATH_MISSING");
  }

  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(entry.artifactPath)) {
    return excluded(entry, "EXTERNAL_URI_NOT_FETCHED");
  }

  const checked = safeArtifactPath(
    binding,
    entry.artifactPath,
    "retainPdf.manifest.artifacts[].path",
  );
  if (!checked.valid) {
    return excluded(entry, "UNSAFE_PATH", {
      artifactPath: checked.path,
      unsafe: true,
    });
  }

  if (!fs.existsSync(checked.absolutePath)) {
    return excluded(entry, "ARTIFACT_MISSING", {
      artifactPath: checked.path,
      missing: true,
    });
  }

  const stat = fs.lstatSync(checked.absolutePath);
  if (!stat.isFile()) {
    return excluded(entry, "ARTIFACT_NOT_FILE", { artifactPath: checked.path });
  }

  const realArtifactPath = fs.realpathSync.native(checked.absolutePath);
  if (!isInsideProject(realArtifactPath, binding.projectRoot)) {
    return excluded(entry, "UNSAFE_PATH", {
      artifactPath: checked.path,
      unsafe: true,
    });
  }

  if (!IMPORTABLE_TYPES.has(entry.artifactType)) {
    const reason = SUPPORTING_TYPES.has(entry.artifactType)
      ? "SUPPORTING_ARTIFACT_NOT_IMPORTED"
      : EXCLUDED_TYPES.has(entry.artifactType)
        ? "ARTIFACT_REQUIRES_HEAVY_ACTION"
        : "ARTIFACT_TYPE_NOT_IMPORTABLE";
    return excluded(entry, reason, {
      artifactPath: checked.path,
      exists: true,
    });
  }

  return {
    artifactPath: checked.path,
    artifactType: entry.artifactType,
    exists: true,
    importable: true,
  };
}

function excluded(entry, reason, extra = {}) {
  return {
    artifactPath: extra.artifactPath ?? entry.artifactPath ?? null,
    artifactType: entry.artifactType,
    importable: false,
    reason,
    ...(extra.exists !== undefined ? { exists: extra.exists } : {}),
    ...(extra.missing ? { missing: true } : {}),
    ...(extra.unsafe ? { unsafe: true } : {}),
  };
}

function makeSourceId(manifestPath, artifactPath) {
  const digest = crypto
    .createHash("sha256")
    .update(`${manifestPath}::${artifactPath}`)
    .digest("hex")
    .slice(0, 16);
  return `retainpdf:${digest}`;
}

function summarizePlan(manifest, plan) {
  return {
    manifestArtifacts: manifest.artifactCount,
    importCandidates: plan.candidates.length,
    importable: plan.candidates.length,
    excluded: plan.excluded.length,
    missing: plan.excluded.filter((artifact) => artifact.missing).length,
    unsafe: plan.excluded.filter((artifact) => artifact.unsafe).length,
    heavyActionsAvailable: false,
  };
}

function hasCommandFields(value) {
  if (!value || typeof value !== "object") return false;
  if (Object.hasOwn(value, "command")) return true;
  if (Object.hasOwn(value, "commands")) return true;
  if (Array.isArray(value.artifacts)) {
    return value.artifacts.some(
      (artifact) =>
        artifact &&
        typeof artifact === "object" &&
        Object.hasOwn(artifact, "command"),
    );
  }
  return false;
}

function isInsideProject(candidate, projectRoot) {
  const relative = path.relative(projectRoot, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}
