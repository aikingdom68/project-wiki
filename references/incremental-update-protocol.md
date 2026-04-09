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
