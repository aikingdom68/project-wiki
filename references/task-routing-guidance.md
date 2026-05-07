# Task Routing Guidance

Project Wiki should route broad project requests into one primary task and optional supporting tasks.

## Primary task types

- `intake`
- `adapt_project`
- `propose_options`
- `explain`
- `evaluate`
- `compare`
- `decide`
- `build_wiki`
- `update_wiki`
- `source_guided_explain`
- `query`
- `bind_project`
- `check_runtime`
- `open_admin_gui`
- `import_normalize_sources`
- `compile_graph`
- `publish_export`

## Routing heuristics

### Route to `intake`
When the current material state is unclear, the user has broad or messy sources, or the task may involve existing Markdown, PDFs, a prior wiki, source authority, GUI/runtime, or import decisions. Intake is a pre-route selector, not a heavy implementation module.

### Route to `adapt_project`
When the project is unfamiliar or the request is too broad to answer safely without first understanding the repo/corpus type.

### Route to `propose_options`
When the user clearly wants help but the target artifact is still ambiguous.

### Route to `explain`
When the user mainly wants a grounded project/module/system explanation.

### Route to `evaluate`
When the user wants a quality judgment, risk review, boundary check, or migration assessment.

### Route to `compare`
When the user wants trade-offs between two or more options.

### Route to `decide`
When the user needs a recommendation with alternatives and trade-offs.

### Route to `build_wiki`
When no stable wiki exists yet and the user wants durable knowledge structure.

### Route to `update_wiki`
When a wiki exists and the user wants narrow, traceable changes.

### Route to `source_guided_explain`
When a preferred source is named and the explanation should preserve its reasoning style.

### Route to `query`
When a wiki/knowledge base already exists and the main need is evidence-backed answering with citations.

### Route to `bind_project`
When the user wants to connect Project Wiki to an existing project, docs folder, Markdown corpus, wiki root, or `.project-wiki` binding.

### Route to `check_runtime`
When the user asks whether a runtime, adapter, or GUI capability is configured. This is read-only unless setup is explicitly confirmed.

### Route to `open_admin_gui`
When the user asks for a local browser/admin/backend page for knowledge-base management. If no safe existing runtime is configured, produce a plan instead of launching anything.

### Route to `import_normalize_sources`
When the user wants PDFs, ebooks, scanned docs, Markdown folders, Word docs, web exports, or mixed raw materials imported into a project wiki.

### Route to `compile_graph`
When the user asks for a knowledge graph, graph report, relationship map, or graph-powered indexing.

### Route to `publish_export`
When the user asks to export a wiki site, publish static docs, or export to Obsidian/Quartz-like formats. When an explicit export plan already exists, default to P4.4 read-only planning: consume P4.1 export adapter readiness and the plan, then return source scope, target/profile, output root, dependency boundary, rollback/cleanup, and confirmation gates without execution.

## Multi-intent rule

If a request mixes several goals:
1. choose one **primary** task
2. keep the others as supporting tasks
3. explain why that route is first
4. ask for confirmation when the route materially changes the outcome

## Repo-state-sensitive defaults

- **unknown materials + broad ask** -> `intake` then `adapt_project` or `propose_options`
- **cold project + broad ask** -> `intake` then `adapt_project` then `propose_options`
- **existing Markdown/docs + KB intent** -> `intake` then `bind_project` or `update_wiki`
- **PDF/ebook/scanned docs + KB intent** -> `intake` then `import_normalize_sources`
- **mixed messy sources** -> `intake` then source inventory and staged import plan
- **partial docs/wiki + architecture question** -> `explain`
- **mature wiki + focused question** -> `query`
- **preferred source named + style requested** -> `source_guided_explain`
- **request to improve docs/wiki with no clear write intent** -> `propose_options` before `build_wiki` or `update_wiki`
- **admin GUI request** -> `open_admin_gui`, but plan/check only unless runtime exists and launch is confirmed
- **graph request + adapter readiness** -> `compile_graph`, default P4.3 read-only graph compile planning
- **export/publish request + explicit export plan** -> `publish_export`, default P4.4 read-only export planning
