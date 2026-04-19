# System Integration Guidance

This file explains how Project Wiki should be understood as a capability specification for future products and systems, not only as a chat-facing Claude skill.

## Why this matters

A user may use Project Wiki in two different ways:

1. **Conversation-facing use**
   - asking Claude directly to explain, compare, evaluate, or build wiki pages
2. **System-facing use**
   - embedding the same logic into a product such as:
     - a teaching platform
     - a project explanation system
     - a knowledge-guided assistant
     - a local documentation support engine

Project Wiki should support both, but the deeper value is in the second case:
- it defines how knowledge should be selected, prioritized, and used
- it defines how explanation should stay grounded in local sources
- it defines how outputs should preserve evidence and source boundaries

## Two layers of interpretation

### 1. Trigger layer

This is the Claude-facing layer.
It answers:
- when should the skill activate?
- how can a user ask for it naturally?
- what prompt patterns should map to its behavior?

This layer matters for usability, but it is not the whole point.

### 2. Behavior layer

This is the system-facing layer.
It answers:
- what counts as the primary knowledge source?
- how do we prioritize one source over another?
- when should we fall back from a preferred source?
- how should explanation follow the source's reasoning style?
- how should the system distinguish source-derived reasoning from supplemental reasoning?

This layer is the long-term value of Project Wiki.

## Minimal integration contract

A system using Project Wiki should ideally make the following inputs explicit.

### Suggested input shape

```json
{
  "task_type": "adapt_project | explain | compare | evaluate | decide | build_wiki | source_guided_explain | propose_options",
  "project_state": "cold | partial | mature | unknown",
  "primary_source": "optional named local source",
  "other_local_sources": ["optional local sources"],
  "privacy_mode": "local_only | local_first | hybrid",
  "allow_external": false,
  "style_following": true,
  "interaction_stage": "adapt | clarify | propose | confirm | execute",
  "fallback_order": [
    "primary_source",
    "other_local_sources",
    "general_or_external"
  ]
}
```

### Suggested output shape

```json
{
  "source_derived": [],
  "local_supplement": [],
  "general_supplement": [],
  "confidence": "high | medium | low",
  "gaps": [],
  "conflicts": []
}
```

### Fallback contract

If the primary source is missing or weak:
1. say that coverage is incomplete
2. fall back to other local sources
3. only then use general or external knowledge
4. keep the output transparent about where reasoning came from

## System behavior model

When integrated into a product, Project Wiki should behave like a knowledge-use policy.

### Adaptation-first rule

Before deep synthesis, the system should first:
- classify project type
- assess project/wiki state
- identify candidate primary sources
- decide whether clarification is required
- propose the best-fit route when the target artifact is not yet clear

### Core behavior contract

1. **Identify the task type**
   - explain
   - compare
   - evaluate
   - support decision
   - build/update knowledge pages
   - source-guided explanation

2. **Identify the source policy**
   - is there a preferred local source?
   - is there a stable local wiki/docs layer?
   - should general knowledge be delayed until local sources are exhausted?

3. **Gather evidence in priority order**
   - preferred source first
   - then other local sources
   - then general/external knowledge if still necessary

4. **Choose explanation style**
   - preserve source terminology
   - preserve source decomposition and sequence where useful
   - do not flatten everything into a generic explanation too early

5. **Produce transparent output**
   - source-derived explanation
   - local supplemental explanation
   - general supplemental explanation
   - gaps / uncertainty

## Teaching-system example

Consider a future teaching platform.

User-side intent:
- there is an example bank
- explanations should prioritize that example bank
- the explanation should reuse the example bank's reasoning approach

In a Project Wiki-compatible system, this means:

### Task classification
- task type: source-guided explanation

### Source policy
- primary source: example bank
- secondary source: other local teaching materials
- tertiary source: general knowledge

### Explanation policy
- first retrieve similar examples
- preserve the example bank's solving order if possible
- reuse its terms and decomposition style
- only introduce general explanation when the example bank is insufficient
- keep the distinction visible

### Output policy
- mark which steps come from the example bank
- mark which steps are local supplements
- mark which steps are broader explanatory additions

## Recommended integration pattern

If Project Wiki is used inside a product, the product should treat it as a policy layer for:

- source prioritization
- page-oriented knowledge organization
- evidence-backed explanation
- transparent distinction between fact, synthesis, and supplement
- structured retrieval with coverage assessment
- offline-capable knowledge delivery

It should **not** be reduced to:
- just a prompt template
- just a retrieval chain
- just a vector search wrapper
- just a generic explanation generator

## SaaS integration contracts

When embedding Project Wiki into a SaaS product, use these contracts as the integration surface:

### Retrieval layer
Use `contracts/retrieval-contract.schema.json` for the knowledge base search interface. This defines:
- request shape: query, source filters, retrieval mode, snapshot version
- response shape: hits with metadata, coverage assessment, fallback signal

### Output layer
Use `contracts/output-contract.schema.json` for structured responses. This defines:
- task-type-specific required fields
- citation objects for API responses
- lifecycle metadata for knowledge management

### Source policy layer
Use `contracts/source-policy.schema.json` for configuring source prioritization per tenant or project.

### Offline behavior
See `references/modes-and-safety.md` → "Offline capability boundary for SaaS" for the offline/online degradation contract.

### Cold start
See `references/cold-start-protocol.md` for bootstrapping a new SaaS instance from zero.

## Product-level design heuristic

When building with Project Wiki principles, ask:

1. What is the primary local source of truth?
2. What is the durable page structure?
3. What is the correct fallback order?
4. How should explanation preserve source style?
5. How will outputs stay transparent about where reasoning came from?
6. What happens when the AI API is unavailable?
7. How are citations rendered in the frontend?

If a system cannot answer those questions, it is probably not really using Project Wiki — it is just using retrieval.
