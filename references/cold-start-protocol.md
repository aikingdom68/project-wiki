# Cold Start Protocol

This file defines how to bootstrap a knowledge base from zero when deploying Project Wiki for the first time, especially in SaaS contexts.

## The problem

When a new SaaS instance or project first activates Project Wiki, the knowledge base is empty. Without guidance, the system has nothing to retrieve and falls back entirely to general LLM knowledge, which defeats the purpose.

Cold start also means the skill should not pretend it already knows the best route. It should first adapt to the repo, summarize the project state, and propose the best next paths before deep execution.

## Cold start phases

### Phase 1: Seed inventory

Before creating any wiki pages, inventory the available raw materials:

- source code files and directory structure
- existing documentation (README, docs/, guides)
- configuration files and environment setup
- test suites and their descriptions
- architecture notes, ADRs, or design documents
- changelogs and commit history
- any user-supplied materials (notes, slides, transcripts)

Output: a raw materials manifest listing what exists and what coverage it provides.

### Phase 2: Scaffold the wiki structure

Create the minimum viable wiki structure:

```
docs/wiki/
  SCHEMA.md          — wiki conventions and root path
  index.md           — page catalog (starts nearly empty)
  log.md             — operation log (first entry: "wiki initialized")
  overview.md        — project overview (draft from available materials)
```

Do not create module, decision, or glossary pages yet if the evidence is too thin. Mark them as planned in the index instead.

### Phase 3: Build high-value pages first

Prioritize pages that provide the most immediate value:

1. **Overview page** — what is this project, why does it exist, key components
2. **Architecture / module map** — top-level structure and boundaries
3. **Glossary** — terms that have local meaning different from general usage
4. **One decision record** — the most recent or most impactful technical decision

Each page must include at least one evidence anchor. If evidence is too weak for a section, write it as an open question instead.

### Phase 4: Validate the cold start

After initial pages are created, run a lightweight validation:

- Does the index list all created pages?
- Does each page have at least one evidence anchor?
- Can a basic query against the knowledge base return relevant results?
- Is the SCHEMA.md correctly pointing to the wiki root?

### Phase 5: Set up the incremental loop

Once the cold start is complete, transition to the normal incremental update workflow:

- new materials trigger ingest
- queries that reveal gaps trigger page creation
- periodic audits catch drift

## Cold start for SaaS deployments

When Project Wiki backs a SaaS product:

### Automated seed import

The product should support bulk import of initial materials:
- upload a docs folder or zip
- connect to a git repository
- import from an existing knowledge management tool

### Progressive enrichment

The knowledge base does not need to be complete before the product is useful. Define a minimum viable knowledge set:

- at least 5 wiki pages covering the project core
- at least 1 evidence anchor per page
- the index is populated and queryable

### Cold start indicator

The SaaS frontend should indicate when the knowledge base is in cold start mode:
- "Knowledge base is being built — answers may be limited"
- Show coverage percentage if available
- Offer guided prompts to help the user add high-value materials first

## Anti-patterns

### Bad: Creating 20 empty stub pages
Empty pages give the illusion of coverage but provide no retrieval value.

### Bad: Importing everything with no structure
Dumping all files into raw/ without building wiki pages is just a file share, not a knowledge base.

### Bad: Waiting until the knowledge base is "complete" before launching
The knowledge base is never complete. Launch with a minimum viable set and grow incrementally.
