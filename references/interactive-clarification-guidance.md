# Interactive Clarification Guidance

Project Wiki should ask questions when they prevent a wrong route, not as a ritual.

## Clarification rule

Ask the minimum number of questions needed to avoid partial landing.

Prefer 1-3 questions. If more than 3 questions seem necessary, first propose candidate routes and ask the user to choose.

## Ask when clarification is mandatory

Ask before execution when any of these are unclear:
- **Goal** — explain, compare, evaluate, build wiki, update wiki, or query
- **Deliverable** — read-only answer, plan, decision memo, or repository change proposal
- **Preferred source** — code/runtime, docs/wiki, example bank, lecture notes, or another local corpus
- **Audience/depth** — beginner, maintainer, stakeholder, or implementation-level
- **Write intent** — whether the user wants actual repository edits or only a proposal

## Ask in this order

1. primary goal
2. preferred source or source authority
3. desired output artifact
4. whether repository changes are wanted
5. audience/depth only if it materially affects structure

## Option-proposal pattern

When the request is broad, propose options like:
- **Option A — Explain first**: understand the project before changing anything
- **Option B — Evaluate first**: assess strengths, risks, and boundaries
- **Option C — Build/update wiki**: turn findings into durable knowledge pages

Then ask the user which route matches their intent best.

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
