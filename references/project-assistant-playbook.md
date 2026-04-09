# Project Assistant Playbook

This file defines the high-value assistance patterns for Project Wiki.

The skill is useful when project knowledge must support real work, not just answer isolated questions.

## Recommended interaction loop

For best results, use this loop:

1. **Explain** — understand the project, module, or decision area.
2. **Evaluate** — identify strengths, risks, assumptions, and missing evidence.
3. **Compare** — contrast realistic options against local project constraints.
4. **Decide** — produce an evidence-aware recommendation or decision memo.
5. **Persist** — turn the useful result into a wiki page, update note, or open question.

Do not jump straight to final recommendations when the project evidence is not yet mapped.

## 1. Explain a project or subsystem

Use this when the user needs understanding.

Typical outputs:
- project overview
- architecture explanation
- module explanation
- data-flow explanation
- onboarding summary

Good structure:
- what it is
- why it exists
- key components
- how they connect
- evidence
- open questions

## 2. Evaluate a design or implementation path

Use this when the user needs judgment.

Typical outputs:
- evaluation report
- risk summary
- architecture fit analysis
- technical debt assessment

Good structure:
- question being evaluated
- evidence available
- strengths
- weaknesses
- assumptions
- recommendation
- confidence

## 3. Compare alternatives

Use this when the user is choosing among options.

Typical outputs:
- trade-off matrix
- migration comparison
- library choice memo
- implementation path comparison

Good structure:
- option
- local fit
- complexity
- maintainability
- performance / scale implications
- evidence
- recommendation

## 4. Support decisions

Use this when the user wants a conclusion that can survive future review.

Typical outputs:
- decision memo
- ADR-like summary
- “why this option” note
- unresolved validation checklist

Good structure:
- decision statement
- context
- alternatives considered
- why this option
- trade-offs
- evidence
- what still needs validation

## 5. Build or update project knowledge pages

Use this when the user wants durable knowledge rather than one-off answers.

High-value page types for MVP:
- overview
- module
- decision
- glossary
- troubleshooting

Page design rule:
- every page must have a clear scope
- every important section should be evidence-backed where possible
- every page should be revisable, not treated as immutable prose

## 6. Onboarding and team reuse

This skill is personal-first, but small-team-friendly.

That means:
- outputs should be understandable by one person working alone
- outputs should also be reusable by teammates later
- pages should read like portable project knowledge, not private scratch notes

## 7. Fact / synthesis / uncertainty discipline

Always separate:

### Verified facts
Directly supported by local evidence.

### Synthesis
Interpretation built from multiple pieces of evidence.

### Open questions
Important unknowns that still block certainty.

This separation is essential for explanation, evaluation, and decisions.

## 8. Good outcome test

A good Project Wiki result should help a future reader do one of these faster:
- understand the project
- compare options
- make a decision
- update a page
- recover project context after time away

If the output does not improve one of those, it is probably too weak or too generic.
