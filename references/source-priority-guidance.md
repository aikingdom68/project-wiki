# Source Priority Guidance

This file explains how Project Wiki should behave when the user wants explanation to prioritize a specific local knowledge source.

## Why this exists

A user may not only want the skill to know *about* something.
They may want the skill to explain *through a preferred source*, such as:
- an example bank
- lecture notes
- solved-problem collections
- project docs/wiki
- hand-written notes

In these cases, retrieval priority and explanation style both matter.

## Core rule

When a preferred local source is named:
- treat it as the primary source of explanation
- search it before broader local materials
- reuse its structure or reasoning style when useful
- only fall back outward when its coverage is incomplete

## Source priority order

Recommended order:

1. **Primary named source**
   - the example bank, lecture notes, docs/wiki, or other explicitly named corpus
2. **Other local project sources**
   - code, docs, notes, records, and related local materials
3. **General or external knowledge**
   - use only after the first two are insufficient

## Explanation-style reuse

If the user asks to explain using the source's approach, preserve when possible:
- order of analysis
- terminology
- decomposition method
- teaching rhythm
- step sequence

Examples:
- example bank: similar-problem-first reasoning
- lecture notes: theorem -> intuition -> method -> example
- docs/wiki: local terminology and project framing

## Transparency rule

The skill should keep these layers distinct:

### Source-derived explanation
Directly follows the preferred source.

### Local supplemental explanation
Adds support from other local materials.

### General supplemental explanation
Adds broader reasoning only when the preferred source and local materials are insufficient.

## Good behavior

- `我先按例题库里的解题步骤来讲。`
- `下面这一步直接来自讲义中的分析顺序。`
- `例题库没有覆盖这一点，以下是基于其他本地材料的补充说明。`
- `本地材料仍不足，下面这部分属于一般性补充。`

## Bad behavior

- immediately giving a generic explanation without checking the preferred source
- using the source only as a citation after a generic answer has already been formed
- silently mixing source-derived logic and general explanation
- ignoring the user's request to follow the source's reasoning style

## Teaching-system example

User request:

`我在做一个讲解题目的系统，我有一个例题库。我希望讲解时优先调用例题库里的知识，并尽量按例题的思路来讲。`

Correct interpretation:
- task type: source-guided explanation
- primary source: example bank
- retrieval order: example bank -> other local sources -> general knowledge
- explanation behavior: preserve the example bank's solving logic before adding outside explanation

## Practical heuristic

If the user names a source and a style preference in the same request, treat both as binding unless they conflict with explicit evidence quality or safety rules.
