# Knowledge Lifecycle

Project Wiki treats knowledge as durable but revisable.

The goal is to keep pages useful over time without turning the system into a heavy platform.

## Lifecycle vocabulary

### `review_status`
Shows the current maintenance state of a page, section, or knowledge object.

Recommended values:
- `draft` — useful but not yet reviewed against enough evidence
- `reviewed` — checked against current evidence and acceptable for reuse
- `needs_review` — still valuable, but likely stale, conflicted, or weakly supported
- `archived` — kept for history or context, not for default reuse

### `last_reviewed`
The most recent date when the item was explicitly checked against current evidence.

Use a simple machine-readable date when possible.

### `retention_class`
Explains how long the knowledge should remain active in normal use.

Recommended values:
- `working` — active operational knowledge that may change often
- `reference` — stable knowledge worth keeping for repeated reuse
- `historical` — older context kept mainly for lineage, audits, or decisions
- `ephemeral` — short-lived notes that should be consolidated or removed later

### `confidence_basis`
A short explanation of why the stated confidence level is justified.

Examples:
- `confirmed by current code paths and tests`
- `based on docs plus one implementation sample`
- `derived from partial local evidence with unresolved gaps`

### `supersedes` / `superseded_by`
Lightweight links between older and newer knowledge objects.

Use them when:
- a page replaces an outdated page
- a decision note replaces an earlier recommendation
- a troubleshooting note is replaced by a cleaner canonical fix

Do not use them for ordinary related links.

### `consolidation_status`
Shows whether a knowledge object is already in durable page form.

Recommended values:
- `raw` — still mostly source-shaped notes or fragments
- `curated` — cleaned up and structured, but may still be fragmented
- `crystallized` — durable, reusable wiki knowledge

### `crystallized_from`
Points to the raw notes, update notes, issue threads, or source bundles that were turned into a durable page or section.

Use it when a stable knowledge object emerged from scattered material.

## Practical rules

- Keep lifecycle metadata lightweight and human-readable.
- Add lifecycle fields only when they improve maintenance or reuse.
- Prefer explicit review state over vague freshness claims.
- Prefer narrow supersession links over broad rewrite history.
- Keep source priority unchanged: current local evidence still outranks generic knowledge.
- Keep wiki-first unchanged: lifecycle metadata supports pages; it does not replace them.

## Suggested defaults

For many project wiki pages, reasonable defaults are:
- `review_status`: `draft` or `reviewed`
- `retention_class`: `reference`
- `consolidation_status`: `crystallized`

For temporary synthesis notes or update plans, reasonable defaults are:
- `review_status`: `draft`
- `retention_class`: `ephemeral`
- `consolidation_status`: `curated`

## When to update lifecycle fields

Update lifecycle metadata when:
- a page is explicitly reviewed
- new evidence materially changes a conclusion
- one page or note replaces another
- a temporary note is consolidated into a durable page
- a previously reliable page becomes stale enough to require review

## What lifecycle metadata should not do

It should not:
- force a database-style workflow
- require graph infrastructure
- replace evidence links
- hide uncertainty behind formal-looking labels
- encourage broad rewrites when a small update is enough
