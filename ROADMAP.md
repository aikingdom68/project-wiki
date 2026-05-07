# Roadmap

## Current status: v0.7.0

> v0.6.x shipped the contracts, the P4.1–P4.5 planners, and the local Admin backend.
> v0.7.0 finally writes down what the **frontend** is allowed to look like.

Completed:

- adaptive intake routes for existing Markdown, PDFs, mixed sources, binding, runtime, Admin GUI, graph, and export planning
- read-only `healthcheck.mjs` binding/runtime inspection
- read-only `adapter-status.mjs` P4.1 adapter readiness inspection
- read-only `source-normalization-import-plan.mjs` P4.2 RetainPDF-style manifest import planning
- read-only `graph-compile-plan.mjs` P4.3 graph compile planning from P4.1 adapter readiness
- read-only `export-plan.mjs` P4.4 export planning from P4.1 export adapter readiness and explicit export plans
- P4.5 strengthen output contracts and examples, including output/retrieval/project-profile contract hardening, doctor guards, and P4 golden cases
- loopback-only `admin.mjs` local Admin inspection runtime
- P3 token-protected append-only curation writes for review queue and manual overrides
- doctor/test coverage for P1/P2/P3/P4.1/P4.2 runtime files and safety boundaries
- **`references/admin-gui-frontend-playbook.md`** — production-grade frontend implementation rules (CSP, OKLCH, vocabulary mapping, fit-to-bounds graph layout, editing extension pattern)
- shared runtime helpers under `scripts/lib/` (`runtime-config.mjs`, `safe-write.mjs`) reused by health/admin/P4 planners
- repo-root research/analysis notes promoted to first-class publishable resources

## Near-term priorities

1. keep README beginner-friendly while preserving platform-spec depth and the new pitch entry
2. release packaging polish if the next release needs publishing cleanup
3. broaden P4 golden cases as more real projects are bound and inspected
4. evaluate whether `wiki_replace` / `wiki_create` in `safe-write.mjs` should graduate from extension pattern to a default P3 capability — only after another round of real Admin GUI usage

## Explicit non-goals for now

- generic RAG platform
- project-management workflow system
- cloud knowledge platform
- autonomous code-changing agent
- heavy vector-database dependency as a default
- arbitrary wiki CRUD as a default Admin write surface
- auto-installing optional adapters (RetainPDF, graph, export) without a confirmed plan
