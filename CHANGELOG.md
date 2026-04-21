# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Root-level `test-prompts.json` with reusable regression prompts covering adaptation-first entry, explanation, comparison, source-guided explanation, and lifecycle-aware wiki updates
- Install test coverage for publishing `test-prompts.json` as part of the standalone skill package

### Changed
- `SKILL.md` frontmatter now uses a quoted `description` value for better skill health compatibility
- `SKILL.md` now surfaces an activation snapshot and default opening route near the top for faster, more reliable triggering
- README, README.zh-CN, publishing notes, install script, and doctor checks now treat `test-prompts.json` as a first-class asset
- Doctor tests now validate `test-prompts.json` presence and JSON validity

## [0.5.0] - 2026-04-19

### Added
- Project adaptation protocol (`references/project-adaptation-protocol.md`) for entering unfamiliar repositories before deep synthesis
- Interactive clarification guidance (`references/interactive-clarification-guidance.md`) for asking the minimum questions needed to avoid a wrong route
- Task routing guidance (`references/task-routing-guidance.md`) for choosing a primary task and handling multi-intent requests
- Project profile contract (`contracts/project-profile.schema.json`) for project-type, project-state, source, fallback, and privacy defaults
- Source policy list contract (`contracts/source-policy-list.schema.json`) for runtime-facing wrappers that carry multiple source policies
- New examples for adaptation-first entry, clarification-first flow, and multi-intent routing
- New eval cases covering ambiguous project requests, cold-start adaptation, clarification-before-plan, multi-intent routing, and preferred-source conflict handling

### Changed
- `SKILL.md` workflow now starts with project adaptation, then clarification, option proposal, route confirmation, and finally execution-heavy outputs
- README and README.zh-CN now treat `/project-wiki` as the preferred public entry and explain adaptation-first behavior
- Output contract expanded with project profile, project state, routing decision, clarifying questions, proposed modes, confirmed scope, and deliverable type
- Retrieval contract expanded with task type, interaction stage, preferred source, project-state probing, clarification signals, candidate primary sources, and policy decision trace
- Source policy contract expanded with usage role, preferred task types, conflict mode, project applicability, and trigger patterns
- System integration guidance now includes adaptation-first behavior and interaction-stage-aware input shape
- Cold start protocol now explicitly requires project-state summary and route proposal before deep execution
- Doctor script now validates adaptation/clarification/routing assets and contract coverage alongside lifecycle rollout checks
- Doctor tests updated to cover the new contract fields and required adaptation assets

## [0.4.0] - 2026-04-18

### Added
- Retrieval contract schema (`contracts/retrieval-contract.schema.json`) for SaaS and API contexts
- Wiki linking reference (`references/wiki-linking.md`) with `[[slug]]` syntax, backlinks, and orphan detection
- Cold start protocol (`references/cold-start-protocol.md`) for bootstrapping knowledge bases from zero
- SCHEMA.md template (`references/templates/schema-page.md`) for anchoring wiki conventions
- `query` internal task mode for read-only knowledge-base-backed question answering
- API-facing citation format in `references/evidence-and-citation.md`
- Offline capability boundary for SaaS in `references/modes-and-safety.md`
- Version snapshot support in `references/knowledge-lifecycle.md`
- Operation log (`log.md`) specification in `references/incremental-update-protocol.md`
- `index.md` catalog specification and `SCHEMA.md` convention in MVP Wiki Layout
- Related Pages section (`[[slug]]` links) in all page templates
- `citations` field and `query` task type in output contract schema
- Broken link, orphan page, and stale log checks in wiki quality audit
- New common mistakes: missing cross-references and missing SaaS citations

### Changed
- MVP Wiki Layout expanded with SCHEMA.md, index.md, log.md, _backlinks.json, _snapshots.json
- LLM Wiki Core reference updated with SCHEMA.md, index.md, and log.md specifications
- Doctor script updated to validate new files

## [0.3.3] - 2026-04-09

### Added
- Output quality standards for explanation, evaluation, comparison, decision, and wiki-update outputs
- Additional examples for evaluation report, decision memo, and source-guided explanation quality
- Additional eval cases and a shared rubric for regression review

## [0.3.2] - 2026-04-09

### Added
- Explicit conflict-resolution rule between project/runtime evidence, maintained local docs/wiki, preferred local teaching sources, and general knowledge
- Minimal system integration contract for input/output/fallback behavior
- Beginner-friendly 60-second self-check in the README

## [0.3.1] - 2026-04-09

### Added
- System-facing interpretation for using `project-wiki` as a capability spec inside future products
- New reference: `references/system-integration-guidance.md`
- README guidance for using `project-wiki` inside a teaching/explanation platform

## [0.3.0] - 2026-04-09

### Added
- Beginner-friendly three-sentence usage entry
- Automatic plus precise triggering guidance
- Source-priority behavior for preferred local knowledge sources
- Source-guided explanation mode for following the reasoning style of example banks, lecture notes, docs, or similar local corpora
- New reference: `references/source-priority-guidance.md`
- New README examples for teaching systems and example-bank-first explanation

## [0.2.0] - 2026-04-09

### Added
- Strengthened wiki-first positioning for `project-wiki`
- Added clearer usage guidance and Quick Start examples
- Added explicit mutation boundary for safe wiki updates
- Added recommended MVP wiki layout and page contract
- Added knowledge object model and `curate` mode
- Added stronger local-first / online authorization boundary

## [0.1.0] - 2026-04-09

### Added
- Initial independent open-source skill structure
- `SKILL.md`
- Core references for LLM Wiki, local RAG engineering, project assistance, and safety modes
- Initial README, LICENSE, and `.gitignore`
