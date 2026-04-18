# Wiki Linking

This file defines the cross-reference and linking conventions for Project Wiki pages.

## Why linking matters

A wiki without links is a folder of documents. Links turn isolated pages into a navigable knowledge graph where related concepts, decisions, and modules connect visibly.

For SaaS contexts, links also serve as structured navigation data that a product frontend can render as clickable cross-references.

## Link syntax

Use `[[slug]]` wiki-link syntax for cross-references between wiki pages.

Examples:
- `[[auth-session]]` links to the session management module page
- `[[adr-0003-cache-strategy]]` links to a decision record
- `[[glossary]]#term-name` links to a specific glossary entry

### Slug rules

- lowercase
- hyphens instead of spaces
- no file extension in the link
- match the target page filename without `.md`

Example: a page at `docs/wiki/modules/auth-session.md` is linked as `[[auth-session]]`.

## Related Pages section

Every wiki page should include a `## Related Pages` section at the bottom (before Lifecycle), listing the most important cross-references:

```markdown
## Related Pages

- [[auth-session]] — session validation depends on this module
- [[adr-0003-cache-strategy]] — cache invalidation decision that affects this flow
- [[glossary]]#refresh-token — local definition of refresh token
```

## Backlinks

A backlink is a reverse reference: if page A links to page B, then B has a backlink from A.

### Backlink index

For SaaS or larger wikis, maintain a backlink index at `docs/wiki/_backlinks.json`:

```json
{
  "auth-session": ["overview", "adr-0003-cache-strategy", "troubleshooting-auth"],
  "glossary": ["auth-session", "overview"]
}
```

This index:
- supports navigation in product frontends
- helps wiki-lint detect orphan pages (zero backlinks)
- helps wiki-quality-audit find under-connected knowledge

### When to rebuild

Rebuild the backlink index when:
- a new page is created
- pages are renamed or deleted
- a wiki-lint or audit pass runs

## Orphan detection

A page with zero incoming links may indicate:
- the page is new and not yet woven into the wiki
- the page covers a topic that no other page relates to
- the page is stale or unnecessary

Wiki-lint should flag orphan pages as a low-severity finding for review.

## Link validation

During wiki-quality-audit or doctor checks:
- verify that every `[[slug]]` target has a corresponding `.md` file
- flag broken links as errors
- flag orphan pages as warnings
