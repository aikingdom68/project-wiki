---
name: project-wiki
version: 0.7.0
author: KimYx0207
user-invocable: true
trigger: "项目解释|项目评估|方案对比|技术选型|决策支持|知识库|项目知识库|项目wiki|wiki更新|模块说明|架构说明|新成员上手|ADR|项目文档整理|代码库理解|本地RAG|离线知识库|LLM Wiki|Markdown 文档|已有 Markdown|现有文档|PDF 知识库|电子书|OCR|资料很乱|一堆资料|整理成知识库|接管知识库|绑定 project-wiki|project-wiki runtime|知识库后台|管理后台|网页管理知识库|本地 wiki GUI|导入 PDF|生成知识图谱|导出 wiki 网站|project explanation|project evaluation|decision support|knowledge base|project wiki|architecture explanation|module explanation|trade-off analysis|local rag|llm wiki|local admin GUI|admin dashboard|import PDF|normalize sources|knowledge graph|export wiki"
tools:
  - shell
  - filesystem
  - browser
  - memory
description: "Use when the user wants to diagnose local project materials, existing Markdown/PDF collections, or an evidence-backed project wiki; explain, evaluate, query, bind, import, plan an admin GUI, or maintain durable knowledge without drifting into generic repo chat."
---

# Project Wiki

Project Wiki turns messy local project materials into a structured, evidence-backed wiki that humans can read and AI can use.

It is **not** a generic RAG chatbot. The durable unit is the wiki page or knowledge object; retrieval is only the evidence layer that helps create, update, and query those durable units.

## Before Starting

- [ ] Identify the target project/corpus root and whether the user gave a narrow task or a broad goal.
- [ ] Check whether an existing wiki, Markdown corpus, knowledge base, PDF/source collection, or project binding already exists.
- [ ] Inventory source shapes only as far as needed: code, README/docs, existing Markdown, PDFs/OCR, notes, examples, prior wiki pages, web exports, or mixed sources.
- [ ] Select the route before deep synthesis; use `Intake / Diagnose Current State` for broad or ambiguous requests.
- [ ] Stay read-only until the user confirms any write, install, external upload/API call, GUI/runtime launch, source-authority decision, retrieval policy, or durable taxonomy.
- [ ] Read only the reference files relevant to the selected route.

## Core Promise

Use Project Wiki to:

1. map a project or local knowledge corpus
2. identify the most trustworthy local sources
3. retrieve evidence with citations
4. explain, evaluate, compare, query, or plan from that evidence
5. propose careful wiki/knowledge-base updates only after confirmation

Best-fit projects include software repos, teaching systems, document/PDF collections, AI knowledge apps, and product/business knowledge bases.

Do not use this skill for one-off summaries, simple symbol lookup, pure implementation tasks, arbitrary frontend work, PDF translation with no knowledge-base intent, or external market/web research.

## Operating Principles

1. **Wiki-first** — stable pages beat disposable chat answers.
2. **Local-first** — local project truth outranks generic best practice.
3. **Evidence-first** — major claims need file, page, or section evidence.
4. **Source-aware** — if sources conflict, state the conflict instead of smoothing it over.
5. **Intake-first** — diagnose current materials and structure before choosing a route.
6. **Confirm before writes** — propose changes before editing files.
7. **Lightest retrieval wins** — read/search directly before inventing a heavy RAG pipeline.
8. **Confirm before structure changes** — ask before locking chapter trees, topic groups, source authority, retrieval policy, or file mutations.

## Default Route

Unless the user already gives a narrow task, follow this route:

1. **Intake** — classify source shape, current wiki/KB state, user goal, write permission, and dependency boundary.
2. **Adapt** — choose the project/corpus type and candidate knowledge architecture from local evidence.
3. **Clarify** — ask only the questions needed to avoid the wrong path.
4. **Propose** — offer 2-3 routes or structures with trade-offs.
5. **Confirm** — wait before write-heavy work, route-changing work, dependency work, or locking durable structures.
6. **Execute** — produce the selected output with evidence and gaps.
7. **Persist** — offer a wiki update when the answer should become durable knowledge.

Completion marker: the selected route is explicit, evidence is gathered, and any file mutation or external/runtime action is confirmed first.

## Fixed Feature-by-Feature Execution

Project Wiki can be triggered by slash commands, natural-language requests, or ongoing context. `/project-wiki` is an optional entrypoint, not the only entrypoint.

For broad project-wiki runs, do not make one upfront decision that selects only one route. Run a fixed capability progression and evaluate each capability one by one. Every capability receives one of four statuses: `executable_now`, `plan_only`, `confirmation_required`, or `not_applicable`.

Capability check template:

1. Is this capability relevant to the current project and user goal?
2. Is enough local evidence available?
3. Can it execute now, or is it plan-only under the current boundary?
4. Does it require confirmation before writes, installs, runtime launch, upload, external calls, source authority, retrieval policy, taxonomy, graph schema, or export target decisions?
5. What is the concrete output of this capability?
6. What capability is checked next?

Default progression:

1. Intake / Diagnose Current State
2. Explain
3. Evaluate
4. Compare / Decide
5. Query Knowledge Base
6. Build or Update Wiki
7. Connect / Bind Project
8. Check Project-Wiki Runtime
9. Open Admin GUI / backend knowledge-base control console
10. Import / Normalize Sources
11. Compile Optional Knowledge Graph
12. Publish / Export Wiki
13. Summarize completed, plan-only, confirmation-required, and not-applicable capabilities

Admin GUI / backend knowledge-base control console is a mandatory capability check. In every broad run, explicitly state whether the control console already exists, can be launched with the local runtime, must be created, or is blocked by missing binding/runtime. If it must be created, produce a safe implementation plan and use frontend `i-*` skills before implementation. Ask before launching local runtime or writing frontend/backend files.

Completion marker: every capability in the default progression has a status, evidence note, output or skip reason, and next action.

## Task Routes

### 0. Intake / Diagnose Current State

Use for broad requests like “我有一堆资料想整理成知识库”, “已有 Markdown 能不能接管”, “只有几个 PDF 想做知识库”, or when the route is unclear.

Read first: `references/project-adaptation-protocol.md`, `references/adaptive-knowledge-architecture.md`, `references/interactive-clarification-guidance.md`.

Output: project/corpus type, existing wiki/KB state, source inventory, candidate source authority, candidate knowledge architecture, recommended route, confirmation gates.

Default: read-only. Forbidden in P0: generating the whole wiki, OCR, installing tools, starting GUI/runtime, compiling graph, exporting sites, or writing binding files.

### 1. Explain

Use when the user asks to understand a project, module, workflow, or local knowledge source.

Output: what it is, why it exists, key components, how pieces connect, evidence, open questions.

### 2. Evaluate

Use when the user asks whether a design, architecture, module boundary, migration, or implementation path is good enough.

Output: question, current evidence, strengths, risks, assumptions, recommendation, confidence.

### 3. Compare / Decide

Use when the user is choosing among options.

Output: options, local fit, complexity, maintainability, performance/scale implications, evidence, recommendation, what still needs validation.

### 4. Build or Update Wiki

Use when the user wants durable project knowledge, not just a reply.

Read first: `references/llm-wiki-core.md`, `references/incremental-update-protocol.md`, and the adaptation references.

Candidate page types depend on project type:

- software repo: `overview`, `module`, `decision`, `troubleshooting`, `glossary`
- document corpus: `catalog`, `source-page`, `topic-summary`, `citation-map`
- teaching KB: `chapters`, `topics`, `examples`, `common-errors`, `source-map`
- AI knowledge app: `source-catalog`, `retrieval-policy`, `output-contract`, `feedback-loop`
- product/business KB: `feature-map`, `decision-log`, `customer-insight`, `FAQ`, `risk-list`

Confirm before creating, renaming, deleting, merging, or rewriting files.

### 5. Query Knowledge Base

Use when the user asks a question that should be answered from an existing wiki or local knowledge base.

Rules: read the wiki/catalog layer first, retrieve relevant pages or sections, answer with citations, separate source-derived reasoning from supplemental reasoning, and keep query mode read-only unless the user asks to save the result.

### 6. Connect / Bind Project

Use when the user wants to “接上 project-wiki”, bind an existing project, connect existing Markdown/wiki files, or define where wiki/admin/source files live.

Read first: `references/project-binding-protocol.md`.

Default: plan-only. Completion marker: proposed binding root, source roots, wiki root, admin root, write whitelist, and confirmation questions are listed. Forbidden in P0: writing `.project-wiki/project-wiki.config.json` automatically.

### 7. Check Project-Wiki Runtime

Use when the user asks whether project-wiki runtime, GUI, adapters, or dependencies are available.

Read first: `references/runtime-architecture.md`, `references/dependency-installation-policy.md`.

Default: read-only. Use `scripts/healthcheck.mjs <target-project>` for local project binding/runtime inspection, `scripts/adapter-status.mjs <target-project>` for optional P4 adapter readiness, `scripts/source-normalization-import-plan.mjs <target-project>` for P4.2 RetainPDF-style manifest import planning, `node scripts/graph-compile-plan.mjs <target-project>` for P4.3 graph compile planning from P4.1 readiness, and `node scripts/export-plan.mjs <target-project>` for P4.4 export planning from P4.1 export adapter readiness and an explicit export plan. These commands report JSON and must not create files, install dependencies, start services, or execute OCR/graph/export/import/publisher tools. Completion marker: configured/missing/unknown runtime or adapter state and next-step plan.

### 8. Open Admin GUI

Use when the user asks to open a knowledge-base backend, local admin GUI, browser dashboard, or web page for nontechnical KB management.

Read first: `references/admin-gui-contract.md`, then `references/runtime-architecture.md`. If the request involves building, redoing, or polishing the frontend itself (visual surface, graph visualization, editing UI), also read `references/admin-gui-frontend-playbook.md` before writing any HTML/CSS/JS — it covers the CSP/embedding constraints, AI-slop bans, plain-language vocabulary mapping, force-layout fit-to-bounds rule, and the editing extension pattern, all of which trace to specific past failures.

Default: read-only plan/check first. If the local runtime exists, show `node scripts/admin.mjs <target-project> --port 0` and ask before launching it. P2 views remain read-only. P3 curation writes are limited to token-protected confirmed preview/apply flows for `review-queue.json` and `manual-overrides.json`, with backups, admin log, and write-whitelist checks. Forbidden in P3: arbitrary CRUD, raw source mutation, direct wiki edits, dependency installs, imports/OCR, graph compilation, export artifact generation, or binding file creation.

### 9. Import / Normalize Sources

Use when the user wants to import PDFs, ebooks, scanned documents, Markdown folders, Word docs, web exports, or mixed raw materials into a project wiki.

Read first: `references/retain-pdf-adapter-contract.md`, `references/dependency-installation-policy.md`, and source-authority guidance.

Default: inventory and plan. P4.2 may consume an explicit configured RetainPDF-style manifest and produce a read-only source normalization import plan with artifact summary, importable candidates, excluded items, proposed source registry entries, and confirmation gates. Confirm before copying, converting, OCR, external provider calls, uploads, source registry writes, wiki/knowledge-object writes, or durable KB writes.

### 10. Compile Optional Knowledge Graph

Use when the user asks for a knowledge graph, graph report, relationship map, or graph-powered indexing.

Read first: `references/graph-adapter-contract.md`.

Default: P4.3 graph compile planning only. It consumes P4.1 adapter readiness and may propose schema profile, source scope, confidence policy, artifact targets, dependency boundary, and confirmation gates. It must not install dependencies, run graphify/graph tools, compile graph artifacts, write `graph.json`/`GRAPH_REPORT.md`/cache/html, start servers/MCP, call external providers, or promote inferred/ambiguous relationships to durable facts.

### 11. Publish / Export Wiki

Use when the user asks to export a wiki site, publish static docs, or export to Obsidian/Quartz-like formats.

Read first: `references/runtime-architecture.md`, `references/upstream-reuse-policy.md`, `references/dependency-installation-policy.md`, and `references/export-adapter-contract.md`.

Default: P4.4 export planning only. It consumes P4.1 export adapter readiness and an explicit export plan, then proposes source scope, target/profile, output root, dependency boundary, rollback/cleanup, and confirmation gates. It must not install export dependencies, run Quartz/static/Obsidian tools, run export commands, generate or write export artifacts, upload/publish, start server/MCP, call external providers, mutate files, or treat the explicit export plan as execution confirmation. If an existing project documents a safe export command, show it only as blocked future execution and ask before any separate execution step.

## Source Priority

Source priority is route-specific:

- for software/project-reality questions, runtime evidence leads
- for teaching, document-corpus, or source-guided explanation tasks, the named or original local source leads unless the user confirms otherwise
- for unclear cases, ask the source authority gate before synthesis

General or external knowledge is only a labeled supplement when local evidence is insufficient or external validation is requested.

For deeper guidance, read `references/source-priority-guidance.md`.

## Retrieval Rules

Use the lightest strategy that is sufficient:

1. known file or narrow question — read the file directly
2. project exploration — use directory structure, headings, symbols, and page roles
3. larger local corpus — use structure-aware chunks with file path, section path, source type, and timestamp when available
4. mixed exact/semantic intent — use hybrid retrieval only when exact names and conceptual similarity both matter
5. evaluation-sensitive output — check retrieval coverage before trusting synthesis

Retrieval should produce evidence bundles, citations, and confidence signals. It should not become a dump of top-k chunks.

For deeper guidance, read `references/local-rag-engineering.md`.

## Local, API, and Hybrid Modes

Default mode is local-first. Use local files, wiki pages, grep/glob-style retrieval, and direct reading before API or heavy indexing.

Use API-enhanced or hybrid mode only when the user authorizes online/API help or the task clearly needs external/public validation. Local evidence remains the base layer; API output must not silently replace project-local truth.

For privacy and mode boundaries, read `references/modes-and-safety.md`.

## Mutation Boundary

Default behavior is read-only.

Before creating, renaming, rewriting, deleting, importing, normalizing, exporting, or otherwise mutating files:

1. propose the page/update/import/export plan
2. name target files and output roots
3. explain what will change and why
4. confirm durable architecture, taxonomy, source authority, retrieval policy, dependency, runtime, upload, or external-provider decisions that the mutation would lock in
5. wait for explicit user confirmation

When writing is authorized, preserve evidence links, update index/log when relevant, and prefer narrow incremental updates over broad rewrites.

## Output Paths, Formats, and Naming

- Read-only answers: Markdown sections with verified facts, synthesis, open questions, evidence, and confidence.
- Intake output: `Intake Summary`, `Candidate Routes`, `Confirmation Needed`, and `Read-only Until Confirmed`.
- Wiki proposals: name target root, page type, target files, and naming convention before writing.
- Existing wiki behavior: preserve existing roots and conventions unless the user confirms a migration.
- New binding proposals: use `<target-project>/.project-wiki/project-wiki.config.json` only as a proposed path until confirmed.
- Software wiki starter root: `docs/wiki/` unless project binding selects another root.
- Citations: include source path and section/page anchor when available.

## Completion States

| 状态 | 含义 |
|---|---|
| `complete_read_only` | Answer delivered with evidence, uncertainty, and confidence; no files changed. |
| `complete_plan_only` | Route/update/import/runtime/GUI/export plan delivered; no files changed. |
| `blocked_confirmation_required` | Gate 1 decision is required before continuing. |
| `blocked_missing_evidence` | Local evidence is insufficient; next evidence needed is named. |
| `blocked_runtime_missing` | Runtime/GUI/script/dependency is absent; only a setup plan was provided. |
| `complete_confirmed_write` | User confirmed mutation; changed files and update/log note are reported. |
| `not_applicable` | Request is outside project-wiki scope and should be handled without this skill. |

## Quality Self-Check

### Gate 1: CRITICAL

Block and ask for explicit confirmation before:

- creating, editing, renaming, deleting, importing, normalizing, exporting, or moving files
- locking durable chapter trees, taxonomy, source authority, retrieval policy, or schema profile
- installing dependencies or running setup commands
- launching GUI/runtime services
- sending private local paths, source text, PDFs, OCR text, or internal project details to external APIs
- writing admin overrides, review queues, source-policy files, graph artifacts, or binding files

### Gate 2: STANDARD

Before treating output as complete:

- route is explicit
- evidence has been read or searched
- claims have citations or are marked as inference
- source conflicts and coverage gaps are visible
- retrieval fallback or clarification is explicit when coverage is insufficient or the target deliverable is unclear
- P4 planning outputs align route/task/deliverable metadata with P4.5 doctor guards and golden cases
- external/API material is labeled
- output path/format is named when the user requested an artifact
- durable changes are only proposed unless Gate 1 was confirmed

## Reference Map

Read these only when needed:

- `references/llm-wiki-core.md` — wiki-first knowledge structure
- `references/project-assistant-playbook.md` — explanation, evaluation, comparison, and decision outputs
- `references/project-adaptation-protocol.md` — cold-start project classification and intake inputs
- `references/cold-start-protocol.md` — bootstrapping from empty or new KB states
- `references/adaptive-knowledge-architecture.md` — project-specific wiki/KB structures and confirmation gates
- `references/interactive-clarification-guidance.md` — when and how to ask route questions
- `references/task-routing-guidance.md` — route IDs and multi-intent routing
- `references/source-priority-guidance.md` — source authority and conflict policy
- `references/evidence-and-citation.md` — citation objects and evidence anchors
- `references/local-rag-engineering.md` — local retrieval strategy
- `references/modes-and-safety.md` — privacy and local/API/hybrid boundaries
- `references/wiki-linking.md` — wikilinks, backlinks, and orphan pages
- `references/wiki-quality-audit.md` — stale, duplicated, unsupported, or conflicting knowledge
- `references/knowledge-lifecycle.md` — review state, confidence basis, supersession, and snapshots
- `references/incremental-update-protocol.md` — safe incremental wiki updates
- `references/output-quality-standards.md` — output quality and confidence
- `references/system-integration-guidance.md` — using Project Wiki as a product/API capability spec
- `references/runtime-architecture.md` — Skill/runtime/adapter/target-project boundaries
- `references/project-binding-protocol.md` — project binding config and write whitelist contract
- `references/admin-gui-contract.md` — local Admin GUI pages and safety boundary
- `references/admin-gui-frontend-playbook.md` — Admin GUI frontend implementation playbook (visual system, force layout, editing UI, diagnostics)
- `references/dependency-installation-policy.md` — lazy install and dependency confirmation policy
- `references/upstream-reuse-policy.md` — adapter-first upstream reuse and license rules
- `references/graph-adapter-contract.md` — optional graph artifacts and confidence labels
- `references/retain-pdf-adapter-contract.md` — optional PDF/OCR artifact contract and provider confirmation
- `references/export-adapter-contract.md` — optional static/Obsidian/Quartz export planning contract
- `references/templates/*.md` — reusable page templates

## Good vs Bad

Good Project Wiki behavior:

> “I found existing Markdown docs, two PDF sources, and no confirmed source authority. I will first produce an intake summary and ask whether the PDFs may be normalized before proposing a wiki structure.”

Bad behavior:

> “I will build the whole knowledge base, install OCR, generate a graph, and open the admin GUI now.”

Difference: good outputs diagnose state, preserve evidence, and wait at durable gates; bad outputs over-promise runtime behavior and mutate structure without confirmation.

## Suppressions

Do not trigger or hand off away from Project Wiki when the request is only:

- a single code bug fix with no wiki/knowledge-base intent
- a simple symbol/file lookup
- one-off article/PDF summary with no durable KB/wiki intent
- pure PDF translation without project knowledge-base import
- generic external market/web research
- arbitrary React/admin page creation unrelated to project-wiki
- general implementation work with no local evidence-backed wiki, KB, source policy, or durable project explanation intent

## Common Mistakes

1. **Turning everything into RAG** — direct reading is better for narrow questions.
2. **Writing polished but unsupported prose** — attach evidence or mark uncertainty.
3. **Treating summaries as wiki pages** — durable pages need scope, evidence, and update paths.
4. **Letting external best practice override local truth** — local evidence wins unless clearly incomplete.
5. **Writing pages with no links** — connect durable pages with `[[slug]]` links.
6. **Serving KB answers without citations** — knowledge-base answers need source paths or citation objects.
7. **Promising runtime/frontend before it exists** — P0 routes can plan or check only.

## Manual Validation Prompts

For reusable regression prompts, see `test-prompts.json`.

Useful smoke tests:

1. `我已经有一批 Markdown 文档了，帮我看看能不能接成知识库。`
2. `我只有几个 PDF 电子书，想弄成项目知识库。`
3. `请解释这个项目的核心架构，并指出最关键的 5 个文件或页面证据。`
4. `我想让不懂代码的人也能在网页里改知识库分类。`
5. `直接把 GUI 和依赖都塞进 skill 里吧。`

## Bottom Line

Project Wiki is for making local project knowledge durable, explainable, verifiable, and reusable.

It should help a future reader understand the project faster, make decisions with evidence, or keep a knowledge base alive after the chat is gone.
