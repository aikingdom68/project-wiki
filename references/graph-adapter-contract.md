# Graph Adapter Contract

Graph support is an optional future adapter. It should not be treated as required for every project-wiki knowledge base.

## P0 Boundary

P0 may propose graph schema and artifacts. It must not compile graphs, install graph tooling, run MCP servers, or write graph files.

## Candidate Artifacts

```text
graph.json
GRAPH_REPORT.md
graph.html
cache/
```

## Base Schema Concepts

Base nodes:

- `source`
- `concept`
- `entity`
- `module`
- `document`
- `decision`
- `question`
- `artifact`

Base edges:

- `cites`
- `contains`
- `depends_on`
- `relates_to`
- `conflicts_with`
- `derived_from`
- `updates`
- `review_needed`

Confidence labels:

```text
EXTRACTED
INFERRED
AMBIGUOUS
```

## Schema Profiles

| Profile | Additional nodes | Additional edges |
|---|---|---|
| software repo | package, file, function, class, API, ADR, test, config | imports, calls, implements, tested_by |
| document corpus | source-page, citation, section, claim, author | cited_by, summarizes, contradicts, supports |
| teaching KB | chapter, topic, example, error, exercise, prerequisite | belongs_to, demonstrated_by, requires |
| AI knowledge app | retrieval-policy, prompt, eval, feedback | retrieves_from, evaluated_by, improves |
| product/business KB | feature, customer, competitor, requirement, risk | requested_by, competes_with, mitigates |

## Confirmation Required

Ask before:

- choosing graph schema profile as durable truth
- installing graph dependencies
- writing graph artifacts
- starting graph/MCP servers
- treating inferred or ambiguous relationships as durable facts

## P4.1 Readiness Check

P4.1 may read only existing graph artifacts such as `graph.json` and `GRAPH_REPORT.md`, either from configured adapter paths or the Admin root defaults. It must not compile graphs, install graph tooling, start graph/MCP servers, or treat inferred relationships as durable facts.

## P4.3 Graph Compile Planning

P4.3 adds a read-only planning layer:

```text
node scripts/graph-compile-plan.mjs <target-project>
GET /api/kb/admin/graph/compile-plan
```

It consumes P4.1 graph adapter readiness and returns `phase: p4_3_graph_compile_planning`. The plan may propose schema profile, source scope, confidence policy, artifact targets, dependency boundary, and confirmation gates.

P4.3 must not install dependencies, run graphify/graph tools, compile graph artifacts, write `graph.json`, write `GRAPH_REPORT.md`, write cache/html artifacts, start graph or MCP servers, call external providers, or promote `INFERRED`/`AMBIGUOUS` relationships to durable facts.

## Completion Marker

A graph plan is complete when it states schema profile, source scope, confidence policy, artifact paths, dependency boundary, and confirmation needed.
