# Eval Cases

This directory contains lightweight golden cases for regression checking.

## Case metadata

New structured cases may include:

- `schema_ref` — contract schema expected for the response shape, for example `contracts/adapter-status.schema.json`.
- `required_fields` — dotted field paths that should be present in the planned output.
- `must_not` — forbidden actions or output claims that would violate the route boundary.
- `expected_route` — human-readable route name selected for the prompt.
- `expected_task_type` — stable task classification, such as `check_runtime`, `source_normalization_import_plan`, `graph_compile_plan`, or `export_plan`.
- `expected_deliverable_type` — stable deliverable classification, such as `adapter_status`, `source_normalization_import_plan`, `graph_compile_plan`, or `export_plan`.

P4 cases are planning/readiness-only. P4.1 adapter readiness uses `contracts/adapter-status.schema.json`; P4.2, P4.3, and P4.4 cases should include both `expected_task_type` and `expected_deliverable_type`.

## Suggested checks
- source priority respected
- output shape stays aligned with contracts
- local-first behavior preserved
- conflicts are not silently flattened
- beginner prompts still trigger useful behavior
- project adaptation happens before deep synthesis when the repo is unfamiliar
- clarification happens before execution when the target artifact is unclear
- broad requests produce route options instead of silently forcing one mode
- lifecycle wording stays lightweight and consistent across docs, examples, and eval cases
- lifecycle rollout coverage includes `references/knowledge-lifecycle.md`, lifecycle-aware templates/examples, and at least one lifecycle update eval case
- P4 readiness/planning cases keep `readOnly: true`, execution/write/install/upload/server flags false, and heavy adapter actions behind separate confirmation gates
