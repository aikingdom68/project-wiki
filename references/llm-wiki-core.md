# LLM Wiki Core

This file captures the core worldview that Project Wiki borrows from the LLM Wiki pattern.

## Page-first workflow

Project Wiki should prefer page-first work:

1. identify the page type being created or improved
2. gather local evidence for that page
3. write or revise only the relevant sections
4. mark unsupported claims as open questions
5. preserve links to related pages or future updates

A page-first workflow keeps the skill from becoming a generic chat interface.

## The central idea

Most document workflows stop at retrieval: search raw materials at question time, retrieve relevant chunks, and generate an answer.

LLM Wiki changes the center of gravity:

- raw materials stay as the evidence layer
- a persistent wiki becomes the working knowledge layer
- the schema defines how the knowledge layer should evolve

The point is not only to answer today's question. The point is to lower the cost of understanding tomorrow.

## Three layers

### 1. Raw sources

These are the source-of-truth materials:
- code
- docs
- notes
- architecture files
- ADRs
- transcripts
- user-provided materials

Rules:
- treat them as evidence
- do not silently rewrite them into “truth” without traceability
- preserve source paths and timestamps where possible

### 2. Wiki layer

This is the durable project knowledge layer.

Typical page types:
- project overview
- architecture map
- module pages
- glossary
- decision records
- troubleshooting pages
- open questions

Rules:
- pages must be readable
- pages must be maintainable
- pages must link back to evidence
- pages should be incrementally updatable
- pages may carry lightweight lifecycle fields such as review_status, last_reviewed, retention_class, consolidation_status, and supersession links when those fields improve maintenance clarity

### 3. Schema layer

This defines how the wiki is organized and maintained.

Schema answers questions like:
- what page types exist?
- what belongs on each page?
- how do updates happen?
- how are evidence and uncertainty represented?
- how do we distinguish fact, synthesis, and open questions?

## The ingest / query / lint loop

### Ingest

When new material arrives:
- identify what it changes
- decide which page(s) it belongs to
- add or update evidence-backed knowledge
- mark unresolved ambiguity instead of smoothing it over

### Query

When answering a project question:
- prefer reading the knowledge layer first
- pull raw evidence when needed
- use answers to strengthen or refine the wiki when appropriate

### Lint

Periodically inspect the knowledge layer for:
- unsupported claims
- stale sections
- contradictions
- missing page types
- weak evidence density
- pages that no longer match project reality

## SCHEMA.md

Every wiki should have a `SCHEMA.md` at its root that anchors the wiki for both human readers and automated tools.

It should record:
- wiki root path (so tools know where to find pages)
- page naming convention
- link syntax (`[[slug]]` wiki-links)
- page types in use
- lifecycle field defaults

For SaaS contexts, `SCHEMA.md` is the entry point that the retrieval layer reads first to understand the knowledge base structure.

## Index and log

A wiki becomes more usable when it has:

### `index.md`
A navigational catalog listing every page with a one-line summary and optional tags.

Rules:
- one line per page
- update whenever pages are created, renamed, or deleted
- supports lightweight retrieval: scan the index first to find candidate pages before reading full content

### `log.md`
An append-only operation log showing what changed, when, and why.

Rules:
- never edit or delete existing entries
- append new entries at the top
- use `[[slug]]` wiki-links for page references
- see `references/incremental-update-protocol.md` for the entry format

For a project-oriented wiki, this does not need to be heavy. The important thing is that change is legible.

## What valuable answers should do

A good answer should not always vanish into chat history.

When an answer reveals durable understanding, it should be a candidate to become:
- a new page
- a new section
- an update to an existing page
- a new open question
- a new decision note

## What this pattern is not

It is **not**:
- a generic vector database product
- a one-off summary generator
- a promise that retrieval can be skipped
- a replacement for evidence

Retrieval still matters. The difference is that retrieval supports a durable knowledge layer instead of being the only product surface.

## Practical interpretation for Project Wiki

For Project Wiki, the LLM Wiki pattern means:

- build pages that help real project work
- retrieve evidence to support those pages
- keep knowledge durable and revisable
- make the project easier to explain, evaluate, compare, and evolve over time
