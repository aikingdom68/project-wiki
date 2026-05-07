import fs from "node:fs";
import path from "node:path";
import { loadProjectBinding } from "./runtime-config.mjs";

const MAX_JSON_BYTES = 500_000;
const MAX_TEXT_BYTES = 200_000;

const CONFIRMATION_GATES = {
  sourceNormalization: [
    "copying sources",
    "converting documents",
    "running OCR",
    "calling external providers",
    "uploading files",
    "writing durable KB artifacts",
  ],
  graph: [
    "choosing graph schema profile as durable truth",
    "installing graph dependencies",
    "compiling graph artifacts",
    "starting graph or MCP servers",
  ],
  export: [
    "installing export toolchains",
    "running publisher commands",
    "generating export artifacts",
    "publishing or uploading output",
  ],
};

export function inspectAdapterStatus(projectRootInput) {
  const binding = loadProjectBinding(projectRootInput);
  const base = {
    ok: true,
    readOnly: true,
    phase: "p4_adapter_readiness",
    inspectionLevel: 0,
    projectRoot: binding.projectRoot,
    binding: {
      status: binding.health.status,
      config: binding.health.config,
    },
  };

  if (!binding.config) {
    const adapters = {
      sourceNormalization: unavailableAdapter("retain-pdf"),
      graph: unavailableAdapter("graph"),
      export: unavailableAdapter("export"),
    };
    return {
      ...base,
      adapters,
      summary: summarizeAdapters(adapters),
      warnings: [],
    };
  }

  const adapters = {
    sourceNormalization: inspectRetainPdf(binding),
    graph: inspectGraph(binding),
    export: inspectExport(binding),
  };

  return {
    ...base,
    adapters,
    summary: summarizeAdapters(adapters),
    warnings: binding.health.warnings ?? [],
  };
}

function unavailableAdapter(adapterId) {
  return adapterRecord(adapterId, "env_unavailable", {
    nextSteps: [
      "Create or confirm .project-wiki/project-wiki.config.json before adapter readiness checks.",
    ],
  });
}

function inspectRetainPdf(binding) {
  const config = binding.config.optionalAdapters?.retainPdf;
  if (!config || !Object.hasOwn(config, "manifestPath")) {
    return adapterRecord("retain-pdf", "not_installed", {
      nextSteps: [
        "Confirm processing boundary and RetainPDF artifact manifest path before normalization.",
      ],
      confirmationRequiredBefore: CONFIRMATION_GATES.sourceNormalization,
    });
  }

  const manifest = readJsonArtifact(
    binding,
    config.manifestPath,
    "optionalAdapters.retainPdf.manifestPath",
  );
  if (manifest.status === "unsafe") {
    return adapterRecord("retain-pdf", "unsupported", {
      warnings: [`UNSAFE_PATH: ${manifest.path}`],
      confirmationRequiredBefore: CONFIRMATION_GATES.sourceNormalization,
    });
  }

  if (manifest.status === "missing") {
    return adapterRecord("retain-pdf", "empty_result", {
      artifacts: [{ path: manifest.path, exists: false }],
      confirmationRequiredBefore: CONFIRMATION_GATES.sourceNormalization,
    });
  }

  if (manifest.status === "invalid") {
    return adapterRecord("retain-pdf", "runtime_failed", {
      artifacts: [{ path: manifest.path, exists: true, error: manifest.error }],
      warnings: [manifest.error],
      confirmationRequiredBefore: CONFIRMATION_GATES.sourceNormalization,
    });
  }

  return adapterRecord("retain-pdf", "configured", {
    artifacts: [
      {
        path: manifest.path,
        exists: true,
        kind: "manifest",
        summary: summarizeJson(manifest.data),
      },
    ],
    confirmationRequiredBefore: CONFIRMATION_GATES.sourceNormalization,
  });
}

function inspectGraph(binding) {
  const config = binding.config.optionalAdapters?.graph ?? {};
  const graphJsonPath =
    config.graphJson ?? `${binding.paths.adminRoot.path}/graph.json`;
  const graphReportPath =
    config.graphReport ?? `${binding.paths.adminRoot.path}/GRAPH_REPORT.md`;
  const graphJson = readJsonArtifact(
    binding,
    graphJsonPath,
    "optionalAdapters.graph.graphJson",
  );
  const graphReport = readTextArtifact(
    binding,
    graphReportPath,
    "optionalAdapters.graph.graphReport",
  );

  if (graphJson.status === "unsafe" || graphReport.status === "unsafe") {
    const unsafe = [graphJson, graphReport].filter(
      (artifact) => artifact.status === "unsafe",
    );
    return adapterRecord("graph", "unsupported", {
      warnings: unsafe.map((artifact) => `UNSAFE_PATH: ${artifact.path}`),
      confirmationRequiredBefore: CONFIRMATION_GATES.graph,
    });
  }

  const invalidArtifacts = [graphJson, graphReport].filter(
    (artifact) => artifact.status === "invalid",
  );
  if (invalidArtifacts.length > 0) {
    return adapterRecord("graph", "runtime_failed", {
      artifacts: artifactSummaries([graphJson, graphReport]),
      warnings: invalidArtifacts.map((artifact) => artifact.error),
      confirmationRequiredBefore: CONFIRMATION_GATES.graph,
      metadata: {
        schemaProfile:
          config.schemaProfile ?? binding.config.schemaProfile ?? "auto",
      },
    });
  }

  const artifacts = artifactSummaries([graphJson, graphReport]);
  const hasArtifact = artifacts.some((artifact) => artifact.exists);
  return adapterRecord("graph", hasArtifact ? "configured" : "empty_result", {
    artifacts,
    confirmationRequiredBefore: CONFIRMATION_GATES.graph,
    metadata: {
      schemaProfile:
        config.schemaProfile ?? binding.config.schemaProfile ?? "auto",
    },
    nextSteps: hasArtifact
      ? []
      : [
          "Confirm schema profile, source scope, confidence policy, and artifact path before graph compilation.",
        ],
  });
}

function inspectExport(binding) {
  const config = binding.config.optionalAdapters?.export;
  if (!config || !Object.hasOwn(config, "planFile")) {
    return adapterRecord("export", "not_installed", {
      nextSteps: [
        "Confirm export target, output root, publisher tool, and rollback plan before export.",
      ],
      confirmationRequiredBefore: CONFIRMATION_GATES.export,
    });
  }

  const plan = readJsonArtifact(
    binding,
    config.planFile,
    "optionalAdapters.export.planFile",
  );
  if (plan.status === "unsafe") {
    return adapterRecord("export", "unsupported", {
      warnings: [`UNSAFE_PATH: ${plan.path}`],
      confirmationRequiredBefore: CONFIRMATION_GATES.export,
    });
  }

  if (plan.status === "missing") {
    return adapterRecord("export", "empty_result", {
      artifacts: [{ path: plan.path, exists: false }],
      confirmationRequiredBefore: CONFIRMATION_GATES.export,
    });
  }

  if (plan.status === "invalid") {
    return adapterRecord("export", "runtime_failed", {
      artifacts: [{ path: plan.path, exists: true, error: plan.error }],
      warnings: [plan.error],
      confirmationRequiredBefore: CONFIRMATION_GATES.export,
    });
  }

  return adapterRecord("export", "configured", {
    artifacts: [
      {
        path: plan.path,
        exists: true,
        kind: "plan",
        summary: summarizeJson(plan.data),
      },
    ],
    warnings: plan.data?.command ? ["EXPORT_COMMAND_PRESENT_NOT_EXECUTED"] : [],
    confirmationRequiredBefore: CONFIRMATION_GATES.export,
  });
}

function adapterRecord(adapterId, state, extra = {}) {
  return {
    adapterId,
    state,
    executionEnabled: false,
    dependencyLevelToExecute: 3,
    artifacts: extra.artifacts ?? [],
    warnings: extra.warnings ?? [],
    confirmationRequiredBefore: extra.confirmationRequiredBefore ?? [],
    nextSteps: extra.nextSteps ?? [],
    ...(extra.metadata ? { metadata: extra.metadata } : {}),
  };
}

export function readJsonArtifact(binding, relativePath, fieldName) {
  const checked = safeArtifactPath(binding, relativePath, fieldName);
  if (!checked.valid) return checked;
  const prepared = prepareArtifactRead(binding, checked, MAX_JSON_BYTES);
  if (prepared.status !== "ok") return prepared;

  try {
    return {
      status: "ok",
      path: checked.path,
      data: JSON.parse(fs.readFileSync(prepared.absolutePath, "utf8")),
    };
  } catch {
    return { status: "invalid", path: checked.path, error: "INVALID_JSON" };
  }
}

function readTextArtifact(binding, relativePath, fieldName) {
  const checked = safeArtifactPath(binding, relativePath, fieldName);
  if (!checked.valid) return checked;
  const prepared = prepareArtifactRead(binding, checked, MAX_TEXT_BYTES);
  if (prepared.status !== "ok") return prepared;

  return {
    status: "ok",
    path: checked.path,
    bytes: prepared.bytes,
  };
}

function prepareArtifactRead(binding, checked, maxBytes) {
  if (!fs.existsSync(checked.absolutePath)) {
    return { status: "missing", path: checked.path };
  }

  const inspection = inspectPathSegments(
    binding.projectRoot,
    checked.absolutePath,
  );
  if (!inspection.valid) {
    return { status: "unsafe", valid: false, path: checked.path };
  }

  const stat = fs.lstatSync(checked.absolutePath);
  if (!stat.isFile()) {
    return {
      status: "invalid",
      path: checked.path,
      error: "ARTIFACT_NOT_FILE",
    };
  }

  const realArtifactPath = fs.realpathSync.native(checked.absolutePath);
  if (!isInsideProject(realArtifactPath, binding.projectRoot)) {
    return { status: "unsafe", valid: false, path: checked.path };
  }

  const realStat = fs.statSync(realArtifactPath);
  if (!realStat.isFile()) {
    return {
      status: "invalid",
      path: checked.path,
      error: "ARTIFACT_NOT_FILE",
    };
  }

  if (realStat.size > maxBytes) {
    return {
      status: "invalid",
      path: checked.path,
      error: "ARTIFACT_TOO_LARGE",
    };
  }

  return {
    status: "ok",
    path: checked.path,
    absolutePath: realArtifactPath,
    bytes: realStat.size,
  };
}

export function safeArtifactPath(binding, relativePath, fieldName) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    return {
      status: "unsafe",
      valid: false,
      path: describeArtifactPath(relativePath),
      fieldName,
    };
  }

  const normalized = relativePath.replaceAll("\\", "/");
  if (
    path.isAbsolute(normalized) ||
    /^[A-Za-z]:[\\/]/.test(normalized) ||
    normalized.startsWith("//") ||
    normalized.startsWith("\\\\") ||
    normalized.split("/").includes("..")
  ) {
    return { status: "unsafe", valid: false, path: normalized, fieldName };
  }

  const absolutePath = path.resolve(binding.projectRoot, normalized);
  if (!isInsideProject(absolutePath, binding.projectRoot)) {
    return { status: "unsafe", valid: false, path: normalized, fieldName };
  }

  const inspection = inspectPathSegments(binding.projectRoot, absolutePath);
  if (!inspection.valid) {
    return { status: "unsafe", valid: false, path: normalized, fieldName };
  }

  return { status: "ok", valid: true, path: normalized, absolutePath };
}

function describeArtifactPath(value) {
  if (value === "") return "[empty-string]";
  if (Array.isArray(value)) return "[non-string:array]";
  return `[non-string:${typeof value}]`;
}

function inspectPathSegments(projectRoot, absolutePath) {
  const relative = path.relative(projectRoot, absolutePath);
  const parts = relative.split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    const currentPath = path.join(projectRoot, ...parts.slice(0, index + 1));
    if (!fs.existsSync(currentPath)) return { valid: true };
    const stat = fs.lstatSync(currentPath);
    if (stat.isSymbolicLink()) return { valid: false };
    if (!isInsideProject(fs.realpathSync.native(currentPath), projectRoot)) {
      return { valid: false };
    }
  }
  return { valid: true };
}

function isInsideProject(candidate, projectRoot) {
  const relative = path.relative(projectRoot, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function artifactSummaries(artifacts) {
  return artifacts.map((artifact) => {
    if (artifact.status === "missing") {
      return { path: artifact.path, exists: false };
    }
    if (artifact.status === "invalid") {
      return { path: artifact.path, exists: true, error: artifact.error };
    }
    if (artifact.data !== undefined) {
      return {
        path: artifact.path,
        exists: true,
        kind: "json",
        summary: summarizeJson(artifact.data),
      };
    }
    return {
      path: artifact.path,
      exists: true,
      kind: "text",
      bytes: artifact.bytes,
    };
  });
}

function summarizeJson(value) {
  if (Array.isArray(value)) {
    return { type: "array", count: value.length };
  }
  if (value && typeof value === "object") {
    return {
      type: "object",
      keys: Object.keys(value).slice(0, 20),
      ...(Array.isArray(value.artifacts)
        ? { artifactCount: value.artifacts.length }
        : {}),
      ...(Array.isArray(value.nodes) ? { nodeCount: value.nodes.length } : {}),
      ...(Array.isArray(value.edges) ? { edgeCount: value.edges.length } : {}),
    };
  }
  return { type: typeof value };
}

function summarizeAdapters(adapters) {
  const configured = Object.entries(adapters)
    .filter(([, adapter]) => adapter.state === "configured")
    .map(([name]) => name);
  const attention = Object.entries(adapters)
    .filter(([, adapter]) => adapter.state !== "configured")
    .map(([name]) => name);
  return {
    configured,
    attention,
    heavyActionsAvailable: false,
  };
}
