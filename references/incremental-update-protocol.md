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

## Lightweight lifecycle handling

When an update materially changes the knowledge layer:
- refresh `last_reviewed` if the page was explicitly checked
- set `review_status` to `needs_review` when evidence is conflicting or incomplete
- use `confidence_basis` to explain why confidence changed
- use `supersedes` / `superseded_by` only when one durable knowledge object clearly replaces another
- use `crystallized_from` when temporary notes or evidence bundles become a stable page or section
- keep retention decisions lightweight; use `retention_class` only when it helps future maintenance
