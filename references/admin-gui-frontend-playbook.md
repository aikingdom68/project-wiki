# Admin GUI Frontend Playbook

This is the **implementation playbook** for the Admin GUI frontend (HTML/CSS/JS embedded in `scripts/admin.mjs`). It is the concrete companion to `admin-gui-contract.md`, which only defines API/safety boundaries.

Read this **before writing any frontend code** for a project-wiki Admin GUI. The patterns here come from production rebuilds — every rule below traces to a specific failure mode that has actually happened.

---

## When to read

- The user asks to build, redo, or polish the Admin GUI (`/admin` web UI).
- A previous Admin GUI build looks like generic AI output (cyan-on-dark, Inter, glowing card grids, `<pre>` JSON dumps).
- A graph visualization is collapsing into a dense ball or one corner.
- Layout looks empty on wide screens.
- User wants editing capability beyond append-only review queues.

If the user only wants to *check status*, `admin-gui-contract.md` is enough. This playbook is for *building or rebuilding the visual surface*.

---

## Mandatory preparation order

## Required preparation (works without any external skills)

The build sequence below is self-contained. The Anthropic `i-*` design skills (`i-impeccable`, `i-shape`, `i-polish`, etc.) are **optional accelerators** — if they happen to be installed, prefer them. If not, the inline checklists in this playbook are the substitute and produce the same artifacts.

### Step 1 — Establish design context

If `/i-impeccable teach` is available: run it; it writes `.impeccable.md` to the project root. Skip the inline form below.

Otherwise, **before writing any code**, answer the following six questions in plain text and save them to `.project-wiki/admin-design-context.md`. This is the substitute for `.impeccable.md`.

```text
1. Audience       — Who opens this Admin GUI? (e.g., "Chinese-speaking
                    teachers + students; mostly non-technical")
2. Job-to-be-done — Why do they open it? (e.g., "browse curated chapters,
                    occasionally fix a typo, check what evidence backs a claim")
3. Voice          — Three concrete adjectives for the brand. NOT
                    "modern" / "elegant" / "clean" — those are dead categories.
                    Pick something like "patient and warm and unfussy" or
                    "precise and quiet and engineering-minded".
4. Theme context  — When and where is it used? Bright office at noon → light.
                    Maintainer's home at midnight → dark. Default: light.
5. Anti-references— What should this NOT look like? (e.g., "not a generic
                    SaaS dashboard, not cyan-on-dark, not a product landing page")
6. Edit boundary  — Read-only? Append-only notes? Edit existing markdown?
                    Create new pages? Pick the smallest that meets the need.
```

### Step 2 — Pick a concrete aesthetic direction

Three known-good directions for project-wiki Admin GUIs (don't blend them, pick one):

- **教材纸感 / Textbook paper** — cream paper background, ink-warm text, serif headings, ink-blue accents. Best for teaching KBs read by beginners. **Default for teaching-kb projectType.**
- **工程文档干净版 / Clean docs** — light gray background, no rule lines, single accent (deep green or brick red), Stripe-Docs feel. Best for technical/maintainer KBs.
- **工坊深色版 / Workshop dark** — warm gray base, cream text, copper accent. **NOT cyan-on-dark.** Best for late-night maintainer-only KBs.

If the user wants something else, that is fine — but commit to one direction with explicit OKLCH tokens before writing CSS. Don't compromise into a beige average.

### Step 3 — Write a one-page design brief

If `/i-shape` is available: run it; it produces a structured brief through interview. Skip the inline template below.

Otherwise, fill in this template and save to `.project-wiki/admin-design-brief.md`:

```text
Feature summary    — one sentence
Primary user action— the single most important thing per page
Pages              — list of routes; for each: kicker, title, primary action,
                     empty state, error state
Layout strategy    — main width cap, sidebar width, reader column ratio
Vocabulary         — backend term → user-visible label mapping
                     (use the table further down in this playbook)
Edit boundary      — which writes are exposed; which require token; which
                     are forbidden
Motion             — none / subtle hover only / page-load reveal
Open questions     — anything unresolved; resolve before coding
```

### Step 4 — Then write code

Skipping any of steps 1-3 produces AI-slop output every time. Both the inline forms and the `/i-*` skills produce the same artifacts; the goal is the artifacts, not which tool created them.

---

## Hard constraints (CSP & embedding)

`admin.mjs` serves HTML/CSS/JS as inline strings with this exact CSP:

```text
default-src 'none';
script-src 'self';
style-src 'self';
connect-src 'self';
base-uri 'none';
form-action 'self';
frame-ancestors 'none';
```

Therefore:

- **No CDN.** No Google Fonts, no D3, no Cytoscape, no Tailwind. Anything that loads remote assets fails silently.
- **No inline `<script>`, no `<style>`, no `onclick=` / `onsubmit=` attributes.** All event handlers via `addEventListener`. All styles in the dedicated `<link rel="stylesheet">`.
- **No inline `style="..."` attributes** for layout decisions. Use classes; reserve inline `style` only for dynamically-computed values (e.g., legend swatch background from a CSS variable).
- **Template-string escaping.** The HTML/CSS/JS are inside backtick template literals in `admin.mjs`. Any literal `` ` `` must be `\``, any literal `${` must be `\${`. Easiest defense: avoid both inside the embedded code (use string concatenation instead of template literals in ADMIN_JS itself).
- **System fonts only.** Use a layered stack: `ui-serif, "Source Han Serif SC", "Noto Serif SC", "Songti SC", Cambria, Georgia, serif` for serif; `ui-sans-serif, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", system-ui, sans-serif` for sans. Never request Inter/Roboto/Open Sans by name.

---

## Visual system: avoid AI slop

Hard bans (every one of these has been the difference between "looks designed" and "AI made this"):

- **No `border-left: 3px solid var(--accent)`** stripe accents on cards/list items. Use full borders or background tints instead.
- **No `background-clip: text` gradient text.** Solid colors only.
- **No purple-blue gradients, no cyan-on-dark, no neon glow.**
- **No pure black `#000` or pure white `#fff`.** Use OKLCH with `chroma >= 0.01`.
- **No identical icon+heading+text card grids** repeated across the page.
- **No big rounded-rectangle drop-shadow cards** as a default container.
- **Tint neutrals toward brand hue.** `oklch(98% 0.012 85)` (warm paper) reads dramatically less generic than `#f5f5f5`.

Color tokens use OKLCH:

```css
--paper: oklch(98% 0.012 85);    /* warm paper bg */
--ink: oklch(22% 0.02 50);       /* warm ink text */
--ink-muted: oklch(55% 0.02 60);
--rule: oklch(86% 0.012 80);     /* hairline */
--link: oklch(40% 0.13 245);     /* ink blue accent */
```

Spacing scale is 4-based with semantic names: `--space-1` through `--space-8` mapping to `4 8 12 16 24 32 48 64 96`. Never inline `padding: 13px`.

---

## Plain-language vocabulary mapping (small-user friendly)

The contract layer uses precise technical terms. The GUI must translate them. Below is the canonical mapping for Chinese teaching-KB contexts. Adapt names to the actual user when the project differs.

| Backend / contract term | GUI label (Chinese) | GUI label (English fallback) |
|---|---|---|
| binding | 项目接入 | Project link |
| writeWhitelist | 可改的目录 | Editable folders |
| adapter (sourceNormalization / graph / export) | 三个工具：素材整理 / 知识图谱 / 导出小册 | Three tools: source / graph / export |
| readOnlyInspection | 只看不动 | Read-only |
| writeMode: append-only-curation | 只追加笔记，不动原稿 | Append-only |
| writeTokenRequired | 本机临时口令 | Local write token |
| inspectionLevel | (do not show) | (hide) |
| confidencePolicy / EXTRACTED / INFERRED | (do not show) | (hide) |
| review_queue_append | 加一条「待复习」 | Add review note |
| manual_override_append | 加一条「订正」 | Add correction |
| wiki_replace | 编辑文章并保存 | Edit & save |
| wiki_create | 新建一篇文章 | New page |
| nodeType: source-page | 证据页 | Evidence page |
| nodeType: chapter / topic / concept / example / error | 章节 / 话题 / 概念 / 示例 / 常见错误 | (mirror) |
| edge: cites / contains / demonstrated_by | 引用 / 包含 / 由示例说明 | (mirror) |
| graph state: configured / env_unavailable / missing | 就绪 / 尚未启用 / 缺产物 | Ready / Not enabled / Missing artifact |

**Never** dump raw JSON `<pre>` blocks at the user. Translate to a definition list (`<dl>`) with the labels above, or hide entirely.

---

## Page architecture

A complete teaching-KB Admin GUI has 6 routes. Skip ones that don't apply, but keep this order:

1. **总览 / Overview** — status badge, project type, graph stats, three-tool readiness, recently-edited list.
2. **教材结构 / Curriculum** — the curated wiki layer (e.g. `cpp-tutorial/`). With editing enabled when contract permits.
3. **素材证据 / Evidence** — the source/底稿 layer (e.g. `c-tutorial/`). Read-only.
4. **知识图谱 / Graph** — interactive node-link diagram (see graph rules below).
5. **找内容 / Search** — full-text across both layers via `/api/kb/admin/test-query`.
6. **系统体检 / Health** — the technical detail dump (binding, adapters, export plan). This is where raw-ish data is acceptable, formatted as `<dl>` not `<pre>`.

**Do not** use a card grid for the overview. Use a stat-row of intentional metrics (project type, graph nodes, graph edges, editable folders) plus two structured panels (tool readiness, recently-edited).

**Layout limits:**
- `.main { max-width: 1640px }`. Smaller than 1500 wastes wide screens; bigger than 1700 makes lines unreadable.
- `.lede { max-width: 64ch }` — keep introductory paragraphs comfortable to read.
- Two-column reader pages: `grid-template-columns: minmax(220px, 280px) 1fr` — list narrow, content wide.
- **Never nest two `overflow: auto` elements.** If `.reader-pane` already has `max-height + overflow`, the child view must NOT also be scrollable.

---

## Graph visualization rules

The graph is the riskiest visual surface. Production data sets have hit 487 nodes / 743 edges with one super-hub (degree 407). A naive force layout collapses every time. Use ALL these rules:

### Pre-layout: data filtering

- **Default-hide long-tail leaf types.** For teaching KBs, default-hide `source-page` (95% of nodes are degree-1 leaves attached to one index node). Show 92 meaningful nodes by default; let users toggle leaves on.
- **Filter visible nodes BEFORE running layout**, not after. Hidden nodes still pulling on the simulation will deform the visible cluster.

### Layout: forces

```text
Initial position: ring by node type
  ringR = min(W, H) * 0.36
  angle = (typeIndex / typeCount) * 2π + jitter

Repulsion: charge -380, falls off as 1/d²
Spring:    target length 90 + sqrt(deg_a + deg_b) * 4, k = 0.45
Center:    pull 0.035 * alpha
Velocity:  decay 0.40, max step 22
Collision: pad 4, applied AFTER position update each iter
Alpha:     start 1.0, decay 0.022 each iter, stop at 0.005
Iter cap:  220 if nodes>200, 320 otherwise
```

### Post-layout: fit-to-bounds (CRITICAL)

After the iteration loop, **always** rescale node positions to fill the canvas:

```js
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const n of nodes) { /* compute bbox */ }
const targetW = W - PAD * 2;
const targetH = H - PAD * 2;
const fitScale = Math.min(targetW / bbW, targetH / bbH) * 0.96;
// translate + scale all nodes into [PAD, W-PAD] × [PAD, H-PAD]
```

Without this step the graph collapses into a small central cluster regardless of force tuning. **This is the single most important fix for "节点都挤一团" complaints.**

### SVG and CSP

- viewBox `0 0 1600 1000`. Smaller viewBoxes (e.g. 1200×720) feel cramped on modern monitors.
- Canvas CSS height `clamp(560px, 78vh, 960px)`.
- Node colors via class (`.node-chapter`, `.node-source-page`, …) — set CSS variables for each type, fill from class. Never set `style="fill: ..."` on `<circle>`.
- Labels need `paint-order: stroke; stroke: var(--paper); stroke-width: 3px` to stay legible on top of nodes and edges.
- Show labels for top ~14 highest-degree nodes only; everyone else gets a hover/click detail panel.
- Pan: SVG `mousedown/mousemove/mouseup` updating a `<g transform>`. Zoom: `wheel` event, `passive: false`, multiply scale 0.9 / 1.1.

---

## Editing capability extension

When the user asks to "edit articles" or "add new articles", extend `safe-write.mjs` rather than introducing a new endpoint.

### Backend: `safe-write.mjs` patch pattern

1. Add new types to `SUPPORTED_OPERATIONS`: `wiki_replace`, `wiki_create`.
2. In `normalizeOperation`, branch on type. New ops carry `relativePath` + `content` (not `entry`). Validate:
   - `hasUnsafePath(relativePath)` blocks `..`, absolute paths, drive prefixes
   - extension is `.md` / `.markdown` / `.mdx`
   - content size ≤ `MAX_FILE_BYTES` (default 500_000)
3. In `buildPlan`, branch to `buildWikiPlan` for the new ops. It must:
   - call `ensureWritableTarget` (whitelist + symlink check + project-root check)
   - reject if `wiki_create` and file exists (409)
   - reject if `wiki_replace` and file missing (404)
   - normalize trailing newline
   - build `affectedFiles` with the same `affectedFile()` helper
   - append the same admin-log entry alongside

The existing `previewCurationOperation` / `applyCurationOperation` flow (preview → apply with previewId match, atomic write, backup, log) requires no changes — branch is fully inside `buildPlan`.

### Frontend: editing UI pattern

- **Token storage:** `sessionStorage[TOKEN_KEY]`. Survives reload, dies on tab close. Not localStorage (would persist across sessions).
- **Token entry:** topbar button toggles a modal containing a `<input type="password">`. Show "口令已设" badge in green (`oklch(48% 0.13 145)`) once set.
- **Two-step commit:** every write goes preview → apply. Both requests carry `x-project-wiki-admin-token` header and `Content-Type: application/json`.
- **Error translation:** all backend error codes get a Chinese-friendly map. Examples:
  - `ADMIN_WRITE_TOKEN_REQUIRED` → 写入口令不正确，请重新粘贴
  - `CURATION_TARGET_NOT_WHITELISTED` → 目标路径不在写白名单内
  - `CURATION_TARGET_EXISTS` → 这个文件已经存在
  - `CURATION_CONTENT_TOO_LARGE` → 内容超过 500KB 限制
- **Modal pattern:** one shared `#modal` div with `[hidden]` toggling, `Escape` key closes, backdrop click closes. Body content built via `createElement` (CSP forbids inline script that `innerHTML` could trigger).
- **Toast pattern:** transient bottom-right card with `data-tone="ok|error"`, auto-removed after 4s.
- **Edit-mode toggle:** view (`<div>` with `white-space: pre-wrap`) and edit (`<textarea>`) live in the same `<article class="reader-pane">`, toggled with `hidden`. Edit/Save/Cancel buttons in a sibling `.reader-actions` row.

---

## Build sequence (recommended)

1. **Establish design context** — run `/i-impeccable teach` if available; otherwise fill in the six-question form from the "Required preparation" section and save to `.project-wiki/admin-design-context.md`.
2. **Write a one-page design brief** — run `/i-shape` if available; otherwise fill in the brief template and save to `.project-wiki/admin-design-brief.md`. Explicitly name the aesthetic direction (paper / docs / workshop / custom).
3. **HTML skeleton** — topbar + sidebar + main with one `<section class="page" data-page="...">` per route. Use the vocabulary table above for all visible labels.
4. **CSS** — OKLCH tokens at the top of `:root`, system font stacks, spacing scale, then component classes. Mobile fallback `@media (max-width: 920px) { .layout { grid-template-columns: 1fr } }`.
5. **JS** — `setupNav` / `setupSearch` / `setupGraphControls` / `setupTokenButton` / `setupEditor` / `setupModal` invoked from `DOMContentLoaded`. Each route loads lazily on first navigation.
6. **Graph module** — implement the full force loop + fit-to-bounds before testing. Verify with realistic data, not toy data.
7. **Run `browser-use`** to actually open `127.0.0.1:<port>/admin` and screenshot. Do not assume "the code looks right". Specifically verify:
   - graph nodes fill the canvas (not collapsed in one corner)
   - layout uses the wide-screen real estate (not a 1100-wide column)
   - text is legible (not falling back to default sans on Chinese)
   - the "checked / unchecked / set token" states all render
8. **Editing capability** (if requested) — extend `safe-write.mjs` per the pattern above; add token modal + edit/save flow + new-page modal.
9. **Final polish pass** — run `/i-polish` if available, otherwise walk this checklist manually: alignment to grid, spacing consistency, all interactive states (default/hover/focus/active/disabled), copy consistency (same things named the same way), focus indicators visible, `prefers-reduced-motion` respected, no console errors.

---

## Diagnostic quick reference

| Symptom | Likely cause | Fix |
|---|---|---|
| Nodes collapsed into one corner / dense ball | Missing fit-to-bounds; super-hub pulling everything | Add bbox rescale step after iteration loop |
| Graph "doesn't move" / one giant fused circle | All 487+ source-page nodes shown by default | Default-hide leaf types; filter BEFORE layout |
| Right side of page is empty on wide monitors | `.main { max-width: 1100px }` | Bump to 1640px; keep `.lede` 64ch |
| Reader pane has two scrollbars | Both `.reader-pane` and child `.reader-view` set `overflow + max-height` | Only one wrapper scrolls |
| Page didn't change after restart | Browser loaded old bundle from cache, or you forgot port changed | Note new port from `admin:ready` JSON, hard reload |
| Edit save returns `ADMIN_WRITE_TOKEN_REQUIRED` | Token not set or stale | Open token modal, paste current `writeToken` |
| Edit save returns `CURATION_TARGET_NOT_WHITELISTED` | Path outside `writeWhitelist` patterns | Add target glob to project-wiki config |
| Chinese text renders in fallback sans (looks like SimSun) | Font stack missing PingFang/Microsoft YaHei | Use the layered stack from the constraints section |
| New labels appear truncated to "..." | Single-pass label budget too small for many high-degree nodes | Increase `labelCount` to 16-20; use stroke painted text |
| Layout flashes then snaps | Layout running on hidden page; or `applyGraphTransform` not called | Run layout only on `loadGraph()` invocation, not eagerly |

---

## Hard rules summary

- ALWAYS produce a design context note and a one-page design brief before writing frontend code (use `/i-impeccable teach` + `/i-shape` if installed; the inline templates above are equivalent substitutes).
- ALWAYS use OKLCH, system font stacks, and the small-user vocabulary table.
- ALWAYS add fit-to-bounds after force-layout iterations.
- ALWAYS verify with `browser-use` — screenshot before claiming done.
- NEVER load CDN assets, inline scripts, or `onclick=` attributes.
- NEVER use cyan-on-dark, gradient text, side-stripe borders, or icon-card grids.
- NEVER show raw JSON dumps to ordinary users; translate every backend term.
- NEVER limit `.main` below 1500px on wide layouts.
- NEVER nest scrollable containers.
