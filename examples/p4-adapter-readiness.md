# Example: P4 Adapter Readiness Check

## User request

检查这个项目的 PDF、图谱和导出适配器现在是否可用。

## Route selected

Check Project-Wiki Runtime / P4.1 adapter readiness.

This is a read-only readiness check for optional adapters. It reports whether configured RetainPDF-style source normalization, graph, and export inputs are present and usable enough for later planning routes.

## Expected task/deliverable type

- `expected_task_type`: `check_runtime`
- `expected_deliverable_type`: `adapter_status`
- Schema: `contracts/adapter-status.schema.json`
- Expected phase: `p4_adapter_readiness`

P4.1 should use the adapter-status schema. It is not an import, graph compile, or export execution route.

## Evidence/readiness inputs

- Target project root.
- Existing project binding, if present, especially `.project-wiki/project-wiki.config.json`.
- Explicit `optionalAdapters.retainPdf.manifestPath` only; do not guess artifact paths or scan for PDFs.
- Explicit graph adapter paths such as `optionalAdapters.graph.graphJson` and `optionalAdapters.graph.graphReport`, plus documented admin-root defaults if configured by the runtime.
- Explicit export adapter plan/config such as `optionalAdapters.export.planFile` and `optionalAdapters.export.outputRoot`.
- Existing artifact metadata only: path, existence, adapter state, warnings, and next-step hints.

## Planning-only output shape

Return a JSON-compatible status report with:

- `ok`, `readOnly: true`, `phase: p4_adapter_readiness`, `inspectionLevel`, and `projectRoot`.
- `binding.status` and `binding.config` describing the detected binding without creating or modifying it.
- `adapters.sourceNormalization`, `adapters.graph`, and `adapters.export`.
- For each adapter: `adapterId`, `state`, `executionEnabled: false`, `dependencyLevelToExecute`, `artifacts`, `warnings`, `confirmationRequiredBefore`, `nextSteps`, and optional metadata.
- `summary.configured`, `summary.attention`, and `summary.heavyActionsAvailable: false`.

## Confirmation gates

Ask for separate confirmation before any later action that would:

- install PDF, graph, export, OCR, static publishing, or provider dependencies;
- run OCR, convert documents, upload files, or call external providers;
- compile or write graph artifacts;
- run export tooling or generate publishing artifacts;
- start local servers, preview servers, graph servers, or MCP processes;
- write adapter artifacts, project binding files, source registry files, wiki files, backups, or admin logs.

## Forbidden actions/non-goals

- Do not install dependencies.
- Do not run RetainPDF, OCR, graphify, graph tools, Quartz, Obsidian, static publishing tools, shell export commands, or provider calls.
- Do not convert PDFs, unzip bundles, import sources, compile graphs, generate exports, upload, publish, or start servers.
- Do not write adapter artifacts, `graph.json`, `GRAPH_REPORT.md`, cache/html outputs, export outputs, binding files, source registry files, wiki files, backups, or admin logs.
- Do not treat missing adapters as permission to install them.

## Completion state

Complete when all three optional adapter families have a read-only state, artifacts/warnings/next steps are reported, `heavyActionsAvailable` is false, and no file, dependency, runtime, graph, source, or export mutation has occurred.
