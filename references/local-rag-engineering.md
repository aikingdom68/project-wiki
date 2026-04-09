# Local RAG Engineering

This file captures the local RAG engineering patterns that support Project Wiki.

The goal is not to turn the skill into a generic RAG system. The goal is to use retrieval well enough to support durable project knowledge.

## Project Wiki retrieval loop

Use retrieval to support page work:

1. define the page or decision being supported
2. retrieve the narrowest useful evidence
3. expand to parent context when the narrow hit is not enough
4. check whether evidence coverage is strong enough
5. write synthesis only after evidence is adequate

If the result cannot map back to a page, decision, or evidence bundle, it is probably too chat-like for this skill.

## Core rule

Use the lightest retrieval strategy that is sufficient.

Do not introduce RAG machinery when direct reading is enough.

## 1. Structure-aware chunking beats naive chunking

When the corpus is large enough to justify retrieval indexing, prefer structure-aware boundaries:

- headings
- modules
- files
- classes
- functions
- config blocks
- section titles
- code comments near the relevant logic

Good practice:
- preserve section paths
- preserve file paths
- preserve document types
- preserve update timestamps when available

Bad practice:
- blindly splitting by length first
- discarding the structure that humans use to navigate the project

## 2. Parent-child retrieval

A strong local pattern is:
- retrieve small units for precision
- expand to larger parent units for explanation quality

Examples:
- child: a section, function, or focused chunk
- parent: the larger file section, module page, or chapter-level context

Why this matters:
- small units help exact retrieval
- larger parent context helps avoid shallow or misleading explanations

## 3. Small retrieval, larger context

For project explanation and evaluation:
- retrieve narrowly
- explain with enough surrounding structure

This reduces the risk of quoting a correct line but missing the real module boundary, dependency, or intent around it.

## 4. Hybrid retrieval

When queries mix exact terms and broader intent, combine:
- lexical retrieval for exact names, APIs, file paths, and terminology
- semantic retrieval for intent, paraphrase, and conceptual similarity

Use hybrid retrieval when:
- users mix product language with code language
- exact naming matters
- semantic intent also matters

Do not force hybrid retrieval when a direct file lookup is already enough.

## 5. Metadata matters

Every useful retrieval unit should carry metadata when possible:
- file path
- section path
- symbol name
- document type
- module or subsystem tag
- language
- timestamp or version marker
- source category

Metadata is what lets retrieval support evaluation and decision support rather than only surface text.

## 6. Retrieval-first evaluation

Before trusting synthesis, ask retrieval questions first:

- did we retrieve the right evidence?
- did we retrieve enough evidence?
- is the evidence too redundant or too narrow?
- are we missing key parent context?
- are we relying on one weak source when the question needs multiple sources?

A fluent answer built on weak retrieval is still weak.

## 7. Index persistence and refresh

For larger local corpora, index persistence is useful.

Good practice:
- persist indexes for reuse
- refresh only what changed
- use file hash / path / timestamp concepts to detect stale index entries
- separate raw source tracking from higher-level knowledge pages

## 8. Direct read vs RAG decision ladder

### Use direct read / search when:
- the question targets a known file or small set of files
- the corpus is small
- the answer depends on exact code or config
- the user mainly needs evidence, not abstraction

### Use lightweight indexed retrieval when:
- the project corpus is broad enough that manual reading becomes inefficient
- the same categories of questions recur
- structure-aware retrieval can save time without hiding evidence

### Use richer local RAG patterns when:
- the corpus is large
- questions require cross-document context
- parent-child retrieval or hybrid retrieval clearly improves evidence gathering

## 9. What retrieval is for in Project Wiki

Retrieval should help:
- page creation
- page update
- evidence gathering
- contrast between alternatives
- explanation grounding
- confidence estimation

Retrieval should not become the whole product.

If the output is only “top-k chunks”, the skill has not yet done its real job.
