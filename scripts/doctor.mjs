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
  "contracts/source-policy.schema.json",
  "contracts/source-policy-list.schema.json",
  "contracts/output-contract.schema.json",
  "contracts/retrieval-contract.schema.json",
  "contracts/project-profile.schema.json",
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
  "contracts/source-policy.schema.json",
  "contracts/source-policy-list.schema.json",
  "contracts/output-contract.schema.json",
  "contracts/retrieval-contract.schema.json",
  "contracts/project-profile.schema.json",
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
    if (normalizeSlashes(rel).startsWith("evals/cases/")) {
      validateEvalCase(rel, parsed);
    }
  } catch (error) {
    fail(error.message);
  }
}

validateMarkdownReferences();
validateLifecycleCoverage();
validateInstallWhitelist();
validateContractClarity();

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

  if (!outputSchema || !sourcePolicy || !retrievalContract || !projectProfile) {
    return;
  }

  const outputProperties = outputSchema.properties ?? {};
  const sourceProperties = sourcePolicy.properties ?? {};
  const retrievalRequest =
    retrievalContract.definitions?.retrieval_request?.properties ?? {};
  const retrievalResponse =
    retrievalContract.definitions?.retrieval_response?.properties ?? {};
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
