# project-wiki

> Language note: this is the English default README. For the Chinese version, see [README.zh-CN.md](README.zh-CN.md).

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

Or invoke it directly as a slash skill:

```text
/project-wiki Please design an offline-first wiki structure for this project.
```

By default, it is best used inside your target project directory so Claude can read the current project files as local evidence.

Note: although the skill declares browser capability, the default posture is still **local-first**. Unless you explicitly authorize it, or you truly need public external facts, private project content should not be sent to online search or external APIs.

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

Note: this `doctor` command is primarily for **repository integrity / installation file completeness checks**. It helps confirm that the skill file set is complete, but it is not a substitute for real prompt testing.

## Use It as a Platform Capability

`project-wiki` is not only a skill for Claude conversations.

It can also be understood as a **system capability specification** for platforms you may build later, such as:

- problem explanation platforms
- teaching/explanation systems
- project explanation systems
- local-knowledge-driven explanation engines

In this kind of setting, `project-wiki` does not define “how the user should write the prompt,” but instead defines:

- how the system identifies the primary knowledge source
- how the system decides source priority
- how the system organizes explanations according to source logic
- how the system distinguishes example-based reasoning, local supplementary explanation, and general supplementary knowledge
- how the system should explicitly resolve conflicts between knowledge sources

This is especially important if you are building a problem-explanation platform:

- an example library can be the primary knowledge source
- the system should prioritize the example library during explanation
- the system should try to follow the example library’s analysis order, terminology, and problem-solving rhythm
- if the example library is insufficient, the system should supplement with other local materials, and only then with general knowledge
- if the example library conflicts with the current project implementation or the project docs/wiki, the conflict should be marked explicitly instead of being silently blended into one answer

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

## When Not to Use It

Do not use it when you only need to:

- look up one symbol, one file, or one config item
- create a one-off summary without accumulating knowledge
- do ordinary search without needing project knowledge structure
- do external market research instead of organizing local project knowledge

## Competitive Advantages

- **Compared with pure RAG**: pure RAG usually focuses on retrieving relevant chunks and answering the current question; `project-wiki` focuses on turning high-value understanding into durable pages so knowledge accumulates over time instead of being re-retrieved and re-generated every time.
- **Compared with Repo Chat / repository Q&A**: Repo Chat is more oriented toward immediate Q&A; `project-wiki` emphasizes evidence, page structure, gaps, decision context, and update paths, making it better suited to project explanation, design evaluation, trade-off analysis, onboarding, and troubleshooting capture.
- **Compared with static wikis or generic document repositories**: traditional documentation is good at storing content; `project-wiki` emphasizes source priority, separation between facts and synthesis, explicit conflict handling, and continuous maintenance of a project knowledge layer instead of just accumulating documents.
- **Compared with generic AI memory or note-taking products**: generic tools often optimize for personal recording or free retrieval; `project-wiki` is more opinionated about project context, primary knowledge source priority, and only cautiously falls back to general knowledge when local evidence is insufficient.
- **Compared with cloud-first or external-index-first products**: many products assume content is sent to external indexes or online services; `project-wiki` is **local-first** by default, making it a better fit for private repositories, sensitive materials, and offline-oriented workflows.
- **Compared with one-off summary tools**: one-off summaries go stale easily; `project-wiki` now also supports lightweight lifecycle semantics such as `review_status`, `supersedes`, `retention_class`, and `consolidation_status`, making it better suited for long-term maintenance.

One-line summary:

> Pure RAG is about “retrieving the right chunk,” Repo Chat is about “ask now, answer now,” and `project-wiki` is about turning project knowledge into a durable, evidence-backed, reusable working layer.

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

If you are using `project-wiki` for the first time, you can start directly with the following request types.

### 1) Understand the project first

```text
Please use project-wiki to explain this project's core goals, major modules, and key dependency relationships, and list the 5 most important evidence files.
```

### 2) Understand a specific module

```text
Please use project-wiki to explain the xxx module: what it is responsible for, what it depends on, whether its boundaries are clear, and separate verified facts, inferences, and items that still need confirmation.
```

### 3) Compare solutions

```text
Please use project-wiki to compare solution A and solution B, prioritizing fit analysis based on the current repository’s local evidence rather than only giving generic best practices.
```

### 4) Design a project wiki

```text
Please use project-wiki to design an offline-first wiki structure for this project that works well for individual maintenance first and later team reuse.
```

### 5) Safe write mode

```text
Please first provide the wiki update plan and the target file paths, and wait for my confirmation before writing any actual documents.
```

### 6) Explain with a specified knowledge source priority

```text
I am building a system for explaining problems, and I have an example library. Please use project-wiki to explain this problem by prioritizing knowledge from the example library and following the example’s reasoning style as much as possible.
```

### 7) A more precise trigger style

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

### 6. Problem-explanation / teaching-system scenarios
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
- `references/modes-and-safety.md` — boundaries for local-first and online/API-enhanced modes
- `references/source-priority-guidance.md` — rules for prioritizing specified local knowledge sources and reusing their explanation style
- `references/system-integration-guidance.md` — how to use it as a platform capability specification

### Maintenance and quality files
- `contracts/*.json` — source policy and output contracts
- `references/evidence-and-citation.md` — lightweight evidence citation guidance
- `references/wiki-quality-audit.md` — wiki quality audit rules
- `references/incremental-update-protocol.md` — incremental update protocol
- `references/knowledge-lifecycle.md` — lightweight knowledge lifecycle vocabulary and maintenance semantics
- `references/output-quality-standards.md` — minimum output quality standards
- `references/templates/*.md` — page templates
- `examples/*.md` — high-quality usage examples
- `scripts/install.mjs` / `scripts/doctor.mjs` — installation and self-check tools
- `evals/` — lightweight golden cases and rubrics
- `ROADMAP.md` — roadmap

## Usage Style

This skill is designed to be:
- **personal-first** — easy for one person to use
- **small-team friendly** — outputs can be reused by a team
- **local-first** — viable without depending on online services
- **evidence-aware** — important conclusions should be traceable to sources

## License

MIT
