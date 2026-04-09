# Release Notes Draft

## project-wiki v0.3.2

`project-wiki` is a wiki-first, local-first project-assist skill for Claude Code.

### What it helps with
- explaining projects and modules
- comparing implementation options
- evaluating technical decisions with evidence
- building and updating a project wiki / knowledge base
- supporting onboarding and troubleshooting knowledge

### What's new in v0.3.2
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
