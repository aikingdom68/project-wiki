---
name: project-wiki
version: 0.4.0
author: KimYx0207
user-invocable: true
trigger: "项目解释|项目评估|方案对比|技术选型|决策支持|知识库|项目知识库|项目wiki|wiki更新|模块说明|架构说明|新成员上手|ADR|项目文档整理|代码库理解|本地RAG|离线知识库|LLM Wiki|project explanation|project evaluation|decision support|knowledge base|project wiki|architecture explanation|module explanation|trade-off analysis|local rag|llm wiki"
tools:
  - shell
  - filesystem
  - browser
  - memory
description: |
  Use when the user wants to explain a project, evaluate or compare technical options, build or update a project knowledge base/wiki, or answer project questions with evidence from local materials. Also use when the user wants explanations to prioritize a specific local knowledge source, such as an example bank, lecture notes, docs, or a curated local corpus, and follow that source's reasoning style before falling back to general knowledge.
---

# Project Wiki

Project Wiki is a project-assist knowledge system skill.

Its job is not to act like a generic search wrapper. Its job is to help turn project materials into a persistent, evidence-backed knowledge layer that supports explanation, evaluation, comparison, decision support, and knowledge-base maintenance.

The core worldview is:

- **LLM Wiki is the skeleton** — stable project knowledge pages, not one-off answers.
- **Local RAG is the evidence layer** — retrieval supports pages and judgments, but does not replace them.
- **Project assistance is the product goal** — explanations, comparisons, decision memos, onboarding, and knowledge updates.
- **Lifecycle fields are support metadata** — they clarify review state, retention, consolidation, and supersession without changing the wiki-first/local-first posture.

## When to Use

Use this skill when the user wants to:

- explain a codebase, module, subsystem, or technical workflow
- compare two or more implementation options
- evaluate an architecture, design, library choice, or migration path
- build or update a project wiki / knowledge base
- turn local materials into structured project knowledge
- answer project questions with file-backed evidence
- prepare onboarding summaries, ADR-style notes, module maps, troubleshooting pages, or technical briefings
- explain something by prioritizing a specific local knowledge source
- reuse the reasoning style of an example bank, lecture notes, docs, or another local corpus

### Beginner-first trigger rule

If the user says something like:
- `我有一个例题库，讲解时优先用它`
- `先按我的讲义思路来讲`
- `优先根据 docs/wiki 里的内容解释`
- `如果例题里有类似题，优先按例题思路讲`

then treat that as a strong trigger for Project Wiki, even if the user does not describe retrieval, wiki structure, or knowledge-base design explicitly.

Do **not** use this skill when:

- the user only needs a simple file search or symbol lookup
- the task is a pure implementation request with no knowledge-structuring need
- the user only wants a one-off prose summary and does not need a durable knowledge layer
- the task is mainly about external market/web research rather than project-local knowledge

## Core Principles

1. **Raw / Wiki / Schema are different layers**
   - Raw sources are evidence.
   - Wiki pages are structured knowledge.
   - Schema defines how knowledge is organized and updated.

2. **Wiki-first, retrieval-second**
   Retrieval is a support mechanism. The primary output should be maintainable knowledge pages or project-assist outputs, not loose chunks.

3. **Evidence before conclusion**
   Major claims should point to files, docs, notes, or other explicit sources.

4. **Separate verified fact, synthesis, and uncertainty**
   Never blur direct evidence with inference.

5. **Local project truth outranks generic best practice**
   External guidance may inform judgment, but it must not override project-local evidence without justification.

6. **Local-first by default**
   Prefer local materials and offline-capable workflows. Online/API augmentation is optional and must respect privacy boundaries.

7. **Pages are the durable unit, not chats**
   A good result should usually strengthen or update a stable page type instead of ending as disposable conversation output.

8. **Decision support must be evidence-aware**
   Comparisons, recommendations, and evaluations should explicitly connect claims to local evidence, assumptions, and unresolved gaps.

## Mode Selection

### Mode A — Local-first

Use this by default.

Best for:
- private codebases
- offline environments
- sensitive materials
- early project understanding
- evidence-backed explanations from local files

Typical tools:
- file reads
- grep/glob style retrieval
- local structure-aware indexing ideas
- parent-child evidence assembly

### Mode B — Online / API-enhanced

Use only when one of these is true:
- the user explicitly allows online augmentation
- external public documentation is clearly required
- local evidence is incomplete and the answer needs publicly verifiable external facts

Typical use:
- enriching library/framework comparisons
- validating ecosystem claims
- improving higher-level synthesis when local data is insufficient

### Mode C — Hybrid

Use local evidence as the base layer, then optionally augment with external information.

Rule:
- external material may refine or contrast with local conclusions
- external material must not silently replace project-local truth

### Fallback Rules

If online augmentation is unavailable or disallowed:
- stay in local-first mode
- answer with explicit evidence boundaries
- mark open gaps rather than over-claiming

If no retrieval/index layer exists yet:
- use direct file reading and lightweight structure mapping
- propose knowledge-base scaffolding instead of pretending a mature KB already exists

## Beginner-Friendly Entry

For most users, three entry patterns are enough:

1. **Explain a project**
   - `请用 project-wiki 解释这个项目。`
2. **Build or update a wiki**
   - `请用 project-wiki 为这个项目建立或更新 wiki。`
3. **Explain using a preferred knowledge source**
   - `请用 project-wiki 优先根据我的例题库讲解这道题，并按例题思路来讲。`

## Triggering Modes

### Automatic triggering

Project Wiki should auto-activate when the user naturally describes:
- a project explanation or evaluation task
- a need to build or maintain project knowledge pages
- a request to prioritize a specific local knowledge source
- a request to explain using the structure, logic, or style of that source

### Precise triggering

Advanced users may state the behavior more explicitly. Examples:

- `请用 project-wiki 优先基于例题库讲解这道题。`
- `请用 project-wiki 先按 docs/wiki 里的现有知识解释这个模块。`
- `请用 project-wiki，主知识源设为讲义，优先沿用讲义的分析顺序。`

## System-facing interpretation

Project Wiki is not only a chat-triggered skill. It can also act as a capability specification for future systems.

That means it may define:
- how a product identifies primary local knowledge sources
- how explanation should prioritize those sources
- how source-guided explanation should preserve reasoning style
- how outputs should distinguish source-derived reasoning from supplemental reasoning

For deeper guidance on this system-facing use, read:
- `references/system-integration-guidance.md`

## Workflow

### 0. Project adaptation

Before choosing an output, first adapt to the target project.

Identify:
- project type (software repo, teaching system, documentation KB, SaaS KB, mixed)
- project state (`cold`, `partial`, `mature`, or `unknown`)
- likely primary sources
- whether a durable wiki layer already exists
- whether clarification is required before execution

Expected adaptation output:
- a lightweight project profile
- candidate routes
- explicit gaps in understanding

### 1. Clarify the intent

Identify which of these the user needs:
- adapt project
- propose options
- explain
- evaluate
- compare
- decide
- build wiki
- update wiki
- audit knowledge quality
- query a knowledge base

If several apply, choose the primary outcome first and treat the others as supporting tasks.

### 2. Interactive clarification

When the request is broad or under-specified, ask the minimum number of questions needed to avoid partial landing.

Clarification is mandatory when any of these are unclear:
- the desired deliverable
- whether repository changes are wanted
- the preferred source of truth
- the audience or depth
- the primary task when several goals are mixed together

Prefer 1-3 questions. If more than 3 seem necessary, propose candidate routes and ask the user to choose.

### 3. Propose best-fit options

Before deep synthesis or repository change proposals, prefer offering 2-3 best-fit paths such as:
- explain first
- evaluate first
- build or update wiki
- source-guided explanation

State why each path fits, its main trade-off, and which one you recommend by default.

### 4. Inventory local evidence

Start from local project materials before offering conclusions:
- source code
- docs
- config files
- tests
- architecture notes
- changelogs
- ADR-like records
- user-supplied materials

### 5. Build or refresh the wiki map

Prefer stable page types over ad-hoc notes:
- project overview
- architecture map
- module pages
- glossary / conventions
- decision records
- troubleshooting pages
- open questions

### 6. Resolve knowledge-source priority

Before broad retrieval, decide whether the user named a preferred source.

Possible primary sources include:
- example banks
- lecture notes
- docs/wiki pages
- curated local corpora
- hand-maintained notes or solved-problem sets

Priority rule:
1. primary local source
2. other local project sources
3. external or general knowledge only if still needed

If a source policy is being recorded, lightweight hints such as `review_cadence` or `supersession_rule` may be added to clarify maintenance expectations.

### 7. Retrieve evidence with the right strategy

Use the lightest strategy that is sufficient:

- direct file read for focused evidence
- structure-aware search for modules, boundaries, and flows
- local RAG-style retrieval when the corpus is large enough to justify chunking/indexing
- parent-child retrieval patterns when fine-grained hits need larger context
- hybrid retrieval when exact terms and semantic intent both matter

If a preferred knowledge source exists:
- search it first
- preserve its terminology and structure when useful
- only expand outward when its coverage is insufficient

### 8. Confirm the route before execution-heavy output

If the user has not yet confirmed the route and the choice would materially change the result:
- summarize what you understood
- state the recommended route
- ask the user to confirm or adjust it
- do not silently drift into a full answer, build plan, or update plan too early

### 9. Synthesize into project-assist output

Outputs should be shaped for action:
- explanations
- comparisons
- evaluations
- decision memos
- wiki build/update plans

### 10. Propose or perform knowledge updates

When appropriate, convert findings into durable knowledge objects:
- create missing pages
- update stale sections
- attach new evidence
- mark open questions
- record trade-offs and decision context

## Mutation Boundary

Project Wiki should treat knowledge updates carefully.

Default behavior:
- propose a wiki build/update plan first
- identify the target page types and likely file locations
- explain what would be created or changed
- wait for the user to explicitly request file creation or modification

Write/update behavior is allowed only when the user clearly wants repository changes.

When writing is authorized:
- follow the project's existing docs/wiki structure if one already exists
- if no wiki structure exists, propose the layout before creating files
- preserve evidence links and change rationale
- update lightweight lifecycle fields when they materially improve maintenance clarity
- avoid broad rewrites when a narrow incremental update is enough

## Recommended MVP Wiki Layout

If the project does not already define its own wiki structure, prefer a small default layout such as:

- docs/wiki/SCHEMA.md (wiki conventions and root path anchor)
- docs/wiki/index.md (page catalog with one-line summaries)
- docs/wiki/log.md (append-only operation log)
- docs/wiki/overview.md (project overview)
- docs/wiki/modules/<name>.md (module pages)
- docs/wiki/decisions/<date>-<slug>.md (decision records)
- docs/wiki/glossary.md (terminology)
- docs/wiki/troubleshooting.md (common problems and fixes)
- docs/wiki/_backlinks.json (reverse link index, optional for SaaS)
- docs/wiki/_snapshots.json (version snapshots, optional for SaaS)

### `SCHEMA.md`

Every wiki should have a `SCHEMA.md` at its root that records:
- wiki root path
- page naming convention (lowercase, hyphen-separated slugs)
- link syntax (`[[slug]]` wiki-links for cross-references)
- evidence citation format
- lifecycle field usage rules
- page types in use

### `index.md`

The index is a navigable catalog of all wiki pages:

```markdown
# Wiki Index

- [Project Overview](overview.md) — what this project is and why it exists | tags: core
- [Auth Session](modules/auth-session.md) — session validation and refresh flow | tags: auth, module
- [Cache Strategy Decision](decisions/2026-04-01-cache-strategy.md) — ADR for cache invalidation approach | tags: decision, cache
```

Rules:
- one line per page
- include a short summary and tags
- keep alphabetically or by page type
- update the index whenever a page is created, renamed, or deleted

### `log.md`

An append-only operation log recording every knowledge base mutation. See `references/incremental-update-protocol.md` for the entry format.

Each MVP page should try to include:
- **Scope**
- **Verified facts**
- **Synthesis**
- **Evidence**
- **Open questions**
- **Related Pages** (using `[[slug]]` wiki-link syntax)
- **Last updated**

When useful, pages may also carry lightweight lifecycle fields such as:
- **Review status**
- **Last reviewed**
- **Retention class**
- **Confidence basis**
- **Supersedes / Superseded by**
- **Consolidation status**
- **Crystallized from**

## Knowledge Objects

Project Wiki should prefer a small set of durable knowledge objects.

### Core page types
- `overview`
- `module`
- `decision`
- `glossary`
- `troubleshooting`

### Supporting knowledge objects
- **evidence bundle** — the file/doc/code references supporting a conclusion
- **comparison set** — structured comparison input for option analysis
- **gap list** — what is still missing or weakly supported
- **update note** — what changed, why it changed, and what page should be refreshed

## Internal Task Modes

### `ingest`
Use when absorbing new materials into the knowledge layer.

Expected behavior:
- identify source type and boundaries
- extract the most relevant structure
- decide where the material belongs in the wiki map
- preserve source traceability

### `compile`
Use when turning raw material into structured project knowledge.

Expected behavior:
- create or revise stable page types
- compress repeated facts into readable project knowledge
- keep evidence links visible
- avoid turning the wiki into a dump of copied source chunks

### `retrieve`
Use when evidence gathering is the main need.

Expected behavior:
- choose direct search vs RAG-like retrieval deliberately
- prefer structure-aware retrieval over blind chunk dumping
- use parent-child and hybrid retrieval patterns when helpful
- gather enough context to support a page or conclusion

### `audit`
Use when checking the quality of the knowledge layer.

Expected behavior:
- find weakly supported claims
- spot contradictions or stale sections
- identify missing pages or knowledge gaps
- highlight where retrieval quality is too weak to trust synthesis

### `assist`
Use when the knowledge layer should help real project work.

Expected behavior:
- explain a system in project language
- compare options with trade-offs
- evaluate risks and assumptions
- produce decision-ready outputs with evidence and caveats
- adapt outputs for personal use or lightweight team reuse

### `source-priority`
Use when a specific local knowledge source should guide explanation.

Expected behavior:
- identify the primary source named by the user
- prefer that source before other knowledge layers
- preserve the source's terminology and reasoning order when useful
- mark where the explanation follows the source directly vs where it adds supplemental reasoning
- fall back in the correct order when the source is incomplete

### `source-guided-explain`
Use when the user wants not only the source's content, but also its way of explaining.

Expected behavior:
- extract the explanation pattern from the source
- reuse its analysis steps, structure, and teaching sequence when possible
- keep the distinction between source-derived reasoning and added explanation visible
- avoid replacing the source's logic with a generic explanation too early

### `curate`
Use when the main need is to improve the quality of the wiki layer itself.

Expected behavior:
- find missing high-value pages
- tighten page scope
- improve links between pages
- reduce duplication
- keep the wiki readable, updateable, and reusable

### `query`
Use when the user asks a question that should be answered from the knowledge base.

Expected behavior:
- always read the wiki layer first, never answer from memory alone
- search the index to identify candidate pages
- read relevant pages and gather evidence
- synthesize an answer with citations pointing to specific pages and sections
- distinguish knowledge-base-sourced reasoning from supplemental reasoning
- when coverage is insufficient, state the gap explicitly before falling back
- offer to save a valuable answer as a new wiki page or section
- this mode is read-only — it does not modify the wiki

For SaaS contexts, query mode is the primary retrieval-and-answer path. Responses must follow the API citation format defined in `references/evidence-and-citation.md`.

### `evolve`
Use when findings should change the durable knowledge layer.

Expected behavior:
- update pages incrementally
- preserve what changed and why
- keep decision context legible
- avoid rewriting everything when only one part changed

## Retrieval Architecture Guidance

This skill does **not** require a heavy RAG system for every use case.

Use this decision ladder:

1. **Single-file / narrow question**
   - Read files directly.
   - Do not invent a RAG pipeline.

2. **Structured project exploration**
   - Use headings, directories, symbols, and file roles first.
   - Build a lightweight mental or written wiki map.

3. **Larger local corpus**
   - Use structure-aware chunking.
   - Preserve metadata such as file path, section path, document type, and timestamp.
   - Prefer parent-child retrieval when a small hit needs larger context.

4. **Mixed exact-match and semantic queries**
   - Use hybrid retrieval ideas: lexical + semantic + rerank if justified.

5. **Evaluation-sensitive outputs**
   - Audit retrieval quality before trusting synthesis.
   - If evidence coverage is weak, say so explicitly.

## Output Contracts

### Page labels and contract keys

Use page-friendly labels in templates and prose, but map them to the exact output contract keys when recording structured data:

- `Review status` -> `review_status`
- `Last reviewed` -> `last_reviewed`
- `Retention class` -> `retention_class`
- `Confidence basis` -> `confidence_basis`
- `Supersedes` / `Superseded by` -> `supersedes` / `superseded_by`
- `Consolidation status` -> `consolidation_status`
- `Crystallized from` -> `crystallized_from`

Only include these lifecycle keys when they materially improve maintenance clarity.

### 1. Project Explanation Report

Use this when explaining a project, module, or system.

Required sections:
- **What it is**
- **Why it exists**
- **Key components**
- **How the pieces connect**
- **Evidence**
- **Open questions / uncertainty**

### 2. Evaluation Report

Use this when judging a design, implementation path, or architecture.

Required sections:
- **Question being evaluated**
- **Current evidence**
- **Strengths**
- **Risks / weaknesses**
- **Assumptions**
- **Recommendation**
- **Confidence**

### 3. Comparison Matrix

Use this when comparing options.

Required columns:
- option
- local fit
- complexity
- maintainability
- performance / scale implications
- evidence
- recommendation

### 4. Decision Memo

Use this when the user needs decision support.

Required sections:
- **Decision statement**
- **Context**
- **Alternatives considered**
- **Why this option**
- **Known trade-offs**
- **Evidence**
- **What still needs validation**

### 5. Wiki Build / Update Plan

Use this when the user wants to create or improve a project knowledge base.

Required sections:
- **Current state**
- **Missing page types**
- **High-value pages to build first**
- **Evidence sources**
- **Suggested update order**
- **Risks if left undocumented**

For lifecycle-sensitive update work, `update_wiki` outputs should include `update_plan` plus at least one lightweight lifecycle key such as `review_status`, `last_reviewed`, `retention_class`, `consolidation_status`, `supersedes`, `superseded_by`, `crystallized_from`, or `confidence_basis`.

## Quality Gates

Before treating an output as solid:

- major conclusions should have local evidence where possible
- facts and inferences must be separated
- gaps must be marked explicitly
- external facts must be labeled as external
- online/API use must respect privacy and authorization boundaries
- retrieval weakness must not be hidden by fluent prose
- outputs intended for reuse should map to a stable page type or explicit knowledge object
- comparisons and recommendations should state assumptions and what still needs validation

## Reference File Map

Read these files when needed:

### Runtime/core guidance
- `references/llm-wiki-core.md`
  - Read when deciding how to structure persistent knowledge instead of producing one-off answers.
- `references/local-rag-engineering.md`
  - Read when retrieval strategy, chunking, parent-child context, metadata, or hybrid retrieval design matters.
- `references/project-assistant-playbook.md`
  - Read when producing explanation, evaluation, comparison, onboarding, or decision-support outputs.
- `references/modes-and-safety.md`
  - Read when deciding between local-first and online/API-enhanced behavior, or when privacy/safety boundaries matter.
- `references/source-priority-guidance.md`
  - Read when a preferred local knowledge source should shape explanation order or style.
- `references/system-integration-guidance.md`
  - Read when using Project Wiki as a capability specification inside a future product or platform.
- `references/project-adaptation-protocol.md`
  - Read when first entering an unfamiliar project and deciding project type, state, likely sources, and candidate routes.
- `references/interactive-clarification-guidance.md`
  - Read when you need to ask the user questions before choosing a route or output artifact.
- `references/task-routing-guidance.md`
  - Read when deciding the primary task type for a broad or multi-intent request.

### Structure and linking guidance
- `references/wiki-linking.md`
  - Read when creating cross-references between wiki pages, setting up backlink indexes, or validating link integrity.
- `references/cold-start-protocol.md`
  - Read when bootstrapping a knowledge base from zero, especially for SaaS deployments.

### Maintenance and quality guidance
- `references/evidence-and-citation.md`
  - Read when outputs need a consistent evidence-backed format, or when designing API-facing citation structures for SaaS.
- `references/wiki-quality-audit.md`
  - Read when auditing page quality, stale knowledge, conflicts, or unsupported claims.
- `references/incremental-update-protocol.md`
  - Read when planning narrow, traceable updates instead of broad rewrites, or when maintaining the operation log.
- `references/knowledge-lifecycle.md`
  - Read when deciding how to express review state, retention, consolidation, confidence basis, supersession, or version snapshots.
- `references/output-quality-standards.md`
  - Read when checking whether explanation, evaluation, comparison, decision, or update outputs meet the minimum quality bar.

### Contracts
- `contracts/output-contract.schema.json`
  - The structural contract for all Project Wiki outputs by task type.
- `contracts/source-policy.schema.json`
  - The structural contract for source policies.
- `contracts/retrieval-contract.schema.json`
  - The structural contract for knowledge base retrieval requests and responses in SaaS and API contexts.

### Reusable templates
- `references/templates/*.md`
  - Read when generating overview, module, decision, glossary, or troubleshooting pages.

## Source-Priority Guidance

When a user names a preferred local knowledge source, treat it as a first-class instruction.

### Explanation priority order

When multiple knowledge layers are available, prefer this order unless the user explicitly requests otherwise:

1. **Current project/runtime evidence**
   - source code, current configs, tests, live project structure
2. **Maintained local project docs/wiki**
   - docs, wiki pages, ADRs, changelogs, maintained internal notes
3. **Preferred local teaching or reference source**
   - example bank, lecture notes, solved-problem collections, curated local corpora
4. **General or external knowledge**
   - use only after the first three are insufficient or when public validation is needed

### Conflict rule

If these layers disagree:
- do not silently merge them into one smooth answer
- state the conflict explicitly
- prefer current project/runtime evidence for project-reality questions
- use the preferred source mainly to shape explanation style or provide guided reasoning, unless the user explicitly wants that source treated as the main authority

### Style priority rule

If the user asks to explain *using the source's way of thinking*, try to preserve:
- its order of analysis
- its terminology
- its problem-solving steps
- its teaching rhythm

### Transparency rule

When explaining from a preferred source, make it clear when:
- a point comes directly from that source
- a point is inferred from several local sources
- a point is supplemental general knowledge

## Common Mistakes

### Mistake 1: Turning everything into RAG

Symptom:
- immediately proposing embeddings/vector DB/chunks for simple questions

Fix:
- start with direct evidence and stable pages
- use RAG only when corpus size or query complexity justifies it

### Mistake 2: Writing beautiful but ungrounded wiki prose

Symptom:
- polished summaries with weak or missing evidence

Fix:
- attach file-backed evidence
- label inference clearly
- mark uncertainty instead of smoothing it over

### Mistake 3: Treating one-off summaries as durable knowledge

Symptom:
- output is a report with no page structure or update path

Fix:
- map findings into reusable page types
- preserve update points and open questions

### Mistake 4: Letting external best practice overwrite project reality

Symptom:
- generic recommendations conflict with local code, docs, or constraints

Fix:
- local evidence first
- external practice as contrast, not silent replacement

### Mistake 5: Trying to solve team collaboration in MVP

Symptom:
- adding workflow, approvals, permissions, comments, and process machinery too early

Fix:
- keep MVP personal-first and structure-first
- support small-team reuse through readable pages and evidence trails

### Mistake 6: Writing wiki pages with no cross-references

Symptom:
- pages exist in isolation with no `[[wikilinks]]` connecting them
- no Related Pages section
- no backlink index

Fix:
- every page should link to at least one related page using `[[slug]]` syntax
- include a Related Pages section before the Lifecycle section
- rebuild the backlink index after creating or updating pages

### Mistake 7: Serving knowledge base answers without citations in SaaS

Symptom:
- API returns a fluent answer with no citation objects
- frontend cannot show where the answer came from
- user cannot verify claims against source material

Fix:
- every knowledge-base-sourced claim must carry a citation object
- use the API-facing citation format from `references/evidence-and-citation.md`
- clearly separate knowledge-base-sourced text from LLM-supplemented text

## MVP Boundary

This skill's MVP is **wiki-first**.

That means:
- the primary outcome is a maintainable project knowledge layer
- retrieval supports page creation, page updates, and evidence-backed answers
- it should not drift into a generic ask-anything project chatbot

For MVP, prefer a small set of page types:
- overview
- module
- decision
- glossary
- troubleshooting

## Manual Validation Prompts

Use prompts like these to test the skill:

1. `请解释这个项目的核心架构，并指出最关键的 5 个文件或页面证据。`
2. `请比较两种方案，并基于本地项目证据给出推荐，不要只给泛泛最佳实践。`
3. `请为这个项目设计一个离线优先的 wiki 结构，适合个人先用、团队后续复用。`
4. `请评估当前模块边界是否合理，并把已验证事实、推断、待确认项分开写。`
5. `请把当前项目材料整理成新人 30 分钟可上手的知识页骨架。`
6. `我在做一个讲解题目的系统，我有一个例题库。请用 project-wiki 讲解这道题时优先调用例题库里的知识，并尽量按例题的思路来讲。`
7. `请用 project-wiki 优先基于讲义讲解这个概念，不足时再补充一般知识，并把两者区分开。`

## Bottom Line

Project Wiki is not here to make retrieval look smarter.

It is here to make project knowledge more durable, more explainable, more evaluable, and more useful for real work.
