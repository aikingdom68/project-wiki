# Runtime Architecture

This reference defines the boundary between the lightweight `project-wiki` Skill and heavier runtime capabilities.

## Layers

```text
project-wiki Skill
  -> route selection, confirmation gates, policy, references
companion runtime
  -> optional local server, adapters, cache, GUI endpoints
adapters
  -> optional bridges to RetainPDF, graph tools, static publishers, Obsidian export
目标项目
  -> owns sources, wiki files, admin files, backups, runtime config
```

## P0/P1/P2/P3 Boundary

P0 is rules-layer only. It may describe runtime contracts, but it must not create or run runtime files.

P1 adds one read-only checker:

```text
scripts/healthcheck.mjs <target-project>
```

The healthcheck script may inspect `.project-wiki/project-wiki.config.json`, configured roots, source roots, and write whitelist boundaries. It must not create target-project files, install dependencies, start services, open browsers, or implement the Admin GUI.

P2 adds one read-only local Admin runtime:

```text
scripts/admin.mjs <target-project> --port 0
```

The Admin runtime binds only to `127.0.0.1`, uses Node built-ins, prints a local URL, and exposes read-only health/summary/tree/items/source/test-query/graph-read endpoints. It must not create target-project files, install dependencies, open browsers, write caches/logs/admin files, compile graphs, import PDFs, or run OCR.

P3 adds append-only curation writes through token-protected preview/apply endpoints. It may write only `review-queue.json`, `manual-overrides.json`, `admin-log.md`, and backup artifacts after confirmation, JSON content-type checks, write-whitelist checks, stale-preview checks, and backup creation.

P0/P1/P2/P3 must not add:

- dependency installers
- target-project `.project-wiki/` binding files
- copied upstream code
- arbitrary CRUD routes
- raw source mutation
- graph/PDF/import/export execution

## Runtime Responsibilities

The companion runtime may:

- read `.project-wiki/project-wiki.config.json`
- serve a local admin UI on `127.0.0.1`
- expose read-only health/summary/tree/items/source/test-query endpoints
- report existing graph artifacts without compiling new ones
- apply confirmed append-only curation changes through review/override layers

P4.1 adds one read-only adapter readiness checker:

```text
scripts/adapter-status.mjs <target-project>
GET /api/kb/admin/adapters
```

It may inspect explicit RetainPDF-style manifests, existing graph artifacts, and explicit export plans. It must not execute adapters, install dependencies, run OCR, compile graphs, generate export artifacts, or write target-project files.

P4.2 adds one read-only source normalization import planner:

```text
scripts/source-normalization-import-plan.mjs <target-project>
GET /api/kb/admin/source-normalization/import-plan
```

It may consume only an explicit configured RetainPDF-style manifest and produce planning-only source registry/wiki candidate metadata. It must not run OCR, convert PDFs, unzip bundles, execute manifest commands, install dependencies, upload files, read normalized document contents, write source registry files, write wiki files, or create adapter artifacts.

P4.3 adds one read-only graph compile planner:

```text
node scripts/graph-compile-plan.mjs <target-project>
GET /api/kb/admin/graph/compile-plan
```

It consumes P4.1 graph adapter readiness and produces only `phase: p4_3_graph_compile_planning` with schema profile, source scope, confidence policy, artifact targets, dependency boundary, and confirmation gates. The Admin health feature flag should report `graphCompilePlanning: true` while `graphCompile` remains `false`. It must not install dependencies, run graphify/graph tools, compile graph artifacts, write `graph.json`/`GRAPH_REPORT.md`/cache/html, start servers or MCP, call external providers, or promote inferred/ambiguous relationships to durable facts.

P4.4 adds one read-only export planner:

```text
node scripts/export-plan.mjs <target-project>
GET /api/kb/admin/export/plan
```

It consumes P4.1 export adapter readiness and an explicit export plan, then produces only `phase: p4_4_export_planning` with source scope, target/profile, output root, dependency boundary, rollback/cleanup, and confirmation gates. The Admin health feature flag should report `exportPlanning: true` while `export` remains `false`. It must not install export dependencies, run Quartz/static/Obsidian tools, run export commands, generate or write export artifacts, upload or publish, start servers or MCP, call external providers, mutate files, or treat the explicit export plan as execution confirmation.

## Confirmation Rules

Ask before:

- starting a local service
- opening a browser dashboard
- installing runtime dependencies
- creating `.project-wiki/runtime/`
- writing config/cache/admin files
- exposing local project data to an external tool or provider

## Frontend Design Note

When the work reaches P2/P3 Admin GUI implementation, first check whether an upstream UI can be adapted. If not, use the user's `D:/claudeskills/i-*` frontend/design skills, starting with `i-shape`, before custom UI implementation.
