#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const requiredFiles = [
  "SKILL.md",
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "RELEASE.md",
  "PUBLISHING.md",
  "ROADMAP.md",
  "contracts/source-policy.schema.json",
  "contracts/output-contract.schema.json",
  "references/llm-wiki-core.md",
  "references/local-rag-engineering.md",
  "references/project-assistant-playbook.md",
  "references/modes-and-safety.md",
  "references/source-priority-guidance.md",
  "references/system-integration-guidance.md",
  "references/evidence-and-citation.md",
  "references/wiki-quality-audit.md",
  "references/incremental-update-protocol.md",
  "references/knowledge-lifecycle.md",
  "references/output-quality-standards.md",
  "references/templates/overview-page.md",
  "references/templates/module-page.md",
  "references/templates/decision-page.md",
  "references/templates/glossary-page.md",
  "references/templates/troubleshooting-page.md",
  "examples/explain-project.md",
  "examples/source-guided-explain.md",
  "examples/build-wiki-plan.md",
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
];

const jsonFiles = [
  "contracts/source-policy.schema.json",
  "contracts/output-contract.schema.json",
  ...collectFiles("evals/cases", ".json"),
];

const parsedJson = new Map();

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
    const referencedPaths = new Set();

    for (const match of content.matchAll(markdownLinkRegex)) {
      const rawTarget = match[1].trim();
      if (shouldValidateReference(rawTarget)) {
        referencedPaths.add(rawTarget);
      }
    }

    for (const match of content.matchAll(codePathRegex)) {
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

  if (!outputSchema || !sourcePolicy) {
    return;
  }

  const outputProperties = outputSchema.properties ?? {};
  const sourceProperties = sourcePolicy.properties ?? {};

  for (const field of [
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

  return /\.(md|json|mjs)$/.test(reference);
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
