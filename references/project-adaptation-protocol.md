# Project Adaptation Protocol

Project Wiki should not jump straight into explanation when entering a new project.

## Goal

Before choosing an output, first build a lightweight project profile:
- what kind of project this is
- what local materials exist
- whether a durable wiki layer already exists
- what the likely primary sources are
- whether clarification is required before execution

## Adaptation checklist

This step should produce plain-language labels such as `project type`, `project state`, and `candidate routes` before deep synthesis begins.

1. **Classify the project**
   - software repo
   - teaching system
   - documentation knowledge base
   - SaaS knowledge layer
   - mixed project

2. **Assess project state**
   - `cold` — no stable wiki layer yet
   - `partial` — some docs/knowledge pages exist but the structure is incomplete
   - `mature` — stable wiki/docs layer already exists
   - `unknown` — not enough evidence yet

3. **Inventory likely sources**
   - current code and runtime behavior
   - docs / wiki pages
   - examples / lecture notes / example banks
   - ADRs / changelogs / design notes
   - user-supplied materials

4. **Select candidate task routes**
   - `adapt_project`
   - `propose_options`
   - `explain`
   - `evaluate`
   - `compare`
   - `build_wiki`
   - `update_wiki`
   - `source_guided_explain`
   - `query`

5. **Decide whether clarification is mandatory**
   Clarification is mandatory when any of these are unclear:
   - the desired deliverable
   - whether repository changes are wanted
   - the preferred source of truth
   - the audience or depth
   - the primary task when several are mixed together

## Expected adaptation output

A good adaptation step should state:
- **Project type**
- **Project state**
- **Likely primary sources**
- **Gaps in understanding**
- **Recommended routes**
- **Questions that need confirmation**

## Good behavior

- explain what the project appears to be before proposing a route
- keep repo-state uncertainty visible
- offer 2-3 best-fit paths instead of forcing one route too early
- ask only the smallest set of questions needed to avoid partial landing

## Bad behavior

- jumping straight into a polished explanation without checking repo state
- assuming the user wants wiki edits when they may only want a read-only diagnosis
- ignoring that a project may be cold-start and need scaffolding first
- choosing one task shape silently when the request mixes several goals
