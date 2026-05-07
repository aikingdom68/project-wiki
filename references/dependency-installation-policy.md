# Dependency Installation Policy

Project Wiki should prefer no-install local reading before optional runtimes or heavy adapters.

## Levels

| Level | Meaning | Examples |
|---|---|---|
| 0 | No install; direct local read/search | Markdown, JSON, source files, existing wiki pages |
| 1 | Existing configured project-wiki runtime | already-present local server/config |
| 2 | Lightweight companion runtime after confirmation | local Python server, static admin assets |
| 3 | Heavy optional adapters after confirmation | RetainPDF, graph tools, Quartz, Obsidian export, OCR providers |

## P0 Boundary

P0 must not install dependencies, create lockfiles, add package managers, or generate scripts.

## Existing No-install Checks

`scripts/healthcheck.mjs <target-project>` is a Level 0/1 read-only check. It uses only Node built-ins, performs no install, and does not start services.

`scripts/adapter-status.mjs <target-project>` is a Level 0/1 read-only adapter readiness check. It may inspect explicit existing manifests, graph artifacts, and export plans, but it must not install dependencies, execute adapters, run OCR, compile graphs, or generate exports.

`scripts/source-normalization-import-plan.mjs <target-project>` is a Level 0/1 read-only RetainPDF-style manifest planner. It may classify existing manifest artifacts and propose planned source registry entries, but it must not install dependencies, execute adapters, run OCR, convert documents, unzip bundles, upload files, or write source registry/wiki files.

`node scripts/graph-compile-plan.mjs <target-project>` is a Level 0/1 read-only graph compile planner. It may consume P4.1 adapter readiness and propose schema/source/confidence/artifact/dependency gates, but it must not install graph dependencies, run graphify/graph tools, compile graph artifacts, write `graph.json`/`GRAPH_REPORT.md`/cache/html, start servers/MCP, call external providers, or promote inferred/ambiguous relationships to durable facts.

`node scripts/export-plan.mjs <target-project>` is a Level 0/1 read-only export planner. It may consume P4.1 export adapter readiness and an explicit export plan, then propose source scope, target/profile, output root, dependency boundary, rollback/cleanup, and confirmation gates, but it must not install export dependencies, run Quartz/static/Obsidian/static publishing tools, run export commands, generate or write export artifacts, upload/publish, start servers/MCP, call external providers, mutate files, or treat the explicit export plan as execution confirmation.

`scripts/admin.mjs <target-project> --port 0` is a Level 1/2 local Admin runtime. It uses only Node built-ins, binds to `127.0.0.1`, prints a local URL and per-server write token, keeps P2 inspection routes read-only, and allows only token-protected P3 append-only curation writes after confirmation. It must be launched only after confirmation.

These tools may report adapter/runtime states, but missing runtime or missing adapters should become setup plans, not automatic installs.

## Export Tooling Boundary

P4.4 export planning stays at Level 0/1. Actual Quartz, static publishing, Obsidian export, export artifact generation, upload/publish, preview servers, command execution, and dependency installation remain Level 3 heavy optional adapter work and require a separate confirmation plan.

## Graph Tooling Boundary

P4.3 graph compile planning stays at Level 0/1. Actual graph tooling, graphify execution, graph artifact generation, MCP startup, and dependency installation remain Level 3 heavy optional adapter work and require a separate confirmation plan.

## Confirmation Required

Ask before:

- installing packages
- starting local servers
- using Docker
- using Node/Quartz or static publishing toolchains
- installing graph/PDF/OCR/vector dependencies
- calling external OCR/API providers
- uploading private sources

## Failure and Rollback

Any future install plan should state:

- package/tool names
- install location
- files likely to be written
- rollback or cleanup path
- what happens if install fails
- whether private source data leaves the machine

## Adapter State Model

Use these states when checking optional adapters:

```text
not_installed
env_unavailable
runtime_failed
unsupported
empty_result
configured
```

## Completion Marker

A dependency plan is complete when it names the level, tool choice, why lighter options are insufficient, confirmation needed, and rollback notes.
