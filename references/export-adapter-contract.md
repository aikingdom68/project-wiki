# Export Adapter Contract

This reference defines the P4.4 boundary for planning wiki export/publishing without executing it.

## Scope

P4.4 is planning-only. It may consume:

- P4.1 export adapter readiness
- an explicit configured export plan
- existing binding/root safety information

It produces an export plan that names source scope, target/profile, output root, dependency boundary, rollback/cleanup notes, and confirmation gates.

## CLI and Admin Surface

```text
node scripts/export-plan.mjs <target-project>
GET /api/kb/admin/export/plan
```

The response should follow `contracts/export-plan.schema.json` and include:

- `readOnly: true`
- `phase: p4_4_export_planning`
- `plan.planningOnly: true`
- `plan.executionEnabled: false`
- `plan.exportAllowed: false`
- `plan.outputRoot.willWrite: false`
- `summary.exportAllowed: false`
- `summary.confirmationRequired: true`

Admin health should expose `exportPlanning: true` and keep `export: false`.

## Planning Fields

A complete P4.4 plan should propose:

| Field | Purpose | Execution implication |
|---|---|---|
| source scope | Which wiki/source roots would be considered for export | read-only inspection only |
| target/profile | Static site, Obsidian, Quartz-like, or another named profile | not an approval to run tools |
| output root | Planned output directory and safety status | `willWrite: false` |
| dependency boundary | Tooling level required to execute later | install/run disabled now |
| rollback/cleanup | Backup, cleanup, and failure-recovery notes | planning only |
| confirmation gates | Decisions required before any future export | separate confirmation required |

## Hard Non-goals

P4.4 must not:

- install export dependencies
- run Quartz, static publishing, Obsidian, shell, or package-manager commands
- generate, write, move, or delete export artifacts
- upload or publish output
- start preview servers, local servers, or MCP processes
- call external providers
- mutate target-project files
- treat an explicit export plan as execution confirmation

## Explicit Plan Handling

An explicit export plan is input evidence, not user consent to execute. Command-like fields (`command`, `script`, `shell`, or similar) may be summarized as blocked future execution but must not be run or surfaced as an immediately available action.

If the plan references unsafe output paths or ambiguous targets, report warnings and keep all write/execution flags false.

## Dependency Level

P4.4 planner behavior is Level 0/1 in `references/dependency-installation-policy.md`:

- Level 0: direct read of JSON/Markdown/config files and existing plan artifacts
- Level 1: configured project-wiki runtime/adapters reporting readiness

Actual export tooling is Level 3 and requires a separate confirmed execution plan.

## Completion Marker

An export plan is complete when it names source scope, target/profile, output root, dependency boundary, rollback/cleanup approach, confirmation gates, explicit non-goals, and states that no files were written and no export was executed.
