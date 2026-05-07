# Example: Source Normalization Import Plan

## User request

我已经有 RetainPDF-style artifacts-manifest 了，请用 project-wiki 规划怎么把这些 normalized sources 接成知识库；先不要 OCR、转换、复制或写文件。

## Route selected

Import / Normalize Sources / P4.2 source normalization import planning.

This route consumes explicit RetainPDF-style readiness evidence and produces a read-only import plan. It does not execute normalization or durable knowledge-base writes.

## Expected task/deliverable type

- `expected_task_type`: `source_normalization_import_plan`
- `expected_deliverable_type`: `source_normalization_import_plan`
- Schema: `contracts/source-normalization-import-plan.schema.json`
- Expected phase: `p4_2_source_normalization_import_planning`

## Evidence/readiness inputs

- P4.1 adapter readiness for `sourceNormalization` / `retain-pdf`.
- Existing project binding and configured `optionalAdapters.retainPdf.manifestPath`.
- Explicit RetainPDF-style artifacts manifest only.
- Manifest metadata: manifest path, existence, artifact count, artifact paths/types, and warnings.
- Target roots from binding: proposed source registry path, wiki/knowledge roots, admin root, and write whitelist candidates.
- Readiness state and adapter warnings; no normalized document body reading beyond manifest/path metadata.

## Planning-only output shape

Return a JSON-compatible plan with:

- `ok`, `readOnly: true`, `phase: p4_2_source_normalization_import_planning`, `inspectionLevel`, and optional `projectRoot`.
- `binding.status`, `binding.config`, and binding errors if any.
- `adapter.adapterId: retain-pdf`, `adapter.state`, `adapter.executionEnabled: false`, `adapter.dependencyLevelToExecute`, `adapter.artifacts`, `adapter.warnings`, `adapter.confirmationRequiredBefore`, and `adapter.nextSteps`.
- `manifest.path`, `manifest.exists`, `manifest.artifactCount`, and `manifest.truncated: false`.
- `plan.planningOnly: true`, `plan.executionEnabled: false`, `plan.applyEndpointAvailable: false`, `plan.sourceRegistryWriteEnabled: false`, `plan.wikiWriteEnabled: false`.
- `plan.proposedRegistryTarget.path` and `plan.proposedRegistryTarget.willWrite: false`.
- `plan.candidates` for importable normalized-source artifacts and `plan.excluded` for supporting, missing, unsafe, or non-import artifacts.
- `summary.manifestArtifacts`, `summary.importCandidates`, `summary.importable`, `summary.excluded`, `summary.missing`, `summary.unsafe`, and `summary.heavyActionsAvailable: false`.
- `warnings` and `nonGoals`.

## Confirmation gates

Ask for confirmation before:

- accepting source authority and whether normalized artifacts should become KB evidence;
- copying, importing, moving, or transforming any artifact;
- reading full normalized document contents beyond planning metadata;
- writing source registry entries, wiki pages, knowledge objects, admin logs, or backups;
- running OCR, conversion, unzip, provider upload, external provider calls, or RetainPDF commands;
- installing adapter dependencies or starting runtime services.

## Forbidden actions/non-goals

- Do not run OCR, conversion, RetainPDF, unzip, copy, move, import, upload, or provider calls.
- Do not install dependencies or execute adapter commands.
- Do not guess manifest paths; use only the explicit configured manifest.
- Do not read normalized document contents beyond manifest/path metadata during planning.
- Do not write source registry files, wiki files, knowledge objects, admin logs, backups, or normalized materials.
- Do not mark planned registry entries as already imported.

## Completion state

Complete when the plan identifies the manifest, adapter state, artifact counts, importable candidates, excluded items, proposed registry target with `willWrite: false`, risks/warnings, confirmation gates, and states that no OCR, conversion, copy/import, command execution, dependency install, or KB write occurred.
