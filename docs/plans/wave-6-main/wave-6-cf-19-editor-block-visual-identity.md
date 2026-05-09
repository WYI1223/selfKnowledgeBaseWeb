# Wave 6 cf-19 — Editor block visual identity (per-kind stripe + per-block boundary)

| field | value |
| --- | --- |
| status | DRAFT (ux-ui-lead dispatch 2026-05-09; awaits codex-pr-reviewer-55 R1) |
| executor | ux-ui-lead |
| ui_touch | true |
| e2e_smoke | true (extends `apps/site/playwright/sample-blocks-edit-loads.spec.ts`) |
| risk | D2 row 4 (no contract change; CSS + 1 NodeView wrapper class) |
| pre_commit_claude_review | NOT required (no D2 row 1+4 trigger; CSS-only change) |

## Why

User reported that `/notes/sample-blocks/edit` "看起来还是一个块 / 不是按功能分的".
Live DOM probe (2026-05-09) on `http://localhost:4324/notes/sample-blocks/edit`
confirms three concrete visual gaps that explain the perception:

1. **3 heavy blocks have no top stripe at all.** ADR-0018 D3 locked
   hue tokens `--accent-jupyter / --accent-nn-viz / --accent-agent-flow`
   in design-tokens but never wired them into the per-kind CSS files.
   Wave 5 Stage C.3-2 (PR #88) shipped stripes for the 5 light blocks
   (callout / code / image / math-display / pdf) and silently dropped
   the heavy 3 — because heavy blocks ship through `heavy-block-boundary`
   on the static read-route and the stripe was assumed already present
   on the SSR skeleton. The editor mounts the *real* component (cf-18,
   PR #108) so the skeleton is bypassed.
   - `packages/block-jupyter/src/ui-default/jupyter.css:15-24` — has
     `border` but no `border-top: 2px solid var(--accent-jupyter)`.
   - `packages/block-nn-viz/src/ui-default/nn-viz.css:15-24` — same gap.
   - `packages/block-agent-flow/src/ui-default/agent-flow.css:19-28` — same gap.

2. **Inline math has no stripe.** `packages/block-math/src/ui-default/math.css:9-22`
   only paints stripe when `data-display='true'`; the first sample-blocks
   math (`x^2 + y^2 = z^2`) is inline so DOM probe shows
   `border-top: 0px`. Inline math by definition does not warrant a 2px
   bar (it would visually wreck inline flow), so the per-kind identity
   for inline math must come from somewhere else — see D3 below.

3. **NodeView wrapper is invisible scaffolding.** `BlockNodeView.tsx`
   emits `<div class="skb-block-nodeview">` with zero CSS rules. It
   adds two layers of DOM but no visual signature — so heavy blocks
   end up as transparent rectangles with no kind affordance, no focus
   ring, no hover hint. 4 sequential callouts (the `## Callout`
   section) read as one "callout band" because they share an identical
   2px green stripe and there is no per-instance focus signal.

## Decisions

### D1 — heavy blocks gain per-kind 2px top stripe

Add `border-top: 2px solid var(--accent-<kind>)` to the existing root
selector in each of the 3 heavy block CSS files. Keep the 1px gray
side/bottom border. This closes the ADR-0018 D3 implementation gap that
PR #88 missed.

### D2 — `.skb-block-nodeview` wrapper gains a per-block focus ring

Editor-shell ships a one-rule CSS file `BlockNodeView.css` (NEW; ~40
LoC) that gives the wrapper a transparent 2px outline normally and an
`--accent` colored 2px outline + soft inset glow when the wrapper has
ProseMirror's `selected` class (or when any descendant `:focus-within`).
This is the per-instance "this is one of N blocks" affordance. No
border-radius, no background change — the inner block component already
owns those.

The wrapper also gets `margin-block: 8px` so 4 sequential callouts visually
breathe. This is *additive* to the inner component's own margin — Tiptap's
EditorContent strips collapsed margins inside ProseMirror, so the visible
gap today is whatever the inner element specifies. 8px outer + inner's
own padding = clear "individual block" perception without ballooning
the surface.

### D3 — inline math gets a soft inline tint (no stripe)

Inline math (`data-display='false'`) cannot host a top stripe without
breaking text flow. Apply a *minimal* `background: var(--canvas-soft)
+ padding: 0 4px + border-radius: 3px` so inline math reads as a typed
expression rather than disappearing into prose. This is faithful to
ADR-0018 D3 markdown-as-canvas rationale (math kind hue 280° purple
→ but inline tint uses canvas-soft per existing prose `.aref` precedent
because purple-soft inline would clash with bold prose). Math 2px stripe
behavior on `data-display='true'` (block-level) stays untouched.

### D4 — drag handle / kebab / per-block toolbar — DEFERRED

Per orchestrator dispatch open-question. ADR-0017 D7 + DragHandle
component already exist in `packages/editor-shell/src/drag-handle.tsx`,
but the component is mounted as a single floating element by
EditorShellMount, NOT per-block. Wiring per-block gutters is an
ADR-0017 implementation deferral (Phase 2+) that needs its own
ADR amendment + ~3 PRs. Out of cf-19 scope.

### D5 — grid layout / column variation — OUT OF SCOPE

All sample-blocks fixtures use `colSpan=12` (full width) by design (Wave
2 sampler intent). The user's perception issue is per-block identity,
not column variety. Different column layouts would be a fixture-design
question for a future close-ceremony fixture, not a visual identity PR.

## Files modified (planned)

| file | change |
| --- | --- |
| `packages/block-jupyter/src/ui-default/jupyter.css` | add `border-top: 2px solid var(--accent-jupyter)` to root |
| `packages/block-nn-viz/src/ui-default/nn-viz.css` | add `border-top: 2px solid var(--accent-nn-viz)` to root |
| `packages/block-agent-flow/src/ui-default/agent-flow.css` | add `border-top: 2px solid var(--accent-agent-flow)` to root |
| `packages/block-math/src/ui-default/math.css` | add inline-math soft-tint rule |
| `packages/editor-shell/src/BlockNodeView.css` | NEW — wrapper margin + focus/selected ring |
| `packages/editor-shell/src/BlockNodeView.tsx` | import the new css side-effect-style |
| `packages/editor-shell/CONTRACT.md` | document the new BlockNodeView.css side-effect import (Public surface) |
| `apps/site/src/styles/global.css` | add 3 heavy-block ui-default css imports (parity with 5 light blocks) |
| `apps/site/playwright/sample-blocks-edit-loads.spec.ts` | extend assertions: stripes present on all 8 kinds + wrapper outline rule reachable |

## Acceptance

- All 8 block kinds have a visible non-zero `border-top-width` on either
  the inner component (light blocks + heavy blocks D1) or — for inline
  math — a non-transparent `background-color`.
- `.skb-block-nodeview` wrapper has non-zero margin-block.
- ProseMirror `selected` class on the wrapper produces a non-transparent
  outline (visual proof = computed `outline-color` is not transparent).
- `pnpm check` PASS.
- Targeted Playwright test PASS.
- Screenshot regenerated.

## Open questions for orchestrator

1. Per-block drag handle gutter (D4 deferred) — open new cf-20 PR or
   fold into Phase 2+ Stage D? Suggest: cf-20 with ADR-0017 amendment.
2. Per-block kebab menu / inline toolbar — same scope question. Suggest
   defer to Phase 2+ given current focus is MVP-ready close.
3. Wrapper outline color: `--accent` (orange-red, ADR-0018 D1
   selection/focus authority) is the obvious pick and matches existing
   `.skb-callout :focus-visible` ring. Confirm before downstream consumers
   bind to a different token.

## Related

- ADR-0018 D3 — per-kind hue table (this PR closes the D1 implementation gap for jupyter / nn-viz / agent-flow)
- ADR-0014 — heavy-block-boundary (skeleton path; orthogonal to editor-mount path)
- ADR-0017 D7 — drag handle (D4 deferral)
- PR #108 cf-18 — wired NodeView; this PR adds visual chrome on top
