# Output Quality Standards

This file defines the minimum quality bar for Project Wiki outputs.

## Global quality rules

All high-value outputs should:
- stay grounded in local evidence when the task depends on project truth
- separate verified facts from synthesis
- expose meaningful gaps rather than smoothing them over
- avoid generic advice when local constraints matter
- remain reusable as pages, plans, or structured project knowledge
- use lifecycle fields only when they clarify maintenance state, confidence basis, retention, consolidation, or supersession

## Quality thresholds by output type

### Project Explanation Report
Minimum quality:
- at least 2 evidence anchors when the project is non-trivial
- at least 1 explicit open question when certainty is incomplete
- must describe both structure and purpose, not only file names

### Evaluation Report
Minimum quality:
- recommendation must be tied to evidence
- assumptions must be explicit
- confidence must not be high if evidence is narrow or conflicting

### Comparison Matrix
Minimum quality:
- at least 2 options
- each option must have evidence or an explicit note that evidence is weak
- recommendation must include assumptions and unresolved risks

### Decision Memo
Minimum quality:
- must show alternatives considered
- must show known trade-offs
- must show what still needs validation

### Wiki Build / Update Plan
Minimum quality:
- must name page types or target files
- must identify evidence sources
- must state why the proposed pages are high value
- should note lifecycle implications when relevant, such as review_status, retention_class, consolidation_status, or supersession

### Knowledge Base Query Response
Minimum quality:
- answer must cite at least one specific wiki page or section
- citations must use structured format with source_path and confidence
- knowledge-base-sourced reasoning must be visibly separated from supplemental reasoning
- coverage assessment must be present (high / medium / low)
- when coverage is low, must state the gap before falling back to general knowledge
- must not modify any wiki files (query is read-only)
- for SaaS API responses, citations must follow the API-facing format from `references/evidence-and-citation.md`

## Source-guided explanation quality
When explanation is guided by a preferred local source:
- the primary source should visibly shape the explanation order
- the answer should distinguish source-derived reasoning from supplemental reasoning
- if the source conflicts with project reality, the conflict must be explicit
- if the source has weak coverage, the fallback must be visible

## Anti-patterns

### Bad
- fluent but ungrounded explanation
- recommendation without assumptions
- comparison with no real evidence
- source-priority requested but ignored in final explanation
- conflicts silently flattened

### Good
- evidence-backed explanation with visible gaps
- recommendation tied to local fit and assumptions
- source-guided reasoning that still remains transparent about supplements
