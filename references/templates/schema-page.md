# SCHEMA.md Template

## Wiki root

The wiki root path for this project.

```
docs/wiki/
```

## Page naming convention

- Lowercase filenames with hyphens: `auth-session.md`, `cache-strategy.md`
- Decision records use date prefix: `2026-04-01-cache-strategy.md`
- Module pages go under `modules/`
- Decision records go under `decisions/`

## Link syntax

Use `[[slug]]` wiki-links for cross-references between pages.

- `[[auth-session]]` resolves to `modules/auth-session.md`
- `[[glossary]]#refresh-token` resolves to `glossary.md`, section "refresh-token"
- Slug matches the filename without extension

## Evidence citation format

```
Evidence:
- source_path -> section_or_symbol: why it matters
```

For API-facing citations, use the structured citation object format defined in the skill's `references/evidence-and-citation.md`.

## Page types

- `overview` — project-level summary
- `module` — subsystem or component description
- `decision` — ADR-style decision record
- `glossary` — terminology with local meaning
- `troubleshooting` — symptoms, causes, and fixes

## Lifecycle field defaults

- `review_status`: `draft` for new pages, `reviewed` after explicit check
- `retention_class`: `reference` for most pages
- `consolidation_status`: `crystallized` for stable pages

## Index and log

- `index.md` — page catalog, one line per page with summary and tags
- `log.md` — append-only operation log, newest entries at top
