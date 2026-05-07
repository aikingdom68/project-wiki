# Project Binding Protocol

Project binding defines how a target project tells `project-wiki` where sources, wiki pages, admin files, backups, and optional runtime configuration live.

## P0 Boundary

P0 may propose a binding shape. It must not automatically create `.project-wiki/project-wiki.config.json`.

## Proposed Binding File

```text
<target-project>/.project-wiki/project-wiki.config.json
```

Conceptual fields:

```json
{
  "version": 1,
  "projectType": "software-repo | document-corpus | teaching-kb | ai-knowledge-app | product-business-kb | mixed",
  "projectRoot": ".",
  "knowledgeRoot": ".project-wiki/knowledge",
  "wikiRoot": ".project-wiki/wiki",
  "adminRoot": ".project-wiki/admin",
  "rawSourceRoots": ["docs", "src", "README.md"],
  "sourcePolicyFile": ".project-wiki/admin/source-policies.json",
  "retrievalPresetFile": ".project-wiki/admin/retrieval-presets.json",
  "manualOverrideFile": ".project-wiki/admin/manual-overrides.json",
  "backupRoot": ".project-wiki/backups",
  "schemaProfile": "auto",
  "writeWhitelist": [".project-wiki/admin/**", ".project-wiki/wiki/**"],
  "optionalAdapters": {
    "retainPdf": {
      "manifestPath": ".project-wiki/admin/retain-pdf/artifacts-manifest.json"
    },
    "graph": {
      "graphJson": ".project-wiki/admin/graph.json",
      "graphReport": ".project-wiki/admin/GRAPH_REPORT.md",
      "schemaProfile": "auto"
    },
    "export": {
      "planFile": ".project-wiki/admin/export-plan.json",
      "outputRoot": ".project-wiki/export"
    }
  }
}
```

## Binding Intake Questions

Before proposing a binding, identify:

- target project root
- existing wiki or docs root
- source roots and source types
- project type or mixed profile
- whether current structure is trusted, partial, missing, or untrusted
- write whitelist candidates
- backup location
- source authority and retrieval policy decisions still needing confirmation

## Project Types

| Type | Typical sources | Typical wiki objects |
|---|---|---|
| `software-repo` | source, README, ADR, tests, config | overview, module, decision, troubleshooting, glossary |
| `document-corpus` | PDFs, Markdown, web exports, meeting notes | catalog, source-page, topic-summary, citation-map |
| `teaching-kb` | lessons, examples, exercises, terminology | chapters, topics, examples, common-errors, source-map |
| `ai-knowledge-app` | prompts, RAG config, evals, feedback | source-catalog, retrieval-policy, output-contract, feedback-loop |
| `product-business-kb` | PRDs, feedback, decisions, competitor notes | feature-map, decision-log, customer-insight, FAQ |
| `mixed` | multiple source families | staged profiles, explicit source authority |

## Read-only Healthcheck

Use this after or before a binding proposal to inspect the current target project without writing files:

```text
node scripts/healthcheck.mjs <target-project>
```

The checker reports:

- whether `.project-wiki/project-wiki.config.json` exists
- project type value and recognition
- configured wiki/admin/knowledge/backup roots
- raw source root existence
- write whitelist presence and path safety
- warnings for missing or invalid paths

It rejects config paths, managed roots, and write whitelist entries that escape the project root. It does not create binding files.

## Completion Marker

A binding proposal is complete when it lists proposed roots, write whitelist, source roots, unresolved confirmation gates, and whether no files were changed.
