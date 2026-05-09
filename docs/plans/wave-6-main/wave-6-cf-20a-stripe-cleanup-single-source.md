# Wave 6 cf-20a — Block-chrome single source of truth (extract to `block-chrome.css`; wrap read route in `.skb-block-static`)

> Wave 6 carry-forward — closes cf-19 R2 P3's "stripe coexistence
> with nested suppression" into a true single source. The card chrome
> (border / radius / hover / per-kind 2px stripe) now lives in ONE
> file `@skb/editor-shell/src/block-chrome.css` selecting on BOTH
> `.skb-block-nodeview` (editor wrapper) AND `.skb-block-static`
> (read-route wrapper emitted by the makeMdxAdapter + the 3 heavy
> Astro wrappers). 8 inner-component stripe rules + the editor-side
> nested-suppression block are deleted.

## title

Extract the v2 `.gblock` card chrome from cf-19's editor-only
`@skb/editor-shell/BlockNodeView.css` into a NEW shared module
`@skb/editor-shell/src/block-chrome.css` whose two
`.skb-block-{nodeview,static}[data-skb-block-kind="<kind>"]` selectors
paint identical chrome on the edit and read routes. Modify
`apps/site/src/lib/mdx-adapter.ts` `makeMdxAdapter(RenderView, kind)`
to wrap each light-block render in
`<div class="skb-block-static" data-skb-block-kind="<kind>">`; modify
the 3 heavy block Astro wrappers (`Jupyter.astro` / `NnViz.astro` /
`AgentFlow.astro`) to wrap their islands the same way. Delete the
`border-top: 2px solid var(--accent-X)` rule from each of the 8 block
packages' `ui-default/<kind>.css` files (callout / code / image /
math display-mode / pdf / jupyter / nn-viz / agent-flow). Delete the
cf-19 R2 P3 nested-suppression block from `BlockNodeView.css` (no
longer needed because the inner stripes are gone). Add the new
`block-chrome.css` exports entry to `@skb/editor-shell/package.json`
and import it explicitly in `apps/site/src/styles/global.css` so the
read route resolves the chrome even when no editor mounts. Strengthen
the cf-19 sample-blocks-edit-loads Playwright spec with a clarifying
cf-20a comment block; add a NEW `apps/site/playwright/sample-blocks-read.spec.ts`
that asserts read-route `.skb-block-static` carries the same v2 chrome.
Update `block-code/src/ui-default/theme-tokens.ts` to drop the now-unused
`border` token (`code.css` no longer consumes `var(--color-border)`);
update editor-shell + 8 block CONTRACT.md + apps/site CONTRACT.md to
record the chrome-handover sister-doc per ADR-0006 #6. Re-emit the
cf-19 edit-route screenshot + emit a NEW
`docs/audits/screenshots/wave-6-cf-20a-sample-blocks-read.png`. Update
the `c3-2-block-hues.spec.ts` selector targets from inner-element
selectors to the new `.skb-block-static[data-skb-block-kind="<kind>"]`
wrapper since the stripe authority moved.

## files

20 source files (~330 LOC net, mostly extraction + comment updates;
236 deletions vs 310 insertions per the rewritten CSS files):

1. `packages/editor-shell/src/block-chrome.css` — **NEW** (~131 LOC).
   Single source of card geometry + per-kind 2px top stripe + read-route
   body padding. Selectors paired between
   `.skb-block-nodeview[data-skb-block-kind="<kind>"]` (cf-19's
   editor wrapper) and `.skb-block-static[data-skb-block-kind="<kind>"]`
   (cf-20a's NEW read-route wrapper) so both routes resolve the same
   per-kind hue token. 7 ADR-0018 D3 hue tokens consumed (callout +
   componentCode share `--accent-runnable` per cf-19 D2 = 7 unique
   colors across 8 kinds). Read-route `.skb-block-static` gets a
   default `padding: 12px` body shell with the canvas/heavy family
   collapsing to `padding: 4px; padding-top: 12px` mirroring
   `BlockNodeView.css`'s `__body` per-kind rules.

2. `packages/editor-shell/src/BlockNodeView.css` — **MODIFY**
   (~160 LOC; previously 277). Imports the shared chrome via
   `@import './block-chrome.css'` at the top, then keeps ONLY the
   editor-mount-specific affordances: ProseMirror selected-node accent
   ring, focus-within border bridge, per-kind chip tint redefinitions
   (4 editor-local CSS variables), gutter shell + kind chip layout,
   body padding (offsets the absolutely-positioned gutter chip),
   unregistered fallback placeholder. The 8-line cf-19 R2 P3
   `.skb-block-nodeview <inner-selector> { border-top: 0 }` nested-
   suppression block is DELETED — inner stripes are gone so there is
   nothing to suppress.

3. `packages/editor-shell/package.json` — **MODIFY** (+1 LOC).
   `exports['./block-chrome.css': './src/block-chrome.css']` added so
   `apps/site/src/styles/global.css` can `@import '@skb/editor-shell/block-chrome.css'`
   directly. The existing `./src/*` glob would technically resolve it
   too but the explicit entry documents the public contract.

4. `apps/site/src/lib/mdx-adapter.ts` — **MODIFY** (~35 LOC). Adds
   second `kind: BlockKindForChrome` parameter to `makeMdxAdapter`.
   The returned component now wraps the inner RenderView in
   `<div class="skb-block-static" data-skb-block-kind="<kind>">`.
   `BlockKindForChrome` is exported as the union of the 5 light-block
   BlockKind literals (`'callout' | 'componentCode' | 'image' | 'math' | 'pdf'`).

5. `apps/site/src/components.ts` — **MODIFY** (~20 LOC). Each of the
   5 `makeMdxAdapter(...)` calls now passes the BlockKind literal:
   `'callout'`, `'componentCode'` (cf-15b internal name; matches
   editor-side `data-skb-block-kind` exactly), `'image'`, `'math'`,
   `'pdf'`.

6. `apps/site/src/components/Jupyter.astro` — **MODIFY** (~5 LOC
   addition). Wraps `<JupyterIsland client:load {...Astro.props} />`
   in `<div class="skb-block-static" data-skb-block-kind="jupyter">`.

7. `apps/site/src/components/NnViz.astro` — **MODIFY** (~5 LOC
   addition). Same wrap with `data-skb-block-kind="nn-viz"`.

8. `apps/site/src/components/AgentFlow.astro` — **MODIFY** (~5 LOC
   addition). Same wrap with `data-skb-block-kind="agent-flow"`.

9. `apps/site/src/styles/global.css` — **MODIFY** (~12 LOC). Adds
   `@import '@skb/editor-shell/block-chrome.css'` BEFORE the existing
   `BlockNodeView.css` import so the chrome is reachable even when no
   editor mounts (read-only `/notes/<slug>` pages).

10. `packages/block-callout/src/ui-default/callout.css` — **MODIFY**
    (~10 LOC). Removes `border: 1px solid rgb(var(--color-border)) /
    border-top: 2px solid var(--accent-runnable) / border-radius /
    box-shadow` from `[data-callout-variant]`. Keeps callout-specific
    layout (flex padding + variant accent bar + variant tints + focus
    ring + reduced-motion). Adds cf-20a chrome-handover comment block.

11. `packages/block-code/src/ui-default/code.css` — **MODIFY** (~9
    LOC). Removes `border / border-top / border-radius` from
    `[data-code-language]`. Keeps code-specific layout (flex column +
    inner `<pre>` / lineno + theme).

12. `packages/block-image/src/ui-default/image.css` — **MODIFY**
    (~8 LOC). Removes `border-top: 2px solid var(--accent-image)`
    from `[data-image-loading]`. Keeps grid layout + caption + figure
    max-width.

13. `packages/block-math/src/ui-default/math.css` — **MODIFY** (~12
    LOC). Removes `border-top: 2px solid var(--accent-math)` from
    `[data-block='math'][data-display='true']`. Keeps display math
    block layout (`display: block; margin; padding; overflow-x: auto`)
    AND inline math `--canvas-soft` background tint (which is
    independent of the chrome stripe — inline math doesn't get a
    `.skb-block-static` wrap because MDX inline elements aren't
    routed through the adapter).

14. `packages/block-pdf/src/ui-default/pdf.css` — **MODIFY** (~10
    LOC). Removes `border / border-top / border-radius` from
    `[data-block='pdf']`. Keeps iframe surface bg + iframe min-height
    70vh + searchable error fallback.

15. `packages/block-jupyter/src/ui-default/jupyter.css` — **MODIFY**
    (~14 LOC). Removes `border / border-top / border-radius` from
    `[data-block='jupyter']`. Keeps padding + monospace font +
    toolbar + Run button + status + line numbers + output streams.

16. `packages/block-nn-viz/src/ui-default/nn-viz.css` — **MODIFY**
    (~14 LOC). Removes `border / border-top / border-radius` from
    `[data-block='nn-viz']`. Keeps padding + sans font + status +
    canvas + layer + edge + label + slider controls.

17. `packages/block-agent-flow/src/ui-default/agent-flow.css` —
    **MODIFY** (~14 LOC). Removes `border / border-top / border-radius`
    from `[data-block='agent-flow']`. Keeps padding + sans font +
    toolbar + status + canvas + svg + per-node-type strokes.

18. `packages/block-code/src/ui-default/theme-tokens.ts` — **MODIFY**
    (~12 LOC). Drops `border: 'border'` from `CODE_THEME_TOKENS`
    because `code.css` no longer consumes `var(--color-border)` after
    the chrome handover (handed off to `block-chrome.css` which uses
    the editor-shell-local `var(--border, oklch(...))` chain instead
    of the `rgb(var(--color-border))` design-tokens chain). Required
    by `theme-tokens.test.ts`'s "manifest key-set is byte-equal to
    `var(--color-*)` refs from code.css" invariant.

19. `apps/site/playwright/sample-blocks-edit-loads.spec.ts` — **MODIFY**
    (~20 LOC comment additions). Adds a clarifying cf-20a comment
    block above the cf-19 v0.2 + R2 visual probe section noting that
    the wrapper-rule + nested-suppression coexistence is gone; the
    existing assertions still pass because the wrapper still paints
    the stripe (now sourced from the shared `block-chrome.css`).

20. `apps/site/playwright/sample-blocks-read.spec.ts` — **NEW**
    (~145 LOC). Read-route chrome lock. Probes
    `.skb-block-static[data-skb-block-kind="<kind>"]` for all 8 kinds
    on `/notes/sample-blocks` and asserts: (a) per-kind 2px+ wrapper
    stripe present + solid + non-transparent, (b) 7 unique stripe
    colors across 8 kinds (callout + componentCode share runnable
    hue), (c) v2 `.gblock` card chrome on wrapper (border-left ≥ 1px
    solid + border-radius ≥ 6px + non-transparent surface bg +
    margin-block ≥ 8px). Emits screenshot to
    `docs/audits/screenshots/wave-6-cf-20a-sample-blocks-read.png`.

21. `apps/site/src/__tests__/e2e/c3-2-block-hues.spec.ts` — **MODIFY**
    (~25 LOC). Updates the 5 `blockHueTargets` selectors from the
    pre-cf-20a inner-element selectors (`[data-callout-variant]`,
    `[data-code-language]`, `[data-image-loading]`,
    `[data-block="math"][data-display="true"]`, `[data-block="pdf"]`)
    to the new `.skb-block-static[data-skb-block-kind="<kind>"]`
    wrapper selectors. The hue assertion semantics unchanged (the
    hue is the same; the DOM owner moved one level out). Comment
    block records the migration rationale.

22. `packages/editor-shell/CONTRACT.md` — **MODIFY** (~89 LOC delta).
    Replaces cf-19's "BlockNodeView wrapper styles (cf-19 v0.2 + R2)"
    section with a cf-20a-aware version that documents BOTH stylesheets
    (`block-chrome.css` shared + `BlockNodeView.css` editor-only) and
    the rule split. The "Per-block stripe coexistence + nested-suppression
    rule (R2 P3 fix)" subsection is replaced by "Per-block stripe single
    source (Wave 6 cf-20a 2026-05-09)" describing the deletion and the
    new pairing pattern.

23. `apps/site/CONTRACT.md` — **MODIFY** (~16 LOC delta).
    "Component-block rendering" section updated with the
    `makeMdxAdapter(RenderView, kind)` 2-arg signature + the
    `.skb-block-static` wrap fact + the 3 heavy block Astro wrappers'
    own `.skb-block-static` shells.

24. `packages/block-{callout,code,image,math,pdf,jupyter,nn-viz,agent-flow}/CONTRACT.md`
    — **MODIFY** (8 files; ~5 LOC delta each). Each block CONTRACT's
    `./ui-default/<kind>.css` line gains a "Wave 6 cf-20a (2026-05-09)
    chrome handover" addendum naming `block-chrome.css` as the
    canonical chrome single source and listing what was deleted. The
    callout + code "CSS = single visual authority" invariants are
    similarly amended to acknowledge the chrome split.

25. `docs/plans/wave-6-main/wave-6-cf-20a-stripe-cleanup-single-source.md`
    — **NEW** (PR.md self; this file).

Plus 2 screenshot artifacts (counted as diff artifacts, not numbered
files):
- `docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png` —
  re-emitted by the cf-19 spec which now resolves the chrome through
  the shared module (visual identity unchanged for sample-blocks
  fixtures).
- `docs/audits/screenshots/wave-6-cf-20a-sample-blocks-read.png` — NEW,
  emitted by the new read-route spec.

Plus minor visual-smoke screenshot byte deltas in `apps/site/playwright/visual-smoke-baseline/` and `docs/audits/screenshots/wave-5-*.png` (re-emitted by their respective specs at full-suite run; visual delta below the c3-5 baseline-diff < 5% threshold).

## D2 trigger judgment

- **Row 1 (CONTRACT.md change in N packages)** — HIT: 10 CONTRACT.md
  files modified (`@skb/editor-shell` + 8 block-* + `apps/site`).
- **Row 2 (NEW deps)** — N/A (no new deps; new exports map entry but
  no new external deps).
- **Row 4 (NEW ADR or amendment)** — N/A (consumes ADR-0018 D3
  already-ratified hue tokens; consumes the v2-styles.css canonical
  visual contract authority via existing ADR-0018; does not amend).
- **Row 5 (cross-package: ≥ 3 packages)** — HIT: 11 packages touched
  (`@skb/editor-shell` + 8 block-* + `apps/site` + the 5 block-* CSS
  files all participate).

Per CLAUDE.md `## Review workflow` + ADR-0011 D1 stage 4 + the
2026-05-09 retrospective rule "ux-ui-lead is dispatched at PLAN, not
REVIEW", **PRE-COMMIT CLAUDE REVIEW (stage 4) fires** on Row 1 + Row 5.
ux-ui-lead authored this PLAN end-to-end. Stage 3 codex-pr-reviewer-55
review still required.

## ui_touch

`true` — `packages/editor-shell/src/**` matches the ADR-0011 D9.1 path
pattern (`block-chrome.css` + `BlockNodeView.css`); `apps/site/src/**`
matches as well (`components.ts`, `lib/mdx-adapter.ts`, the 3
`components/*.astro`, `styles/global.css`, the modified `c3-2` spec,
and the new `playwright/sample-blocks-read.spec.ts`); 8
`packages/block-*/src/ui-default/<kind>.css` modifications also count
as visual surface changes.

The strengthened sample-blocks-edit-loads spec PLUS the NEW
sample-blocks-read spec satisfy the D9.2 e2e_smoke obligation; both
emit screenshots at D9.5-compliant paths.

## e2e_smoke

- flow_a: `/notes/sample-blocks/edit` mount loads via the
    ApiAdapter chain (cf-18 NodeView wiring + cf-19 v0.2 wrapper
    chrome). Each of 8 component-block kinds mounts inside a discrete
    v2 `.gblock` card with a per-kind 2px top stripe in its
    ADR-0018 D3 hue. Post-cf-20a the chrome is sourced from the shared
    `block-chrome.css` instead of `BlockNodeView.css` directly, but
    the user-visible result is byte-identical.
  target_url: /notes/sample-blocks/edit
  playwright_spec: apps/site/playwright/sample-blocks-edit-loads.spec.ts:"sample-blocks edit route loads non-empty content (mdxFlowExpression no longer breaks)"
  screenshot_archive: docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png
  assertions: (cf-19 list preserved verbatim; cf-20a clarifying
    comment added above the visual-probe section; assertions
    themselves unchanged because the chrome rule still paints the
    same stripe — just from a shared module now)

- flow_b: `/notes/sample-blocks` (read route) renders 14 component
    blocks each wrapped in `.skb-block-static[data-skb-block-kind="<kind>"]`
    via `apps/site/src/lib/mdx-adapter.ts` (5 light blocks) and the
    3 heavy-block Astro wrappers `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`.
    The wrapper carries the same v2 `.gblock` chrome (border + radius
    + per-kind stripe) as the editor route; this lock spec catches
    chrome drift between routes (the failure mode that made the user
    say "全部对齐 v2" — pre-cf-20a inner-component CSS painted a
    different chrome than the editor wrapper, so routes drifted).
  target_url: /notes/sample-blocks
  playwright_spec: apps/site/playwright/sample-blocks-read.spec.ts:"sample-blocks read route shares v2 .gblock chrome via .skb-block-static (cf-20a single source)"
  screenshot_archive: docs/audits/screenshots/wave-6-cf-20a-sample-blocks-read.png
  assertions:
    - .skb-block-static first wrapper visible within 15s
    - per-kind 2px+ top stripe on all 8 kinds
       (callout / componentCode / image / math / pdf / jupyter / nn-viz / agent-flow)
    - stripe colors are DISTINCT across kinds: 7 unique computed
       colors (callout + componentCode share `--accent-runnable`)
    - callout and componentCode resolve to the same `borderTopColor`
       (sanity for the runnable-hue sharing pair)
    - v2 `.gblock` card chrome: border-left ≥ 1px solid + border-radius ≥ 6px + non-transparent surface bg + margin-block ≥ 8px each side
    - no console errors mentioning `skb-block-static` or `block-chrome`

## Why (user feedback)

Verbatim user directive 2026-05-09:

> "把 defer 的做完。... 全部做，不允许 defer，必须保质保量，出现问题会直接让你推翻重写。这部分做完之后，把 edit 和正常模式风格统一一下。还有个比较关键的，就是把侧边 Component library sidebar，固定在编辑器旁边的 block 库侧栏补全，全部按照 web 文件夹里的风格来。遇到问题就解决问题，不允许 defer，不允许降级实现。换句话说，除了之前要求的，其他的全部对齐 v2."

cf-20a is the first step in the 9-PR cf-20 sequence locked by the
orchestrator. It tackles the deferred "stripe cleanup" item from
cf-19's "Out of scope" list and lifts the fix to the user-stated
single-source standard ("把 edit 和正常模式风格统一一下" = unify edit
and normal-mode styling) by routing both routes through one CSS file.
Read-route chrome unification (cf-23 in the 9-PR plan) is partially
prefigured here for the 8 component-block cards; the broader prose +
layout unification stays on cf-23.

## Design source

- `/mnt/d/download/web/v2-styles.css:154-249` — canonical
  `.gblock` card geometry (`background / border / border-radius /
  margin-block / hover lift / selected accent ring`); cf-20a's
  `block-chrome.css` consumes this contract verbatim.
- `/mnt/d/download/web/v2-styles.css:39-100` — palette / sidebar rules
  (consumed by cf-24 which is later in the 9-PR sequence; out of
  cf-20a scope per orchestrator's locked split).
- `/mnt/d/download/web/v2-design-granularity.md` § "Block 容器（.gblock）状态"
  — gatekeeper design intent confirming that block chrome is a single
  visual contract shared across editor and read modes. Pre-cf-20a's
  stripe coexistence with nested suppression diverged from this
  intent; cf-20a aligns.
- ADR-0018 D3 — per-kind hue tokens. cf-20a continues to consume
  these unchanged; the only delta is WHICH selector consumes them
  (now both `.skb-block-nodeview` and `.skb-block-static`).
- cf-19 PR.md `wave-6-cf-19-editor-block-visual-identity.md` open
  questions list, items 2 + 3 (drag handle + kebab cf-20 deferrals)
  + item 7 (chip-tint promotion deferral) — cf-20a does not address
  these (they live in cf-20c/d/e + cf-21+ per the orchestrator's
  9-PR sequence); cf-20a only closes the inner-stripe coexistence
  half of the cf-19 stripe story.

## Decisions

### D1 — Extract chrome to a shared `block-chrome.css` module (vs duplicating the rules)

The two-class pairing approach
(`.skb-block-nodeview, .skb-block-static`) places one rule with two
selectors instead of two parallel rules. Future changes to chrome
geometry (e.g. switching `border-radius: 7px → 8px`) become single
edits. Per the 2026-05-09 retrospective Rule 4 ("Integration layers
must be enumerated, not assumed") — keeping the chrome in two
parallel files is the kind of duplication that produces silent drift,
which is exactly what cf-19 R2 P3 was working around with the
nested-suppression block.

### D2 — `.skb-block-static` wrapper class name (vs reusing `.skb-block-nodeview` or `.gblock` directly)

The editor wrapper class `.skb-block-nodeview` is semantically tied
to ProseMirror NodeViews — pseudo-classes like `.ProseMirror-selectednode`
attach to it, the gutter shell + chip live underneath, etc. Adding
those rules to the read route would require selector negation
everywhere ("not selected, not focus-within, not selectable").
Instead, the read-route gets a sibling class `.skb-block-static` with
its own minimal rules (chrome + body padding) and the chrome rules
union both selectors via `,`. The v2 contract uses `.gblock`; we keep
the `.skb-` prefix throughout the codebase per existing convention
(`.skb-grid`, `.skb-prose`, `.skb-block-nodeview`, etc.) so the v2
class name is mapped 1:1 but namespaced.

### D3 — Pass kind to `makeMdxAdapter` rather than infer from RenderView identity

Two reasons: (a) the RenderView component imports don't carry a kind
discriminator (`CalloutRenderView` is just a `ComponentType`; the
`coreName` lives on `calloutCore` in a different barrel and would
require importing core for every block), (b) `componentCode` is the
internal cf-15b BlockKind name that doesn't match the user-facing
"Code" label OR the MDX tag `<Code>` — we'd need a lookup table
either way, and an explicit `kind` argument at the call site is more
honest than a hidden mapping. The 5 light-block call sites are co-
located in `components.ts` so the argument is locally checkable.

### D4 — Heavy block Astro wrappers wrap the island, not the React component

For the 3 heavy blocks (Jupyter / NnViz / AgentFlow) the `.skb-block-static`
div lives in the Astro file (`apps/site/src/components/Jupyter.astro`
etc.), wrapping `<JupyterIsland client:load {...Astro.props} />`.
This places the wrapper in the SSR HTML output (verifiable via
`grep '<div class="skb-block-static" data-skb-block-kind="jupyter"' dist/notes/sample-blocks/index.html`
which finds 1 occurrence per heavy block) so the chrome paints
immediately on first paint without waiting for hydration. The
React island stays bare; if a future PR moves chrome inside the
island for some reason it would need `inline-block` containment math
that doesn't apply to Astro-wrapped islands.

### D5 — Inline math keeps its `--canvas-soft` tint; not wrapped in `.skb-block-static`

`block-math/src/ui-default/math.css` has two rules:
`[data-block='math'][data-display='true']` (display math, gets the
2px stripe pre-cf-20a) and `[data-block='math'][data-display='false']`
(inline math, gets a `--canvas-soft` background tint per cf-19 v0.1
because inline math can't host a stripe without wrecking text flow).
cf-20a removes the display-math stripe (handed off to
`block-chrome.css`) but **keeps** the inline-math tint because:
(a) inline math doesn't go through `makeMdxAdapter` (MDX inline
elements aren't routed through the flat-prop wrapper; they appear
inline inside markdown paragraphs as inline JSX expressions), so
there's no `.skb-block-static` wrap to put a stripe on; (b) the
`--canvas-soft` tint is what gives inline math its visual identity in
prose flow and removing it would degrade the v0.1 cf-19 fix.
Documented in the cf-20a addendum to `block-math/CONTRACT.md`.

### D6 — Drop `border` from `CODE_THEME_TOKENS` (vs leaving it as forward-compat)

`code.css` no longer references `var(--color-border)` after the
chrome handover (the wrapper consumes editor-shell-local `var(--border, oklch(...))`
instead, which is part of the design-tokens chrome surface, not the
inner-component palette). The `theme-tokens.test.ts` invariant
"manifest key-set is byte-equal to var(--color-*) refs from code.css"
fails loudly if we leave the stale key. Choosing to drop the key
rather than relax the invariant: the invariant is a working
drift-detector and disabling it for cf-20a alone would weaken it
elsewhere. The deletion is one line in `theme-tokens.ts` with a
comment recording the rationale.

### D7 — Update `c3-2-block-hues.spec.ts` selectors instead of leaving inner stripes for back-compat

The pre-cf-20a `c3-2` test asserts the per-kind top border lives on
the inner element. Two options: (a) keep the inner stripe rules AND
the wrapper rules, both painting (then `c3-2` still passes as-is and
we revert to coexistence; user-visible doubled stripe). (b) Update
the test selectors to track the wrapper authority. Per the user
directive "全部对齐 v2" (single-source) + "出现问题会直接让你推翻重写"
(no degradation), option (a) is degradation. cf-20a chooses (b).
Test selector update is mechanical; the hue assertion semantics are
preserved (same colors, different DOM owner). Comment block in the
test file records the migration so future-me knows the inner-element
selectors are intentionally retired.

### D8 — Don't promote per-kind chrome geometry tokens (`--row-h` / `--gap`) into design-tokens

cf-20a's chrome rules use `7px` / `8px` / `1px` / `2px` literals
inside `block-chrome.css` rather than `var(--card-radius)` etc.
These are the v2 contract values that don't have a clear cross-block
reuse story (the `--gap` and `--row-h` grid tokens DO need promotion
in cf-20b for the `.skb-grid` rule). Promoting cf-19's wrapper
chrome geometry to design-tokens would balloon the global surface
without a real second consumer; if cf-23 (read-mode broader
unification) or cf-24 (sidebar) introduces a second card style we
revisit.

## Acceptance

```bash
# AC-1: ADR-0011 D9 ui_touch detects on the right files
pnpm exec tsx scripts/check-ui-touch.ts \
  --files packages/editor-shell/src/block-chrome.css \
          packages/editor-shell/src/BlockNodeView.css \
          apps/site/src/lib/mdx-adapter.ts \
          apps/site/src/components.ts \
          apps/site/src/components/Jupyter.astro \
          packages/block-callout/src/ui-default/callout.css 2>&1 | tail -3
# Expected: ui_touch=true
```

```bash
# AC-2: 8 inner stripe rules deleted (single source enforced)
grep -cE 'border-top:.*2px solid var\(--accent-' \
  packages/block-callout/src/ui-default/callout.css \
  packages/block-code/src/ui-default/code.css \
  packages/block-image/src/ui-default/image.css \
  packages/block-math/src/ui-default/math.css \
  packages/block-pdf/src/ui-default/pdf.css \
  packages/block-jupyter/src/ui-default/jupyter.css \
  packages/block-nn-viz/src/ui-default/nn-viz.css \
  packages/block-agent-flow/src/ui-default/agent-flow.css
# Expected: each file 0 (8 zeros)
```

```bash
# AC-3: chrome stripes now in block-chrome.css (8 selectors paired across both wrappers)
grep -cE '\.skb-block-static\[data-skb-block-kind=' packages/editor-shell/src/block-chrome.css
# Expected: 8 (one per kind in the per-kind stripe table) + 6 in the body padding rule = 14
grep -cE '\.skb-block-nodeview\[data-skb-block-kind=' packages/editor-shell/src/block-chrome.css
# Expected: 8 (paired)
```

```bash
# AC-4: cf-19 R2 P3 nested-suppression block deleted from BlockNodeView.css
# (count `border-top: 0` only inside CSS rule bodies, NOT inside /* */ comment blocks)
grep -E '^\s*border-top: 0\s*;?\s*$' packages/editor-shell/src/BlockNodeView.css | wc -l
# Expected: 0 (the only `border-top: 0` reference left is inside the file-top
#            documentation comment block describing what was deleted; that's
#            documentation, not a CSS rule)
```

```bash
# AC-5: read-route SSR HTML carries .skb-block-static wrappers for all 8 kinds
pnpm --filter @skb/site build 2>&1 | tail -3
# Expected: build succeeds
grep -oE 'class="skb-block-static[^"]*" data-skb-block-kind="[a-zA-Z-]+"' apps/site/dist/notes/sample-blocks/index.html | sort | uniq -c | wc -l
# Expected: 8 (one entry per kind: agent-flow / callout / componentCode / image / jupyter / math / nn-viz / pdf)
```

```bash
# AC-6: editor-shell + 8 block + apps/site test suites green
pnpm --filter @skb/editor-shell test 2>&1 | grep -E 'Tests'
# Expected: 132 passed (carried)
pnpm --filter @skb/site test 2>&1 | grep -E 'Tests'
# Expected: 77 passed | 1 skipped (carried)
pnpm -r --filter "./packages/block-*" test 2>&1 | grep -cE 'Test Files\s+[0-9]+ passed'
# Expected: 8 (one per block package)
```

```bash
# AC-7: targeted Playwright passes (edit + read routes)
pnpm --filter @skb/site exec playwright test \
  playwright/sample-blocks-edit-loads.spec.ts \
  playwright/sample-blocks-read.spec.ts \
  --reporter=line --workers=1 2>&1 | tail -3
# Expected: 2 passed
```

```bash
# AC-8: full apps/site Playwright suite passes (visual baseline diff < 5%)
pnpm --filter @skb/site exec playwright test --reporter=line --workers=1 2>&1 | tail -3
# Expected: 50 passed (or higher) | N skipped | 0 failed
```

```bash
# AC-9: pnpm check exit 0
pnpm check
# Expected: all 41 tasks successful
```

```bash
# AC-10: scope-fence — count files (post-commit)
git diff --name-only main..HEAD -- ':!docs/audits/codex-runs/' \
  ':!docs/audits/screenshots/' \
  ':!apps/site/playwright/visual-smoke-baseline/' \
  ':!content/' | sort | wc -l
# Expected: 33 cf-20a files. Breakdown:
#   - 2 NEW (block-chrome.css + sample-blocks-read.spec.ts + cf-20a PR.md = 3)
#   - 11 source modifications (BlockNodeView.css + 8 block CSS + components.ts + lib/mdx-adapter.ts + 3 Astro wrappers + global.css + package.json + theme-tokens.ts = a lot — recount below)
#   - 11 CONTRACT.md (editor-shell + 8 block + apps/site)
#   - 2 spec modifications (sample-blocks-edit-loads + c3-2-block-hues)
#   - 2 reflection log files (README.md index entry + cf-20a entry append)
```

```bash
# AC-11: chrome (border-top stripe rules) lives in exactly one file
# (block-chrome.css). Grep specifically for the `border-top: 2px solid var(--accent-`
# pattern — that's the chrome stripe rule body, distinct from the chip-tint
# redefinitions in BlockNodeView.css which only set --skb-block-nodeview--chip-*.
grep -lE 'border-top: 2px solid var\(--accent-' \
  $(find packages apps -name '*.css' -not -path '*/node_modules/*' -not -path '*/dist/*')
# Expected: exactly 1 file path → packages/editor-shell/src/block-chrome.css
```

## Reflection landing

This PR appends one entry to
`docs/orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md`
per the 2026-05-09 retrospective process rule (every PR ends with
one orchestrator-reflection entry). The entry will document what
surprised ux-ui-lead during cf-20a (e.g. the `theme-tokens.test.ts`
invariant catching the `border` removal — a useful drift-detector
that I might not have re-discovered without the test failing first;
the layered SSR HTML verification confirming all 8 kinds wrap; the
necessity of updating the c3-2 test rather than degrading the new
single source).

## Out-of-scope

(none — per the 2026-05-09 retrospective Rule 3 "Defer requires
explicit user approval, not orchestrator's"; user has explicitly
disapproved deferral via "不允许 defer". The remaining 8 PRs in the
cf-20 sequence — cf-20b grid + cf-20c-1 algebra + cf-20c-2 drag UI
+ cf-20d resize + cf-20e kebab + cf-22 keyboard a11y + cf-23 read-
mode unification + cf-24 sidebar — are scheduled work, not
"out-of-scope" deferrals. Each is a NEW dispatch on its own branch
with its own PR.md.)

## Related

- [cf-19 PR.md](wave-6-cf-19-editor-block-visual-identity.md) — closed
  the editor-only chrome half. cf-19 R2 P3 nested-suppression block
  is what cf-20a deletes.
- [cf-15b PR.md](wave-6-cf-15b-block-code-rename.md) — `code` → `componentCode`
  BlockKind rename. cf-20a's `data-skb-block-kind="componentCode"` on
  the read-route wrapper preserves the cf-15b internal-name semantic
  (the user-facing chip label still collapses to `code` in
  BlockNodeView.tsx; the read route doesn't have a chip so the
  internal name appears only in the `data-` attribute).
- [ADR-0018 D3](../../decisions/ADR-0018-v2-visual-migration.md) —
  per-kind hue tokens consumed by the cf-20a paired selector rule.
- [ADR-0011 D1 stage 4 + D9](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pre-commit Claude review trigger (Row 1 + Row 5 hit) +
  ui_touch / e2e_smoke gates.
- [ADR-0006 #6](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — sister-doc-sync rule (8 block CONTRACTs + editor-shell CONTRACT
  + apps/site CONTRACT updated in same PR).
- [orchestrator-reflections 2026-05-09](../../orchestrator-reflections/2026-05-09-cf-15a-19-retrospective.md)
  — the 4 systemic gaps that locked the 9-PR cf-20 sequence + the
  rule that ux-ui-lead is dispatched at PLAN.
- v2-styles.css `.gblock` `.gblock-body` lines 154-249 — direct
  visual contract source for cf-20a's `block-chrome.css`.
