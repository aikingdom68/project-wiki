# Changelog

All notable changes to this project will be documented in this file.

## [0.7.0] — "The frontend has rules now" — 2026-05-07

This release answers a single failure mode: every previous attempt at the local Admin GUI drifted into generic AI output. Cyan-on-dark themes, glowing card grids, raw JSON `<pre>` dumps for ordinary users, force-layout graphs that collapsed into one corner no matter how we tuned the springs.

v0.7.0 stops treating the frontend as the easy half of the product. The new Frontend Playbook codifies — rule by rule — what we learned rebuilding the GUI from scratch. Every rule traces back to a specific failure that has actually happened in production data (487 nodes, 743 edges, one super-hub at degree 407).

It is also the version where the Skill admits that the docs themselves are part of how this skill competes. The READMEs lead with a 30-second pitch now, not an installation block.

### Added
- `references/admin-gui-frontend-playbook.md` — the implementation companion to `admin-gui-contract.md`. Covers:
  - the strict CSP/embedding constraints (`script-src 'self'`, no CDN, no inline `<script>`/`<style>`/`onclick=`)
  - the **AI-slop ban list**: no cyan-on-dark, no gradient text, no `border-left: 3px solid var(--accent)` stripes, no identical icon-card grids
  - the OKLCH color tokens and three known-good aesthetic directions (paper / clean docs / workshop dark)
  - the **plain-language vocabulary mapping** so non-technical users never see raw terms like `writeWhitelist`, `INFERRED`, or `manual_override_append`
  - page architecture for 6 routes (Overview / Curriculum / Evidence / Graph / Search / Health)
  - the **fit-to-bounds rescaling step** that fixes the "all nodes collapse into one corner" bug after any force-directed layout
  - an extension pattern for adding `wiki_replace` / `wiki_create` editing capability through `safe-write.mjs` rather than a new endpoint
  - a diagnostic quick-reference table mapping symptom → cause → fix
- `scripts/lib/runtime-config.mjs` and `scripts/lib/safe-write.mjs` extracted as shared helpers, now reused by `healthcheck.mjs`, `admin.mjs`, and the P4.x planners. New tests at `tests/safe-write.test.mjs`.
- Two repository-root research notes (`local-kb-admin-gui-and-claude-obsidian-analysis.md`, `meta-memory-and-project-wiki-analysis.md`) promoted to first-class publishable resources next to `SKILL.md` and `references/`.

### Changed
- `SKILL.md` `version` field bumped to `0.7.0`. The Admin GUI route (Route 8) now requires reading `references/admin-gui-frontend-playbook.md` before any HTML/CSS/JS work, in addition to `references/admin-gui-contract.md`.
- README.md and README.zh-CN.md now open with a 30-second elevator pitch and a one-line demo prompt before the long-form documentation, then keep the existing platform-spec depth below.
- Both READMEs now reference `admin-gui-frontend-playbook.md` in their main-file inventory; the Chinese inventory previously skipped it.
- ROADMAP.md and RELEASE.md now treat v0.7.0 as the current state.
- PUBLISHING.md adds the two analysis docs to the publish set.

### Decided
- The Admin GUI is **part** of the product, not a follow-on. The frontend playbook lives next to the API contract; both must be read before building, redoing, or polishing the GUI.
- The two analysis documents stay at the repo root rather than being moved into a subdirectory. They document the reasoning behind structural decisions and are exactly the kind of artifact a reviewer or future maintainer reads cold.

### Still out of scope
- Arbitrary wiki CRUD. `wiki_replace` / `wiki_create` are documented as an **extension pattern** in the playbook, not delivered as a default capability of `safe-write.mjs` in this release.
- Auto-launching the Admin GUI, auto-installing dependencies, or auto-opening a browser. These remain confirmation gates.

## [0.6.0] - 2026-05-03

### Added
- P4.5 golden cases and P4 examples/eval cases for output contract hardening across adapter readiness, source normalization import planning, graph compile planning, and export planning.
- P4.5 doctor guards for enum drift, P4 deliverable mapping, retrieval fallback/clarification behavior, and P4 examples/evals metadata checks.
- P4.4 read-only export planning via `scripts/export-plan.mjs <target-project>` and `GET /api/kb/admin/export/plan`, consuming P4.1 export adapter readiness and an explicit export plan.
- `contracts/export-plan.schema.json` for the P4.4 export plan response shape.
- `references/export-adapter-contract.md` documenting static/Obsidian/Quartz export planning boundaries, output roots, rollback/cleanup, dependency gates, and non-execution rules.
- Regression prompt coverage for export planning without export execution.
- Intake-first routes for existing Markdown, mixed materials, PDF/source normalization, project binding, runtime checks, Admin GUI planning, graph compilation planning, and wiki export planning.
- `scripts/graph-compile-plan.mjs` and `scripts/lib/graph-compile-plan.mjs` for P4.3 read-only graph compile planning from P4.1 adapter readiness.
- `contracts/graph-compile-plan.schema.json` for the P4.3 graph compile plan response shape.
- `scripts/source-normalization-import-plan.mjs` and `scripts/lib/source-normalization-import-plan.mjs` for P4.2 read-only source normalization import planning from explicit RetainPDF-style manifests.
- `contracts/source-normalization-import-plan.schema.json` for the P4.2 import-plan response shape.
- `scripts/adapter-status.mjs` and `scripts/lib/adapter-status.mjs` for P4.1 read-only adapter readiness checks across RetainPDF-style manifests, graph artifacts, and export plans.
- `contracts/adapter-status.schema.json` for the P4.1 adapter status response shape.
- `scripts/admin.mjs` local Admin runtime with read-only inspection UI and API endpoints.
- `scripts/lib/runtime-config.mjs` for shared binding, root, whitelist, and symlink/path validation.
- `scripts/lib/safe-write.mjs` for P3 append-only curation preview/apply writes.
- Admin and safe-write tests covering read-only behavior, loopback/Host protections, token-protected curation, stale preview rejection, backups, admin log, root overlap rejection, and malformed JSON handling.
- Runtime/admin/adapter references for binding, dependency policy, Admin GUI contract, graph adapter, RetainPDF-style import contract, upstream reuse, and adaptive knowledge architecture.

### Changed
- P4.5 hardens `contracts/output-contract.schema.json`, `contracts/retrieval-contract.schema.json`, and `contracts/project-profile.schema.json` around route/task/deliverable metadata and fallback/clarification behavior.
- P4 examples and eval metadata now stay aligned with the hardened contracts and doctor checks.
- `SKILL.md` Route 7 now names `scripts/export-plan.mjs`, and Route 11 is explicitly P4.4 planning-only rather than export execution.
- `test-prompts.json` now covers intake, binding, Admin GUI, PDF import, optional graph, and skill-format guard prompts.
- Doctor checks now require P1/P2/P3/P4.1/P4.2/P4.3 runtime files and the new runtime/admin/adapter references.
- README and README.zh-CN now document no-install healthcheck/Admin runtime behavior, P3 safe-write curation limits, P4.1 adapter readiness limits, P4.2 source normalization import planning limits, P4.3 graph compile planning limits, and P4.4 export planning limits.

## [0.5.1] - 2026-04-22

### Added
- Root-level `test-prompts.json` with reusable regression prompts covering adaptation-first entry, explanation, comparison, source-guided explanation, and lifecycle-aware wiki updates
- Install test coverage for publishing `test-prompts.json` as part of the standalone skill package

### Changed
- `SKILL.md` frontmatter now uses a quoted `description` value for better skill health compatibility
- `SKILL.md` now surfaces an activation snapshot and default opening route near the top for faster, more reliable triggering
- README, README.zh-CN, publishing notes, install script, and doctor checks now treat `test-prompts.json` as a first-class asset
- Doctor tests now validate `test-prompts.json` presence and JSON validity

## [0.5.0] - 2026-04-19

### Added
- Project adaptation protocol (`references/project-adaptation-protocol.md`) for entering unfamiliar repositories before deep synthesis
- Interactive clarification guidance (`references/interactive-clarification-guidance.md`) for asking the minimum questions needed to avoid a wrong route
- Task routing guidance (`references/task-routing-guidance.md`) for choosing a primary task and handling multi-intent requests
- Project profile contract (`contracts/project-profile.schema.json`) for project-type, project-state, source, fallback, and privacy defaults
- Source policy list contract (`contracts/source-policy-list.schema.json`) for runtime-facing wrappers that carry multiple source policies
- New examples for adaptation-first entry, clarification-first flow, and multi-intent routing
- New eval cases covering ambiguous project requests, cold-start adaptation, clarification-before-plan, multi-intent routing, and preferred-source conflict handling

### Changed
- `SKILL.md` workflow now starts with project adaptation, then clarification, option proposal, route confirmation, and finally execution-heavy outputs
- README and README.zh-CN now treat `/project-wiki` as the preferred public entry and explain adaptation-first behavior
- Output contract expanded with project profile, project state, routing decision, clarifying questions, proposed modes, confirmed scope, and deliverable type
- Retrieval contract expanded with task type, interaction stage, preferred source, project-state probing, clarification signals, candidate primary sources, and policy decision trace
- Source policy contract expanded with usage role, preferred task types, conflict mode, project applicability, and trigger patterns
- System integration guidance now includes adaptation-first behavior and interaction-stage-aware input shape
- Cold start protocol now explicitly requires project-state summary and route proposal before deep execution
- Doctor script now validates adaptation/clarification/routing assets and contract coverage alongside lifecycle rollout checks
- Doctor tests updated to cover the new contract fields and required adaptation assets

## [0.4.0] - 2026-04-18

### Added
- Retrieval contract schema (`contracts/retrieval-contract.schema.json`) for SaaS and API contexts
- Wiki linking reference (`references/wiki-linking.md`) with `[[slug]]` syntax, backlinks, and orphan detection
- Cold start protocol (`references/cold-start-protocol.md`) for bootstrapping knowledge bases from zero
- SCHEMA.md template (`references/templates/schema-page.md`) for anchoring wiki conventions
- `query` internal task mode for read-only knowledge-base-backed question answering
- API-facing citation format in `references/evidence-and-citation.md`
- Offline capability boundary for SaaS in `references/modes-and-safety.md`
- Version snapshot support in `references/knowledge-lifecycle.md`
- Operation log (`log.md`) specification in `references/incremental-update-protocol.md`
- `index.md` catalog specification and `SCHEMA.md` convention in MVP Wiki Layout
- Related Pages section (`[[slug]]` links) in all page templates
- `citations` field and `query` task type in output contract schema
- Broken link, orphan page, and stale log checks in wiki quality audit
- New common mistakes: missing cross-references and missing SaaS citations

### Changed
- MVP Wiki Layout expanded with SCHEMA.md, index.md, log.md, _backlinks.json, _snapshots.json
- LLM Wiki Core reference updated with SCHEMA.md, index.md, and log.md specifications
- Doctor script updated to validate new files

## [0.3.3] - 2026-04-09

### Added
- Output quality standards for explanation, evaluation, comparison, decision, and wiki-update outputs
- Additional examples for evaluation report, decision memo, and source-guided explanation quality
- Additional eval cases and a shared rubric for regression review

## [0.3.2] - 2026-04-09

### Added
- Explicit conflict-resolution rule between project/runtime evidence, maintained local docs/wiki, preferred local teaching sources, and general knowledge
- Minimal system integration contract for input/output/fallback behavior
- Beginner-friendly 60-second self-check in the README

## [0.3.1] - 2026-04-09

### Added
- System-facing interpretation for using `project-wiki` as a capability spec inside future products
- New reference: `references/system-integration-guidance.md`
- README guidance for using `project-wiki` inside a teaching/explanation platform

## [0.3.0] - 2026-04-09

### Added
- Beginner-friendly three-sentence usage entry
- Automatic plus precise triggering guidance
- Source-priority behavior for preferred local knowledge sources
- Source-guided explanation mode for following the reasoning style of example banks, lecture notes, docs, or similar local corpora
- New reference: `references/source-priority-guidance.md`
- New README examples for teaching systems and example-bank-first explanation

## [0.2.0] - 2026-04-09

### Added
- Strengthened wiki-first positioning for `project-wiki`
- Added clearer usage guidance and Quick Start examples
- Added explicit mutation boundary for safe wiki updates
- Added recommended MVP wiki layout and page contract
- Added knowledge object model and `curate` mode
- Added stronger local-first / online authorization boundary

## [0.1.0] - 2026-04-09

### Added
- Initial independent open-source skill structure
- `SKILL.md`
- Core references for LLM Wiki, local RAG engineering, project assistance, and safety modes
- Initial README, LICENSE, and `.gitignore`
