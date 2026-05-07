# Upstream Reuse Policy

Project Wiki should reuse proven upstream behavior through narrow contracts instead of copying heavy systems into the Skill.

## Default Strategy

```text
adapter > template > fork > vendor > submodule
```

| Strategy | Use when | Notes |
|---|---|---|
| adapter | upstream has useful APIs/artifacts | preferred |
| template | small skeleton or config can be generated later | keep lightweight |
| fork | upstream matches 80%+ and long-term divergence is intended | confirm maintenance cost |
| vendor | tiny licensed files only | preserve attribution |
| submodule | rarely | adds setup complexity, especially on Windows |

## Current Upstream Roles

- `AgriciDaniel/claude-obsidian` — long-lived wiki workflow ideas: raw/wiki/index/log/hot.
- `liangdabiao/llm-wiki` — route/source-registry/adapter-state concepts; license must be confirmed before copying code.
- `safishamsi/graphify` — optional graph pipeline and artifacts.
- `wxyhgk/retain-pdf` / local `retain-pdf` skill — optional PDF/OCR artifact source.
- `Quartz` / static-site publishers / Obsidian export tools — optional export targets; plan through adapter contracts only.

## License Rules

- License unclear: borrow workflow concepts only; do not copy code.
- MIT or permissive code reuse: preserve notices and attribution when code is actually copied.
- Heavy upstream systems stay outside the Skill body.
- Prefer documented adapter contracts over vendored implementation.

## P0 Boundary

P0 may cite upstream ideas and define adapter contracts. It must not copy upstream code, add submodules, or vendor dependencies.

## P4.1 Readiness Boundary

P4.1 adapter readiness may report whether upstream-adapter artifacts or manifests are present, but it must not vendor, fork, install, run, or call upstream tools automatically.

## P4.3 Graph Compile Planning Boundary

P4.3 may use graphify-style concepts only through adapter readiness and graph compile planning. It must not vendor, fork, install, or run graphify/graph tooling by default; it must not start MCP/server processes, call external providers, or write graph artifacts. Any future graph execution remains a separate confirmed adapter action.

## P4.4 Export Planning Boundary

P4.4 may use static publishing, Quartz, and Obsidian export concepts only through adapter readiness and explicit export-plan fields. It must not vendor, fork, install, or run publishing/export tooling by default; it must not generate export artifacts, upload/publish, start preview servers/MCP, call external providers, or mutate files. Any future export execution remains a separate confirmed adapter action.

## Completion Marker

An upstream reuse decision is complete when it names the upstream, reuse strategy, license status, copied artifacts if any, and why a lighter strategy is not enough.
