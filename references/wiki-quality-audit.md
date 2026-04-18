# Wiki Quality Audit

Use this audit to inspect whether a project wiki is staying useful over time.

## Page checks

For each page, ask:
- Does it have a clear scope?
- Does it separate verified facts from synthesis?
- Does it include evidence or reference anchors?
- Does it show open questions when certainty is incomplete?
- Does it appear stale or contradicted by newer project reality?
- Is it duplicated elsewhere?
- If lifecycle fields exist, do review_status, last_reviewed, retention_class, confidence_basis, and consolidation_status still match current evidence?
- If supersedes or superseded_by exists, are those links still correct and narrow?

## Typical findings

### Unsupported claim
A strong statement with weak or missing evidence.

### Stale section
A section likely outdated relative to current project structure or overdue for review relative to its stated lifecycle.

### Conflict
Two pages or sources disagree in a meaningful way.

### Missing page
A high-value project topic with no durable page yet.

### Weak page
A page that reads like a summary but is not maintainable knowledge.

### Broken link
A `[[slug]]` reference that does not resolve to an existing page.

### Orphan page
A page with zero incoming `[[slug]]` links from other pages.

### Missing index entry
A page that exists as a file but is not listed in `index.md`.

### Stale log
The operation log (`log.md`) has not been updated after recent wiki changes.

## Suggested output

- page health
- unsupported claims
- stale sections
- conflicts
- missing pages
- lifecycle mismatches
- broken links
- orphan pages
- missing index entries
- stale operation log
- recommended update order
