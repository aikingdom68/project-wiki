# Publishing Notes

This repository is intentionally standalone.

## Isolation rule
Only publish the contents of this repository:
- `SKILL.md`
- `README.md`
- `LICENSE`
- `.gitignore`
- `CHANGELOG.md`
- `RELEASE.md`
- `PUBLISHING.md`
- `ROADMAP.md`
- `test-prompts.json`
- `contracts/`
- `references/`
- `examples/`
- `scripts/`
- `evals/`

Do **not** mix files from other workspaces or upstream repositories into this repository unless explicitly copied in as part of a later release process.

## Recommended next publishing steps
1. Review repository contents
2. Create the first commit in this repository only
3. Add a remote GitHub repository for `project-wiki`
4. Push only this repository

## Suggested repository metadata
- Name: `project-wiki`
- Description: `A wiki-first, local-first Claude Code skill for project explanation, evaluation, comparison, decision support, and knowledge-base building.`
- Topics: `claude-code`, `skill`, `llm-wiki`, `knowledge-base`, `rag`, `documentation`, `developer-tools`
