# Task Routing Guidance

Project Wiki should route broad project requests into one primary task and optional supporting tasks.

## Primary task types

- `adapt_project`
- `propose_options`
- `explain`
- `evaluate`
- `compare`
- `decide`
- `build_wiki`
- `update_wiki`
- `source_guided_explain`
- `query`

## Routing heuristics

### Route to `adapt_project`
When the project is unfamiliar or the request is too broad to answer safely without first understanding the repo.

### Route to `propose_options`
When the user clearly wants help but the target artifact is still ambiguous.

### Route to `explain`
When the user mainly wants a grounded project/module/system explanation.

### Route to `evaluate`
When the user wants a quality judgment, risk review, boundary check, or migration assessment.

### Route to `compare`
When the user wants trade-offs between two or more options.

### Route to `decide`
When the user needs a recommendation with alternatives and trade-offs.

### Route to `build_wiki`
When no stable wiki exists yet and the user wants durable knowledge structure.

### Route to `update_wiki`
When a wiki exists and the user wants narrow, traceable changes.

### Route to `source_guided_explain`
When a preferred source is named and the explanation should preserve its reasoning style.

### Route to `query`
When a wiki/knowledge base already exists and the main need is evidence-backed answering with citations.

## Multi-intent rule

If a request mixes several goals:
1. choose one **primary** task
2. keep the others as supporting tasks
3. explain why that route is first
4. ask for confirmation when the route materially changes the outcome

## Repo-state-sensitive defaults

- **cold project + broad ask** -> `adapt_project` then `propose_options`
- **partial docs/wiki + architecture question** -> `explain`
- **mature wiki + focused question** -> `query`
- **preferred source named + style requested** -> `source_guided_explain`
- **request to improve docs/wiki with no clear write intent** -> `propose_options` before `build_wiki` or `update_wiki`
