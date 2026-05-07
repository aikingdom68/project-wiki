# Release Notes Draft

## project-wiki v0.7.0 — "The frontend has rules now"

`project-wiki` is a wiki-first, local-first project-assist skill for Claude Code. Version 0.7.0 closes the loop on the local Admin GUI: the contract layer was already in place, but the frontend implementation kept drifting into AI-slop visuals every time it was rebuilt. v0.7.0 commits the rules to the repo so the next rebuild does not have to relearn them.

### What's new in v0.7.0
- **Frontend Playbook** — `references/admin-gui-frontend-playbook.md`, the implementation companion to `admin-gui-contract.md`. CSP/embedding constraints, OKLCH color tokens, system-font stacks, the AI-slop ban list, plain-language vocabulary mapping for non-technical users, the 6-route page architecture, the fit-to-bounds rescaling step that prevents force-layout graphs from collapsing into one corner, an editing extension pattern for `wiki_replace` / `wiki_create`, and a symptom→cause→fix diagnostic table.
- **Shared runtime helpers** — `scripts/lib/runtime-config.mjs` and `scripts/lib/safe-write.mjs` extracted from inline implementations and reused by `healthcheck.mjs`, `admin.mjs`, and the P4.x planners. Backed by `tests/safe-write.test.mjs`.
- **Pitch-ready READMEs** — both READMEs now lead with a 30-second pitch and a one-line demo prompt before the long-form documentation.
- **Research notes promoted** — `local-kb-admin-gui-and-claude-obsidian-analysis.md` and `meta-memory-and-project-wiki-analysis.md` are now part of the published asset set.
- Chinese README main-file inventory aligned with the English version (the Chinese list previously skipped `admin-gui-frontend-playbook`).

### Still out of scope in v0.7.0
- arbitrary wiki CRUD as a default Admin capability
- `wiki_replace` / `wiki_create` as default P3 operations (documented as extension pattern only)
- auto-installing optional adapter dependencies
- auto-launching local runtime or opening a browser without confirmation

---

## project-wiki v0.6.0

`project-wiki` is a wiki-first, local-first project-assist skill for Claude Code. Version 0.6.0 adds adaptive intake routes plus no-install local runtime helpers for project binding checks, safe Admin curation, adapter readiness, source import planning, graph compile planning, and export planning.

### What's new in v0.6.0
- Intake-first routing for existing Markdown/wiki collections, mixed messy sources, PDFs/ebooks, source-code projects, and partially trusted knowledge bases.
- Read-only binding/runtime checker: `node scripts/healthcheck.mjs <target-project>`.
- Local Admin runtime: `node scripts/admin.mjs <target-project> --port 0`, loopback-only and Node built-ins only.
- P2 read-only Admin inspection endpoints for health, summary, tree, items, source/wiki preview, test query, and existing graph artifacts.
- P3 token-protected append-only curation writes for `review-queue.json` and `manual-overrides.json` through preview/apply.
- Read-only P4.3 graph compile planning: `node scripts/graph-compile-plan.mjs <target-project>` and `GET /api/kb/admin/graph/compile-plan` consume P4.1 readiness and return planning-only schema/source/confidence/artifact/dependency gates.
- Read-only P4.4 export planning: `node scripts/export-plan.mjs <target-project>` and `GET /api/kb/admin/export/plan` consume P4.1 export adapter readiness plus an explicit export plan and return planning-only source scope, target/profile, output root, dependency boundary, rollback/cleanup, and confirmation gates.
- Safe-write protections: server-issued preview IDs, confirmation, JSON content-type, write token, Host/Origin checks, stale-preview rejection, backup artifacts, admin log, write whitelist enforcement, root-overlap rejection, symlink/path checks, and malformed JSON rejection.
- New references for runtime architecture, project binding, Admin GUI contract, dependency policy, upstream reuse, graph adapter planning, RetainPDF-style source normalization, and adaptive knowledge architecture.
- Expanded regression prompts and tests for Admin/runtime/safe-write/adapter planning behavior.

### Still out of scope in v0.6.0
- arbitrary wiki CRUD
- direct raw source mutation
- binding file creation
- dependency installation
- PDF/OCR execution
- graph compilation execution
- static export/publishing execution
- treating an explicit export plan as export execution confirmation



### What it helps with
- explaining projects and modules
- comparing implementation options
- evaluating technical decisions with evidence
- building and updating a project wiki / knowledge base
- supporting onboarding and troubleshooting knowledge
- adapting to unfamiliar projects before producing deep outputs
- routing multi-intent requests into a clear primary task

### What's new in v0.5.0
- adaptation-first workflow: classify project type and state before deep synthesis
- interactive clarification guidance: ask the minimum questions needed to avoid a wrong route
- task routing guidance: pick one primary task and keep supporting tasks visible
- new `adapt_project` and `propose_options` task types in the output contract
- new `interaction_stage` field (`adapt | clarify | propose | confirm | execute`) for system integration
- new `project-profile.schema.json` and `source-policy-list.schema.json` contracts
- new examples: adapt-project-first, interactive-clarification, task-routing-multi-intent
- new eval cases: ambiguous-project-request, cold-start-project-adaptation, clarification-before-plan, multi-intent-routing, preferred-source-conflict-routing
- doctor script extended to validate the new contracts and required adaptation/clarification/routing assets

### What's new in v0.4.0
- retrieval contract schema (`contracts/retrieval-contract.schema.json`) for SaaS and API contexts
- wiki linking reference (`references/wiki-linking.md`) with `[[slug]]` syntax, backlinks, and orphan detection
- cold start protocol (`references/cold-start-protocol.md`) for bootstrapping knowledge bases from zero
- SCHEMA.md template for anchoring wiki conventions
- new `query` internal task mode for read-only knowledge-base-backed answering
- API-facing citation format and offline capability boundary for SaaS
- version snapshot support and operation log (`log.md`) specification
- `index.md` catalog and Related Pages sections in all page templates
- `citations` field and `query` task type in output contract schema
- new common mistakes: missing cross-references and missing SaaS citations

### What's new in v0.3.3
- added output quality standards for key task types
- added richer examples for evaluation, decision memos, and source-guided explanation quality
- expanded eval coverage and added a shared rubric for regression review

### Previous v0.3.2 improvements
- added explicit conflict-resolution rules across project/runtime evidence, maintained docs/wiki, preferred teaching sources, and general knowledge
- added a minimal system integration contract for future products and platforms
- added a beginner-friendly 60-second self-check so open-source users can verify installation and expected behavior quickly

### Previous v0.3.1 improvements
- clarified that `project-wiki` can also serve as a capability specification for future systems and platforms
- added system-facing guidance for teaching systems, explanation engines, and knowledge-driven products
- documented how preferred local knowledge sources should shape explanation behavior inside a product

### Previous v0.3.0 improvements
- beginner-friendly three-sentence entry for first-time users
- automatic plus precise triggering guidance
- preferred local knowledge-source priority rules
- source-guided explanation behavior for example banks, lecture notes, docs, and similar local corpora
- stronger README examples for teaching and explanation systems

### Previous v0.2.0 improvements
- clearer Quick Start and usage guidance
- stronger boundaries against collapsing into pure RAG or generic repo chat
- explicit mutation boundary for safe wiki updates
- recommended wiki layout and page contract for MVP usage
- stronger support for durable knowledge objects and curation
- clearer local-first / online-enhanced safety rules

### Positioning
`project-wiki` is not a generic RAG framework, project-management system, or cloud knowledge platform.
It is a project knowledge skill: LLM Wiki as the skeleton, local retrieval as the evidence layer, and project assistance as the product goal.
