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
const p4TaskTypes = [
  "source_normalization_import_plan",
  "graph_compile_plan",
  "export_plan",
];

const p4EvalCases = {
  "p4-adapter-readiness-check": {
    schema_ref: "contracts/adapter-status.schema.json",
    expected_route: "Check Project-Wiki Runtime / P4.1 adapter readiness",
    expected_task_type: "check_runtime",
    expected_deliverable_type: "adapter_status",
    required_fields: [
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
    must_not: [
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
  },
  "p4-source-normalization-import-plan": {
    schema_ref: "contracts/source-normalization-import-plan.schema.json",
    expected_route:
      "Import / Normalize Sources / P4.2 source normalization import planning.",
    expected_task_type: "source_normalization_import_plan",
    expected_deliverable_type: "source_normalization_import_plan",
    required_fields: [
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
    must_not: [
      "run OCR, PDF conversion, RetainPDF, unzip, copy, move, import, or upload actions",
      "install dependencies or execute adapter commands",
      "guess manifest paths or scan for PDFs outside explicit configuration",
      "read normalized document body contents beyond manifest/path metadata",
      "write source registry files, wiki files, knowledge objects, admin logs, backups, or normalized materials",
      "mark planned registry entries as already imported",
    ],
  },
  "p4-graph-compile-planning": {
    schema_ref: "contracts/graph-compile-plan.schema.json",
    expected_route: "Map / Graph Knowledge / P4.3 graph compile planning.",
    expected_task_type: "graph_compile_plan",
    expected_deliverable_type: "graph_compile_plan",
    required_fields: [
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
    must_not: [
      "install graph dependencies",
      "run graphify, graph tools, package-manager scripts, or compile commands",
      "compile graph artifacts",
      "generate, write, move, or delete graph.json, GRAPH_REPORT.md, cache, html, or graph artifacts",
      "start graph servers, preview servers, local servers, or MCP processes",
      "call external providers",
      "promote INFERRED or AMBIGUOUS relationships to durable facts",
    ],
  },
  "p4-export-planning-no-export": {
    schema_ref: "contracts/export-plan.schema.json",
    expected_route: "Publish / Export Wiki / P4.4 export planning.",
    expected_task_type: "export_plan",
    expected_deliverable_type: "export_plan",
    required_fields: [
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
    must_not: [
      "install export dependencies",
      "run Quartz, Obsidian, static publishing tools, package-manager scripts, shell commands, or export commands",
      "generate, write, move, delete, upload, publish, or serve export artifacts",
      "start preview servers, local servers, or MCP processes",
      "call external providers",
      "mutate target-project files",
      "treat an explicit export plan as execution confirmation",
    ],
  },
};

const doctorPath = path.join(repoRoot, "scripts", "doctor.mjs");

const requiredFiles = {
  "SKILL.md": fs.readFileSync(path.join(repoRoot, "SKILL.md"), "utf8"),
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
        task_type: {
          type: "string",
          enum: [
            "adapt_project",
            "update_wiki",
            "source_normalization_import_plan",
            "graph_compile_plan",
            "export_plan",
          ],
        },
        deliverable_type: {
          type: "string",
          enum: [
            "wiki_update",
            "source_normalization_import_plan",
            "graph_compile_plan",
            "export_plan",
          ],
        },
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
        planning_quality: {
          type: "object",
          required: [
            "planning_only",
            "execution_enabled",
            "confirmation_required",
            "confirmation_gates",
            "dependency_boundary",
            "must_not_execute",
          ],
          properties: {
            planning_only: { const: true },
            execution_enabled: { const: false },
            confirmation_required: { const: true },
            confirmation_gates: { type: "array" },
            dependency_boundary: { type: "object" },
            must_not_execute: { type: "array" },
          },
          additionalProperties: false,
        },
        coverage: { type: "string" },
        fallback: { type: "string" },
        save_offer: { type: "string" },
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
        {
          if: {
            properties: {
              task_type: { const: "source_normalization_import_plan" },
            },
          },
          then: {
            required: [
              "deliverable_type",
              "update_plan",
              "assumptions",
              "planning_quality",
            ],
            properties: {
              deliverable_type: {
                const: "source_normalization_import_plan",
              },
            },
          },
        },
        {
          if: {
            properties: {
              task_type: { const: "graph_compile_plan" },
            },
          },
          then: {
            required: [
              "deliverable_type",
              "update_plan",
              "assumptions",
              "confidence_basis",
              "planning_quality",
            ],
            properties: {
              deliverable_type: {
                const: "graph_compile_plan",
              },
            },
          },
        },
        {
          if: {
            properties: {
              task_type: { const: "export_plan" },
            },
          },
          then: {
            required: [
              "deliverable_type",
              "update_plan",
              "assumptions",
              "confidence_basis",
              "planning_quality",
            ],
            properties: {
              deliverable_type: {
                const: "export_plan",
              },
            },
          },
        },
      ],
    },
    null,
    2,
  ),
  "contracts/retrieval-contract.schema.json": JSON.stringify(
    {
      type: "object",
      required: ["request", "response"],
      additionalProperties: false,
      definitions: {
        retrieval_request: {
          type: "object",
          properties: {
            task_type: {
              type: "string",
              enum: [
                "adapt_project",
                "update_wiki",
                "source_normalization_import_plan",
                "graph_compile_plan",
                "export_plan",
              ],
            },
            interaction_stage: { type: "string" },
            preferred_source: { type: "string" },
            project_state_probe: { type: "boolean" },
          },
        },
        retrieval_response: {
          type: "object",
          required: [
            "fallback_needed",
            "clarification_needed",
            "retrieval_mode_used",
          ],
          properties: {
            project_state_assessment: { type: "string" },
            fallback_needed: { type: "boolean" },
            fallback_reason: { type: "string" },
            clarification_needed: { type: "boolean" },
            clarification_reason: { type: "string" },
            retrieval_mode_used: { type: "string" },
            policy_decision_trace: { type: "array" },
          },
          allOf: [
            {
              if: { properties: { fallback_needed: { const: true } } },
              then: { required: ["fallback_reason"] },
            },
            {
              if: { properties: { clarification_needed: { const: true } } },
              then: { required: ["clarification_reason"] },
            },
          ],
        },
      },
    },
    null,
    2,
  ),
  "contracts/adapter-status.schema.json": fs.readFileSync(
    path.join(repoRoot, "contracts", "adapter-status.schema.json"),
    "utf8",
  ),
  "contracts/source-normalization-import-plan.schema.json": fs.readFileSync(
    path.join(
      repoRoot,
      "contracts",
      "source-normalization-import-plan.schema.json",
    ),
    "utf8",
  ),
  "contracts/graph-compile-plan.schema.json": fs.readFileSync(
    path.join(repoRoot, "contracts", "graph-compile-plan.schema.json"),
    "utf8",
  ),
  "contracts/export-plan.schema.json": fs.readFileSync(
    path.join(repoRoot, "contracts", "export-plan.schema.json"),
    "utf8",
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
        preferred_tasks: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "adapt_project",
              "update_wiki",
              "source_normalization_import_plan",
              "graph_compile_plan",
              "export_plan",
            ],
          },
        },
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
  "references/adaptive-knowledge-architecture.md": "# adaptive architecture\n",
  "references/project-binding-protocol.md": "# project binding\n",
  "references/runtime-architecture.md": "# runtime architecture\n",
  "references/admin-gui-contract.md": "# admin gui contract\n",
  "references/dependency-installation-policy.md": "# dependency policy\n",
  "references/upstream-reuse-policy.md": "# upstream reuse\n",
  "references/graph-adapter-contract.md": "# graph adapter\n",
  "references/retain-pdf-adapter-contract.md": "# retain pdf adapter\n",
  "references/export-adapter-contract.md": "# export adapter\n",
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
  "examples/p4-adapter-readiness.md": `# Example: P4 Adapter Readiness

Check Project-Wiki Runtime / P4.1 adapter readiness

- \`expected_task_type\`: \`check_runtime\`
- \`expected_deliverable_type\`: \`adapter_status\`
- Schema: \`contracts/adapter-status.schema.json\`
- phase: p4_adapter_readiness
- readOnly: true
- executionEnabled: false
- \`heavyActionsAvailable\` is false

## Confirmation gates

## Forbidden actions/non-goals
`,
  "examples/source-normalization-import-plan.md": `# Example: Source Normalization Import Plan

Import / Normalize Sources / P4.2 source normalization import planning.

- \`expected_task_type\`: \`source_normalization_import_plan\`
- \`expected_deliverable_type\`: \`source_normalization_import_plan\`
- Schema: \`contracts/source-normalization-import-plan.schema.json\`
- phase: p4_2_source_normalization_import_planning
- readOnly: true
- planningOnly: true
- executionEnabled: false
- willWrite: false

## Confirmation gates

## Forbidden actions/non-goals
`,
  "examples/graph-compile-plan.md": `# Example: Graph Compile Plan

Map / Graph Knowledge / P4.3 graph compile planning.

- \`expected_task_type\`: \`graph_compile_plan\`
- \`expected_deliverable_type\`: \`graph_compile_plan\`
- Schema: \`contracts/graph-compile-plan.schema.json\`
- phase: p4_3_graph_compile_planning
- readOnly: true
- planningOnly: true
- executionEnabled: false
- graphWriteEnabled: false
- serverStartEnabled: false

## Confirmation gates

## Forbidden actions/non-goals
`,
  "examples/export-plan.md": `# Example: Export Plan

Publish / Export Wiki / P4.4 export planning.

- \`expected_task_type\`: \`export_plan\`
- \`expected_deliverable_type\`: \`export_plan\`
- Schema: \`contracts/export-plan.schema.json\`
- phase: p4_4_export_planning
- readOnly: true
- planningOnly: true
- executionEnabled: false
- exportAllowed: false
- willWrite: false

## Confirmation gates

## Forbidden actions/non-goals
`,
  "scripts/doctor.mjs": "#!/usr/bin/env node\n",
  "scripts/healthcheck.mjs": "#!/usr/bin/env node\n",
  "scripts/adapter-status.mjs": "#!/usr/bin/env node\n",
  "scripts/source-normalization-import-plan.mjs": "#!/usr/bin/env node\n",
  "scripts/graph-compile-plan.mjs": "#!/usr/bin/env node\n",
  "scripts/export-plan.mjs": "#!/usr/bin/env node\n",
  "scripts/admin.mjs": "#!/usr/bin/env node\n",
  "scripts/lib/runtime-config.mjs": "export function placeholder() {}\n",
  "scripts/lib/adapter-status.mjs": "export function placeholder() {}\n",
  "scripts/lib/source-normalization-import-plan.mjs":
    "export function placeholder() {}\n",
  "scripts/lib/graph-compile-plan.mjs": "export function placeholder() {}\n",
  "scripts/lib/export-plan.mjs": "export function placeholder() {}\n",
  "scripts/lib/safe-write.mjs": "export function placeholder() {}\n",
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
  "evals/cases/p4-adapter-readiness-check.json": JSON.stringify(
    {
      id: "p4-adapter-readiness-check",
      prompt: "prompt",
      checks: ["validates P4 adapter readiness boundaries"],
      ...p4EvalCases["p4-adapter-readiness-check"],
    },
    null,
    2,
  ),
  "evals/cases/p4-source-normalization-import-plan.json": JSON.stringify(
    {
      id: "p4-source-normalization-import-plan",
      prompt: "prompt",
      checks: ["validates source normalization import planning boundaries"],
      ...p4EvalCases["p4-source-normalization-import-plan"],
    },
    null,
    2,
  ),
  "evals/cases/p4-graph-compile-planning.json": JSON.stringify(
    {
      id: "p4-graph-compile-planning",
      prompt: "prompt",
      checks: ["validates graph compile planning boundaries"],
      ...p4EvalCases["p4-graph-compile-planning"],
    },
    null,
    2,
  ),
  "evals/cases/p4-export-planning-no-export.json": JSON.stringify(
    {
      id: "p4-export-planning-no-export",
      prompt: "prompt",
      checks: ["validates export planning boundaries"],
      ...p4EvalCases["p4-export-planning-no-export"],
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

function outputSchemaWithoutExportPlan() {
  const schema = JSON.parse(
    requiredFiles["contracts/output-contract.schema.json"],
  );
  return JSON.stringify(
    {
      ...schema,
      properties: {
        ...schema.properties,
        task_type: {
          ...schema.properties.task_type,
          enum: schema.properties.task_type.enum.filter(
            (value) => value !== "export_plan",
          ),
        },
        deliverable_type: {
          ...schema.properties.deliverable_type,
          enum: schema.properties.deliverable_type.enum.filter(
            (value) => value !== "export_plan",
          ),
        },
      },
      allOf: schema.allOf.filter(
        (entry) => entry?.if?.properties?.task_type?.const !== "export_plan",
      ),
    },
    null,
    2,
  );
}

function retrievalSchemaWithoutExportPlan() {
  const schema = JSON.parse(
    requiredFiles["contracts/retrieval-contract.schema.json"],
  );
  const request = schema.definitions.retrieval_request;
  return JSON.stringify(
    {
      ...schema,
      definitions: {
        ...schema.definitions,
        retrieval_request: {
          ...request,
          properties: {
            ...request.properties,
            task_type: {
              ...request.properties.task_type,
              enum: request.properties.task_type.enum.filter(
                (value) => value !== "export_plan",
              ),
            },
          },
        },
      },
    },
    null,
    2,
  );
}

function outputSchemaWithoutP4DeliverableConstMappings() {
  const schema = JSON.parse(
    requiredFiles["contracts/output-contract.schema.json"],
  );
  return JSON.stringify(
    {
      ...schema,
      allOf: schema.allOf.map((entry) => {
        const taskType = entry?.if?.properties?.task_type?.const;
        if (!p4TaskTypes.includes(taskType)) {
          return entry;
        }

        const { properties: _properties, ...thenWithoutProperties } =
          entry.then ?? {};
        return {
          ...entry,
          then: thenWithoutProperties,
        };
      }),
    },
    null,
    2,
  );
}

function projectProfileSchemaWithoutP4PreferredTasks() {
  const schema = JSON.parse(
    requiredFiles["contracts/project-profile.schema.json"],
  );
  const preferredTasks = schema.properties.preferred_tasks;
  return JSON.stringify(
    {
      ...schema,
      properties: {
        ...schema.properties,
        preferred_tasks: {
          ...preferredTasks,
          items: {
            ...preferredTasks.items,
            enum: preferredTasks.items.enum.filter(
              (value) => !p4TaskTypes.includes(value),
            ),
          },
        },
      },
    },
    null,
    2,
  );
}

function retrievalSchemaWithoutFallbackClarificationRules() {
  const schema = JSON.parse(
    requiredFiles["contracts/retrieval-contract.schema.json"],
  );
  const response = schema.definitions.retrieval_response;
  const { allOf: _allOf, ...responseWithoutAllOf } = response;
  return JSON.stringify(
    {
      ...schema,
      definitions: {
        ...schema.definitions,
        retrieval_response: responseWithoutAllOf,
      },
    },
    null,
    2,
  );
}

function p4EvalCaseWithoutHardeningFields(caseId) {
  const {
    schema_ref: _schemaRef,
    required_fields: _requiredFields,
    must_not: _mustNot,
    ...evalCase
  } = {
    id: caseId,
    prompt: "prompt",
    checks: ["validates P4 planning boundaries"],
    ...p4EvalCases[caseId],
  };
  return JSON.stringify(evalCase, null, 2);
}

function outputSchemaWithoutPlanningQualitySafetyGuards() {
  const schema = JSON.parse(
    requiredFiles["contracts/output-contract.schema.json"],
  );
  return JSON.stringify(
    {
      ...schema,
      properties: {
        ...schema.properties,
        planning_quality: {
          type: "object",
          properties: {
            planning_only: { type: "boolean" },
            confirmation_required: { type: "boolean" },
            blocked_actions: { type: "array" },
          },
        },
      },
    },
    null,
    2,
  );
}

function p4EvalCaseWithoutExpectedMetadataEntries(caseId) {
  return JSON.stringify(
    {
      id: caseId,
      prompt: "prompt",
      checks: ["validates P4 planning boundaries"],
      ...p4EvalCases[caseId],
      required_fields: ["phase"],
      must_not: [p4EvalCases[caseId].must_not[0]],
    },
    null,
    2,
  );
}

function p4EvalCaseWithoutExpectedRouteMetadata(caseId) {
  return JSON.stringify(
    {
      id: caseId,
      prompt: "prompt",
      checks: ["validates P4 planning boundaries"],
      ...p4EvalCases[caseId],
      expected_route: "wrong route",
      expected_task_type: "wrong_task",
      expected_deliverable_type: "wrong_deliverable",
    },
    null,
    2,
  );
}

function exportPlanSchemaWithPhase(phase) {
  const schema = JSON.parse(requiredFiles["contracts/export-plan.schema.json"]);
  return JSON.stringify(
    {
      ...schema,
      properties: {
        ...schema.properties,
        phase: { const: phase },
      },
    },
    null,
    2,
  );
}

function assertDoctorFailsWith(result, pattern) {
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, pattern);
  assert.notEqual(result.status, 0, result.stdout);
}

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

test("doctor fails when SKILL.md omits fixed feature-by-feature flow", () => {
  const root = makeFixture({
    "SKILL.md": requiredFiles["SKILL.md"].replace(
      /## Fixed Feature-by-Feature Execution[\s\S]*?## Task Routes/,
      "## Task Routes",
    ),
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /SKILL_FIXED_FLOW_MISSING_MARKER/i);
});

test("doctor fails when SKILL.md omits fixed-flow confirmation gate", () => {
  const root = makeFixture({
    "SKILL.md": requiredFiles["SKILL.md"].replace(
      "Ask before launching local runtime or writing frontend/backend files.",
      "Proceed with local runtime and frontend/backend files.",
    ),
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /SKILL_FIXED_FLOW_MISSING_MARKER/i);
});

test("doctor fails when SKILL.md authorizes heavy actions without confirmation", () => {
  const root = makeFixture({
    "SKILL.md": `${requiredFiles["SKILL.md"]}\n\nFor speed, execute writes, installs, runtime launches, uploads, external calls, and frontend/backend file creation without confirmation.\n`,
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /SKILL_FIXED_FLOW_FORBIDDEN_MARKER/i);
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

test("doctor fails when export plan schema is missing", () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, "contracts", "export-plan.schema.json"));
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /export-plan\.schema\.json/i);
});

test("doctor fails when export plan runtime files are missing", () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, "scripts", "export-plan.mjs"));
  fs.rmSync(path.join(root, "scripts", "lib", "export-plan.mjs"));
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /scripts\/export-plan\.mjs/i);
  assert.match(result.stderr, /scripts\/lib\/export-plan\.mjs/i);
});

test("doctor fails when export plan phase const is wrong", () => {
  const root = makeFixture({
    "contracts/export-plan.schema.json":
      exportPlanSchemaWithPhase("wrong_phase"),
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /EXPORT_PLAN_SCHEMA_MISSING_PHASE_CONST/i);
});

test("doctor fails when output contract omits export plan task wiring", () => {
  const root = makeFixture({
    "contracts/output-contract.schema.json": outputSchemaWithoutExportPlan(),
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(
    result.stderr,
    /OUTPUT_CONTRACT_MISSING_TASK_TYPE: export_plan/i,
  );
  assert.match(
    result.stderr,
    /OUTPUT_CONTRACT_MISSING_DELIVERABLE_TYPE: export_plan/i,
  );
  assert.match(result.stderr, /OUTPUT_CONTRACT_MISSING_EXPORT_PLAN_RULE/i);
});

test("doctor fails when retrieval contract omits export plan task wiring", () => {
  const root = makeFixture({
    "contracts/retrieval-contract.schema.json":
      retrievalSchemaWithoutExportPlan(),
  });
  const result = runDoctor(root);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(
    result.stderr,
    /RETRIEVAL_CONTRACT_MISSING_TASK_TYPE: export_plan/i,
  );
});

test("doctor fails when P4 output rules omit deliverable const mappings", () => {
  const root = makeFixture({
    "contracts/output-contract.schema.json":
      outputSchemaWithoutP4DeliverableConstMappings(),
  });
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_P4_RULE_MISSING_DELIVERABLE_TYPE_CONST: source_normalization_import_plan/i,
  );
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_P4_RULE_MISSING_DELIVERABLE_TYPE_CONST: graph_compile_plan/i,
  );
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_P4_RULE_MISSING_DELIVERABLE_TYPE_CONST: export_plan/i,
  );
});

test("doctor fails when project profile preferred_tasks omits P4 task types", () => {
  const root = makeFixture({
    "contracts/project-profile.schema.json":
      projectProfileSchemaWithoutP4PreferredTasks(),
  });
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /PROJECT_PROFILE_PREFERRED_TASKS_MISSING: source_normalization_import_plan/i,
  );
  assertDoctorFailsWith(
    result,
    /PROJECT_PROFILE_PREFERRED_TASKS_MISSING: graph_compile_plan/i,
  );
  assertDoctorFailsWith(
    result,
    /PROJECT_PROFILE_PREFERRED_TASKS_MISSING: export_plan/i,
  );
});

test("doctor fails when retrieval contract omits fallback and clarification conditional rules", () => {
  const root = makeFixture({
    "contracts/retrieval-contract.schema.json":
      retrievalSchemaWithoutFallbackClarificationRules(),
  });
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /RETRIEVAL_CONTRACT_MISSING_FALLBACK_NEEDED_RULE/i,
  );
  assertDoctorFailsWith(
    result,
    /RETRIEVAL_CONTRACT_MISSING_CLARIFICATION_NEEDED_RULE/i,
  );
});

test("doctor fails when output planning_quality lacks safety guards", () => {
  const root = makeFixture({
    "contracts/output-contract.schema.json":
      outputSchemaWithoutPlanningQualitySafetyGuards(),
  });
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_PLANNING_QUALITY_MISSING_REQUIRED: planning_only/i,
  );
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_PLANNING_QUALITY_MISSING_REQUIRED: execution_enabled/i,
  );
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_PLANNING_QUALITY_MISSING_REQUIRED: confirmation_required/i,
  );
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_PLANNING_QUALITY_FIELD_MISSING_CONST: planning_only/i,
  );
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_PLANNING_QUALITY_FIELD_MISSING_CONST: execution_enabled/i,
  );
  assertDoctorFailsWith(
    result,
    /OUTPUT_CONTRACT_PLANNING_QUALITY_FIELD_MISSING_CONST: confirmation_required/i,
  );
});

test("doctor fails when P4 eval route metadata drifts", () => {
  const root = makeFixture({
    "evals/cases/p4-adapter-readiness-check.json":
      p4EvalCaseWithoutExpectedRouteMetadata("p4-adapter-readiness-check"),
  });
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_EXPECTED_TASK_TYPE: evals\/cases\/p4-adapter-readiness-check\.json: check_runtime/i,
  );
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_EXPECTED_DELIVERABLE_TYPE: evals\/cases\/p4-adapter-readiness-check\.json: adapter_status/i,
  );
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_EXPECTED_ROUTE: evals\/cases\/p4-adapter-readiness-check\.json: Check Project-Wiki Runtime \/ P4\.1 adapter readiness/i,
  );
});

test("doctor fails when P4 eval metadata omits expected entries", () => {
  const root = makeFixture({
    "evals/cases/p4-export-planning-no-export.json":
      p4EvalCaseWithoutExpectedMetadataEntries("p4-export-planning-no-export"),
  });
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_REQUIRED_FIELD: evals\/cases\/p4-export-planning-no-export\.json: plan\.planningOnly/i,
  );
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_REQUIRED_FIELD: evals\/cases\/p4-export-planning-no-export\.json: plan\.executionEnabled/i,
  );
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_MUST_NOT_ENTRY: evals\/cases\/p4-export-planning-no-export\.json: start preview servers, local servers, or MCP processes/i,
  );
});

test("doctor fails when the P4 adapter readiness eval case is missing", () => {
  const root = makeFixture();
  fs.rmSync(
    path.join(root, "evals", "cases", "p4-adapter-readiness-check.json"),
  );
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /MISSING_P4_EVAL_CASE: evals\/cases\/p4-adapter-readiness-check\.json/i,
  );
});

test("doctor fails when a P4 eval case omits schema_ref, required_fields, and must_not", () => {
  const root = makeFixture({
    "evals/cases/p4-export-planning-no-export.json":
      p4EvalCaseWithoutHardeningFields("p4-export-planning-no-export"),
  });
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_SCHEMA_REF: evals\/cases\/p4-export-planning-no-export\.json/i,
  );
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_REQUIRED_FIELDS: evals\/cases\/p4-export-planning-no-export\.json/i,
  );
  assertDoctorFailsWith(
    result,
    /P4_EVAL_CASE_MISSING_MUST_NOT: evals\/cases\/p4-export-planning-no-export\.json/i,
  );
});

test("doctor fails when a P4 example is missing", () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, "examples", "export-plan.md"));
  const result = runDoctor(root);
  assertDoctorFailsWith(
    result,
    /MISSING_P4_EXAMPLE: examples\/export-plan\.md/i,
  );
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
