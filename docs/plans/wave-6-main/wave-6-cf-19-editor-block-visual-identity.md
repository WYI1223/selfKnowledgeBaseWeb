# Wave 6 cf-19 — Editor block visual identity (v2-faithful card chrome + per-kind stripe + gutter shell)

> Wave 6 carry-forward — promotes the editor surface to the v2 `.gblock`
> card visual contract per /mnt/d/download/web/v2-styles.css:154-249,
> closes the per-kind hue gap for 3 heavy blocks, adds the gutter shell
> + kind chip so cf-20 can drop drag-handle/kebab buttons in without
> restructuring DOM.

## title

Restructure `packages/editor-shell/src/BlockNodeView.{tsx,css}` to emit
the v2 `.gblock` card chrome (border + radius + surface bg + hover lift
+ selected accent ring + per-kind 2px top stripe + `.gblock-gutter` shell
+ `.gblock-body` padding shell). Move the per-kind 2px top stripe up to
the wrapper so it sits flush at the card top edge; suppress the inner
component stripe inside the wrapper (single source of stripe truth on
the editor path; static read-route inner stripes preserved). Extend
`apps/site/playwright/sample-blocks-edit-loads.spec.ts` to lock the new
visual identity per kind (8 per-kind stripe probes / 7 unique computed
colors — callout + componentCode share the runnable hue per ADR-0018
D3 — + .gblock card chrome + gutter shell + chip text). Update sister-doc
`packages/editor-shell/CONTRACT.md` § Public surface to document the
new DOM contract and 7 public selectors. Plan-doc PR.md (this file)
records the design decisions, scope fences, and ADR-0011 D9 metadata
gate fields.

## files

8 source files (R2-applied PR; 18 in v0.1+v0.2+R2 cumulative diff):

1. `packages/editor-shell/src/BlockNodeView.tsx` — **MODIFY** (~70
   LOC). Restructure to emit a 3-element NodeView DOM:
   `<NodeViewWrapper class="skb-block-nodeview" data-skb-block-kind>` →
   `<.skb-block-nodeview__gutter contentEditable=false>` carrying
   `<.skb-block-nodeview__kind-chip data-skb-block-kind>` text
   (chipLabel collapses `componentCode` → `code`); then
   `<.skb-block-nodeview__body contentEditable=false data-skb-block-host>`
   wrapping the registered EditorView. The unregistered fallback shell
   carries the same gutter+chip+fallback structure with the
   `--unregistered` modifier class.

2. `packages/editor-shell/src/BlockNodeView.css` — **MODIFY** (~220
   LOC). Restructure from v0.1's outline-only to the full v2 `.gblock`
   card chrome: surface bg + 1px border + 7px radius + 8px margin-block
   + hover lift (border-strong + shadow-sm) + selected accent border
   + 2px accent-soft outer ring (via `box-shadow`) + focus-within soft
   accent border bridge. Per-kind 2px top stripe lives on the wrapper
   via `[data-skb-block-kind="<kind>"]` consuming ADR-0018 D3 hue
   tokens — 7 unique hue tokens with callout + componentCode sharing
   `--accent-runnable` per ADR-0018 D3:
   `--accent-runnable` (callout + componentCode) /
   `--accent-image` / `--accent-math` / `--accent-pdf` /
   `--accent-jupyter` / `--accent-nn-viz` / `--accent-agent-flow`. Inner-component stripe nesting suppression
   (R2 P3 fix): `.skb-block-nodeview [data-block]`/`[data-callout-variant]`/
   etc. selectors set `border-top: 0` so only the wrapper stripe
   renders on the editor path. Gutter chip per-kind tints + the
   wrapper-level `--accent-soft` shadow color use editor-local CSS
   custom properties scoped to `.skb-block-nodeview` itself (R2 P2
   honesty fix); they never escape the wrapper into the global token
   namespace.

3. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~80 LOC). Replace
   v0.1's "minimal outline" public-surface section with the v0.2 v2
   card chrome DOM contract + 7 public selectors. Documents the
   editor-local CSS variables introduced in BlockNodeView.css (chip
   tints + accent-soft shadow color), the inner-stripe suppression
   selector, and the chipLabel `componentCode` → `code` collapse.

4. `apps/site/playwright/sample-blocks-edit-loads.spec.ts` — **MODIFY**
   (~95 LOC delta). Restructure the cf-19 visual-identity assertion
   block from v0.1's "stripe-or-tint" weak check to 4 assertion
   families (R2 P4 fix): (a) per-kind wrapper stripe width≥2 + style
   solid + non-transparent color FOR ALL 8 KINDS, (b) **stripe colors
   are distinct across kinds** (7 unique because callout +
   componentCode share `--accent-runnable`), (c) v2 `.gblock` card
   chrome on wrapper (border-left, border-radius≥6, non-transparent
   surface bg, margin-block≥8), (d) gutter shell present + chip text
   matches kind (with `componentCode` → `code` collapse).

5. `apps/site/src/styles/global.css` — **UNCHANGED in R2** (carried
   from v0.1). Imports the 4 missing CSS files (3 heavy ui-default +
   editor-shell/BlockNodeView.css) so the wrapper rule + stripe
   tokens are reachable from the apps/site bundler.

6. `packages/editor-shell/package.json` — **R3 fix +1 line**:
   `exports['./BlockNodeView.css']` (v0.1, so consumers can
   `@import '@skb/editor-shell/BlockNodeView.css'`) PLUS
   `exports['./src/*': './src/*']` (R3 fix, restores deep-subpath
   compatibility for the 4 grid-* Playwright specs that import
   `@skb/editor-shell/src/drag-drop/edge-rects` etc. — without it,
   Node exports-map semantics block all unlisted subpaths and full
   `pnpm --filter @skb/site test:visual` fails collection with
   `Package subpath './src/...' is not defined by "exports"`).

7. `packages/block-{callout,code,image,math,pdf,jupyter,nn-viz,agent-flow}/src/ui-default/<kind>.css`
   — **UNCHANGED in R2** (carried from v0.1: 5 light blocks already
   shipped stripes pre-cf-19, 3 heavy blocks gained stripes in v0.1,
   inline math gained the canvas-soft tint in v0.1). The inner
   stripe rules remain authoritative for the static read-route
   `/notes/<slug>` Astro page (where the NodeView wrapper is absent);
   the editor-path nesting suppression selector in BlockNodeView.css
   (R2 P3 fix) zeroes them only when nested inside `.skb-block-nodeview`.

8. `docs/plans/wave-6-main/wave-6-cf-19-editor-block-visual-identity.md`
   — **NEW** (PR.md self; this file).

Plus `docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png`
re-emits with the v2 card chrome visible. Counts as a diff artifact,
not a numbered file.

## D2 trigger judgment

**Row 1 hit** (R2 self-correction; v0.2 PR.md said "row 4 only" which
was wrong): `packages/editor-shell/CONTRACT.md` is materially extended
with a new `### BlockNodeView wrapper styles` public-surface section
declaring 7 NEW public CSS selectors (`.skb-block-nodeview` +
`__gutter` + `__kind-chip` + `__body` + `--unregistered` +
`__fallback` + the per-kind `[data-skb-block-kind="<kind>"]` family)
and 4 editor-local CSS variables (`--skb-block-nodeview--accent-soft` +
`--chip-bg` + `--chip-border` + `--chip-text`). That is a CONTRACT.md change in
1 package per Row 1 → **PRE-COMMIT CLAUDE REVIEW (stage 4) fires**.
Codex-pr-reviewer-55 R1 caught the v0.2 mis-classification; R2 PR.md
records the corrected verdict so the orchestrator dispatch ledger is
accurate.

Row 2 N/A (no NEW deps). Row 4 N/A (no NEW ADR; consumes ADR-0018 D3
already-ratified hue tokens). Row 5 N/A (single-package CONTRACT
change; cross-package effects are CSS-import wiring only and stay
inside apps/site global.css already-existing import block).

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1
path pattern (BlockNodeView.tsx + BlockNodeView.css both under that
prefix); `apps/site/src/styles/**` matches as well. The strengthened
sample-blocks Playwright spec at file 4 satisfies the D9.2 e2e_smoke
obligation; the regen'd screenshot satisfies D9.5.

## e2e_smoke

- flow: `/notes/sample-blocks/edit` mount loads via the
    ApiAdapter chain (cf-18 NodeView wiring + cf-19 v0.2 wrapper
    chrome). Each of 8 component-block kinds now mounts inside a
    discrete v2 `.gblock` card with a per-kind 2px top stripe in
    its ADR-0018 D3 hue (8 per-kind stripe probes / 7 unique
    computed colors — callout + componentCode share the runnable
    145° hue per cf-19 D2 table). The
    `.skb-block-nodeview__gutter` shell renders top-left of every
    card with the kind chip text matching the kind name (with
    `componentCode` displayed as `code`). 4 sequential same-kind
    blocks (Callout note/tip/warning/danger) read as 4 distinct
    cards instead of one band.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-edit-loads.spec.ts:"sample-blocks edit route loads non-empty content (mdxFlowExpression no longer breaks)"
  screenshot_archive: docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png
  assertions:
    - .ProseMirror editor element is visible within 15s
    - editor textContent length is > 50 within 10s
    - editor contains "Wave 2 close acceptance criterion"
    - editor.locator('a').first() is visible (anchor preservation; cf-15a)
    - editor.locator('code').first() is visible (inline code mark; cf-15b)
    - the [data-skb-load-error] banner is NOT present
    - no `loadFromMdx`/`mdx-bridge` page console errors observed
    - 14 `[data-skb-block-host]` per-kind hosts present (cf-18)
    - none of the 14 NodeViews fell back to `.skb-block-nodeview--unregistered` (cf-18)
    - real-component DOM markers visible: PDF iframe, Image img, KaTeX, AgentFlow react-flow, Code `pre code` (cf-18)
    - cf-19 (a) per-kind wrapper stripe: width≥2 + style solid + color non-transparent for ALL 8 kinds
    - cf-19 (b) stripe colors are DISTINCT across kinds (7 unique, callout & componentCode intentionally share runnable hue)
    - cf-19 (c) `.skb-block-nodeview` v2 `.gblock` card chrome: border-left ≥1px solid + border-radius ≥6px + non-transparent surface bg + margin-block ≥8px each side
    - cf-19 (d) every kind has `.skb-block-nodeview__gutter` shell present
    - cf-19 (d) every kind's `.skb-block-nodeview__kind-chip` text matches the kind name (with `componentCode` collapsed to `code`)

## Why (user feedback)

> "B 具体风格参考 /mnt/d/download/web 里的 Block Editor v2.html，文件夹里的内容可以都适当看一下，都比较统一。"

The user rejected v0.1's minimal CSS-only approach and explicitly named the v2 reference design as the canonical visual contract source. v0.1 closed the heavy-block stripe gap + added a wrapper outline ring; user wants the **full v2 `.gblock` card treatment** so every block in the editor reads as a discrete card, not just a row of styled inner components.

## Design source

- `/mnt/d/download/web/v2-styles.css` (25 KB, 780 lines) — canonical visual contract (`.gblock`, `.gblock-body`, `.gblock-gutter`, `.gblock.k-*`, etc.)
- `/mnt/d/download/web/v2-design-granularity.md` (33 KB, 573 lines) — gatekeeper design-intent authority. Confirms: "Block 容器（`.gblock`）状态 — 默认 white bg, 1px border, radius 7px / hover border-strong + shadow-sm + gutter 显现 / selected accent border + 2px accent-soft outer ring".
- ADR-0018 — already pulled the v2 OKLCH tokens + Inter/JetBrains Mono into design-tokens. cf-19 v0.2 extends consumption to the editor surface card chrome.

## Decisions (v0.2 + R2 deltas)

### D1 — `.skb-block-nodeview` wrapper becomes the v2 `.gblock` card

`packages/editor-shell/src/BlockNodeView.css` ships:

- `background: var(--surface)` (white)
- `border: 1px solid var(--border)` + `border-radius: 7px` (matches v2-styles.css:165)
- `transition: box-shadow 120ms, border-color 120ms`
- `:hover` → `border-color: var(--border-strong)` + `box-shadow: var(--shadow-sm)` (v2-styles.css:171)
- `.ProseMirror-selectednode` → `border-color: var(--accent)` + `box-shadow: 0 0 0 2px var(--skb-block-nodeview--accent-soft)` (v2-styles.css:172; the `--skb-block-nodeview--accent-soft` is an editor-local CSS variable scoped to the wrapper — see R2 P2 honesty note in D2 below)
- `:focus-within` (descendant control focus) — softer 1px accent border bridge so jupyter Run / nn-viz range focus reads as block-active
- `padding: 0` on the wrapper itself; the inner block component manages its own padding via `.skb-block-nodeview__body` (R2: explicit class added; carried from v0.2)

### D2 — per-kind 2px top stripe via `.skb-block-nodeview[data-skb-block-kind=X]`

The stripe authority lives on the wrapper so the stripe sits flush at the card top edge (the v2 `.gblock.k-canvas { border-top: 2px solid ... }` model). **R2 P3 fix**: editor-path inner-component stripes are explicitly suppressed via `.skb-block-nodeview <inner-selector> { border-top: 0 }` — the wrapper is the single source of stripe truth on the editor path. The static read-route `/notes/<slug>` (where blocks render WITHOUT the NodeView wrapper) still gets its stripe from each block's inner CSS rule.

Per-kind table (consumes ADR-0018 D3 hue tokens):

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

(callout + componentCode intentionally share the runnable hue → only 7 unique stripe colors across 8 kinds. The Playwright distinctness assertion accounts for this.)

**R2 P2 honesty note — editor-local CSS variables**: BlockNodeView.css defines a small set of CSS custom properties scoped to `.skb-block-nodeview` itself (NOT global `:root`). They are the per-kind chip tints (`--skb-block-nodeview--chip-bg`, `--skb-block-nodeview--chip-border`, `--skb-block-nodeview--chip-text`) and the wrapper-level accent-soft shadow color (`--skb-block-nodeview--accent-soft`). Each kind redefines those variables on its own `[data-skb-block-kind="<kind>"]` selector. Rationale: they're editor-decoration-only and would balloon the global `@skb/design-tokens` token surface (24 NEW per-kind chip tokens + 1 accent-soft) without clear cross-package reuse. The introductory comment in BlockNodeView.css now declares this explicitly so reviewers can match the comment claim against the file content. design-tokens CONTRACT.md is unchanged; new global tokens are not introduced by this PR.

### D3 — `.skb-block-nodeview__gutter` shell DOM (cf-20 button drop-in scope)

Render an empty gutter shell so cf-20 can drop drag-handle / kebab buttons in without a re-layout PR. Per v2-styles.css:230-249:

- `position: absolute; top: 4px; left: 4px`
- `opacity: 0.45` baseline (raised from v2's 0.25 because the kind chip is currently the only visible affordance and we want it readable); `1` on `:hover` / `:focus-within` / selected
- `display: flex; gap: 2px`
- visible "kind tag" (small uppercase `data-skb-block-kind` text) in a chip + future drag handle position reserved

The chip renders the kind name (`callout`, `code`, `image`, etc.) so 4 sequential same-kind blocks remain visually identifiable as 4 individual blocks (the original "看起来还是一个块" complaint).

### D4 — `.skb-block-nodeview__body` padding shell (matches `.gblock-body`)

The host div emitted by BlockNodeView.tsx now carries class `skb-block-nodeview__body`. Default `padding: 28px 12px 8px` reserves 28px top for the absolutely-positioned gutter chip; canvas/image/heavy-family kinds (`image`/`pdf`/`math`/`jupyter`/`nn-viz`/`agent-flow`) drop side+bottom padding to `4px` per the v2 `.gblock-body.fit` analog (those blocks manage their own internal canvas).

### D5 — defer drag-handle interactions, kebab actions, resize handles, drop preview to cf-20+

Hard line. cf-19 ships visible chrome only; cf-20 (and beyond) wires the actual interactions. The DOM shells are designed so cf-20 doesn't need to restructure HTML.

### D6 — defer `.ProseMirror` → CSS Grid switch (open question)

**Open question for orchestrator** (called out per dispatch instruction):

The v2 contract has `.doc { display: grid; grid-template-columns: repeat(12, 1fr) }` on the document container, with each block placing itself via `grid-column` / `grid-row`. Our editor's `.ProseMirror` is currently a **flex column** wrapped in a `<GridContainer>` ancestor (per `apps/site/src/components/EditorShellMount.tsx:220-230`).

Switching `.ProseMirror` itself to CSS Grid would let blocks live in 12-col positions per their `col`/`colSpan`/`rowSpan` node attrs (which already exist post-Wave 5). But it interleaves with prose nodes (`<p>`/`<h2>`) inside the same parent — those would also have to gain grid placement. ProseMirror's NodeSelection / arrow-key navigation / selection highlight all assume vertical flow and would need re-validation under grid.

**Recommendation**: defer to cf-20 or cf-21 with a dedicated ADR-0017 amendment (or new ADR) that locks the editor-grid approach. cf-19 v0.2 ships the per-block card chrome which is correct in either layout (single-column or grid).

All sample-blocks fixtures use `colSpan=12` (full width) so cf-19 v0.2 visual identity is verifiable today without the grid switch.

## Acceptance

```bash
# AC-1: ADR-0011 D9 metadata gates pass (R2 P1 fix lock)
pnpm exec tsx scripts/check-e2e-coverage.ts 2>&1 | tail -3
# Expected: PASS (1 e2e_smoke entries verified)
pnpm exec tsx scripts/check-screenshot-archive.ts 2>&1 | tail -3
# Expected: PASS (1 screenshot verified ≥ 5KB)
```

```bash
# AC-2: ui_touch detected on the right files
pnpm exec tsx scripts/check-ui-touch.ts 2>&1 | tail -3
# Expected: ui_touch=true (packages/editor-shell/src/** + apps/site/src/styles/**)
```

```bash
# AC-3: editor-shell + apps/site test suites green
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 132 passed (carried)
pnpm --filter @skb/site test 2>&1 | grep -E 'Tests'
# Expected: 77 passed | 1 skipped (carried)
```

```bash
# AC-4: targeted Playwright passes with cf-19 v0.2 4-family assertion block
pnpm --filter @skb/site exec playwright test playwright/sample-blocks-edit-loads.spec.ts --reporter=line --workers=1 2>&1 | tail -3
# Expected: 1 passed
```

```bash
# AC-5: pnpm check exit 0 (modulo the documented pre-existing main lint
# error in grid-drag-drop.fixtures.ts:26)
pnpm typecheck && pnpm size-check && pnpm build
# Expected: all 3 PASS
```

```bash
# AC-6 (R2 P3 lock): inner-component stripe is suppressed inside the
# wrapper on the editor path. Each block CSS still ships its own
# border-top rule for the static read-route.
grep -c "border-top: 0" packages/editor-shell/src/BlockNodeView.css
# Expected: 1 (the `.skb-block-nodeview <inner> { border-top: 0 }` rule)
grep -c "border-top: 2px solid var(--accent-" packages/block-callout/src/ui-default/callout.css packages/block-code/src/ui-default/code.css packages/block-image/src/ui-default/image.css packages/block-math/src/ui-default/math.css packages/block-pdf/src/ui-default/pdf.css packages/block-jupyter/src/ui-default/jupyter.css packages/block-nn-viz/src/ui-default/nn-viz.css packages/block-agent-flow/src/ui-default/agent-flow.css
# Expected: 8 (one per inner block CSS for static read-route)
```

```bash
# AC-7 (R2 P2 lock): editor-local CSS variables stay scoped to
# .skb-block-nodeview; design-tokens is NOT modified by this PR.
git diff main..HEAD -- packages/design-tokens/ | wc -l
# Expected: 0 (no design-tokens changes)
```

```bash
# AC-8 (R2 P4 lock): per-kind stripe color distinctness asserted in
# Playwright (catches "all kinds share fallback color" / "wrong
# kind→hue mapping" regressions).
grep -c "stripe colors are distinct" apps/site/playwright/sample-blocks-edit-loads.spec.ts
# Expected: ≥1
```

## Open questions for orchestrator (continuing v0.1's list; updated for R2)

1. ~~**Push permission**~~ — resolved: orchestrator pushed v0.1.
2. **Per-block drag handle interactions** (D5 deferred): cf-20 PR. The DOM shell now lives in cf-19 v0.2 wrapper, so cf-20 only needs to wire pointer events + ProseMirror commands.
3. **Per-block kebab menu actions** (D5 deferred): cf-20 PR. Shell available.
4. **`.ProseMirror` CSS Grid switch** (D6, NEW): single-column visual identity is correct in either layout; recommend dedicated ADR amendment + cf-20+ PR. **STOP & ASK before implementing**.
5. **Pre-existing main lint error** (`apps/site/playwright/grid-drag-drop.fixtures.ts:26`): unchanged from v0.1. Suggest separate fix-forward PR.
6. **kind chip label text**: chip renders kind name (`callout` / `code` / `image` / etc.) with `componentCode` collapsed to `code`. Confirm before consumers bind to the chip text.
7. **Promote per-kind chip tints to `@skb/design-tokens`?** R2 P2 currently keeps them as editor-local CSS variables scoped to `.skb-block-nodeview`. If a future cf-21+ PR adds another consumer (e.g. an inspector panel that mirrors the chip), promote to `@skb/design-tokens` with an ADR amendment. Not in cf-19 scope.

## Out-of-scope

- All cf-20 interactions (drag-handle pointer wiring, kebab actions, resize handles, drop preview, edge-hint, drop-pulse).
- `.ProseMirror` → CSS Grid switch (D6 open question).
- Promoting per-kind chip tints into `@skb/design-tokens` (R2 P2 deferred).
- Fixing the pre-existing main lint error in `grid-drag-drop.fixtures.ts:26` (separate fix-forward).

## Related

- v0.1 commit: `e63659c` (per-kind heavy stripe + inline math tint + minimal wrapper outline)
- v0.2 commit: `0f0362a` (v2 `.gblock` card chrome + gutter shell + kind chip)
- ADR-0018 D3 — per-kind hue tokens (consumed by D2 wrapper rule)
- ADR-0011 D1 stage 4 + D9 — pre-commit Claude review trigger (Row 1 hit per R2 P1 self-correction) + ui_touch / e2e_smoke gates
- ADR-0017 D7 — drag handle (D5 cf-20 hookup; gutter shell prepared by cf-19 v0.2 D3)
- v2-styles.css `.gblock` `.gblock-body` `.gblock-gutter` `.gblock.k-*` — direct visual contract source
