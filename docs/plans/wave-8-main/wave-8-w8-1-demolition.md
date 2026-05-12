# Wave 8 W8-1 — demolition of the Tiptap-NodeView grid stack

> **The reset PR.** Tears down the cf-19/20/22/23/24/25 editor surface
> + Wave 7 Phase 2C/2D/2E retrofits. The new architecture per user
> directive 2026-05-12 inverts the SoT: React state holds `GridState`
> directly; renderer is a downstream consumer; per-block Tiptap
> mini-editors handle markdown text only. That `GridEditor` lands in
> W8-2; this PR is foundation clearing.

## Why this PR exists

User feedback after Phase 2E smoke test: "整体结构上跟 prototype 有
一样的地方吗? ... 为什么数据结构决定渲染? ... 最开始的详细的更新计划
为什么到最后搬过来的只有形式? ... 全部推翻 / 上下文干净 / 一点一点
地基搭起来."

The honest answer was no — every PR from #123 through #130 retrofitted
visual surface (themes, baseplate, absolute positioning) onto the
Tiptap-NodeView pipeline. That pipeline made Tiptap the SoT and engine
state a derived view (the OPPOSITE of [ADR-0020](../../decisions/ADR-0020-grid-engine-contract.md)
D1 "数据 = SoT, 渲染 = 下游消费"). This PR removes the wrong
architecture before W8-2 builds the right one.

## What's deleted

### `packages/editor-shell/src/` (the editor stack)

- `BlockNodeView.tsx` + `BlockNodeView.css` — the Tiptap NodeView wrapper
- `block-chrome.css` — moved to `apps/site/src/styles/read-route-chrome.css` (only `.skb-block-static` rules retained; `.skb-block-nodeview` rules dropped)
- `EditorShell.tsx` — Tiptap `<EditorContent>` global wrapper
- `drag-handle.tsx` — pre-cf-20c standalone drag handle
- `palette-modal.tsx`, `palette-sidebar.tsx`, `palette-sidebar.css` — cf-24 palette surfaces
- `registerBlocks.ts`, `registry-wire.tsx` — Tiptap extension wiring
- `slash-menu.tsx`, `toolbar.tsx` — Tiptap editor menus
- `drag-drop/` directory entirely (17 files):
  - `apply-drop-mode.ts` (already gone in #126), `tiebreak.ts`, `edge-rects.ts` (already gone)
  - `commit-drop.ts`, `commit-external-drop.ts`
  - `drag-context.tsx`, `drag-ghost.ts`, `drag-handle-button.{tsx,css}`
  - `drop-pulse.ts`, `esc-cancel.ts`, `external-drop-source.ts`
  - `grid-engine-adapter.ts`, `keyboard-drag-mode.ts`, `layout-reducer.ts`
  - `outline-overlay.tsx`, `pipeline-snapshot.ts`
  - `use-drag-drop-pipeline.ts`, `use-external-drag-start.ts`, `use-pointer-drag-listeners.ts`
- `kebab/` directory entirely (5 files) — cf-20e kebab menu
- `resize/` directory entirely (9 files) — cf-20d resize pipeline
- `__tests__/{drag-drop,kebab,resize}/` + 6 unit-test files for deleted code

### `apps/site/src/`

- `components/EditorShellMount.{astro,tsx}` + `EditorShellMountInner.tsx`
- `components/EditorShellOverlays.tsx`
- `components/EditorShellAnnounceCallbacks.ts`
- `components/EditorShellKebabActions.ts`

### Playwright specs (test deleted architecture)

- `sample-blocks-drag-handle`, `sample-blocks-kebab-menu`,
  `sample-blocks-keyboard-a11y`, `sample-blocks-resize-handles`,
  `sample-blocks-palette-sidebar`, `sample-blocks-markdown-blocks`,
  `sample-blocks-markdown-blocks-behavior`, `sample-blocks-edit-loads`
- `grid-drag-drop` + `grid-drag-drop.fixtures` + `grid-resize-responsive`
  + `grid-perf`
- `edit-mount-api-wire`, `stage-b-close-roundtrip`
- 11 `src/__tests__/e2e/c2-8 / c4-*` e2e tests for the deleted mount

## What stays

### `packages/editor-shell/src/`

- `save-adapter.ts` + `saveLoad.ts` + `save-indicator.tsx` — save flow (orthogonal)
- `edit-mode-banner.tsx`, `grid-container.tsx`, `responsive-cols.ts` — passive primitives
- `grid-style.ts` — `gridPlacementStyle` / `extractGridPosition` still used by READ ROUTE adapters (apps/site/src/components.ts + 3 heavy block .astro wrappers); kept scoped to non-themed paths
- `theme-baseplate.tsx`, `use-theme.ts` — Phase 2C/2D theme hook + baseplate (will feed into W8-2 GridEditor)
- `a11y/` directory — `LiveAnnouncer`, `useFocusReturn`, `keyboard-step`, `announce-format` (orthogonal)
- `registerKernels.ts` — kernel registry passthrough

### `packages/` outside editor-shell — UNTOUCHED

- `@skb/grid-engine` (pure ops)
- `@skb/grid-themes` (theme contract + 3 themes)
- `@skb/mdx-bridge` (parse/serialize)
- `@skb/block-foundation` (block schema types)
- 9 per-kind block packages (their EditorView/RenderView components will be leaf-mounted in W8-2)

### Read route (`/notes/<slug>`)

UNAFFECTED. CSS Grid layout via `apps/site/src/styles/grid.css` +
v2 chrome via the new `apps/site/src/styles/read-route-chrome.css`
(moved from deleted `@skb/editor-shell/block-chrome.css`).

### `/grid-prototype` route + `apps/site/src/components/_grid-prototype/`

UNTOUCHED. Per user directive 2026-05-11 the prototype stays alive
through Wave 8 close as acceptance benchmark. Deleted only after user
signs off on prototype-vs-editor visual parity.

## ui_touch

`true` — `apps/site/src/components/` paths matched. **Visible
user-facing change**: edit route `/notes/<slug>/edit` now renders a
W8-1 placeholder card explaining the demolition + linking back to
read route. Read route + prototype unaffected. W8-2 will restore the
edit experience with the new architecture.

## e2e_smoke

- flow: read route renders all 9 block kinds with v2 chrome (per-kind
  hue stripe) intact post-demolition.
  target_url: /notes/sample-blocks
  playwright_spec: apps/site/playwright/sample-blocks-read.spec.ts
  assertions:
    - `.skb-block-static` count ≥ 1
    - per-kind hue stripe `border-top` resolved to non-transparent color

## Acceptance

executor: orchestrator-self (demolition; no codex needed)
reviewer: CI gates (lint + typecheck + test + build + size-check + lychee + e2e-coverage + visual-smoke)
contract_changes:
  - REMOVED `@skb/editor-shell` exports (~30 surface elements):
    `EditorShell`, `PaletteModal`, `PaletteSidebar`, `SlashMenu`,
    `DragHandle`, `Toolbar`, `makeBlockNodeView`, `wireRegistry`,
    `appendBlockKind`, `insertBlockKind`, `defaultBlockAttrsFor`,
    `BLOCK_KIND_OPTIONS`, the entire drag-drop + resize + kebab + a11y
    exports... see `index.ts` diff for the post-W8-1 minimal surface
  - REMOVED CSS exports: `block-chrome.css`, `BlockNodeView.css`,
    `drag-handle-button.css`, `resize-handles.css`, `kebab-menu.css`,
    `palette-sidebar.css`
  - NEW local: `apps/site/src/styles/read-route-chrome.css`
new_adr: NONE — Wave 8 ADR-0021 (close) lands in W8-5
risk_class: D2 row 8 (UI behavior change — edit route is now a placeholder until W8-2)

## Out of scope (next PRs)

- W8-2: NEW `GridEditor` (engine state as React SoT; per-block Tiptap mini-editor for markdown text)
- W8-3: wire apps/site `/edit` route to GridEditor
- W8-4: rewrite sample-blocks fixture for 2D layout
- W8-5: ADR-0021 close + prototype acceptance + delete `/grid-prototype`

## Process

1. ✓ User directive 2026-05-12: "全部推翻 / 上下文干净 / 一点一点地基搭起来"
2. ✓ Inventory + delete editor-shell src files (16 files + 3 dirs)
3. ✓ Delete editor-shell tests for deleted code (8 files + 3 dirs)
4. ✓ Delete apps/site editor mount components (6 files)
5. ✓ Delete playwright specs testing dead arch (14 specs)
6. ✓ Replace edit.astro page with W8-1 placeholder
7. ✓ Move read-route chrome from editor-shell to apps/site local CSS
8. ✓ Strip editor-shell index.ts + package.json exports to minimal surface
9. ✓ Read route at `/notes/sample-blocks` visually verified (16 blocks, v2 chrome intact)
10. ✓ Edit route at `/notes/sample-blocks/edit` renders W8-1 placeholder
11. ✓ Full `pnpm check` 47/47 pass
12. **THIS PR** — commit + CI gate

## Honest scope

- ~98 files changed: 92 deleted, 4 modified, 2 added (placeholder + read-route-chrome.css + plan doc)
- Net ~+200 / -10,000 LOC delete
- Editor-shell surface narrowed from ~120 exports to ~25 exports
- Read route untouched; prototype untouched
