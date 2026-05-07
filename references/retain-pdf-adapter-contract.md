# RetainPDF Adapter Contract

RetainPDF is an optional future adapter for PDF, ebook, OCR, and structured document normalization workflows.

## P0 Boundary

P0 may describe how Project Wiki should consume RetainPDF-style artifacts. It must not run OCR, upload PDFs, call providers, install RetainPDF, or write converted materials.

## Preferred Artifact Model

Do not guess paths. Use an artifact manifest when available.

Useful artifacts:

```text
artifacts-manifest
markdown_bundle_zip
markdown/full.md
markdown/images/**
normalized_document_json / document.v1.json
normalization_report_json
layout_json
events_jsonl
```

## Default Import Flow

```text
source inventory
  -> confirm local/external processing boundary
  -> optional PDF/OCR normalization
  -> artifact manifest
  -> source registry
  -> wiki/knowledge-object proposal
  -> user confirmation before durable writes
```

## Provider and Upload Confirmation

Before any external OCR provider or file upload, show:

- provider name
- whether processing is local or external
- files that would be uploaded
- token/credential source
- output location
- privacy risk
- fallback if provider fails

## Source Handling Rules

- PDFs and OCR outputs are evidence sources, not automatically final wiki pages.
- Preserve page/section evidence where possible.
- Keep raw source materials read-only by default.
- Prefer OCR-only/normalization before translation or PDF reconstruction.
- Ask before copying, converting, normalizing, or indexing sources into a durable KB.

## P4.1 Readiness Check

P4.1 may inspect only an explicit `optionalAdapters.retainPdf.manifestPath` in the target project binding. It must not guess artifact paths, scan for PDFs, run OCR, convert documents, upload files, call providers, or write normalized materials.

## P4.2 Source Normalization Import Planning

P4.2 may consume the explicit RetainPDF-style manifest from P4.1 readiness and produce a read-only import plan. The plan may classify manifest artifacts into importable normalized sources, supporting evidence artifacts, and excluded items, then propose source registry entries marked `planned_only` / `needs_review`.

P4.2 must not read normalized document contents beyond manifest/path metadata, execute manifest commands, unzip bundles, copy files, convert PDFs, run OCR, upload files, call providers, write source registry files, write wiki/knowledge-object files, write admin logs, or create backups.

Minimum planning output:

- manifest path and artifact count
- adapter state and warnings
- importable candidate artifacts
- excluded artifacts with reasons
- proposed source registry target with `willWrite: false`
- confirmation gates before any durable writes or heavy adapter actions

## Completion Marker

A PDF/import plan is complete when it lists source files, processing boundary, adapter state, artifact expectations, output roots, and confirmation questions.
