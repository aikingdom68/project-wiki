# Example: Export Plan

## User request

已经有 export adapter readiness 和显式 export plan 了，请规划怎么导出 wiki；先不要安装依赖、运行 Quartz/Obsidian/static 工具、生成 artifacts、发布、上传或写文件。

## Route selected

Publish / Export Wiki / P4.4 export planning.

This route consumes P4.1 export adapter readiness and an explicit export plan, then returns a planning-only export plan. It does not execute export or publishing work.

## Expected task/deliverable type

- `expected_task_type`: `export_plan`
- `expected_deliverable_type`: `export_plan`
- Schema: `contracts/export-plan.schema.json`
- Expected phase: `p4_4_export_planning`

## Evidence/readiness inputs

- P4.1 export adapter readiness.
- Explicit configured export plan, usually from `optionalAdapters.export.planFile`.
- Existing project binding, source roots, wiki root, admin root, output root, and write whitelist candidates.
- Target/profile hints such as static site, Obsidian, Quartz-like, or another named profile.
- Existing export artifact metadata only, if present.
- Command-like fields in the explicit plan may be summarized as blocked future execution evidence, but must not be run.

## Planning-only output shape

Return a JSON-compatible plan with:

- `ok`, `readOnly: true`, `phase: p4_4_export_planning`, `inspectionLevel`, and optional `projectRoot`.
- `binding.status`, `binding.config`, and binding errors if any.
- `adapter.adapterId: export`, `adapter.state`, `adapter.executionEnabled: false`, `adapter.dependencyLevelToExecute`, artifacts/warnings/next steps, and confirmation requirements.
- `artifacts.existing` and `artifacts.truncated: false`.
- `plan.planningOnly: true`, `plan.executionEnabled: false`, `plan.exportEndpointAvailable: false`, and `plan.exportAllowed: false`.
- All write/run/upload/server/dependency flags false when present: `exportWriteEnabled`, `writeEnabled`, `dependencyInstallEnabled`, `publisherCommandEnabled`, `uploadEnabled`, `serverStartEnabled`.
- `plan.target`, `plan.profile`, `plan.sourceScope.status: needs_confirmation`, source roots with `confirmed: false`, `plan.outputRoot.path`, `plan.outputRoot.safe`, `plan.outputRoot.willWrite: false`, `plan.rollback`, `plan.dependencyBoundary`, and `plan.confirmationGates`.
- `summary.adapterState`, target/profile/output-root summary, `summary.heavyActionsAvailable: false`, `summary.exportAllowed: false`, execution/write/dependency/command/upload/server flags false, and `summary.confirmationRequired: true`.
- `warnings` and `nonGoals`.

## Confirmation gates

Ask for confirmation before:

- finalizing source scope and export target/profile;
- accepting output root safety and cleanup/rollback behavior;
- installing Quartz, Obsidian, static publishing, or export dependencies;
- running publisher commands, package-manager scripts, export commands, or shell commands;
- generating, writing, moving, deleting, uploading, or publishing export artifacts;
- starting preview servers, local servers, or MCP processes;
- calling external providers.

## Forbidden actions/non-goals

- Do not install export dependencies.
- Do not run Quartz, Obsidian, static publishing tools, package-manager scripts, shell commands, or export commands.
- Do not generate, write, move, delete, upload, publish, or serve export artifacts.
- Do not start preview servers, local servers, or MCP processes.
- Do not call external providers.
- Do not mutate target-project files.
- Do not treat an explicit export plan as execution confirmation.

## Completion state

Complete when the plan names source scope, target/profile, output root and safety, dependency boundary, rollback/cleanup approach, confirmation gates, explicit non-goals, and states that no export was executed and no files were written.
