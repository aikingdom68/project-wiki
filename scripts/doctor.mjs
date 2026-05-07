#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const requiredFiles = [
  "SKILL.md",
  "README.md",
  "README.zh-CN.md",
  "LICENSE",
  "CHANGELOG.md",
  "RELEASE.md",
  "PUBLISHING.md",
  "ROADMAP.md",
  "test-prompts.json",
  "contracts/source-policy.schema.json",
  "contracts/source-policy-list.schema.json",
  "contracts/output-contract.schema.json",
  "contracts/retrieval-contract.schema.json",
  "contracts/project-profile.schema.json",
  "contracts/adapter-status.schema.json",
  "contracts/source-normalization-import-plan.schema.json",
  "contracts/graph-compile-plan.schema.json",
  "contracts/export-plan.schema.json",
  "references/llm-wiki-core.md",
  "references/local-rag-engineering.md",
  "references/project-assistant-playbook.md",
  "references/modes-and-safety.md",
  "references/source-priority-guidance.md",
  "references/system-integration-guidance.md",
  "references/project-adaptation-protocol.md",
  "references/interactive-clarification-guidance.md",
  "references/task-routing-guidance.md",
  "references/evidence-and-citation.md",
  "references/wiki-quality-audit.md",
  "references/incremental-update-protocol.md",
  "references/knowledge-lifecycle.md",
  "references/output-quality-standards.md",
  "references/wiki-linking.md",
  "references/cold-start-protocol.md",
  "references/adaptive-knowledge-architecture.md",
  "references/project-binding-protocol.md",
  "references/runtime-architecture.md",
  "references/admin-gui-contract.md",
  "references/dependency-installation-policy.md",
  "references/upstream-reuse-policy.md",
  "references/graph-adapter-contract.md",
  "references/retain-pdf-adapter-contract.md",
  "references/templates/overview-page.md",
  "references/templates/module-page.md",
  "references/templates/decision-page.md",
  "references/templates/glossary-page.md",
  "references/templates/troubleshooting-page.md",
  "references/templates/schema-page.md",
  "examples/explain-project.md",
  "examples/source-guided-explain.md",
  "examples/build-wiki-plan.md",
  "examples/adapt-project-first.md",
  "examples/interactive-clarification.md",
  "examples/task-routing-multi-intent.md",
  "examples/compare-options.md",
  "examples/evaluation-report.md",
  "examples/wiki-lifecycle-update.md",
  "scripts/doctor.mjs",
  "scripts/healthcheck.mjs",
  "scripts/adapter-status.mjs",
  "scripts/source-normalization-import-plan.mjs",
  "scripts/graph-compile-plan.mjs",
  "scripts/export-plan.mjs",
  "scripts/admin.mjs",
  "scripts/lib/runtime-config.mjs",
  "scripts/lib/adapter-status.mjs",
  "scripts/lib/source-normalization-import-plan.mjs",
  "scripts/lib/graph-compile-plan.mjs",
  "scripts/lib/export-plan.mjs",
  "scripts/lib/safe-write.mjs",
  "scripts/install.mjs",
  "evals/README.md",
  "evals/cases/source-guided-example-bank.json",
  "evals/cases/project-explanation-basic.json",
  "evals/cases/compare-options-local-evidence.json",
  "evals/cases/evaluation-report-boundary-check.json",
  "evals/cases/wiki-lifecycle-update.json",
  "evals/cases/ambiguous-project-request.json",
  "evals/cases/cold-start-project-adaptation.json",
  "evals/cases/multi-intent-routing.json",
  "evals/cases/clarification-before-plan.json",
  "evals/cases/preferred-source-conflict-routing.json",
];

const jsonFiles = [
  "test-prompts.json",
  "contracts/source-policy.schema.json",
  "contracts/source-policy-list.schema.json",
  "contracts/output-contract.schema.json",
  "contracts/retrieval-contract.schema.json",
  "contracts/project-profile.schema.json",
  "contracts/adapter-status.schema.json",
  "contracts/source-normalization-import-plan.schema.json",
  "contracts/graph-compile-plan.schema.json",
  "contracts/export-plan.schema.json",
  ...collectFiles("evals/cases", ".json"),
];

const parsedJson = new Map();

const skillRepoPrefixes = [
  "references/",
  "contracts/",
  "examples/",
  "scripts/",
  "evals/",
  "tests/",
  "./references/",
  "./contracts/",
  "./examples/",
  "./scripts/",
  "./evals/",
  "./tests/",
  "../",
];

const skillRepoRootFiles = new Set([
  "SKILL.md",
  "README.md",
  "README.zh-CN.md",
  "LICENSE",
  "CHANGELOG.md",
  "RELEASE.md",
  "RELEASE-PLANNING.md",
  "PUBLISHING.md",
  "ROADMAP.md",
]);

const lifecycleMarkers = [
  "review_status",
  "last_reviewed",
  "retention_class",
  "confidence_basis",
  "supersedes",
  "superseded_by",
  "consolidation_status",
  "crystallized_from",
];

const lifecycleCoverageTargets = [
  {
    rel: "references/knowledge-lifecycle.md",
    markers: ["review_status", "retention_class", "consolidation_status"],
  },
  {
    rel: "references/templates/overview-page.md",
    markers: ["review_status", "retention_class", "consolidation_status"],
  },
  {
    rel: "references/templates/module-page.md",
    markers: ["review_status", "retention_class", "consolidation_status"],
  },
  {
    rel: "references/templates/decision-page.md",
    markers: ["review_status", "supersedes", "confidence_basis"],
  },
  {
    rel: "references/templates/glossary-page.md",
    markers: ["review_status", "retention_class"],
  },
  {
    rel: "references/templates/troubleshooting-page.md",
    markers: ["review_status", "supersedes"],
  },
  {
    rel: "examples/build-wiki-plan.md",
    markers: ["review_status", "retention_class", "consolidation_status"],
  },
  {
    rel: "examples/evaluation-report.md",
    markers: ["review_status", "last_reviewed", "confidence_basis"],
  },
  {
    rel: "examples/wiki-lifecycle-update.md",
    markers: ["review_status", "consolidation_status", "supersedes"],
  },
  {
    rel: "references/project-adaptation-protocol.md",
    markers: ["project type", "project state", "candidate routes"],
  },
  {
    rel: "references/interactive-clarification-guidance.md",
    markers: ["Clarification rule", "Option-proposal pattern", "goal"],
  },
  {
    rel: "references/task-routing-guidance.md",
    markers: ["Primary task types", "Multi-intent rule", "cold project"],
  },
  {
    rel: "examples/adapt-project-first.md",
    markers: ["project type", "primary sources", "routes"],
  },
  {
    rel: "examples/interactive-clarification.md",
    markers: ["questions", "candidate routes", "write intent"],
  },
  {
    rel: "examples/task-routing-multi-intent.md",
    markers: ["primary route", "supporting tasks", "confirmation"],
  },
  {
    rel: "evals/README.md",
    markers: ["knowledge-lifecycle", "lifecycle"],
  },
  {
    rel: "evals/cases/wiki-lifecycle-update.json",
    markers: ["review_status", "consolidation_status", "supersession"],
  },
];

const p4TaskTypes = [
  "source_normalization_import_plan",
  "graph_compile_plan",
  "export_plan",
];

const p4ArtifactRequirements = [
  {
    taskType: "check_runtime",
    expectedRoute: "Check Project-Wiki Runtime / P4.1 adapter readiness",
    expectedDeliverableType: "adapter_status",
    exampleRel: "examples/p4-adapter-readiness.md",
    evalRel: "evals/cases/p4-adapter-readiness-check.json",
    schemaRef: "contracts/adapter-status.schema.json",
    requiredFields: [
      "ok",
      "readOnly",
      "phase",
      "inspectionLevel",
      "binding.status",
      "binding.config",
      "adapters.sourceNormalization",
      "adapters.sourceNormalization.executionEnabled",
      "adapters.graph",
      "adapters.graph.executionEnabled",
      "adapters.export",
      "adapters.export.executionEnabled",
      "summary.configured",
      "summary.attention",
      "summary.heavyActionsAvailable",
    ],
    mustNot: [
      "install dependencies",
      "run OCR or convert PDFs",
      "execute RetainPDF or adapter commands",
      "compile graph artifacts",
      "run graphify or graph tools",
      "execute export commands",
      "generate export artifacts",
      "start servers or MCP processes",
      "call external providers or upload files",
      "write adapter artifacts, binding files, source registry files, wiki files, backups, admin logs, graph outputs, or export outputs",
    ],
    exampleRequiredMarkers: [
      "expected_task_type`: `check_runtime`",
      "expected_deliverable_type`: `adapter_status`",
      "contracts/adapter-status.schema.json",
      "phase: p4_adapter_readiness",
      "readOnly: true",
      "executionEnabled: false",
      "heavyActionsAvailable` is false",
      "Confirmation gates",
      "Forbidden actions/non-goals",
    ],
    exampleForbiddenMarkers: [
      "Install dependencies now",
      "Run graphify now",
      "Execute export commands now",
      "Start servers now",
      "Upload files now",
    ],
  },
  {
    taskType: "source_normalization_import_plan",
    expectedRoute:
      "Import / Normalize Sources / P4.2 source normalization import planning.",
    expectedDeliverableType: "source_normalization_import_plan",
    exampleRel: "examples/source-normalization-import-plan.md",
    evalRel: "evals/cases/p4-source-normalization-import-plan.json",
    schemaRef: "contracts/source-normalization-import-plan.schema.json",
    requiredFields: [
      "ok",
      "readOnly",
      "phase",
      "inspectionLevel",
      "binding.status",
      "binding.config",
      "adapter.adapterId",
      "adapter.state",
      "adapter.executionEnabled",
      "adapter.dependencyLevelToExecute",
      "adapter.confirmationRequiredBefore",
      "manifest.path",
      "manifest.exists",
      "manifest.artifactCount",
      "manifest.truncated",
      "plan.planningOnly",
      "plan.executionEnabled",
      "plan.applyEndpointAvailable",
      "plan.sourceRegistryWriteEnabled",
      "plan.wikiWriteEnabled",
      "plan.proposedRegistryTarget.willWrite",
      "plan.candidates",
      "plan.excluded",
      "summary.manifestArtifacts",
      "summary.importCandidates",
      "summary.importable",
      "summary.excluded",
      "summary.missing",
      "summary.unsafe",
      "summary.heavyActionsAvailable",
    ],
    mustNot: [
      "run OCR, PDF conversion, RetainPDF, unzip, copy, move, import, or upload actions",
      "install dependencies or execute adapter commands",
      "guess manifest paths or scan for PDFs outside explicit configuration",
      "read normalized document body contents beyond manifest/path metadata",
      "write source registry files, wiki files, knowledge objects, admin logs, backups, or normalized materials",
      "mark planned registry entries as already imported",
    ],
    exampleRequiredMarkers: [
      "expected_task_type`: `source_normalization_import_plan`",
      "expected_deliverable_type`: `source_normalization_import_plan`",
      "contracts/source-normalization-import-plan.schema.json",
      "phase: p4_2_source_normalization_import_planning",
      "readOnly: true",
      "planningOnly: true",
      "executionEnabled: false",
      "willWrite: false",
      "Confirmation gates",
      "Forbidden actions/non-goals",
    ],
    exampleForbiddenMarkers: [
      "Install dependencies now",
      "Run OCR now",
      "Write source registry now",
      "Upload files now",
      "Import sources now",
    ],
  },
  {
    taskType: "graph_compile_plan",
    expectedRoute: "Map / Graph Knowledge / P4.3 graph compile planning.",
    expectedDeliverableType: "graph_compile_plan",
    exampleRel: "examples/graph-compile-plan.md",
    evalRel: "evals/cases/p4-graph-compile-planning.json",
    schemaRef: "contracts/graph-compile-plan.schema.json",
    requiredFields: [
      "ok",
      "readOnly",
      "phase",
      "inspectionLevel",
      "binding.status",
      "binding.config",
      "adapter.adapterId",
      "adapter.state",
      "adapter.executionEnabled",
      "adapter.dependencyLevelToExecute",
      "artifacts.existing",
      "artifacts.truncated",
      "plan.planningOnly",
      "plan.executionEnabled",
      "plan.compileEndpointAvailable",
      "plan.graphWriteEnabled",
      "plan.dependencyInstallEnabled",
      "plan.serverStartEnabled",
      "plan.schemaProfile",
      "plan.sourceScope",
      "plan.confidencePolicy",
      "plan.artifactTarget",
      "plan.dependencyBoundary",
      "plan.confirmationGates",
      "summary.adapterState",
      "summary.schemaProfile",
      "summary.sourceRoots",
      "summary.existingArtifacts",
      "summary.plannedTargets",
      "summary.heavyActionsAvailable",
      "summary.compileAllowed",
      "summary.confirmationRequired",
    ],
    mustNot: [
      "install graph dependencies",
      "run graphify, graph tools, package-manager scripts, or compile commands",
      "compile graph artifacts",
      "generate, write, move, or delete graph.json, GRAPH_REPORT.md, cache, html, or graph artifacts",
      "start graph servers, preview servers, local servers, or MCP processes",
      "call external providers",
      "promote INFERRED or AMBIGUOUS relationships to durable facts",
    ],
    exampleRequiredMarkers: [
      "expected_task_type`: `graph_compile_plan`",
      "expected_deliverable_type`: `graph_compile_plan`",
      "contracts/graph-compile-plan.schema.json",
      "phase: p4_3_graph_compile_planning",
      "readOnly: true",
      "planningOnly: true",
      "executionEnabled: false",
      "graphWriteEnabled: false",
      "serverStartEnabled: false",
      "Confirmation gates",
      "Forbidden actions/non-goals",
    ],
    exampleForbiddenMarkers: [
      "Install graph dependencies now",
      "Run graphify now",
      "Write graph artifacts now",
      "Start graph servers now",
      "Compile graph now",
    ],
  },
  {
    taskType: "export_plan",
    expectedRoute: "Publish / Export Wiki / P4.4 export planning.",
    expectedDeliverableType: "export_plan",
    exampleRel: "examples/export-plan.md",
    evalRel: "evals/cases/p4-export-planning-no-export.json",
    schemaRef: "contracts/export-plan.schema.json",
    requiredFields: [
      "ok",
      "readOnly",
      "phase",
      "inspectionLevel",
      "binding.status",
      "binding.config",
      "adapter.adapterId",
      "adapter.state",
      "adapter.executionEnabled",
      "adapter.dependencyLevelToExecute",
      "artifacts.existing",
      "artifacts.truncated",
      "plan.planningOnly",
      "plan.executionEnabled",
      "plan.exportEndpointAvailable",
      "plan.exportAllowed",
      "plan.sourceScope.status",
      "plan.sourceScope.roots",
      "plan.outputRoot.path",
      "plan.outputRoot.safe",
      "plan.outputRoot.willWrite",
      "plan.dependencyBoundary",
      "summary.adapterState",
      "summary.heavyActionsAvailable",
      "summary.exportAllowed",
      "summary.confirmationRequired",
    ],
    mustNot: [
      "install export dependencies",
      "run Quartz, Obsidian, static publishing tools, package-manager scripts, shell commands, or export commands",
      "generate, write, move, delete, upload, publish, or serve export artifacts",
      "start preview servers, local servers, or MCP processes",
      "call external providers",
      "mutate target-project files",
      "treat an explicit export plan as execution confirmation",
    ],
    exampleRequiredMarkers: [
      "expected_task_type`: `export_plan`",
      "expected_deliverable_type`: `export_plan`",
      "contracts/export-plan.schema.json",
      "phase: p4_4_export_planning",
      "readOnly: true",
      "planningOnly: true",
      "executionEnabled: false",
      "exportAllowed: false",
      "willWrite: false",
      "Confirmation gates",
      "Forbidden actions/non-goals",
    ],
    exampleForbiddenMarkers: [
      "Install export dependencies now",
      "Run export commands now",
      "Write export artifacts now",
      "Upload artifacts now",
      "Publish artifacts now",
      "Start preview servers now",
    ],
  },
];

let ok = true;

for (const rel of requiredFiles) {
  const absolutePath = path.join(root, rel);
  if (!fs.existsSync(absolutePath)) {
    fail(`MISSING: ${rel}`);
    continue;
  }

  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile()) {
    fail(`NOT_A_FILE: ${rel}`);
    continue;
  }

  if (stat.size === 0) {
    fail(`EMPTY_FILE: ${rel}`);
  }
}

for (const rel of jsonFiles) {
  const absolutePath = path.join(root, rel);
  if (!fs.existsSync(absolutePath)) {
    continue;
  }

  try {
    const parsed = parseJsonFile(rel);
    parsedJson.set(normalizeSlashes(rel), parsed);
    if (normalizeSlashes(rel) === "test-prompts.json") {
      validateTestPrompts(rel, parsed);
    }
    if (normalizeSlashes(rel).startsWith("evals/cases/")) {
      validateEvalCase(rel, parsed);
    }
  } catch (error) {
    fail(error.message);
  }
}

validateMarkdownReferences();
validateSkillFixedFlow();
validateLifecycleCoverage();
validateInstallWhitelist();
validateContractClarity();
validateP4Artifacts();

if (ok) {
  console.log("project-wiki doctor: OK");
  process.exit(0);
}

process.exit(1);

function fail(message) {
  ok = false;
  console.error(message);
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function parseJsonFile(rel) {
  try {
    return JSON.parse(readText(rel));
  } catch (error) {
    throw new Error(`INVALID_JSON: ${rel}: ${error.message}`);
  }
}

function validateTestPrompts(rel, value) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(`INVALID_TEST_PROMPTS: ${rel}: root must be a non-empty array`);
    return;
  }

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      fail(`INVALID_TEST_PROMPTS: ${rel}: item[${index}] must be an object`);
      continue;
    }

    if (!isNonEmptyString(item.id)) {
      fail(
        `INVALID_TEST_PROMPTS: ${rel}: item[${index}].id must be a non-empty string`,
      );
    }

    if (!isNonEmptyString(item.prompt)) {
      fail(
        `INVALID_TEST_PROMPTS: ${rel}: item[${index}].prompt must be a non-empty string`,
      );
    }

    if (!isNonEmptyString(item.expected)) {
      fail(
        `INVALID_TEST_PROMPTS: ${rel}: item[${index}].expected must be a non-empty string`,
      );
    }
  }
}

function validateEvalCase(rel, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`INVALID_EVAL_CASE: ${rel}: root must be an object`);
    return;
  }

  if (!isNonEmptyString(value.id)) {
    fail(`INVALID_EVAL_CASE: ${rel}: id must be a non-empty string`);
  }

  const expectedId = path.basename(rel, ".json");
  if (isNonEmptyString(value.id) && value.id !== expectedId) {
    fail(`INVALID_EVAL_CASE: ${rel}: id must match filename '${expectedId}'`);
  }

  if (!isNonEmptyString(value.prompt)) {
    fail(`INVALID_EVAL_CASE: ${rel}: prompt must be a non-empty string`);
  }

  if (!Array.isArray(value.checks) || value.checks.length === 0) {
    fail(`INVALID_EVAL_CASE: ${rel}: checks must be a non-empty array`);
    return;
  }

  for (const [index, check] of value.checks.entries()) {
    if (!isNonEmptyString(check)) {
      fail(
        `INVALID_EVAL_CASE: ${rel}: checks[${index}] must be a non-empty string`,
      );
    }
  }
}

function validateMarkdownReferences() {
  const markdownFiles = collectFiles(".", ".md");
  const markdownLinkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
  const codePathRegex =
    /`((?:\.{0,2}\/)?(?:[A-Za-z0-9_.-]+\/)*(?:<[A-Za-z0-9_.-]+>\/)?[A-Za-z0-9_.-]+\.(?:md|json|mjs))`/g;

  for (const rel of markdownFiles) {
    const content = readText(rel);
    const contentOutsideCodeBlocks = stripFencedCodeBlocks(content);
    const referencedPaths = new Set();

    for (const match of contentOutsideCodeBlocks.matchAll(markdownLinkRegex)) {
      const rawTarget = match[1].trim();
      if (shouldValidateReference(rawTarget)) {
        referencedPaths.add(rawTarget);
      }
    }

    for (const match of contentOutsideCodeBlocks.matchAll(codePathRegex)) {
      const rawTarget = match[1].trim();
      if (shouldValidateReference(rawTarget)) {
        referencedPaths.add(rawTarget);
      }
    }

    for (const reference of referencedPaths) {
      const normalized = normalizeReference(reference);
      const candidates = [
        path.resolve(path.dirname(path.join(root, rel)), normalized),
        path.resolve(root, normalized),
      ];
      const exists = candidates.some(
        (candidate) => isInsideRoot(candidate) && fs.existsSync(candidate),
      );
      if (!exists) {
        fail(`BROKEN_LOCAL_REFERENCE: ${rel}: ${reference}`);
      }
    }
  }
}

function stripFencedCodeBlocks(content) {
  return content.replace(/^```[\s\S]*?^```/gm, "");
}

function validateSkillFixedFlow() {
  const content = readText("SKILL.md");
  for (const marker of [
    "## Fixed Feature-by-Feature Execution",
    "slash commands, natural-language requests, or ongoing context",
    "do not make one upfront decision",
    "executable_now",
    "plan_only",
    "confirmation_required",
    "not_applicable",
    "Capability check template",
    "Default progression",
    "Open Admin GUI / backend knowledge-base control console",
    "Admin GUI / backend knowledge-base control console is a mandatory capability check",
    "use frontend `i-*` skills before implementation",
  ]) {
    if (!content.includes(marker)) {
      fail(`SKILL_FIXED_FLOW_MISSING_MARKER: ${marker}`);
    }
  }
}

function validateLifecycleCoverage() {
  for (const target of lifecycleCoverageTargets) {
    if (!fs.existsSync(path.join(root, target.rel))) {
      continue;
    }

    const content = readText(target.rel);
    const missingMarkers = target.markers.filter(
      (marker) => !content.includes(marker),
    );
    if (missingMarkers.length > 0) {
      fail(
        `MISSING_LIFECYCLE_MARKER: ${target.rel}: ${missingMarkers.join(", ")}`,
      );
    }
  }

  const lifecycleMentions = lifecycleCoverageTargets
    .filter((target) => fs.existsSync(path.join(root, target.rel)))
    .map((target) => readText(target.rel))
    .join("\n");

  const missingGlobalMarkers = lifecycleMarkers.filter(
    (marker) => !lifecycleMentions.includes(marker),
  );
  if (missingGlobalMarkers.length > 0) {
    fail(
      `MISSING_LIFECYCLE_ROLLOUT_COVERAGE: ${missingGlobalMarkers.join(", ")}`,
    );
  }
}

function validateInstallWhitelist() {
  const rel = "scripts/install.mjs";
  if (!fs.existsSync(path.join(root, rel))) {
    return;
  }

  const content = readText(rel);
  const match = content.match(
    /const\s+whitelist\s*=\s*\[(?<items>[\s\S]*?)\]/m,
  );
  if (!match?.groups?.items) {
    fail(`INVALID_INSTALL_WHITELIST: ${rel}: unable to parse whitelist array`);
    return;
  }

  const values = Array.from(
    match.groups.items.matchAll(/"([^"]+)"|'([^']+)'/g),
  ).map((entry) => entry[1] ?? entry[2]);

  const requiredWhitelistEntries = [
    "SKILL.md",
    "README.md",
    "README.zh-CN.md",
    "LICENSE",
    "CHANGELOG.md",
    "RELEASE.md",
    "PUBLISHING.md",
    "ROADMAP.md",
    "test-prompts.json",
    "contracts",
    "references",
    "examples",
    "scripts",
    "evals",
  ];

  for (const entry of requiredWhitelistEntries) {
    if (!values.includes(entry)) {
      fail(`INSTALL_WHITELIST_MISSING: ${rel}: ${entry}`);
    }
  }
}

function validateContractClarity() {
  const outputSchema = parsedJson.get("contracts/output-contract.schema.json");
  const sourcePolicy = parsedJson.get("contracts/source-policy.schema.json");
  const retrievalContract = parsedJson.get(
    "contracts/retrieval-contract.schema.json",
  );
  const projectProfile = parsedJson.get(
    "contracts/project-profile.schema.json",
  );
  const sourceImportPlan = parsedJson.get(
    "contracts/source-normalization-import-plan.schema.json",
  );
  const graphCompilePlan = parsedJson.get(
    "contracts/graph-compile-plan.schema.json",
  );
  const exportPlan = parsedJson.get("contracts/export-plan.schema.json");

  if (!outputSchema || !sourcePolicy || !retrievalContract || !projectProfile) {
    return;
  }

  if (
    sourceImportPlan?.properties?.phase?.const !==
    "p4_2_source_normalization_import_planning"
  ) {
    fail("SOURCE_IMPORT_PLAN_SCHEMA_MISSING_PHASE_CONST");
  }

  if (
    graphCompilePlan?.properties?.phase?.const !== "p4_3_graph_compile_planning"
  ) {
    fail("GRAPH_COMPILE_PLAN_SCHEMA_MISSING_PHASE_CONST");
  }

  if (exportPlan?.properties?.phase?.const !== "p4_4_export_planning") {
    fail("EXPORT_PLAN_SCHEMA_MISSING_PHASE_CONST");
  }

  const outputProperties = outputSchema.properties ?? {};
  const sourceProperties = sourcePolicy.properties ?? {};
  const retrievalRequestSchema =
    retrievalContract.definitions?.retrieval_request ?? {};
  const retrievalResponseSchema =
    retrievalContract.definitions?.retrieval_response ?? {};
  const retrievalRequest = retrievalRequestSchema.properties ?? {};
  const retrievalResponse = retrievalResponseSchema.properties ?? {};
  const projectProfileProperties = projectProfile.properties ?? {};

  for (const field of [
    "project_profile",
    "project_state",
    "routing_decision",
    "clarifying_questions",
    "proposed_modes",
    "confirmed_scope",
    "deliverable_type",
    "review_status",
    "last_reviewed",
    "retention_class",
    "confidence_basis",
    "supersedes",
    "superseded_by",
    "consolidation_status",
    "crystallized_from",
  ]) {
    if (!outputProperties[field]) {
      fail(`OUTPUT_CONTRACT_MISSING_PROPERTY: ${field}`);
    }
  }

  if (!sourceProperties.review_cadence?.description) {
    fail("SOURCE_POLICY_MISSING_DESCRIPTION: review_cadence");
  }

  if (!sourceProperties.supersession_rule?.description) {
    fail("SOURCE_POLICY_MISSING_DESCRIPTION: supersession_rule");
  }

  for (const field of [
    "usage_role",
    "preferred_for_task_types",
    "conflict_mode",
  ]) {
    if (!sourceProperties[field]) {
      fail(`SOURCE_POLICY_MISSING_PROPERTY: ${field}`);
    }
  }

  for (const field of [
    "task_type",
    "interaction_stage",
    "preferred_source",
    "project_state_probe",
  ]) {
    if (!retrievalRequest[field]) {
      fail(`RETRIEVAL_CONTRACT_MISSING_REQUEST_PROPERTY: ${field}`);
    }
  }

  for (const field of [
    "project_state_assessment",
    "clarification_needed",
    "policy_decision_trace",
  ]) {
    if (!retrievalResponse[field]) {
      fail(`RETRIEVAL_CONTRACT_MISSING_RESPONSE_PROPERTY: ${field}`);
    }
  }

  for (const field of [
    "project_type",
    "cold_start_status",
    "primary_sources",
    "fallback_order",
    "privacy_mode",
    "style_following_default",
  ]) {
    if (!projectProfileProperties[field]) {
      fail(`PROJECT_PROFILE_MISSING_PROPERTY: ${field}`);
    }
  }

  const allOf = Array.isArray(outputSchema.allOf) ? outputSchema.allOf : [];
  const hasUpdateWikiRule = allOf.some((entry) => {
    const taskType = entry?.if?.properties?.task_type?.const;
    return taskType === "update_wiki";
  });

  if (!hasUpdateWikiRule) {
    fail(
      "OUTPUT_CONTRACT_MISSING_UPDATE_WIKI_RULE: expected conditional lifecycle guidance for update_wiki",
    );
  }

  const outputTaskTypes = outputProperties.task_type?.enum ?? [];
  for (const taskType of p4TaskTypes) {
    if (!outputTaskTypes.includes(taskType)) {
      fail(`OUTPUT_CONTRACT_MISSING_TASK_TYPE: ${taskType}`);
    }
  }

  const outputDeliverableTypes = outputProperties.deliverable_type?.enum ?? [];
  for (const deliverableType of p4TaskTypes) {
    if (!outputDeliverableTypes.includes(deliverableType)) {
      fail(`OUTPUT_CONTRACT_MISSING_DELIVERABLE_TYPE: ${deliverableType}`);
    }
  }

  const retrievalTaskTypes = retrievalRequest.task_type?.enum ?? [];
  for (const taskType of p4TaskTypes) {
    if (!retrievalTaskTypes.includes(taskType)) {
      fail(`RETRIEVAL_CONTRACT_MISSING_TASK_TYPE: ${taskType}`);
    }
  }

  validateStrictRetrievalContract(retrievalContract, retrievalResponseSchema);
  validateP4SchemaHardening({
    adapterStatus: parsedJson.get("contracts/adapter-status.schema.json"),
    sourceImportPlan,
    graphCompilePlan,
    exportPlan,
  });

  const preferredTaskTypes =
    projectProfileProperties.preferred_tasks?.items?.enum ?? [];
  for (const taskType of p4TaskTypes) {
    if (!preferredTaskTypes.includes(taskType)) {
      fail(`PROJECT_PROFILE_PREFERRED_TASKS_MISSING: ${taskType}`);
    }
  }

  for (const taskType of p4TaskTypes) {
    const p4Rule = allOf.find((entry) => {
      const entryTaskType = entry?.if?.properties?.task_type?.const;
      return entryTaskType === taskType;
    });

    if (p4Rule?.then?.properties?.deliverable_type?.const !== taskType) {
      fail(
        `OUTPUT_CONTRACT_P4_RULE_MISSING_DELIVERABLE_TYPE_CONST: ${taskType}`,
      );
    }

    const required = Array.isArray(p4Rule?.then?.required)
      ? p4Rule.then.required
      : [];
    if (!required.includes("planning_quality")) {
      fail(
        `OUTPUT_CONTRACT_P4_RULE_MISSING_REQUIRED: ${taskType}: planning_quality`,
      );
    }
  }

  if (!outputProperties.planning_quality) {
    fail("OUTPUT_CONTRACT_MISSING_PROPERTY: planning_quality");
  }
  validatePlanningQualityContract(outputProperties.planning_quality);

  for (const field of ["coverage", "fallback", "save_offer"]) {
    if (!outputProperties[field]) {
      fail(`OUTPUT_CONTRACT_QUERY_MISSING_PROPERTY: ${field}`);
    }
  }

  const sourceImportPlanRule = allOf.some((entry) => {
    const taskType = entry?.if?.properties?.task_type?.const;
    return taskType === "source_normalization_import_plan";
  });

  if (!sourceImportPlanRule) {
    fail(
      "OUTPUT_CONTRACT_MISSING_SOURCE_IMPORT_PLAN_RULE: expected confirmation-gated source normalization import planning guidance",
    );
  }

  const graphCompilePlanRule = allOf.some((entry) => {
    const taskType = entry?.if?.properties?.task_type?.const;
    return taskType === "graph_compile_plan";
  });

  if (!graphCompilePlanRule) {
    fail(
      "OUTPUT_CONTRACT_MISSING_GRAPH_COMPILE_PLAN_RULE: expected confirmation-gated graph compile planning guidance",
    );
  }

  const exportPlanRule = allOf.find((entry) => {
    const taskType = entry?.if?.properties?.task_type?.const;
    return taskType === "export_plan";
  });

  if (!exportPlanRule) {
    fail(
      "OUTPUT_CONTRACT_MISSING_EXPORT_PLAN_RULE: expected confirmation-gated export planning guidance",
    );
  } else {
    const required = Array.isArray(exportPlanRule.then?.required)
      ? exportPlanRule.then.required
      : [];
    for (const field of [
      "deliverable_type",
      "update_plan",
      "assumptions",
      "confidence_basis",
    ]) {
      if (!required.includes(field)) {
        fail(`OUTPUT_CONTRACT_EXPORT_PLAN_RULE_MISSING_REQUIRED: ${field}`);
      }
    }
  }

  const hasAdaptProjectRule = allOf.some((entry) => {
    const taskType = entry?.if?.properties?.task_type?.const;
    return taskType === "adapt_project";
  });

  if (!hasAdaptProjectRule) {
    fail(
      "OUTPUT_CONTRACT_MISSING_ADAPT_PROJECT_RULE: expected adaptation-specific conditional guidance",
    );
  }
}

function validateP4SchemaHardening(schemas) {
  const checks = [
    {
      name: "adapter-status",
      schema: schemas.adapterStatus,
      paths: [
        [],
        ["properties", "binding"],
        ["properties", "adapters"],
        ["properties", "summary"],
        ["definitions", "adapter"],
      ],
    },
    {
      name: "source-normalization-import-plan",
      schema: schemas.sourceImportPlan,
      paths: [
        [],
        ["properties", "binding"],
        ["properties", "manifest"],
        ["properties", "plan"],
        ["properties", "plan", "properties", "proposedRegistryTarget"],
        ["properties", "summary"],
        ["definitions", "adapter"],
        ["definitions", "candidate"],
        ["definitions", "candidate", "properties", "proposedRegistryEntry"],
        ["definitions", "excluded"],
      ],
    },
    {
      name: "graph-compile-plan",
      schema: schemas.graphCompilePlan,
      paths: [
        [],
        ["properties", "binding"],
        ["properties", "artifacts"],
        ["properties", "plan"],
        ["properties", "plan", "properties", "schemaProfile"],
        ["properties", "plan", "properties", "sourceScope"],
        ["properties", "plan", "properties", "confidencePolicy"],
        ["properties", "plan", "properties", "artifactTarget"],
        ["properties", "plan", "properties", "dependencyBoundary"],
        ["properties", "summary"],
        ["definitions", "adapter"],
        ["definitions", "target"],
        ["definitions", "sourceRoot"],
      ],
    },
    {
      name: "export-plan",
      schema: schemas.exportPlan,
      paths: [
        [],
        ["properties", "binding"],
        ["properties", "artifacts"],
        ["properties", "plan"],
        ["properties", "plan", "properties", "target"],
        ["properties", "plan", "properties", "profile"],
        ["properties", "plan", "properties", "sourceScope"],
        ["properties", "plan", "properties", "rollback"],
        ["properties", "plan", "properties", "dependencyBoundary"],
        ["properties", "summary"],
        ["definitions", "adapter"],
        ["definitions", "planningString"],
        ["definitions", "sourceRoot"],
        ["definitions", "outputRoot"],
      ],
    },
  ];

  for (const check of checks) {
    for (const schemaPath of check.paths) {
      const node = resolveSchemaRef(
        check.schema,
        getPath(check.schema, schemaPath),
      );
      if (node?.additionalProperties !== false) {
        fail(
          `P4_SCHEMA_OBJECT_NOT_SEALED: ${check.name}: ${schemaPath.join(".") || "root"}`,
        );
      }
    }
  }

  const sourcePlan =
    schemas.sourceImportPlan?.properties?.plan?.properties ?? {};
  for (const field of [
    "executionEnabled",
    "applyEndpointAvailable",
    "sourceRegistryWriteEnabled",
    "wikiWriteEnabled",
  ]) {
    if (sourcePlan[field]?.const !== false) {
      fail(
        `P4_SCHEMA_FLAG_NOT_FALSE: source-normalization-import-plan: plan.${field}`,
      );
    }
  }
  if (
    sourcePlan.proposedRegistryTarget?.properties?.willWrite?.const !== false
  ) {
    fail(
      "P4_SCHEMA_FLAG_NOT_FALSE: source-normalization-import-plan: plan.proposedRegistryTarget.willWrite",
    );
  }

  const graphPlan =
    schemas.graphCompilePlan?.properties?.plan?.properties ?? {};
  for (const field of [
    "executionEnabled",
    "compileEndpointAvailable",
    "graphWriteEnabled",
    "dependencyInstallEnabled",
    "serverStartEnabled",
  ]) {
    if (graphPlan[field]?.const !== false) {
      fail(`P4_SCHEMA_FLAG_NOT_FALSE: graph-compile-plan: plan.${field}`);
    }
  }
  const graphDependency = graphPlan.dependencyBoundary?.properties ?? {};
  for (const field of [
    "installAllowed",
    "commandExecutionAllowed",
    "externalProviderAllowed",
    "mcpServerStartAllowed",
  ]) {
    if (graphDependency[field]?.const !== false) {
      fail(
        `P4_SCHEMA_FLAG_NOT_FALSE: graph-compile-plan: plan.dependencyBoundary.${field}`,
      );
    }
  }

  const exportPlanProperties =
    schemas.exportPlan?.properties?.plan?.properties ?? {};
  for (const field of [
    "executionEnabled",
    "exportEndpointAvailable",
    "exportAllowed",
    "exportWriteEnabled",
    "writeEnabled",
    "dependencyInstallEnabled",
    "publisherCommandEnabled",
    "uploadEnabled",
    "serverStartEnabled",
  ]) {
    if (exportPlanProperties[field]?.const !== false) {
      fail(`P4_SCHEMA_FLAG_NOT_FALSE: export-plan: plan.${field}`);
    }
  }
  const exportDependency =
    exportPlanProperties.dependencyBoundary?.properties ?? {};
  for (const field of [
    "installAllowed",
    "dependencyInstallAllowed",
    "commandExecutionAllowed",
    "publisherCommandAllowed",
    "uploadAllowed",
    "serverStartAllowed",
    "exportAllowed",
  ]) {
    if (exportDependency[field]?.const !== false) {
      fail(
        `P4_SCHEMA_FLAG_NOT_FALSE: export-plan: plan.dependencyBoundary.${field}`,
      );
    }
  }
  const exportOutputRoot = resolveSchemaRef(
    schemas.exportPlan,
    exportPlanProperties.outputRoot,
  );
  const exportRollback = resolveSchemaRef(
    schemas.exportPlan,
    exportPlanProperties.rollback,
  );
  if (exportOutputRoot?.properties?.willWrite?.const !== false) {
    fail("P4_SCHEMA_FLAG_NOT_FALSE: export-plan: plan.outputRoot.willWrite");
  }
  if (exportRollback?.properties?.willWrite?.const !== false) {
    fail("P4_SCHEMA_FLAG_NOT_FALSE: export-plan: plan.rollback.willWrite");
  }
}

function resolveSchemaRef(schema, node) {
  if (!node?.$ref) {
    return node;
  }
  const prefix = "#/";
  if (!node.$ref.startsWith(prefix)) {
    return node;
  }
  return getPath(schema, node.$ref.slice(prefix.length).split("/"));
}

function getPath(value, segments) {
  return segments.reduce((current, segment) => current?.[segment], value);
}

function validatePlanningQualityContract(planningQuality) {
  const required = Array.isArray(planningQuality?.required)
    ? planningQuality.required
    : [];
  for (const field of [
    "planning_only",
    "execution_enabled",
    "confirmation_required",
    "confirmation_gates",
    "dependency_boundary",
    "must_not_execute",
  ]) {
    if (!required.includes(field)) {
      fail(`OUTPUT_CONTRACT_PLANNING_QUALITY_MISSING_REQUIRED: ${field}`);
    }
  }

  const properties = planningQuality?.properties ?? {};
  for (const [field, expectedConst] of [
    ["planning_only", true],
    ["execution_enabled", false],
    ["confirmation_required", true],
  ]) {
    if (properties[field]?.const !== expectedConst) {
      fail(`OUTPUT_CONTRACT_PLANNING_QUALITY_FIELD_MISSING_CONST: ${field}`);
    }
  }
}

function validateStrictRetrievalContract(
  retrievalContract,
  retrievalResponseSchema,
) {
  const topLevelRequired = Array.isArray(retrievalContract.required)
    ? retrievalContract.required
    : [];
  for (const field of ["request", "response"]) {
    if (!topLevelRequired.includes(field)) {
      fail(`RETRIEVAL_CONTRACT_MISSING_TOP_LEVEL_REQUIRED: ${field}`);
    }
  }

  if (retrievalContract.additionalProperties !== false) {
    fail("RETRIEVAL_CONTRACT_ADDITIONAL_PROPERTIES_NOT_FALSE");
  }

  const responseRequired = Array.isArray(retrievalResponseSchema.required)
    ? retrievalResponseSchema.required
    : [];
  for (const field of [
    "fallback_needed",
    "clarification_needed",
    "retrieval_mode_used",
  ]) {
    if (!responseRequired.includes(field)) {
      fail(`RETRIEVAL_CONTRACT_RESPONSE_MISSING_REQUIRED: ${field}`);
    }
  }

  const responseAllOf = Array.isArray(retrievalResponseSchema.allOf)
    ? retrievalResponseSchema.allOf
    : [];
  if (
    !hasBooleanConstRequiredRule(
      responseAllOf,
      "fallback_needed",
      "fallback_reason",
    )
  ) {
    fail("RETRIEVAL_CONTRACT_MISSING_FALLBACK_NEEDED_RULE");
  }

  if (
    !hasBooleanConstRequiredRule(
      responseAllOf,
      "clarification_needed",
      "clarification_reason",
    )
  ) {
    fail("RETRIEVAL_CONTRACT_MISSING_CLARIFICATION_NEEDED_RULE");
  }
}

function validateP4Artifacts() {
  for (const requirement of p4ArtifactRequirements) {
    if (!fs.existsSync(path.join(root, requirement.exampleRel))) {
      fail(`MISSING_P4_EXAMPLE: ${requirement.exampleRel}`);
    }

    const evalRel = firstExistingRel([
      requirement.evalRel,
      ...(requirement.alternateEvalRels ?? []),
    ]);
    if (!evalRel) {
      fail(`MISSING_P4_EVAL_CASE: ${requirement.evalRel}`);
      continue;
    }

    const evalCase = parsedJson.get(evalRel);
    if (!evalCase || typeof evalCase !== "object" || Array.isArray(evalCase)) {
      continue;
    }

    if (evalCase.schema_ref !== requirement.schemaRef) {
      fail(`P4_EVAL_CASE_MISSING_SCHEMA_REF: ${evalRel}`);
    }

    if (evalCase.expected_task_type !== requirement.taskType) {
      fail(
        `P4_EVAL_CASE_MISSING_EXPECTED_TASK_TYPE: ${evalRel}: ${requirement.taskType}`,
      );
    }

    if (
      requirement.expectedDeliverableType &&
      evalCase.expected_deliverable_type !== requirement.expectedDeliverableType
    ) {
      fail(
        `P4_EVAL_CASE_MISSING_EXPECTED_DELIVERABLE_TYPE: ${evalRel}: ${requirement.expectedDeliverableType}`,
      );
    }

    if (
      requirement.expectedRoute &&
      evalCase.expected_route !== requirement.expectedRoute
    ) {
      fail(
        `P4_EVAL_CASE_MISSING_EXPECTED_ROUTE: ${evalRel}: ${requirement.expectedRoute}`,
      );
    }

    if (!isNonEmptyArray(evalCase.required_fields)) {
      fail(`P4_EVAL_CASE_MISSING_REQUIRED_FIELDS: ${evalRel}`);
    } else {
      for (const requiredField of requirement.requiredFields) {
        if (!evalCase.required_fields.includes(requiredField)) {
          fail(
            `P4_EVAL_CASE_MISSING_REQUIRED_FIELD: ${evalRel}: ${requiredField}`,
          );
        }
      }
    }

    if (!isNonEmptyArray(evalCase.must_not)) {
      fail(`P4_EVAL_CASE_MISSING_MUST_NOT: ${evalRel}`);
    } else {
      for (const forbiddenAction of requirement.mustNot) {
        if (!evalCase.must_not.includes(forbiddenAction)) {
          fail(
            `P4_EVAL_CASE_MISSING_MUST_NOT_ENTRY: ${evalRel}: ${forbiddenAction}`,
          );
        }
      }
    }

    if (!isNonEmptyString(evalCase.prompt)) {
      fail(`P4_EVAL_CASE_MISSING_PROMPT: ${evalRel}`);
    }

    if (!isNonEmptyString(evalCase.id)) {
      fail(`P4_EVAL_CASE_MISSING_ID: ${evalRel}`);
    }

    const exampleRel = requirement.exampleRel;
    const exampleText = fs.readFileSync(path.join(root, exampleRel), "utf8");
    for (const marker of requirement.exampleRequiredMarkers ?? []) {
      if (!exampleText.includes(marker)) {
        fail(`P4_EXAMPLE_MISSING_MARKER: ${exampleRel}: ${marker}`);
      }
    }

    for (const marker of requirement.exampleForbiddenMarkers ?? []) {
      if (exampleText.includes(marker)) {
        fail(`P4_EXAMPLE_HAS_FORBIDDEN_MARKER: ${exampleRel}: ${marker}`);
      }
    }
  }
}

function hasBooleanConstRequiredRule(allOf, flagField, requiredField) {
  return allOf.some((entry) => {
    const flagConst = entry?.if?.properties?.[flagField]?.const;
    const required = Array.isArray(entry?.then?.required)
      ? entry.then.required
      : [];
    return flagConst === true && required.includes(requiredField);
  });
}

function firstExistingRel(relCandidates) {
  return relCandidates.find((rel) => fs.existsSync(path.join(root, rel)));
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function collectFiles(startRel, extension) {
  const startPath = path.join(root, startRel);
  if (!fs.existsSync(startPath)) {
    return [];
  }

  const results = [];
  walk(startPath, results, extension);
  return results
    .map((absolutePath) => normalizeSlashes(path.relative(root, absolutePath)))
    .sort((left, right) => left.localeCompare(right));
}

function walk(currentPath, results, extension) {
  const stat = fs.lstatSync(currentPath);
  if (stat.isSymbolicLink()) {
    return;
  }

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(currentPath)) {
      walk(path.join(currentPath, entry), results, extension);
    }
    return;
  }

  if (currentPath.endsWith(extension)) {
    results.push(currentPath);
  }
}

function shouldValidateReference(reference) {
  if (!reference) {
    return false;
  }

  if (reference.startsWith("http://") || reference.startsWith("https://")) {
    return false;
  }

  if (reference.startsWith("#")) {
    return false;
  }

  if (reference.includes("<") || reference.includes(">")) {
    return false;
  }

  if (!/\.(md|json|mjs)$/.test(reference)) {
    return false;
  }

  if (skillRepoRootFiles.has(reference)) {
    return true;
  }

  if (skillRepoPrefixes.some((prefix) => reference.startsWith(prefix))) {
    return true;
  }

  return false;
}

function normalizeReference(reference) {
  return reference.replace(/#.*$/, "");
}

function normalizeSlashes(value) {
  return value.replace(/\\/g, "/");
}

function isInsideRoot(candidatePath) {
  const relative = path.relative(root, candidatePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? true
    : candidatePath === root;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
