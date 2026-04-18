# Evidence and Citation

Project Wiki uses lightweight evidence-backed writing.

## Minimum rule

Important conclusions should point to explicit evidence.

## Recommended structure

### Evidence
- file path or source identifier
- section, symbol, or sub-area if known
- why this evidence matters

### Verified fact
A statement directly supported by the evidence.

### Synthesis
A higher-level interpretation that combines multiple pieces of evidence.

### Open question
A gap, ambiguity, or unresolved conflict.

## Minimal example

```md
Evidence
- src/auth/session.ts -> validateSession(): session validation entry
- docs/architecture.md -> Request Lifecycle

Verified fact
- Requests pass through session validation before the main handler.

Synthesis
- Session validation is centralized rather than repeated in each route.

Open questions
- No evidence yet for refresh-token invalidation flow.
```

## API-facing citation format

When Project Wiki outputs are served through a SaaS API, citations must be structured for frontend rendering.

### Citation object shape

```json
{
  "id": "cite-1",
  "anchor_text": "the claim or statement being cited",
  "source_id": "kb-auth-session",
  "source_title": "Authentication - Session Management",
  "source_path": "knowledge_base/auth/session.md",
  "section_path": "Session Management > Validation Flow",
  "snippet": "the relevant passage from the source document",
  "confidence": "verified_fact | synthesis | open_question"
}
```

### Inline citation markers

API responses should support inline markers that frontends can render as links, tooltips, or highlights:

```
Session validation is centralized[^cite-1], not repeated per route[^cite-2].
```

The `[^cite-N]` marker maps to the citation object with the matching `id`.

### Citation rules for API responses

- Every claim sourced from the knowledge base must have at least one citation
- Citations must distinguish `verified_fact` from `synthesis` from `open_question`
- When a claim has no knowledge base evidence, it must be marked as `general_supplement` with no citation (not a fake citation)
- The `snippet` field should be short enough for a tooltip (under 200 characters) but long enough to verify the claim
- The `source_path` must be a resolvable path within the knowledge base, not a generated description

### Offline citation behavior

When operating in offline mode without an AI API:
- citations still work because they point to local knowledge base files
- the answer text may be less synthesized (closer to direct retrieval), but citations remain fully functional
- if no relevant source is found, the response must say so rather than generating an uncited answer

## Usage rule

Do not write polished conclusions without at least one visible evidence anchor when the task depends on local project truth.
