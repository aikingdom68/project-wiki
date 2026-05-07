# Interactive Clarification Guidance

Project Wiki should ask questions when they prevent a wrong route, not as a ritual.

## Clarification rule

Ask the minimum number of questions needed to avoid partial landing.

Prefer 1-3 questions. If more than 3 questions seem necessary, first propose candidate routes and ask the user to choose.

## Ask when clarification is mandatory

Ask before execution when any of these are unclear:
- **Goal** — intake, explain, compare, evaluate, build/update wiki, query, bind project, check runtime, open admin GUI, import/normalize sources, compile graph, or publish/export
- **Deliverable** — read-only answer, intake summary, plan, decision memo, binding proposal, import plan, GUI/runtime plan, graph/export plan, or repository change proposal
- **Preferred source** — code/runtime, docs/wiki, existing Markdown, PDF/OCR sources, example bank, lecture notes, web exports, or another local corpus
- **Audience/depth** — beginner, maintainer, stakeholder, nontechnical KB curator, or implementation-level
- **Write intent** — whether the user wants actual repository edits or only a proposal
- **File mutation type** — create, edit, rename, rewrite, delete, import, normalize, export, or read-only
- **Runtime/dependency boundary** — whether GUI/runtime/adapters may be checked, installed, launched, or only planned
- **External processing boundary** — whether PDF/OCR/API/provider uploads are allowed, local-only, or forbidden
- **Retrieval/indexing policy** — direct search, structured index, hybrid retrieval, API synthesis, graph index, or no indexing change
- **Knowledge architecture** — whether the project should use a small wiki, software repo wiki, teaching KB, document corpus, AI knowledge app, product/business KB, or mixed structure
- **Taxonomy decisions** — chapter names, topic groups, category trees, or source ordering that will shape future retrieval

## Ask in this order

1. primary goal
2. preferred source or source authority
3. desired output artifact
4. whether repository changes are wanted and which mutation type is allowed
5. retrieval/indexing policy only if it affects durable structure
6. knowledge architecture or taxonomy only if it affects durable structure
7. audience/depth only if it materially affects structure

## Option-proposal pattern

When the request is broad, propose options like:
- **Option A — Explain first**: understand the project before changing anything
- **Option B — Evaluate first**: assess strengths, risks, and boundaries
- **Option C — Build/update wiki**: turn findings into durable knowledge pages

Then ask the user which route matches their intent best.

## Structure confirmation pattern

When Project Wiki is about to propose durable chapters, topic groups, source priority, or retrieval indexes, ask one concrete confirmation question before proceeding.

Use this shape:

```text
I currently see [evidence]. I recommend [candidate structure] because [reason]. Should I use this structure, or should it follow [alternative source/order] instead?
```

If the user cannot answer, keep the result as a provisional proposal and do not write files.

## Transparency rule

If clarification is still incomplete after one round:
- say what you understood
- say what remains uncertain
- propose the default route you would take
- ask the user to confirm or adjust it

## Good behavior

- `我先给你 3 条适合这个项目的路径，你选最接近的一条。`
- `我目前判断这是一个教学知识库项目，但还需要确认你是想先解释还是先建 wiki。`
- `如果你只想 read-only 评估，我先不进入更新方案。`

## Bad behavior

- asking many generic questions with no routing value
- pretending clarification is unnecessary when the user mixed several goals
- silently choosing build_wiki/update_wiki when the user did not authorize changes
- answering too deeply before the target artifact is clear
