import { inspectAdapterStatus, safeArtifactPath } from "./adapter-status.mjs";
import { loadProjectBinding } from "./runtime-config.mjs";

const PHASE = "p4_3_graph_compile_planning";
const CONFIRMATION_GATES = [
  "choosing graph schema profile as durable truth",
  "confirming source scope for graph compilation",
  "treating inferred relationships as durable facts",
  "writing graph.json",
  "writing GRAPH_REPORT.md",
  "writing graph HTML or cache artifacts",
  "installing graph dependencies",
  "executing graph compile commands",
  "starting graph or MCP servers",
  "exposing local project data to external graph/provider tools",
];
const NON_GOALS = [
  "NO_GRAPH_COMPILE",
  "NO_DEPENDENCY_INSTALL",
  "NO_COMMAND_EXECUTION",
  "NO_GRAPH_WRITES",
  "NO_CACHE_WRITES",
  "NO_SERVER_START",
  "NO_MCP_START",
  "NO_DURABLE_INFERRED_TRUTH",
];

export function inspectGraphCompilePlan(projectRootInput) {
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
    const adapter = graphAdapter("env_unavailable");
    return response(base, binding, adapter);
  }

  const adapterStatus = inspectAdapterStatus(binding.projectRoot);
  const adapter = adapterStatus.adapters.graph;
  return response(base, binding, adapter, adapterStatus.warnings ?? []);
}

function response(base, binding, adapter, warnings = []) {
  const graphConfig = binding.config?.optionalAdapters?.graph ?? {};
  const commandWarnings = hasCommandFields(graphConfig)
    ? ["GRAPH_COMMAND_FIELD_IGNORED"]
    : [];
  const normalizedAdapter = {
    ...adapter,
    warnings: [...(adapter.warnings ?? []), ...commandWarnings],
    confirmationRequiredBefore:
      adapter.confirmationRequiredBefore?.length > 0
        ? adapter.confirmationRequiredBefore
        : CONFIRMATION_GATES,
  };
  const plan = buildPlan(binding, normalizedAdapter);
  return {
    ...base,
    adapter: normalizedAdapter,
    artifacts: {
      existing: normalizedAdapter.artifacts ?? [],
      truncated: false,
    },
    plan,
    summary: summarize(binding, normalizedAdapter, plan),
    warnings: [...warnings, ...(normalizedAdapter.warnings ?? [])],
    nonGoals: NON_GOALS,
  };
}

function graphAdapter(state) {
  return {
    adapterId: "graph",
    state,
    executionEnabled: false,
    dependencyLevelToExecute: 3,
    artifacts: [],
    warnings: [],
    confirmationRequiredBefore: CONFIRMATION_GATES,
    nextSteps: [],
    metadata: {
      schemaProfile: "auto",
    },
  };
}

function buildPlan(binding, adapter) {
  const schemaProfile = adapter.metadata?.schemaProfile ?? "auto";
  return {
    planningOnly: true,
    executionEnabled: false,
    compileEndpointAvailable: false,
    graphWriteEnabled: false,
    dependencyInstallEnabled: false,
    serverStartEnabled: false,
    schemaProfile: {
      value: schemaProfile,
      source: "adapter_readiness.metadata.schemaProfile",
      confirmed: false,
      durableTruth: false,
    },
    sourceScope: {
      status: "needs_confirmation",
      roots: sourceRoots(binding),
      existingGraphArtifactsAreEvidenceOnly: true,
    },
    confidencePolicy: {
      labels: ["EXTRACTED", "INFERRED", "AMBIGUOUS"],
      inferredRelationshipsDurable: false,
      ambiguousRelationshipsDurable: false,
      requiresEvidenceForExtracted: true,
      reviewRequiredFor: ["INFERRED", "AMBIGUOUS"],
    },
    artifactTarget: artifactTargets(binding),
    dependencyBoundary: {
      requiredToExecute: 3,
      installAllowed: false,
      commandExecutionAllowed: false,
      externalProviderAllowed: false,
      mcpServerStartAllowed: false,
      allowedNow: [
        "read project binding",
        "read adapter readiness status",
        "summarize existing graph artifact metadata",
      ],
      blockedUntilConfirmation: [
        "installing graph dependencies",
        "compiling graph artifacts",
        "writing graph artifacts",
        "starting graph or MCP servers",
      ],
    },
    confirmationGates: CONFIRMATION_GATES,
  };
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
    if (source.path)
      roots.push({ role: "raw_source", path: source.path, confirmed: false });
  }
  return roots;
}

function artifactTargets(binding) {
  const graphConfig = binding.config?.optionalAdapters?.graph ?? {};
  return {
    graphJson: targetRecord(
      binding,
      graphConfig.graphJson ??
        `${binding.paths?.adminRoot?.path ?? ".project-wiki/admin"}/graph.json`,
      "optionalAdapters.graph.graphJson",
    ),
    graphReport: targetRecord(
      binding,
      graphConfig.graphReport ??
        `${binding.paths?.adminRoot?.path ?? ".project-wiki/admin"}/GRAPH_REPORT.md`,
      "optionalAdapters.graph.graphReport",
    ),
  };
}

function targetRecord(binding, value, fieldName) {
  if (!binding.config) return { path: null, willWrite: false };
  const checked = safeArtifactPath(binding, value, fieldName);
  return {
    path: checked.path,
    willWrite: false,
    safe: checked.valid,
  };
}

function summarize(binding, adapter, plan) {
  return {
    adapterState: adapter.state,
    schemaProfile: plan.schemaProfile.value,
    sourceRoots: plan.sourceScope.roots.length,
    existingArtifacts: (adapter.artifacts ?? []).filter(
      (artifact) => artifact.exists,
    ).length,
    plannedTargets: 2,
    heavyActionsAvailable: false,
    compileAllowed: false,
    confirmationRequired: true,
  };
}

function hasCommandFields(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    (Object.hasOwn(value, "command") || Object.hasOwn(value, "commands")),
  );
}
