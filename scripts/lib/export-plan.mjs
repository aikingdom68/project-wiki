import {
  inspectAdapterStatus,
  readJsonArtifact,
  safeArtifactPath,
} from "./adapter-status.mjs";
import { loadProjectBinding } from "./runtime-config.mjs";

const PHASE = "p4_4_export_planning";
const DEFAULT_OUTPUT_ROOT = ".project-wiki/export";
const EXPORT_CONFIRMATION_GATES = [
  "confirming export target and profile",
  "installing export toolchains",
  "running publisher commands",
  "generating export artifacts",
  "writing export output",
  "publishing or uploading output",
  "starting export preview or publisher servers",
];
const NON_GOALS = [
  "NO_EXPORT_EXECUTION",
  "NO_EXPORT_WRITES",
  "NO_DEPENDENCY_INSTALL",
  "NO_COMMAND_EXECUTION",
  "NO_PUBLISHER_COMMANDS",
  "NO_UPLOAD",
  "NO_SERVER_START",
];

export function inspectExportPlan(projectRootInput) {
  const binding = loadProjectBinding(projectRootInput);
  const adapterStatus = inspectAdapterStatus(binding.projectRoot);
  const adapter = normalizeExportAdapter(adapterStatus.adapters.export);
  const explicitPlan = readExplicitPlan(binding, adapter);
  const planned = buildPlan(binding, adapter, explicitPlan.data);
  const warnings = uniqueStrings([
    ...(adapterStatus.warnings ?? []),
    ...(adapter.warnings ?? []),
    ...(explicitPlan.warnings ?? []),
    ...(planned.warnings ?? []),
  ]);

  return {
    ok: true,
    readOnly: true,
    phase: PHASE,
    inspectionLevel: 1,
    projectRoot: binding.projectRoot,
    binding: {
      status: binding.health.status,
      config: binding.health.config,
    },
    adapter,
    artifacts: {
      existing: adapter.artifacts ?? [],
      truncated: false,
    },
    plan: planned.plan,
    summary: summarize(adapter, planned.plan),
    warnings,
    nonGoals: NON_GOALS,
  };
}

function normalizeExportAdapter(adapter) {
  return {
    adapterId: "export",
    state: adapter?.state ?? "env_unavailable",
    executionEnabled: false,
    dependencyLevelToExecute: adapter?.dependencyLevelToExecute ?? 3,
    artifacts: (adapter?.artifacts ?? []).map(sanitizeArtifactSummary),
    warnings: adapter?.warnings ?? [],
    confirmationRequiredBefore:
      adapter?.confirmationRequiredBefore?.length > 0
        ? adapter.confirmationRequiredBefore
        : EXPORT_CONFIRMATION_GATES,
    nextSteps: adapter?.nextSteps ?? [],
    ...(adapter?.metadata ? { metadata: adapter.metadata } : {}),
  };
}

function sanitizeArtifactSummary(artifact) {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    return artifact;
  }

  const summary = sanitizeSummary(artifact.summary);
  return {
    ...artifact,
    ...(summary ? { summary } : {}),
  };
}

function sanitizeSummary(summary) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return summary;
  }

  return {
    ...summary,
    ...(Array.isArray(summary.keys)
      ? { keys: summary.keys.filter((key) => !isCommandFieldName(key)) }
      : {}),
  };
}

function readExplicitPlan(binding, adapter) {
  if (!binding.config || adapter.state !== "configured") {
    return { data: null, warnings: [] };
  }

  const planFile = binding.config.optionalAdapters?.export?.planFile;
  const plan = readJsonArtifact(
    binding,
    planFile,
    "optionalAdapters.export.planFile",
  );
  if (plan.status !== "ok") {
    return { data: null, warnings: plan.error ? [plan.error] : [] };
  }

  return {
    data: plan.data && typeof plan.data === "object" ? plan.data : null,
    warnings: hasCommandFields(plan.data)
      ? ["EXPORT_COMMAND_FIELDS_IGNORED"]
      : [],
  };
}

function buildPlan(binding, adapter, explicitPlan) {
  const exportConfig = binding.config?.optionalAdapters?.export ?? {};
  const target = planningString(
    exportConfig.target,
    explicitPlan?.target,
    null,
  );
  const profile = planningString(
    exportConfig.profile,
    explicitPlan?.profile,
    null,
  );
  const outputRoot = outputRootRecord(
    binding,
    firstPlanningValue(exportConfig.outputRoot, explicitPlan?.outputRoot) ??
      DEFAULT_OUTPUT_ROOT,
  );
  const rollback = rollbackRecord(
    binding,
    exportConfig.rollback ?? explicitPlan?.rollback,
  );
  const dependencyBoundary = dependencyBoundaryRecord(
    adapter,
    exportConfig.dependencyBoundary ?? explicitPlan?.dependencyBoundary,
  );
  const warnings = [
    ...(outputRoot.safe ? [] : [`UNSAFE_PATH: ${outputRoot.path}`]),
    ...(rollback.backupRoot && !rollback.backupRoot.safe
      ? [`UNSAFE_PATH: ${rollback.backupRoot.path}`]
      : []),
  ];

  return {
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
      target: {
        value: target.value,
        source: target.source,
        confirmed: false,
      },
      profile: {
        value: profile.value,
        source: profile.source,
        confirmed: false,
      },
      sourceScope: {
        status: "needs_confirmation",
        roots: sourceRoots(binding),
      },
      outputRoot,
      rollback,
      dependencyBoundary,
      confirmationGates: EXPORT_CONFIRMATION_GATES,
    },
    warnings,
  };
}

function planningString(configValue, planValue, fallback) {
  const configString = stringOrNull(configValue);
  if (configString !== null) {
    return { value: configString, source: "optionalAdapters.export" };
  }

  const planString = stringOrNull(planValue);
  if (planString !== null) {
    return { value: planString, source: "exportPlan" };
  }

  return { value: fallback, source: "default" };
}

function sourceRoots(binding) {
  const roots = [];
  if (binding.paths?.wikiRoot?.path) {
    roots.push({
      role: "wiki",
      path: binding.paths.wikiRoot.path,
      confirmed: false,
    });
  }
  for (const source of binding.rawSourceRoots ?? []) {
    if (source.path) {
      roots.push({ role: "raw_source", path: source.path, confirmed: false });
    }
  }
  return roots;
}

function outputRootRecord(binding, value) {
  const originalPath =
    typeof value === "string" ? value : describePlanningPath(value);
  const checked = binding.config
    ? safeArtifactPath(binding, value, "optionalAdapters.export.outputRoot")
    : safeArtifactPath(
        { projectRoot: binding.projectRoot },
        value,
        "optionalAdapters.export.outputRoot",
      );

  return {
    path: checked.path ?? originalPath,
    safe: checked.valid === true,
    willWrite: false,
  };
}

function rollbackRecord(binding, rollback) {
  const record =
    rollback && typeof rollback === "object" && !Array.isArray(rollback)
      ? rollback
      : {};
  const backupRootValue = stringOrNull(record.backupRoot);
  return {
    strategy: stringOrNull(record.strategy) ?? null,
    confirmed: false,
    willWrite: false,
    ...(backupRootValue !== null
      ? { backupRoot: outputRootRecord(binding, backupRootValue) }
      : {}),
  };
}

function dependencyBoundaryRecord(adapter, dependencyBoundary) {
  const record =
    dependencyBoundary &&
    typeof dependencyBoundary === "object" &&
    !Array.isArray(dependencyBoundary)
      ? dependencyBoundary
      : {};
  return {
    requiredToExecute: Math.max(
      3,
      finiteNumber(record.requiredToExecute)
        ? record.requiredToExecute
        : adapter.dependencyLevelToExecute,
    ),
    toolchain: stringOrNull(record.toolchain),
    installAllowed: false,
    dependencyInstallAllowed: false,
    commandExecutionAllowed: false,
    publisherCommandAllowed: false,
    uploadAllowed: false,
    serverStartAllowed: false,
    exportAllowed: false,
    allowedNow: [
      "read project binding",
      "read export adapter readiness status",
      "summarize explicit export planning fields",
    ],
    blockedUntilConfirmation: [
      "installing export toolchains",
      "running publisher commands",
      "writing export output",
      "publishing or uploading output",
      "starting export servers",
    ],
  };
}

function summarize(adapter, plan) {
  return {
    adapterState: adapter.state,
    target: plan.target.value,
    profile: plan.profile.value,
    outputRoot: plan.outputRoot.path,
    outputRootSafe: plan.outputRoot.safe,
    existingArtifacts: (adapter.artifacts ?? []).filter(
      (artifact) => artifact.exists,
    ).length,
    heavyActionsAvailable: false,
    exportAllowed: false,
    executionAllowed: false,
    writeAllowed: false,
    dependencyInstallAllowed: false,
    commandExecutionAllowed: false,
    uploadAllowed: false,
    serverStartAllowed: false,
    confirmationRequired: true,
  };
}

function firstPlanningValue(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function describePlanningPath(value) {
  if (value === "") return "[empty-string]";
  if (Array.isArray(value)) return "[non-string:array]";
  return `[non-string:${typeof value}]`;
}

function hasCommandFields(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 8) return false;
  if (Array.isArray(value)) {
    return value.some((entry) => hasCommandFields(entry, depth + 1));
  }

  return Object.entries(value).some(
    ([key, entry]) =>
      isCommandFieldName(key) || hasCommandFields(entry, depth + 1),
  );
}

function isCommandFieldName(key) {
  return typeof key === "string" && /command|script|shell/i.test(key);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string"))];
}
