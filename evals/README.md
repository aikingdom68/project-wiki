# Eval Cases

This directory contains lightweight golden cases for regression checking.

## Suggested checks
- source priority respected
- output shape stays aligned with contracts
- local-first behavior preserved
- conflicts are not silently flattened
- beginner prompts still trigger useful behavior
- project adaptation happens before deep synthesis when the repo is unfamiliar
- clarification happens before execution when the target artifact is unclear
- broad requests produce route options instead of silently forcing one mode
- lifecycle wording stays lightweight and consistent across docs, examples, and eval cases
- lifecycle rollout coverage includes `references/knowledge-lifecycle.md`, lifecycle-aware templates/examples, and at least one lifecycle update eval case
