# Example: Fixed Feature-by-Feature Routing

## User request

请用 project-wiki 接管这个项目，解释架构、评估边界、补 wiki，并看看能不能打开后台知识库管理控制台。

## Expected shape

- does not choose only one primary route and skip the rest
- keeps supporting tasks visible as capability checks instead of collapsing them into one route
- runs the fixed feature-by-feature progression
- gives each capability one status: `executable_now`, `plan_only`, `confirmation_required`, or `not_applicable`
- checks explain, evaluate, compare/decide, query KB, build/update wiki, bind project, runtime, Admin GUI/backend control console, import/normalize, graph, and export in order
- treats Admin GUI / backend knowledge-base control console as a mandatory capability check
- asks before launching runtime, writing binding/config files, or implementing frontend/backend control-console files
- summarizes completed, plan-only, confirmation-required, and not-applicable capabilities
