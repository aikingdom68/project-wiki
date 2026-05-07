# Admin GUI Contract

The Admin GUI is a local web interface contract for ordinary users to inspect and safely curate a project knowledge base.

## P0 Boundary

P0 only defines the contract. It must not create frontend files, backend server files, routes, scripts, or dependencies.

## Product Goal

```text
project-wiki Skill
  -> bind project
  -> optional local Admin GUI
  -> ordinary users inspect structure, test queries, fix categories, and manage backups
```

The GUI is a safety layer over Markdown/JSON files, not a replacement for source evidence.

## P2 Read-only GUI

P2 provides a lightweight local read-only runtime:

```text
node scripts/admin.mjs <target-project> --port 0
```

It binds only to `127.0.0.1`, prints a local URL, uses Node built-ins only, and does not open a browser automatically.

Read-only pages:

- overview dashboard
- structure browser
- source preview
- test query page
- health check page
- graph preview page if graph artifacts already exist
- export plan page for P4.4 read-only planning

Read-only API:

```text
GET  /api/kb/admin/health
GET  /api/kb/admin/summary
GET  /api/kb/admin/tree
GET  /api/kb/admin/items
GET  /api/kb/admin/item/:id
GET  /api/kb/admin/source/:id
POST /api/kb/admin/test-query  # read-only test, no KB mutation
GET  /api/kb/admin/graph       # reads existing artifacts only
GET  /api/kb/admin/graph/compile-plan  # read-only plan; no compile action
GET  /api/kb/admin/export/plan  # read-only plan; no export/publish/install/run action
```

P2 must not create binding files, caches, logs, source policies, backups, graph artifacts, or admin override files.

## P3 Safe-write GUI

Write-capable GUI behavior must use a curation layer:

```text
manual-overrides.json
review-queue.json
admin-log.md
backups/
```

P3 implementation supports only append-only curation operations:

```text
POST /api/kb/admin/curation/preview
POST /api/kb/admin/curation/apply
```

Supported operation types:

- `review_queue_append` appends a normalized entry to `review-queue.json`.
- `manual_override_append` appends a normalized entry to `manual-overrides.json`.

Preview must be read-only and return affected files, diff, base hashes, planned backups, and a random `previewId`. Apply must require the same server-issued `previewId`, `confirmed: true`, `Content-Type: application/json`, and the `x-project-wiki-admin-token` header printed by the local runtime readiness event. Apply must recompute the preview, reject stale previews, create backups or missing-file sentinels under `backups/`, write atomically, and append `admin-log.md`.

P3 still must not provide arbitrary wiki edits, raw source mutation, backup restore, imports/OCR, graph compilation, source policy editing, retrieval preset editing, export, dependency installation, or external API calls.

P3 implemented user actions:

- append review queue entries
- append manual override entries
- preview affected files and diffs before apply
- create backups or missing-file sentinels
- append admin log entries

Future P4+ candidate actions may include:

- edit knowledge object metadata through a richer override model
- change category/topic/module binding through validated schemas
- split or merge knowledge objects through review queues
- save test queries
- edit source/retrieval policy after confirmation
- restore backups after preview

## P4.1 Adapter Readiness

P4.1 adds a read-only adapter status endpoint:

```text
GET /api/kb/admin/adapters
```

It reports RetainPDF-style source normalization readiness, graph artifact readiness, and export plan readiness. It must not expose action buttons that run OCR, import, graph compilation, dependency installation, export, publish, or external provider calls.

## P4.2 Source Normalization Import Planning

P4.2 adds a read-only import-plan endpoint:

```text
GET /api/kb/admin/source-normalization/import-plan
```

It may display manifest artifact summaries, importable candidates, excluded items, and proposed source registry entries with `willWrite: false`. It must not expose import/apply/OCR/convert/upload buttons, write source registry files, write wiki files, or execute adapter commands.

## P4.3 Graph Compile Planning

P4.3 adds a read-only graph compile-plan endpoint/view:

```text
GET /api/kb/admin/graph/compile-plan
```

It may display schema profile, source scope, confidence policy, artifact targets, dependency boundary, existing graph artifact metadata, and confirmation gates. The Admin health feature flag should expose `graphCompilePlanning: true` and keep `graphCompile: false`. The UI must not expose a compile button, install button, graphify/run button, MCP/server start button, external provider action, or any action that writes `graph.json`, `GRAPH_REPORT.md`, cache, or HTML artifacts.

## P4.4 Export Planning

P4.4 adds a read-only export plan endpoint/view:

```text
GET /api/kb/admin/export/plan
```

It may display source scope, target/profile, output root, dependency boundary, rollback/cleanup, existing export-plan metadata, and confirmation gates with all write/execution fields set to false. The Admin health feature flag should expose `exportPlanning: true` and keep `export: false`. The UI must not expose an export button, publish button, install button, Quartz/static/Obsidian run button, command runner, upload action, server/MCP start button, external provider action, or any action that writes export artifacts.

## Hard Rules

- NEVER directly mutate raw/source materials by default.
- NEVER write without diff preview.
- NEVER write without backup.
- NEVER write outside the write whitelist.
- NEVER silently confirm chapter tree, source authority, retrieval policy, schema profile, or graph write location.
- NEVER upload PDFs or call external OCR/provider without explicit confirmation.

## Frontend Skill Use

When implementation reaches P2/P3 and no upstream UI is directly reusable, first use `D:/claudeskills/i-shape/SKILL.md` to shape the UX/UI. Then use relevant `i-*` skills for implementation and quality passes, such as `i-impeccable`, `i-layout`, `i-harden`, `i-audit`, and `i-polish`.

## Completion Marker

An Admin GUI plan is complete when it states whether the GUI exists, what phase is being planned, read/write boundaries, confirmation gates, and the next safe action.
