import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const doctorPath = path.join(repoRoot, "scripts", "doctor.mjs");

const requiredFiles = {
  "SKILL.md": "# skill\n",
  "README.md": "# readme\n",
  "README.zh-CN.md": "# 说明\n",
  LICENSE: "MIT\n",
  "CHANGELOG.md": "# changelog\n",
  "RELEASE.md": "# release\n",
  "PUBLISHING.md": "# publishing\n",
  "ROADMAP.md": "# roadmap\n",
  "test-prompts.json": JSON.stringify(
    [
      {
        id: "project-explanation-basic",
        prompt:
          "请用 project-wiki 解释这个项目的核心架构，并指出最关键的 5 个文件或页面证据。",
        expected: "给出项目解释结构并附证据锚点。",
      },
    ],
    null,
    2,
  ),
  "contracts/source-policy.schema.json": JSON.stringify(
    {
      type: "object",
      properties: {
        source_id: { type: "string" },
        source_type: { type: "string" },
        authority_level: { type: "string" },
        privacy_class: { type: "string" },
        style_following_allowed: { type: "boolean" },
        fallback_allowed: { type: "boolean" },
        usage_role: { type: "string" },
        preferred_for_task_types: { type: "array" },
        conflict_mode: { type: "string" },
        review_cadence: {
          type: "string",
          description: "Lightweight review expectation.",
        },
        supersession_rule: {
          type: "string",
          description: "Narrow supersession rule.",
        },
      },
    },
    null,
    2,
  ),
  "contracts/source-policy-list.schema.json": JSON.stringify(
    {
      type: "object",
      properties: {
        format: { const: "source-policy-list" },
        policies: { type: "array" },
      },
    },
    null,
    2,
  ),
  "contracts/output-contract.schema.json": JSON.stringify(
    {
      type: "object",
      properties: {
        task_type: { type: "string" },
        deliverable_type: { type: "string" },
        interaction_status: { type: "string" },
        project_profile: { type: "object" },
        project_state: { type: "string" },
        routing_decision: { type: "object" },
        clarifying_questions: { type: "array" },
        proposed_modes: { type: "array" },
        confirmed_scope: { type: "object" },
        verified_facts: { type: "array" },
        synthesis: { type: "array" },
        evidence: { type: "array" },
        gaps: { type: "array" },
        confidence: { type: "string" },
        review_status: { type: "string" },
        last_reviewed: { type: "string" },
        retention_class: { type: "string" },
        supersedes: { type: "array" },
        superseded_by: { type: "array" },
        consolidation_status: { type: "string" },
        crystallized_from: { type: "array" },
        comparison_matrix: { type: "array" },
        recommendation: { type: "string" },
        assumptions: { type: "array" },
        update_plan: { type: "array" },
        confidence_basis: { type: "string" },
      },
      allOf: [
        {
          if: { properties: { task_type: { const: "adapt_project" } } },
          then: {
            required: ["project_profile", "routing_decision", "proposed_modes"],
          },
        },
        {
          if: { properties: { task_type: { const: "update_wiki" } } },
          then: { required: ["update_plan", "review_status"] },
        },
      ],
    },
    null,
    2,
  ),
  "contracts/retrieval-contract.schema.json": JSON.stringify(
    {
      definitions: {
        retrieval_request: {
          type: "object",
          properties: {
            task_type: { type: "string" },
            interaction_stage: { type: "string" },
            preferred_source: { type: "string" },
            project_state_probe: { type: "boolean" },
          },
        },
        retrieval_response: {
          type: "object",
          properties: {
            project_state_assessment: { type: "string" },
            clarification_needed: { type: "boolean" },
            policy_decision_trace: { type: "array" },
          },
        },
      },
    },
    null,
    2,
  ),
  "references/llm-wiki-core.md": "# core\n",
  "references/local-rag-engineering.md": "# rag\n",
  "references/project-assistant-playbook.md": "# playbook\n",
  "references/modes-and-safety.md": "# modes\n",
  "references/source-priority-guidance.md": "# source priority\n",
  "contracts/project-profile.schema.json": JSON.stringify(
    {
      type: "object",
      properties: {
        project_type: { type: "string" },
        cold_start_status: { type: "string" },
        primary_sources: { type: "array" },
        fallback_order: { type: "array" },
        privacy_mode: { type: "string" },
        style_following_default: { type: "boolean" },
      },
    },
    null,
    2,
  ),
  "references/system-integration-guidance.md":
    "# system integration\n\ninteraction_stage\nproject_state\n",
  "references/project-adaptation-protocol.md":
    "# project adaptation\n\nproject type\nproject state\ncandidate routes\n",
  "references/interactive-clarification-guidance.md":
    "# clarification\n\nClarification rule\nOption-proposal pattern\ngoal\n",
  "references/task-routing-guidance.md":
    "# routing\n\nPrimary task types\nMulti-intent rule\ncold project\n",
  "references/evidence-and-citation.md": "# evidence\n",
  "references/wiki-quality-audit.md": "# audit\n",
  "references/incremental-update-protocol.md": "# incremental\n",
  "references/knowledge-lifecycle.md":
    "# lifecycle\n\nreview_status\nlast_reviewed\nretention_class\nconfidence_basis\nsupersedes\nsuperseded_by\nconsolidation_status\ncrystallized_from\n",
  "references/output-quality-standards.md": "# output quality\n",
  "references/wiki-linking.md": "# wiki linking\n",
  "references/cold-start-protocol.md": "# cold start\n",
  "references/templates/overview-page.md":
    "# Overview Page Template\n\nreview_status\nretention_class\nconsolidation_status\n",
  "references/templates/module-page.md":
    "# Module Page Template\n\nreview_status\nretention_class\nconsolidation_status\n",
  "references/templates/decision-page.md":
    "# Decision Page Template\n\nreview_status\nconfidence_basis\nsupersedes\n",
  "references/templates/glossary-page.md":
    "# Glossary Page Template\n\nreview_status\nretention_class\n",
  "references/templates/troubleshooting-page.md":
    "# Troubleshooting Page Template\n\nreview_status\nsupersedes\n",
  "references/templates/schema-page.md": "# SCHEMA.md Template\n",
  "examples/explain-project.md": "# Example: Explain Project\n",
  "examples/source-guided-explain.md": "# Example: Source Guided Explain\n",
  "examples/build-wiki-plan.md":
    "# Example: Build Wiki Plan\n\n- review_status\n- retention_class\n- consolidation_status\n",
  "examples/adapt-project-first.md":
    "# Example: Adapt Project First\n\nproject type\nprimary sources\nroutes\n",
  "examples/interactive-clarification.md":
    "# Example: Interactive Clarification\n\nquestions\ncandidate routes\nwrite intent\n",
  "examples/task-routing-multi-intent.md":
    "# Example: Task Routing\n\nprimary route\nsupporting tasks\nconfirmation\n",
  "examples/compare-options.md": "# Example: Compare Options\n",
  "examples/evaluation-report.md":
    "# Example: Evaluation Report\n\n- review_status\n- last_reviewed\n- confidence_basis\n",
  "examples/wiki-lifecycle-update.md":
    "# Example: Wiki Lifecycle Update\n\n- review_status\n- consolidation_status\n- supersedes\n",
  "scripts/doctor.mjs": "#!/usr/bin/env node\n",
  "scripts/install.mjs":
    '#!/usr/bin/env node\nconst whitelist = ["SKILL.md", "README.md", "README.zh-CN.md", "LICENSE", "CHANGELOG.md", "RELEASE.md", "PUBLISHING.md", "ROADMAP.md", "test-prompts.json", "contracts", "references", "examples", "scripts", "evals"];\n',
  "evals/README.md":
    "# Eval Cases\n\n- lifecycle\n- knowledge-lifecycle\n- project adaptation\n- clarification\n- route options\n",
  "evals/cases/source-guided-example-bank.json": JSON.stringify(
    {
      id: "source-guided-example-bank",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/project-explanation-basic.json": JSON.stringify(
    {
      id: "project-explanation-basic",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/compare-options-local-evidence.json": JSON.stringify(
    {
      id: "compare-options-local-evidence",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/evaluation-report-boundary-check.json": JSON.stringify(
    {
      id: "evaluation-report-boundary-check",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/wiki-lifecycle-update.json": JSON.stringify(
    {
      id: "wiki-lifecycle-update",
      prompt: "prompt",
      checks: [
        "mentions review_status",
        "mentions consolidation_status",
        "mentions supersession",
      ],
    },
    null,
    2,
  ),
  "evals/cases/ambiguous-project-request.json": JSON.stringify(
    {
      id: "ambiguous-project-request",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/cold-start-project-adaptation.json": JSON.stringify(
    {
      id: "cold-start-project-adaptation",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/multi-intent-routing.json": JSON.stringify(
    {
      id: "multi-intent-routing",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/clarification-before-plan.json": JSON.stringify(
    {
      id: "clarification-before-plan",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
  "evals/cases/preferred-source-conflict-routing.json": JSON.stringify(
    {
      id: "preferred-source-conflict-routing",
      prompt: "prompt",
      checks: ["one"],
    },
    null,
    2,
  ),
};

function writeFixture(root, overrides = {}) {
  const files = { ...requiredFiles, ...overrides };
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}

function makeFixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-doctor-"));
  writeFixture(root, overrides);
  return root;
}

function runDoctor(root) {
  return spawnSync(process.execPath, [doctorPath, root], {
    encoding: "utf8",
  });
}

test("doctor passes on a fixture with lifecycle-aware coverage", () => {
  const root = makeFixture();
  const result = runDoctor(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /project-wiki doctor: OK/);
});

test("doctor fails when knowledge lifecycle reference is missing", () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, "references", "knowledge-lifecycle.md"));
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /knowledge-lifecycle/i);
});

test("doctor fails when the Chinese README is missing", () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, "README.zh-CN.md"));
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /README\.zh-CN\.md/i);
});

test("doctor fails when test-prompts.json is missing", () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, "test-prompts.json"));
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /test-prompts\.json/i);
});

test("doctor fails when test-prompts.json is malformed", () => {
  const root = makeFixture({
    "test-prompts.json": "{ invalid json }\n",
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /test-prompts\.json/i);
});

test("doctor fails when an eval JSON file is malformed", () => {
  const root = makeFixture({
    "evals/cases/wiki-lifecycle-update.json": "{ invalid json }\n",
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /wiki-lifecycle-update\.json/i);
  assert.match(result.stderr, /json/i);
});

test("doctor fails cleanly when a contract JSON file is malformed", () => {
  const root = makeFixture({
    "contracts/output-contract.schema.json": "{ invalid json }\n",
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /output-contract\.schema\.json/i);
  assert.match(result.stderr, /invalid_json/i);
  assert.doesNotMatch(result.stderr, /node:internal|Error:/i);
});

test("doctor fails when an eval case shape is incomplete", () => {
  const root = makeFixture({
    "evals/cases/wiki-lifecycle-update.json": JSON.stringify(
      {
        id: "wiki-lifecycle-update",
        checks: [
          "mentions review_status",
          "mentions consolidation_status",
          "mentions supersession",
        ],
      },
      null,
      2,
    ),
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /wiki-lifecycle-update\.json/i);
  assert.match(result.stderr, /prompt/i);
});

test("doctor fails when lifecycle markers are missing from required docs", () => {
  const root = makeFixture({
    "examples/wiki-lifecycle-update.md":
      "# Example: Wiki Lifecycle Update\n\nno marker here\n",
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /wiki-lifecycle-update/i);
  assert.match(result.stderr, /marker/i);
});

test("doctor fails when install whitelist omits lifecycle rollout directories", () => {
  const root = makeFixture({
    "scripts/install.mjs":
      '#!/usr/bin/env node\nconst whitelist = ["SKILL.md", "README.md"];\n',
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /whitelist/i);
  assert.match(result.stderr, /README\.zh-CN\.md|references/i);
});

test("doctor ignores symlinked directories outside the repo root", () => {
  const root = makeFixture();
  const outsideRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "project-wiki-outside-"),
  );
  fs.writeFileSync(
    path.join(outsideRoot, "outside.md"),
    "[broken](missing.md)\n",
  );
  fs.symlinkSync(
    outsideRoot,
    path.join(root, "references", "outside-link"),
    process.platform === "win32" ? "junction" : "dir",
  );

  const result = runDoctor(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /project-wiki doctor: OK/);
});
