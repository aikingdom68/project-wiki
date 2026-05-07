# Example: Graph Compile Plan

## User request

已经有 graph adapter readiness 了，请规划怎么编译知识图谱；先不要安装依赖、运行 graphify 或写 graph artifacts。

## Route selected

Map / Graph Knowledge / P4.3 graph compile planning.

This route consumes P4.1 graph adapter readiness and produces a read-only graph compile plan. It does not compile graph artifacts.

## Expected task/deliverable type

- `expected_task_type`: `graph_compile_plan`
- `expected_deliverable_type`: `graph_compile_plan`
- Schema: `contracts/graph-compile-plan.schema.json`
- Expected phase: `p4_3_graph_compile_planning`

## Evidence/readiness inputs

- P4.1 graph adapter readiness.
- Existing project binding, including project type, source roots, admin root, and optional graph adapter config.
- Existing graph artifacts if explicitly configured or exposed by readiness: `graph.json`, `GRAPH_REPORT.md`, `graph.html`, or `cache/` metadata.
- Existing schema profile hint, if present, such as `auto`, `software-repo`, `document-corpus`, `teaching-kb`, `ai-knowledge-app`, `product-business-kb`, or `mixed`.
- Source inventory metadata sufficient to propose source scope; do not perform a graph extraction pass.
- Confidence label policy for `EXTRACTED`, `INFERRED`, and `AMBIGUOUS` relationships.

## Planning-only output shape

Return a JSON-compatible plan with:

- `ok`, `readOnly: true`, `phase: p4_3_graph_compile_planning`, `inspectionLevel`, and optional `projectRoot`.
- `binding.status`, `binding.config`, and binding errors if any.
- `adapter.adapterId: graph`, `adapter.state`, `adapter.executionEnabled: false`, `adapter.dependencyLevelToExecute`, artifacts/warnings/next steps, and confirmation requirements.
- `artifacts.existing` and `artifacts.truncated: false`.
- `plan.planningOnly: true`, `plan.executionEnabled: false`, `plan.compileEndpointAvailable: false`, `plan.graphWriteEnabled: false`, `plan.dependencyInstallEnabled: false`, and `plan.serverStartEnabled: false`.
- `plan.schemaProfile`, `plan.sourceScope`, `plan.confidencePolicy`, `plan.artifactTarget`, `plan.dependencyBoundary`, and `plan.confirmationGates`.
- `summary.adapterState`, `summary.schemaProfile`, `summary.sourceRoots`, `summary.existingArtifacts`, `summary.plannedTargets`, `summary.heavyActionsAvailable: false`, `summary.compileAllowed: false`, and `summary.confirmationRequired: true`.
- `warnings` and `nonGoals`.

## Confirmation gates

Ask for confirmation before:

- choosing a schema profile as durable truth;
- locking source scope or excluding source roots from graph compilation;
- installing graph dependencies or using graphify/graph toolchains;
- writing `graph.json`, `GRAPH_REPORT.md`, cache/html artifacts, or other graph outputs;
- starting graph servers, preview servers, or MCP processes;
- calling external providers;
- promoting `INFERRED` or `AMBIGUOUS` relationships to durable facts.

## Forbidden actions/non-goals

- Do not install graph dependencies.
- Do not run graphify, graph tools, package-manager scripts, or compile commands.
- Do not generate, write, move, or delete `graph.json`, `GRAPH_REPORT.md`, graph cache, graph HTML, or graph artifacts.
- Do not start servers or MCP processes.
- Do not call external providers.
- Do not treat inferred or ambiguous relationships as durable facts.

## Completion state

Complete when the plan names schema profile, source scope, confidence policy, artifact targets, dependency boundary, confirmation gates, explicit non-goals, and states that no graph tool was run and no graph artifact was written.
