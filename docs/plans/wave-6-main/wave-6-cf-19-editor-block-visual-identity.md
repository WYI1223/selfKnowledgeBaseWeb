# Wave 6 cf-19 — Editor block visual identity (v2-faithful card chrome + per-kind stripe + gutter shell)

| field | value |
| --- | --- |
| status | DRAFT v0.2 (ux-ui-lead second pass 2026-05-09; user rejected v0.1 conservative scope and pointed at /mnt/d/download/web v2 reference) |
| executor | ux-ui-lead |
| ui_touch | true |
| e2e_smoke | true (extends `apps/site/playwright/sample-blocks-edit-loads.spec.ts`) |
| risk | D2 row 4 (no contract change beyond a documented css side-effect; CSS + 1 NodeView wrapper structure tweak; no propsSchema / parse / serialize touched) |
| pre_commit_claude_review | NOT required (no D2 row 1+4 trigger; CSS + DOM-shell-only change) |
| supersedes | The conservative v0.1 first cf-19 commit `e63659c` (kept on this branch as the foundation; v0.2 builds on it) |

## Why (user feedback)

> "B 具体风格参考 /mnt/d/download/web 里的 Block Editor v2.html，文件夹里的内容可以都适当看一下，都比较统一。"

The user rejected v0.1's minimal CSS-only approach and explicitly named the v2 reference design as the canonical visual contract source. v0.1 closed the heavy-block stripe gap + added a wrapper outline ring; user wants the **full v2 `.gblock` card treatment** so every block in the editor reads as a discrete card, not just a row of styled inner components.

## Design source

- `/mnt/d/download/web/v2-styles.css` (25 KB, 780 lines) — canonical visual contract (`.gblock`, `.gblock-body`, `.gblock-gutter`, `.gblock.k-*`, etc.)
- `/mnt/d/download/web/v2-design-granularity.md` (33 KB, 573 lines) — gatekeeper design-intent authority. Confirms: "Block 容器（`.gblock`）状态 — 默认 white bg, 1px border, radius 7px / hover border-strong + shadow-sm + gutter 显现 / selected accent border + 2px accent-soft outer ring".
- ADR-0018 — already pulled the v2 OKLCH tokens + Inter/JetBrains Mono into design-tokens. cf-19 v0.2 extends consumption to the editor surface card chrome.

## Decisions (v0.2)

### D1 — `.skb-block-nodeview` wrapper becomes the v2 `.gblock` card

`packages/editor-shell/src/BlockNodeView.css` is restructured (extending v0.1's file). The wrapper now ships:

- `background: var(--surface)` (white)
- `border: 1px solid var(--border)` + `border-radius: 7px` (matches v2-styles.css:165)
- `transition: box-shadow 120ms, border-color 120ms`
- `:hover` → `border-color: var(--border-strong)` + `box-shadow: var(--shadow-sm)` (v2-styles.css:171)
- `.ProseMirror-selectednode` → `border-color: var(--accent)` + `box-shadow: 0 0 0 2px var(--accent-soft)` (v2-styles.css:172)
- `:focus-within` (descendant control focus) — softer 1px accent border bridge so jupyter Run / nn-viz range focus reads as block-active
- `padding: 0` on the wrapper itself (the inner block component manages its own padding via `.gblock-body` analog)

### D2 — per-kind 2px top stripe via `.skb-block-nodeview[data-skb-block-kind=X]`

Move the stripe authority from each block's inner CSS up to the **wrapper**, so the stripe sits flush at the card top edge (the v2 `.gblock.k-canvas { border-top: 2px solid ... }` model). Inner block CSS stripe rules are kept (back-compat for the static read-route which doesn't ship the wrapper) but the wrapper rule wins specificity-wise on the editor path.

Per-kind table (consumes ADR-0018 D3 hue tokens; matches the previous decision lock):

| kind | wrapper rule | hue group |
| --- | --- | --- |
| `callout` | `--accent-runnable` (145°) | runnable |
| `componentCode` | `--accent-runnable` (145°) | runnable |
| `image` | `--accent-image` (60°) | image |
| `math` | `--accent-math` (280°) | canvas family |
| `pdf` | `--accent-pdf` (0°) | canvas family |
| `jupyter` | `--accent-jupyter` (90°) | canvas family |
| `nn-viz` | `--accent-nn-viz` (325°) | canvas family |
| `agent-flow` | `--accent-agent-flow` (180°) | canvas family |

(v2-styles.css:207-210 only had 4 group hues because v2 demo only had 4 kinds. ADR-0018 D3 already extended to 8 kinds, locking the math/pdf/jupyter/nn-viz/agent-flow hues.)

### D3 — `.skb-block-nodeview__gutter` shell DOM (cf-20 button drop-in scope)

Render an empty gutter shell so cf-20 can drop drag-handle / kebab buttons in without a re-layout PR. Per v2-styles.css:230-249:

- `position: absolute; top: 4px; left: 4px`
- `opacity: 0.25` baseline; `1` on `:hover` / `:focus-within` / selected
- `display: flex; gap: 2px`
- visible "kind tag" (small uppercase `data-skb-block-kind` text in a 22-wide chip) + a placeholder dot for the future drag handle position

The chip renders the kind name (`callout`, `code`, `image`, etc.) so 4 sequential same-kind blocks remain visually identifiable as 4 individual blocks (the original "看起来还是一个块" complaint).

### D4 — `.skb-block-nodeview__body` padding shell (matches `.gblock-body`)

The host div emitted by BlockNodeView.tsx already had no class. Add class `skb-block-nodeview__body` so v2's `padding: 4px 10px` analog can be applied to wrap the inner block component. For canvas / image / runnable family kinds, apply the v2 `.fit` rule (`padding: 0`) since those manage their own padding.

### D5 — defer drag-handle interactions, kebab actions, resize handles, drop preview to cf-20+

Hard line. cf-19 ships visible chrome only; cf-20 (and beyond) wires the actual interactions. The DOM shells are designed so cf-20 doesn't need to restructure HTML.

### D6 — defer `.ProseMirror` → CSS Grid switch (open question)

**Open question for orchestrator** (called out per dispatch instruction):

The v2 contract has `.doc { display: grid; grid-template-columns: repeat(12, 1fr) }` on the document container, with each block placing itself via `grid-column` / `grid-row`. Our editor's `.ProseMirror` is currently a **flex column** wrapped in a `<GridContainer>` ancestor (per `apps/site/src/components/EditorShellMount.tsx:220-230`).

Switching `.ProseMirror` itself to CSS Grid would let blocks live in 12-col positions per their `col`/`colSpan`/`rowSpan` node attrs (which already exist post-Wave 5). But it interleaves with prose nodes (`<p>`/`<h2>`) inside the same parent — those would also have to gain grid placement. ProseMirror's NodeSelection / arrow-key navigation / selection highlight all assume vertical flow and would need re-validation under grid.

**Recommendation**: defer to cf-20 or cf-21 with a dedicated ADR-0017 amendment (or new ADR) that locks the editor-grid approach. cf-19 v0.2 ships the per-block card chrome which is correct in either layout (single-column or grid).

All sample-blocks fixtures use `colSpan=12` (full width) so cf-19 v0.2 visual identity is verifiable today without the grid switch.

## Files modified (planned, building on v0.1 commit `e63659c`)

| file | change |
| --- | --- |
| `packages/editor-shell/src/BlockNodeView.css` | restructure to v2 `.gblock` card chrome + per-kind stripe via wrapper attr selector + gutter shell |
| `packages/editor-shell/src/BlockNodeView.tsx` | wrap inner host with `.skb-block-nodeview__body` class + render `.skb-block-nodeview__gutter` shell with kind chip |
| `packages/editor-shell/CONTRACT.md` | extend the BlockNodeView wrapper styles section with v2 card chrome contract + gutter shell + kind chip |
| `apps/site/playwright/sample-blocks-edit-loads.spec.ts` | extend assertions: per-kind wrapper stripe, gutter shell present, kind chip text matches kind |
| `docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png` | regenerate |

(v0.1's already-shipped CSS edits to block-jupyter / block-nn-viz / block-agent-flow / block-math + global.css imports all stay — they remain authoritative for the static read-route, and the wrapper stripe just gives the editor-mount path the visual flush.)

## Acceptance

- `.skb-block-nodeview` has `border: 1px solid var(--border)` + `border-radius: 7px` + `background: var(--surface)`
- `.skb-block-nodeview[data-skb-block-kind="<kind>"]` has correct per-kind `border-top: 2px solid var(--accent-X)` for all 8 kinds
- `.skb-block-nodeview:hover` has `border-color: var(--border-strong)` + non-`none` box-shadow
- `.skb-block-nodeview.ProseMirror-selectednode` has `border-color: var(--accent)` + non-`none` box-shadow
- `.skb-block-nodeview__gutter` is present in DOM with `data-skb-block-kind` chip text matching the kind
- `pnpm check` PASS (modulo the one pre-existing main lint error documented in v0.1 ACCEPT)
- Targeted Playwright PASS
- Screenshot regenerated

## Open questions for orchestrator (continuing v0.1's list)

1. ~~**Push permission**~~ — resolved: orchestrator pushed v0.1.
2. **Per-block drag handle interactions** (D5 deferred): cf-20 PR. The DOM shell now lives in cf-19 v0.2 wrapper, so cf-20 only needs to wire pointer events + ProseMirror commands.
3. **Per-block kebab menu actions** (D5 deferred): cf-20 PR. Shell available.
4. **`.ProseMirror` CSS Grid switch** (D6, NEW): single-column visual identity is correct in either layout; recommend dedicated ADR amendment + cf-20+ PR. **STOP & ASK before implementing**.
5. **Pre-existing main lint error** (`grid-drag-drop.fixtures.ts:26`): unchanged from v0.1. Suggest separate fix-forward.
6. **kind chip label text**: chip renders kind name (`callout` / `code` / `image` / etc.). Confirm before consumers bind to it. v2 design uses tiny mono uppercase per kind glyph in palette (v2-styles.css:75-78); we adopt the same monospaced uppercase treatment scaled into the gutter chip.

## Related

- v0.1 commit: `e63659c` (per-kind heavy stripe + inline math tint + minimal wrapper outline)
- ADR-0018 D3 — per-kind hue tokens (consumed by D2 wrapper rule)
- ADR-0017 D7 — drag handle (D5 cf-20 hookup; gutter shell prepared by cf-19 v0.2 D3)
- v2-styles.css `.gblock` `.gblock-body` `.gblock-gutter` `.gblock.k-*` — direct visual contract source
