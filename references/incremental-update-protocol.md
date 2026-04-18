# Incremental Update Protocol

Project Wiki should prefer narrow, traceable updates.

## What should trigger an update

- a module boundary changes
- a design decision changes
- a troubleshooting pattern becomes repeatable
- project docs/wiki drift from current code or runtime behavior
- new local evidence changes an existing conclusion

## Update order

Prefer updating in this order:
1. impacted module or decision pages
2. overview if the project mental model changed
3. glossary if terminology shifted
4. troubleshooting if the change affects repeated failure patterns

## Update note

A good incremental update should record:
- what changed
- why it changed
- what evidence caused the update
- which pages are impacted
- what is still unresolved
- whether review_status, last_reviewed, or consolidation_status should change
- whether the update supersedes an older page, note, or conclusion

## Operation log (`log.md`)

Every knowledge base mutation must be recorded in `docs/wiki/log.md` as an append-only log.

### Log entry format

```markdown
## YYYY-MM-DD HH:MM — <action>

- **Action**: created | updated | deleted | renamed | superseded
- **Pages affected**: [[page-slug-1]], [[page-slug-2]]
- **Reason**: brief explanation of why this change happened
- **Evidence**: what triggered the update (file path, user request, audit finding)
```

### Rules

- Never edit or delete existing log entries
- Always append new entries at the top of the file
- Keep each entry concise (3-6 lines)
- Use wiki-link syntax for page references so the log is navigable

### Why the log matters

- Provides a readable audit trail for knowledge base changes
- Helps identify when and why a page drifted from project reality
- Supports SaaS features like "show recent knowledge base changes"
- Enables rollback decisions when an update introduces errors

## Lightweight lifecycle handling

When an update materially changes the knowledge layer:
- refresh `last_reviewed` if the page was explicitly checked
- set `review_status` to `needs_review` when evidence is conflicting or incomplete
- use `confidence_basis` to explain why confidence changed
- use `supersedes` / `superseded_by` only when one durable knowledge object clearly replaces another
- use `crystallized_from` when temporary notes or evidence bundles become a stable page or section
- keep retention decisions lightweight; use `retention_class` only when it helps future maintenance
