# Adaptive Knowledge Architecture

Project Wiki should not force every project into one fixed wiki or memory layout.

The job of Adapt is to classify the project, propose the smallest useful knowledge architecture, and confirm key structure decisions with the user before locking them in.

## Core rule

Use evidence first, then propose structure, then ask for confirmation at key decision points.

Do not silently choose the final chapter tree, top-level wiki headings, source policy, or write plan when those choices affect future retrieval or durable project knowledge.

## Adaptation loop

```text
Local evidence
  ↓
Project / corpus type guess
  ↓
Candidate knowledge architecture
  ↓
User confirmation at key nodes
  ↓
Read-only output or confirmed wiki update
```

If the project type, source authority, or target structure is unclear, stop at a proposal and ask. Do not pretend the structure is settled.

## Project type signals

Use local materials and user intent together.

| Project / corpus type | Common local signals | Best-fit structure |
|---|---|---|
| Small project | few files, no stable docs, narrow scope | `overview`, `decisions`, `troubleshooting` |
| Software repo | `src/`, tests, configs, APIs, modules | overview, module pages, decisions, runtime evidence |
| Teaching system | lessons, examples, errors, glossary, textbook/PDF/OCR | chapters, topics, examples, common errors, detail index, source evidence |
| Document corpus | PDFs, notes, source lists, citations | catalog, topic summaries, source pages, citations |
| Product/support KB | FAQ, tickets, customer issues, logs | issue categories, approved answers, cases, unresolved feedback |
| AI knowledge app | catalog, retrieval configs, source policies, output contracts | source catalog, retrieval contract, output contract, feedback loop |
| Mixed project | multiple strong source types | hybrid structure with named branches, not one forced template |

## Confirmation gates

Ask the user before crossing these gates unless the user already gave an explicit structure.

1. **Project type gate** — when multiple project types fit.
2. **Source authority gate** — when it is unclear whether code, docs, textbook, examples, or user-supplied material should lead.
3. **Architecture gate** — before choosing the final wiki/KB layout.
4. **Taxonomy gate** — before locking chapter names, topic groups, top-level headings, or category trees.
5. **Retrieval policy gate** — before deciding whether details should be found by direct search, indexes, hybrid retrieval, or API synthesis.
6. **Mutation gate** — before creating, renaming, rewriting, or deleting files.

A good gate question is small and concrete:

```text
I found evidence for a teaching-system structure. Do you want the main navigation to follow the textbook chapters, the existing topic pages, or a hybrid of both?
```

A bad gate question is vague:

```text
What should I do with the knowledge base?
```

## Choosing structure without overfitting

Prefer source-preserving structure before AI-invented structure.

Candidate layout evidence order:

1. original table of contents, course outline, or source order
2. maintained local wiki or knowledge pages
3. existing examples, error collections, glossary, or tags
4. repeated user workflows and query types
5. AI clustering suggestions, labeled as provisional

Finalization rule: before treating any chapter/topic layout as authoritative, ask for user confirmation.

AI may propose headings, but it should not silently make them authoritative.

## Teaching knowledge bases

Teaching KBs are different from agent memory.

Do not demote low-frequency curated knowledge just because it is rarely asked. A detail that is rare may still be exactly what a student needs.

For teaching systems, protect fine-grained retrieval with multiple paths:

```text
chapter index       → where this appears in the course or textbook
topic index         → what concept it teaches
example index       → which examples or exercises demonstrate it
common-error index  → what mistakes or symptoms connect to it
detail index        → aliases, small questions, terms, symbols, edge cases
source evidence     → original PDF/OCR/page/example citation
```

The evidence/material layer is not a low-value archive. It is the proof layer that lets answers trace back to the original course material.

## Software repositories

For software repos, runtime evidence usually outranks stale prose.

Prefer:

```text
source code / tests / configs
  → maintained docs and ADRs
  → generated wiki pages
  → external best practice only as labeled supplement
```

When proposing module pages, confirm module boundaries if the codebase has several plausible decompositions.

## Mixed projects

Mixed projects should use a router rather than one universal layout.

Example:

```text
Teaching branch      → topics, examples, errors, detail index
Runtime branch       → architecture, modules, configs, tests
Knowledge-app branch → catalog, retrieval policy, output contract
Feedback branch      → unresolved questions, candidate improvements
```

Ask the user which branch is primary for the current task before making durable edits.

## Output pattern

When using this reference, show:

- observed project/corpus signals
- likely project type and confidence
- 2-3 candidate structures when uncertain
- recommended structure and why
- confirmation question for any key gate
- what will remain read-only until confirmed

## Good vs bad

Good:

> “This looks like a teaching knowledge base with original textbook evidence. I recommend a hybrid chapter/topic/error/detail structure. Before I lock the top-level chapters, should they follow the textbook table of contents or the existing `topics.md` order?”

Bad:

> “I created a new chapter tree from my own summary and rewrote the wiki around it.”

Difference: good behavior keeps human control over durable structure; bad behavior lets AI-invented headings become the retrieval backbone without confirmation.
