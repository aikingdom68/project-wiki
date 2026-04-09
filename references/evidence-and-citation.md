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

## Usage rule

Do not write polished conclusions without at least one visible evidence anchor when the task depends on local project truth.
