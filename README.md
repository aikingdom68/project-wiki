# project-wiki

> Language note: this is the English default README. For the Chinese version, see [README.zh-CN.md](README.zh-CN.md).

## 30 seconds

Most "AI knowledge base" tools are RAG with a UI. They re-search every question, never accumulate, and stop working the moment the LLM is offline.

`project-wiki` flips that. The durable output is **structured Markdown pages** — pages humans can read offline, products can embed directly, and Claude can co-author with citations. **No vector DB required. No API required. Works offline.**

It is also a skill that **refuses to start writing**. When you say "explain this project", it diagnoses what's actually here, proposes 2–3 routes, and asks before touching a single file — the way a careful new maintainer would.

## Try it in one line

```text
/project-wiki 帮我看看这堆资料能不能接成知识库。
```

You will not get an immediate answer. You will get:

1. an **intake summary** (project type, source shapes, existing wiki/KB state, gaps)
2. **2–3 candidate routes** with explicit trade-offs
3. **clarifying questions**, only the ones needed to avoid the wrong path
4. a confirmation gate before any file is created, renamed, or rewritten

That is the entire point. The output you keep is a wiki page — not a chat reply.

## Why it's different

| | Pure RAG | Generic notes / wiki | **project-wiki** |
|---|---|---|---|
| **Offline?** | Dead — chunks need an LLM | Usable but unstructured | Degraded but **readable**, with citations |
| **Knowledge accumulates?** | No — re-derived every query | Yes, manually | Yes, via durable pages + lifecycle metadata (`review_status`, `supersedes`, `retention_class`) |
| **Fact vs guess?** | Blended by the LLM | Up to the writer | Always separated: `verified_fact` / `synthesis` / `open_question` |
| **Embedded in your product?** | Chunks are LLM-only | Markdown only | Markdown **plus** JSON contracts + citation objects |
| **Confirmation gates?** | None | None | Every durable structural decision pauses for the user |
| **Starts with a polished answer?** | Yes (often wrong) | N/A | **No.** Diagnoses first, proposes routes, then executes |

## Why it might win you over

The elevator version goes like this:

1. **Wiki is the product, retrieval is a witness.** The artifact you keep is a Markdown page, not a chat log. A new teammate can read it without an LLM.
2. **Local truth outranks global best practice.** When your repo and the internet disagree, the repo wins. When your textbook and a generic LLM disagree, the textbook wins.
3. **Confirmation is a feature, not friction.** Chapter trees, source authority, retrieval policy, file mutations — every durable choice stops at a gate. AI proposes; the human ratifies.
4. **The frontend has rules.** The local Admin GUI is part of the product. v0.7.0 ships a [Frontend Playbook](references/admin-gui-frontend-playbook.md) where every visual rule, vocabulary mapping, and graph-layout fix traces back to a specific failure that has actually happened in production data.

## What this skill does

`project-wiki` is an independent open-source Claude Code skill for organizing **project materials** into a maintainable knowledge layer, and then using that layer to help you with:

- project explanation
- project evaluation
- solution comparison
- decision support
- knowledge base / wiki creation and updates

Its core goal is not to make retrieval “look smarter,” but to make **project knowledge more stable, more trustworthy, and more reusable**.

It is designed around three core ideas:

- **LLM Wiki is the skeleton** — persistent, maintainable project knowledge pages
- **Local RAG is the evidence layer** — retrieval supports the wiki instead of replacing it
- **Project Assistance is the product goal** — it should serve real project work, not just search

## Installation and Invocation

This is a standalone skill repository.

### One-command install (recommended)

Run from the repository root:

```bash
node scripts/install.mjs . --dry-run
node scripts/install.mjs . --clean
```

If you know you want to overwrite files with the same name but do not want to clear the old directory first, you can use:

```bash
node scripts/install.mjs . --force
```

Notes:
- `--clean`: recommended for upgrades; replaces the target directory first to avoid leftover old files
- `--force`: only overwrites files with the same name and does not guarantee a clean upgrade
- `--dry-run`: previews what will be installed

### Manual installation

The simplest manual approach is to copy the entire repository directory into your Claude Code skills directory, for example:

```text
~/.claude/skills/project-wiki/
```

> Note: for manual installation, it is recommended to **copy real files**. Do not use symlinks, junctions, or other link-based approaches instead of copying.

The final structure should look like:

```text
~/.claude/skills/project-wiki/
  SKILL.md
  README.md
  README.zh-CN.md
  LICENSE
  CHANGELOG.md
  RELEASE.md
  PUBLISHING.md
  ROADMAP.md
  test-prompts.json
  contracts/
  references/
  examples/
  scripts/
  evals/
```

In Claude Code, you can trigger it like this:

```text
Please use project-wiki to explain the core architecture of this project.
```

The preferred public entry is the slash skill `/project-wiki`.

Or invoke it directly as a slash skill:

```text
/project-wiki Please design an offline-first wiki structure for this project.
```

By default, it is best used inside your target project directory so Claude can read the current project files as local evidence.

When entering a new or unfamiliar project, the preferred behavior is:
1. adapt to the project first
2. identify likely sources and project state
3. ask a small number of clarification questions when needed
4. propose best-fit routes before committing to one output shape

Note: although the skill declares browser capability, the default posture is still **local-first**. Unless you explicitly authorize it, or you truly need public external facts, private project content should not be sent to online search or external APIs.

## Standard Opening Flow (what a correct first response looks like)

`project-wiki` is **not** a one-shot answer skill. When you type a broad request such as `请用 project-wiki 解释这个项目`, a correct first response should walk through five stages — `adapt → clarify → propose → confirm → execute` — instead of jumping straight into a polished explanation.

### Expected interaction shape

```text
You:
  请用 project-wiki 解释这个项目。

project-wiki (stage 1: adapt):
  Project type: software_repo (looks like a TypeScript library)
  Project state: partial — some README + tests, no docs/wiki layer
  Likely primary sources: src/, README.md, examples/
  Gaps in understanding: no ADRs, unclear module boundaries

project-wiki (stage 2: propose 2-3 routes):
  Option A — Explain first: walk through architecture before changing anything (recommended)
  Option B — Build wiki: scaffold docs/wiki/ with overview + module pages
  Option C — Evaluate first: assess module boundaries and risks

project-wiki (stage 3: ask for confirmation):
  Which route do you want? Any audience/depth preference?

You:
  Option A, for a new maintainer.

project-wiki (stage 4-5: execute the chosen route):
  [Project Explanation Report with verified facts, synthesis,
   evidence anchors, open questions]
```

### When the skill is allowed to skip stages

- **Skip adapt** when the project is already known (e.g. mature wiki present and the user asks a focused query).
- **Skip clarify** only when goal, deliverable, source, and write intent are all unambiguous.
- **Skip propose** only when the user explicitly named one route (e.g. `/project-wiki build wiki for this project`).
- **Never skip confirm** when the chosen route would write or modify repository files.

If you want this opening flow shown in worked examples, see:
- `examples/adapt-project-first.md`
- `examples/interactive-clarification.md`
- `examples/task-routing-multi-intent.md`

## 60-Second Self-Check

After installation, you can first run:

```bash
node scripts/doctor.mjs .
```

Or if it is already installed into your skills directory:

```bash
node ~/.claude/skills/project-wiki/scripts/doctor.mjs ~/.claude/skills/project-wiki
```

Then use the following 4 steps to quickly confirm it works:

1. Check that the directory contains at least:
   - `SKILL.md`
   - `contracts/`
   - `references/`
   - `examples/`
   - `scripts/`
   - `evals/`
2. Enter a real project directory in Claude Code.
3. Type:

```text
Please use project-wiki to explain this project.
```

4. Check whether it responds in the `project-wiki` style:
   - it emphasizes the project knowledge layer more than generic search
   - it emphasizes evidence, pages, structure, and gaps
   - it does not collapse into generic repo chat
5. Reuse `test-prompts.json` when you want a small regression prompt set for manual validation.

Note: this `doctor` command is primarily for **repository integrity / installation file completeness checks**. It helps confirm that the skill file set is complete, but it is not a substitute for real prompt testing.

## Use It as a Platform Capability

`project-wiki` is not only a skill for Claude conversations.

It can also be understood as a **system capability specification** for platforms you may build later, such as:

- problem explanation platforms
- teaching/explanation systems
- project explanation systems
- local-knowledge-driven explanation engines
- **AI SaaS products that need knowledge-first answers**

In this kind of setting, `project-wiki` does not define “how the user should write the prompt,” but instead defines:

- how the system identifies the primary knowledge source
- how the system decides source priority
- how the system organizes explanations according to source logic
- how the system distinguishes example-based reasoning, local supplementary explanation, and general supplementary knowledge
- how the system should explicitly resolve conflicts between knowledge sources
- **how the retrieval layer interfaces with the knowledge base** (see `contracts/retrieval-contract.schema.json`)
- **how API responses carry structured citations** (see `references/evidence-and-citation.md`)
- **how the system degrades gracefully when offline** (see `references/modes-and-safety.md`)
- **how to bootstrap a knowledge base from zero** (see `references/cold-start-protocol.md`)

This is especially important if you are building a problem-explanation platform:

- an example library can be the primary knowledge source
- the system should prioritize the example library during explanation
- the system should try to follow the example library’s analysis order, terminology, and problem-solving rhythm
- if the example library is insufficient, the system should supplement with other local materials, and only then with general knowledge
- if the example library conflicts with the current project implementation or the project docs/wiki, the conflict should be marked explicitly instead of being silently blended into one answer

### SaaS Integration

If you are building an AI SaaS product, `project-wiki` provides concrete integration contracts:

| Contract | Purpose |
|----------|---------|
| `contracts/retrieval-contract.schema.json` | Defines retrieval request/response shapes: query, source filters, retrieval modes, coverage assessment, fallback signals, snapshot versioning |
| `contracts/output-contract.schema.json` | Defines structured output shapes by task type, including citation objects for API responses |
| `contracts/source-policy.schema.json` | Defines per-tenant or per-project source prioritization policies |
| `contracts/export-plan.schema.json` | Defines the P4.4 read-only export planning response shape; not an export execution contract |

Key SaaS-specific guidance:
- **Offline fallback**: `references/modes-and-safety.md` → “Offline capability boundary for SaaS” defines what works offline, what degrades, and what requires connectivity
- **Cold start**: `references/cold-start-protocol.md` covers bootstrapping a new instance from zero
- **Citations**: `references/evidence-and-citation.md` → “API-facing citation format” defines citation objects and inline markers for frontend rendering
- **Version snapshots**: `references/knowledge-lifecycle.md` → “Version snapshots” supports historical queries against past knowledge base states

For more complete guidance, see:
- `references/source-priority-guidance.md`
- `references/system-integration-guidance.md`
- `references/knowledge-lifecycle.md`

## When to Use It

Use it when you want to:

- quickly explain a project, module, or architecture
- compare two technical approaches and make recommendations based on local evidence
- evaluate design quality, boundaries, technical debt, or migration paths
- build or update a project wiki / knowledge base
- generate onboarding summaries, ADR-style conclusions, module maps, or troubleshooting pages
- **query a knowledge base with citations** — get evidence-backed answers with structured references to source pages
- **build an AI SaaS product** that needs knowledge-first answers, offline fallback, and structured citations

## When Not to Use It

Do not use it when you only need to:

- look up one symbol, one file, or one config item
- create a one-off summary without accumulating knowledge
- do ordinary search without needing project knowledge structure
- do external market research instead of organizing local project knowledge

## How Is This Different from Pure RAG?

This is the most common question. The core difference is not “who retrieves better” — it is that **the knowledge layer itself has a different shape**.

### How pure RAG works

```
User question → search raw document chunks → LLM generates answer from chunks → answer disappears into chat
```

Every time: re-retrieve, re-assemble, re-generate. Knowledge does not accumulate. The understanding from the last answer does not help the next one.

### How project-wiki works

```
Raw materials → structured wiki pages (human-readable, browsable, citable)
User question → check wiki pages first → if API available, synthesize → if offline, return page content directly
```

Knowledge is pre-organized. Queries do not start from zero each time.

### Offline comparison (this is the key difference)

| | Pure RAG (offline) | project-wiki (offline) |
|---|---|---|
| **Usable?** | **No.** Chunks without LLM cannot generate answers — effectively dead | **Yes.** Wiki pages are complete, human-readable knowledge — no LLM required |
| **What can users see?** | Fragmented document chunks, or “service unavailable” | Structured knowledge pages: project overview, module docs, decision records, glossary, troubleshooting |
| **Searchable?** | Vector search may work, but returns raw fragments, not answers | Index.md provides a navigable catalog; `[[wikilinks]]` enable related-page traversal |
| **Citable?** | No — citations require LLM assembly | **Yes.** Pages have built-in evidence links and citation anchors |
| **Fact vs inference separated?** | No — LLM blends them during generation | **Yes.** Pages already separate verified facts, synthesis, and open questions |

**One line: Pure RAG offline = dead. project-wiki offline = degraded but usable.**

### Online comparison (with API)

| | Pure RAG (with API) | project-wiki (with API) |
|---|---|---|
| **Answer quality** | Depends on retrieval quality each time — inconsistent | Wiki layer already contains high-quality knowledge; API synthesizes and supplements, not generates from scratch |
| **Knowledge accumulation** | None — re-retrieves from raw documents every time | Accumulates: good answers can be saved back as wiki pages for direct reuse |
| **Citation reliability** | Citations point to raw chunks; user must judge relevance | Citations point to specific wiki page sections with confidence labels (verified_fact / synthesis / open_question) |
| **Coverage awareness** | Does not know if the knowledge base covers the question; may hallucinate | Explicitly reports coverage (high/medium/low); states “not covered” before falling back |
| **Cost** | Heavy token usage for generation every time | Wiki layer serves existing knowledge directly; LLM only called for synthesis and analysis |

### No API required — that is a feature, not a limitation

`project-wiki` **does not require an API**. Its core output is **markdown wiki pages** — readable, searchable, and usable with or without an LLM.

The API is an enhancement layer, not a dependency:

| Mode | Description |
|------|-------------|
| **Fully offline** | Browse wiki pages, search via index, navigate via wikilinks, view evidence and citations. For private environments, air-gapped networks, local-only deployments. |
| **Local-first + API-enhanced** | Check wiki pages first, call LLM only when synthesis is needed. Most queries do not need the API. |
| **Fully online** | Wiki pages + LLM synthesis + external knowledge supplement. For scenarios requiring real-time reasoning and external validation. |

### Does this only work when chatting with Claude?

**No.** This is the most important point to understand.

The core output of `project-wiki` is **standardized markdown pages + JSON contracts**, not a Claude-proprietary format. Your own product code can use them directly:

| Output | In Claude conversation | Embedded in your product |
|--------|----------------------|--------------------------|
| **Wiki pages** | Claude reads them to answer your questions | Your backend reads the .md files, parses them, and returns structured content to the frontend |
| **index.md** | Claude uses it to find relevant pages | Your product uses it as a search entry point — scan the index for candidates, faster than full-text search |
| **`[[wikilinks]]`** | Claude uses them to navigate related knowledge | Your frontend renders them as clickable links for users to browse |
| **_backlinks.json** | Claude uses it to discover reverse references | Your product uses it for “related pages” recommendations |
| **Three-layer separation** (verified_fact / synthesis / open_question) | Claude presents them layered in responses | Your frontend uses different colors/labels — green = verified, yellow = synthesis, gray = unconfirmed |
| **retrieval-contract.schema.json** | Claude uses it internally | Your product backend implements its retrieval API to this schema directly |
| **output-contract.schema.json** | Claude outputs in this format | Your product formats API responses to this schema |
| **Citation objects** | Claude attaches citations to answers | Your frontend renders them as footnotes, tooltips, or highlights |
| **SCHEMA.md** | Claude reads wiki structure from here | Your backend reads the wiki root path and naming rules from here |

**The key difference:**
- **Pure RAG** embedded in a product — without LLM, chunks are useless (they are for LLM consumption, not human consumption)
- **project-wiki** embedded in a product — wiki pages ARE the product content (human-readable, machine-parseable, frontend-renderable)

### Compared with other products

- **Compared with Repo Chat / repository Q&A**: Repo Chat is more oriented toward immediate Q&A; `project-wiki` emphasizes evidence, page structure, gaps, decision context, and update paths, making it better suited to project explanation, design evaluation, trade-off analysis, onboarding, and troubleshooting capture.
- **Compared with static wikis or generic document repositories**: traditional documentation is good at storing content; `project-wiki` emphasizes source priority, separation between facts and synthesis, explicit conflict handling, and continuous maintenance of a project knowledge layer instead of just accumulating documents.
- **Compared with generic AI memory or note-taking products**: generic tools often optimize for personal recording or free retrieval; `project-wiki` is more opinionated about project context, primary knowledge source priority, and only cautiously falls back to general knowledge when local evidence is insufficient.
- **Compared with cloud-first or external-index-first products**: many products assume content is sent to external indexes or online services; `project-wiki` is **local-first** by default, making it a better fit for private repositories, sensitive materials, and offline-oriented workflows.
- **Compared with one-off summary tools**: one-off summaries go stale easily; `project-wiki` supports lightweight lifecycle semantics such as `review_status`, `supersedes`, `retention_class`, and `consolidation_status`, making it better suited for long-term maintenance.

## Page Labels and Contract Key Mapping

To let page templates, examples, and contracts share the same lightweight lifecycle vocabulary, the following mappings are recommended:

- `Review status` -> `review_status`
- `Last reviewed` -> `last_reviewed`
- `Retention class` -> `retention_class`
- `Confidence basis` -> `confidence_basis`
- `Supersedes` / `Superseded by` -> `supersedes` / `superseded_by`
- `Consolidation status` -> `consolidation_status`
- `Crystallized from` -> `crystallized_from`

These fields should only be used when they improve maintenance clarity; not every page needs all of them.

## The Three-Sentence Beginner Version

If this is your first time using it, these three prompts are enough to start:

### 1) Explain the project
```text
Please use project-wiki to explain this project.
```

### 2) Build or update the wiki
```text
Please use project-wiki to build or update the wiki for this project.
```

### 3) Explain using a preferred knowledge source first
```text
Please use project-wiki to explain this problem primarily based on my example library, and follow the example’s reasoning style as much as possible.
```

## Quick Start

If you are using `project-wiki` for the first time, the prompts below cover the full task surface — not just explanation.

> Reference table: each prompt maps to a `task_type` defined in `contracts/output-contract.schema.json`.

### 1) Adapt to an unfamiliar project — `adapt_project`

```text
Please use project-wiki to adapt to this project first: classify project type and state, list likely primary sources, surface gaps, and recommend candidate routes before doing anything else.
```

### 2) Propose options when intent is unclear — `propose_options`

```text
Please use project-wiki to propose 2-3 best-fit routes for this project. State the trade-off of each and recommend a default — do not commit to one output yet.
```

### 3) Understand the project — `explain`

```text
Please use project-wiki to explain this project's core goals, major modules, and key dependency relationships, and list the 5 most important evidence files.
```

### 4) Understand a specific module — `explain`

```text
Please use project-wiki to explain the xxx module: what it is responsible for, what it depends on, whether its boundaries are clear, and separate verified facts, inferences, and items that still need confirmation.
```

### 5) Evaluate a design or boundary — `evaluate`

```text
Please use project-wiki to evaluate whether the current module boundaries are reasonable. Include strengths, risks, assumptions, recommendation, and confidence.
```

### 6) Compare solutions — `compare`

```text
Please use project-wiki to compare solution A and solution B, prioritizing fit analysis based on the current repository's local evidence rather than only giving generic best practices.
```

### 7) Decision support — `decide`

```text
Please use project-wiki to produce a decision memo: state the decision, alternatives considered, why this option, known trade-offs, evidence, and what still needs validation.
```

### 8) Design or build a project wiki — `build_wiki`

```text
Please use project-wiki to design an offline-first wiki structure for this project that works well for individual maintenance first and later team reuse.
```

### 9) Update an existing wiki with lifecycle metadata — `update_wiki`

```text
Please use project-wiki to update the wiki for the recent <module> changes. Output an update_plan plus lifecycle fields (review_status, last_reviewed, retention_class, supersedes if applicable). Wait for my confirmation before writing.
```

### 10) Audit knowledge quality — `audit` mode

```text
Please use project-wiki to audit the current wiki: find weakly supported claims, stale sections, contradictions, missing pages, broken `[[wikilinks]]`, and orphan pages.
```

### 11) Curate the wiki layer — `curate` mode

```text
Please use project-wiki to curate the wiki: tighten page scope, improve cross-references, reduce duplication, and identify high-value pages still missing.
```

### 12) Query the knowledge base with citations — `query`

```text
Please use project-wiki in query mode: answer "<your question>" strictly from the existing wiki pages, attach structured citations (verified_fact / synthesis / open_question), and explicitly mark coverage if the wiki does not cover the question.
```

### 13) Safe write mode

```text
Please first provide the wiki update plan and the target file paths, and wait for my confirmation before writing any actual documents.
```

### 14) Explain with a specified knowledge source priority — `source_guided_explain`

```text
I am building a system for explaining problems, and I have an example library. Please use project-wiki to explain this problem by prioritizing knowledge from the example library and following the example's reasoning style as much as possible.
```

### 15) A more precise source-guided trigger style — `source_guided_explain`

```text
Please use project-wiki to explain this problem based primarily on the example library. Requirements:
1. Find relevant examples first
2. Reuse the analytical steps from the examples whenever possible
3. Supplement with general knowledge only when necessary
4. Clearly distinguish the example-based reasoning from the supplementary explanation
```

## What Outputs You Can Expect

`project-wiki` mainly produces the following outputs:

- **project explanation reports**: explain the project, modules, architecture, and data flow
- **evaluation reports**: evaluate solutions, design, boundaries, risks, and technical debt
- **comparison matrices**: structured comparison of multiple options
- **decision memos**: recommendations, reasons, evidence, and items that still need validation
- **wiki build/update plans**: what pages to create first, how to fill gaps, and how to update existing knowledge
- **knowledge base query responses**: evidence-backed answers with structured citations, coverage assessment, and save-back offers
- **API-ready citation objects**: structured references that frontends can render as links, tooltips, or highlights

## Typical Use Cases

### 1. Taking over an old project
Have it generate:
- a project overview
- an architecture map
- a module index
- glossary pages

### 2. Understanding a complex module
Have it produce around a specific module:
- module responsibility
- dependency relationships
- boundary judgment
- evidence and items needing confirmation

### 3. Technology selection or solution comparison
Have it use local project evidence to produce:
- a trade-off matrix
- a risk explanation
- a recommendation
- items still needing verification

### 4. Newcomer onboarding
Have it generate:
- a 30-minute onboarding knowledge-page skeleton
- a recommended reading order
- key terms and module entry points

### 5. Documentation cleanup and troubleshooting capture
Have it turn scattered materials into:
- troubleshooting pages
- known issues pages
- decision records
- lists of missing documentation

### 6. AI SaaS with knowledge-first answers
When building an AI SaaS product:
- configure `contracts/retrieval-contract.schema.json` as the search interface
- render citations from `contracts/output-contract.schema.json` → `citations` field
- handle offline mode using the degradation sequence in `references/modes-and-safety.md`
- bootstrap new instances with `references/cold-start-protocol.md`

### 7. Problem-explanation / teaching-system scenarios
If you have:
- an example library
- course notes
- solution collections
- your own curated knowledge base

Then you can ask `project-wiki` to:
- prioritize finding relevant content from those local knowledge sources
- prioritize following their explanation order and terminology
- supplement with general knowledge only when needed
- distinguish between “example-based reasoning” and “supplementary explanation”

## Automatic Trigger vs Precise Trigger

### Automatic trigger

If you naturally say things like:
- `I have an example library; prioritize it during explanation`
- `Explain this following my course notes first`
- `Prefer the content in docs/wiki when explaining`
- `If there is a similar example, explain it using the example’s reasoning first`

`project-wiki` should understand that as:
- you specified a primary knowledge source
- you want explanations to prioritize that source
- you may also want the explanation style of that source to be followed

### Precise trigger

If you want more stable behavior, you can say it explicitly:

```text
Please use project-wiki to explain this problem primarily based on the example library, and follow the analytical steps from the example as much as possible.
```

Or:

```text
Please use project-wiki with the course notes set as the primary knowledge source, and prioritize the analysis order used in the notes.
```

## Example Prompts

```text
Please explain the core architecture of this project and identify the 5 most important file or page evidence sources.
```

```text
Please compare two solutions and recommend one based on local project evidence rather than only generic best practices.
```

```text
Please design an offline-first wiki structure for this project that works for individual use first and later team reuse.
```

```text
Please evaluate whether the current module boundaries are reasonable, and separate verified facts, inferences, and items needing confirmation.
```

```text
Please organize the current project materials into a knowledge-page skeleton that allows a newcomer to get started within 30 minutes.
```

```text
I am building a system for explaining problems, and I have an example library. Please use project-wiki to explain this problem by prioritizing knowledge from the example library and following the example’s reasoning style as much as possible.
```

```text
Please use project-wiki to explain this concept primarily based on the course notes, supplementing with general knowledge only when necessary, and keep the two clearly separated.
```

## How to Use It in a Personal Workflow

If you are maintaining a project by yourself, this is a recommended flow:

1. first ask it to explain the project or module
2. then ask it for evaluation / comparison / decision support
3. finally turn the conclusions into wiki pages or an update plan

Recommended page types to create first:
- `overview`
- `module`
- `glossary`
- `troubleshooting`
- `decision`

One-line principle:

> First turn understanding into pages, then turn pages into long-term assets.

## How to Use It in a Small-Team Workflow

For a small team of 2-8 people, the recommended usage is:

- treat it as a “shared explanation layer,” not a task management system
- accumulate recurring questions into stable pages instead of repeatedly explaining them in chat
- use it to organize facts, evidence, options, and risks first, then let humans make the final call
- use it to generate onboarding pages and troubleshooting pages to reduce the cost of oral knowledge transfer

`project-wiki` supports reuse in small teams, but it does **not** try to become:
- Jira / Linear
- a multi-user real-time collaboration platform
- an enterprise knowledge hub

## Runtime and Admin Tools

`project-wiki` includes no-install local runtime helpers for configured target projects:

```bash
node scripts/healthcheck.mjs <target-project>
node scripts/adapter-status.mjs <target-project>
node scripts/source-normalization-import-plan.mjs <target-project>
node scripts/graph-compile-plan.mjs <target-project>
node scripts/export-plan.mjs <target-project>
node scripts/admin.mjs <target-project> --port 0
```

- `healthcheck.mjs` is read-only and reports binding/config/root/write-whitelist state as JSON.
- `adapter-status.mjs` is read-only and reports P4 adapter readiness for RetainPDF-style source normalization, graph artifacts, and export plans without executing adapters.
- `source-normalization-import-plan.mjs` is read-only and turns an explicit RetainPDF-style manifest into a planning-only source normalization import plan without writing a source registry or wiki files.
- `graph-compile-plan.mjs` is read-only and turns P4.1 graph adapter readiness into a P4.3 graph compile plan; it proposes schema profile, source scope, confidence policy, artifact targets, dependency boundary, and confirmation gates without compiling graphs or writing graph artifacts.
- `export-plan.mjs` is read-only and turns P4.1 export adapter readiness plus an explicit export plan into a P4.4 export plan; it proposes source scope, target/profile, output root, dependency boundary, rollback/cleanup, and confirmation gates without installing export dependencies, running publishers, writing export artifacts, uploading, publishing, starting servers/MCP, calling external providers, or treating the plan as execution confirmation.
- `admin.mjs` binds only to `127.0.0.1`, serves a local inspection UI, and uses Node built-ins only.
- P2 inspection routes are read-only: health, summary, tree, items, source/wiki preview, local test query, and existing graph artifact read.
- P3 curation writes are limited to token-protected `preview` / `apply` for append-only `review-queue.json` and `manual-overrides.json` updates, with diff preview, stale-preview checks, backups, write whitelist enforcement, and `admin-log.md`.
- P4.1 adapter readiness adds only status inspection; it does not run OCR, convert PDFs, compile graphs, install dependencies, execute export commands, or write adapter artifacts.
- P4.2 source normalization import planning only classifies existing manifest artifacts and proposes planned registry entries; it does not import, copy, OCR, convert, unzip, or write KB files.
- P4.3 graph compile planning only consumes P4.1 readiness and proposes a graph compile plan; it does not install graph dependencies, run graphify/graph tools, compile graph artifacts, write `graph.json`/`GRAPH_REPORT.md`/cache/html, start servers/MCP, call external providers, or promote inferred/ambiguous relationships to durable facts.
- P4.4 export planning only consumes P4.1 export readiness and an explicit export plan; it does not install export dependencies, run Quartz/static/Obsidian tools, run export commands, generate/write export artifacts, upload/publish, start servers/MCP, call external providers, mutate files, or treat the explicit plan as execution confirmation.
- P4.5 hardens output/retrieval/project-profile contracts and golden cases; doctor guards catch enum drift, P4 deliverable mapping drift, retrieval fallback/clarification gaps, and missing P4 examples/evals metadata.
- It still does not create binding files, install dependencies, import/OCR PDFs, compile graphs, export sites, directly edit raw sources, or provide arbitrary wiki CRUD.

## Core Design Position

`project-wiki` is **wiki-first**.

That means:
- the main product is a maintainable knowledge layer
- retrieval serves page creation, page updates, and evidence-backed answers
- it is not designed to become a repo chatbot that answers everything

## Main Files

### Core runtime files
- `SKILL.md` — main skill
- `references/llm-wiki-core.md` — the LLM Wiki worldview
- `references/local-rag-engineering.md` — local retrieval / RAG engineering support
- `references/project-assistant-playbook.md` — explanation / evaluation / comparison / decision patterns
- `references/modes-and-safety.md` — boundaries for local-first and online/API-enhanced modes, offline SaaS capability boundary
- `references/source-priority-guidance.md` — rules for prioritizing specified local knowledge sources and reusing their explanation style
- `references/system-integration-guidance.md` — how to use it as a platform capability specification, SaaS integration contracts
- `references/wiki-linking.md` — `[[slug]]` cross-reference syntax, backlinks, and orphan detection
- `references/cold-start-protocol.md` — bootstrapping a knowledge base from zero
- `references/adaptive-knowledge-architecture.md` — project-type-specific knowledge structures and confirmation gates
- `references/project-binding-protocol.md` — target-project binding roots, admin roots, source roots, and write whitelist contract
- `references/runtime-architecture.md` — P0/P1/P2/P3/P4 runtime boundaries and no-install helper scripts
- `references/admin-gui-contract.md` — local Admin GUI read/write boundary and P3 curation API contract
- `references/dependency-installation-policy.md` — lazy install policy and confirmation gates
- `references/upstream-reuse-policy.md` — adapter-first reuse policy for upstream tools
- `references/graph-adapter-contract.md` — optional graph artifact planning and confidence labels
- `references/retain-pdf-adapter-contract.md` — optional PDF/OCR normalization artifact contract
- `references/export-adapter-contract.md` — optional static/Obsidian/Quartz export planning contract

### Contracts
- `contracts/output-contract.schema.json` — structured output shapes by task type, including citations
- `contracts/source-policy.schema.json` — source prioritization policies
- `contracts/retrieval-contract.schema.json` — retrieval request/response shapes for SaaS and API contexts
- `contracts/export-plan.schema.json` — P4.4 read-only export planning response shape

### Maintenance and quality files
- `references/evidence-and-citation.md` — lightweight evidence citation guidance, API-facing citation format
- `references/wiki-quality-audit.md` — wiki quality audit rules, link validation, orphan detection
- `references/incremental-update-protocol.md` — incremental update protocol, operation log specification
- `references/knowledge-lifecycle.md` — lightweight knowledge lifecycle vocabulary, version snapshots
- `references/output-quality-standards.md` — minimum output quality standards
- `references/templates/*.md` — page templates (overview, module, decision, glossary, troubleshooting, SCHEMA)
- `examples/*.md` — high-quality usage examples
- `scripts/install.mjs` / `scripts/doctor.mjs` / `scripts/healthcheck.mjs` / `scripts/adapter-status.mjs` / `scripts/source-normalization-import-plan.mjs` / `scripts/graph-compile-plan.mjs` / `scripts/export-plan.mjs` / `scripts/admin.mjs` — installation, self-check, runtime inspection, adapter readiness, import planning, graph compile planning, export planning, and local Admin tools
- `evals/` — lightweight golden cases and rubrics
- `ROADMAP.md` — roadmap

## Usage Style

This skill is designed to be:
- **personal-first** — easy for one person to use
- **small-team friendly** — outputs can be reused by a team
- **local-first** — viable without depending on online services
- **evidence-aware** — important conclusions should be traceable to sources

## Background Reading

The repository ships with two analysis documents at the root level. They are not required reading to use the skill, but they document the reasoning that shaped the current design — useful if you are reviewing this project, forking it, or just want to understand why things are the way they are:

- [`local-kb-admin-gui-and-claude-obsidian-analysis.md`](local-kb-admin-gui-and-claude-obsidian-analysis.md) — analysis of local KB admin GUI patterns and a comparison with the `claude-obsidian` workflow ideas, informing the P2/P3 Admin GUI contract and the v0.7.0 Frontend Playbook.
- [`meta-memory-and-project-wiki-analysis.md`](meta-memory-and-project-wiki-analysis.md) — analysis of long-lived memory/persistence systems and how project-wiki's durable knowledge layer differs from agent-style memory, informing the lifecycle vocabulary and the wiki-vs-RAG positioning.

## License

MIT
