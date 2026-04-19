# Release Notes Draft

## project-wiki v0.5.0

`project-wiki` is a wiki-first, local-first project-assist skill for Claude Code.

### What it helps with
- explaining projects and modules
- comparing implementation options
- evaluating technical decisions with evidence
- building and updating a project wiki / knowledge base
- supporting onboarding and troubleshooting knowledge
- adapting to unfamiliar projects before producing deep outputs
- routing multi-intent requests into a clear primary task

### What's new in v0.5.0
- adaptation-first workflow: classify project type and state before deep synthesis
- interactive clarification guidance: ask the minimum questions needed to avoid a wrong route
- task routing guidance: pick one primary task and keep supporting tasks visible
- new `adapt_project` and `propose_options` task types in the output contract
- new `interaction_stage` field (`adapt | clarify | propose | confirm | execute`) for system integration
- new `project-profile.schema.json` and `source-policy-list.schema.json` contracts
- new examples: adapt-project-first, interactive-clarification, task-routing-multi-intent
- new eval cases: ambiguous-project-request, cold-start-project-adaptation, clarification-before-plan, multi-intent-routing, preferred-source-conflict-routing
- doctor script extended to validate the new contracts and required adaptation/clarification/routing assets

### What's new in v0.4.0
- retrieval contract schema (`contracts/retrieval-contract.schema.json`) for SaaS and API contexts
- wiki linking reference (`references/wiki-linking.md`) with `[[slug]]` syntax, backlinks, and orphan detection
- cold start protocol (`references/cold-start-protocol.md`) for bootstrapping knowledge bases from zero
- SCHEMA.md template for anchoring wiki conventions
- new `query` internal task mode for read-only knowledge-base-backed answering
- API-facing citation format and offline capability boundary for SaaS
- version snapshot support and operation log (`log.md`) specification
- `index.md` catalog and Related Pages sections in all page templates
- `citations` field and `query` task type in output contract schema
- new common mistakes: missing cross-references and missing SaaS citations

### What's new in v0.3.3
- added output quality standards for key task types
- added richer examples for evaluation, decision memos, and source-guided explanation quality
- expanded eval coverage and added a shared rubric for regression review

### Previous v0.3.2 improvements
- added explicit conflict-resolution rules across project/runtime evidence, maintained docs/wiki, preferred teaching sources, and general knowledge
- added a minimal system integration contract for future products and platforms
- added a beginner-friendly 60-second self-check so open-source users can verify installation and expected behavior quickly

### Previous v0.3.1 improvements
- clarified that `project-wiki` can also serve as a capability specification for future systems and platforms
- added system-facing guidance for teaching systems, explanation engines, and knowledge-driven products
- documented how preferred local knowledge sources should shape explanation behavior inside a product

### Previous v0.3.0 improvements
- beginner-friendly three-sentence entry for first-time users
- automatic plus precise triggering guidance
- preferred local knowledge-source priority rules
- source-guided explanation behavior for example banks, lecture notes, docs, and similar local corpora
- stronger README examples for teaching and explanation systems

### Previous v0.2.0 improvements
- clearer Quick Start and usage guidance
- stronger boundaries against collapsing into pure RAG or generic repo chat
- explicit mutation boundary for safe wiki updates
- recommended wiki layout and page contract for MVP usage
- stronger support for durable knowledge objects and curation
- clearer local-first / online-enhanced safety rules

### Positioning
`project-wiki` is not a generic RAG framework, project-management system, or cloud knowledge platform.
It is a project knowledge skill: LLM Wiki as the skeleton, local retrieval as the evidence layer, and project assistance as the product goal.
