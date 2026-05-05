# C.2-4 — `@skb/editor-shell` grid container + `useAutoRowSpan` hook

> **Wave 5 Stage C.2 4th implementation PR** of the locked 13-PR sequence
> (C.2-1 → C.2-12; per Wave 5 plan v1.1 §469-498 amendment). Lands the
> **editor-shell side** grid container React component + the
> `useAutoRowSpan` hook with 3-stage 抖动收敛 per ADR-0016 D3 + D11
> (Tiptap inside / grid outside 分层). C.2-1 (mdx-bridge serialize, squash
> `e54497d`) shipped the wire format with transitional defensive defaults;
> C.2-2 (block-foundation grid primitives, squash `b15ba24`) shipped the
> `BlockGridPosition` + `COL_SNAPS` + `proseGridDefaults` +
> `effectiveCellHeight` / `effectiveColWidth` authority; C.2-3 (Astro
> renderer grid + Responsive 12/6/1, squash `2586328`) shipped the SSR
> `.skb-grid` container CSS + `@media` viewport breakpoints. C.2-4 wires
> the **editor-side** rendering layer so a React consumer can mount a
> a `GridContainer` JSX element wrapping a Tiptap `EditorContent` (or
> arbitrary children) emitting a `div` with `class="skb-grid"` reusing the same SSR-side
> CSS authority from C.2-3, AND ships the `useAutoRowSpan` hook for
> markdown-block `rowSpan='auto'` rendering-derived height per ADR-0016
> D3. **layoutReducer + `layoutEpoch` mutation pipeline impl** is **NOT**
> in scope here (deferred to C.2-8 per Wave 5 plan v1.1 row C.2-8); C.2-4
> establishes the **W5-2 invariant prose** in editor-shell CONTRACT.md as
> a forward-pointer only. **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES**
> per `## D2 trigger judgment` (Row 1 NEW W5-2 invariant + grid container
> + hook public surface in `packages/editor-shell/CONTRACT.md` + Row 5
> boundary contract change since editor-shell is the React-side consumer
> of `BlockGridPosition` from C.2-2 and the `.skb-grid` selector authority
> from C.2-3).

## title

Wire the **editor-side** grid container + auto-row-span hook in
`@skb/editor-shell` per ADR-0016 D3 + D11 + D12 (W5-2 invariant
forward-pointer only; reducer impl deferred). Specifically:

1. NEW `packages/editor-shell/src/grid-container.tsx` (~50-80 LOC). Thin
   functional React component emitting `<div class="skb-grid {className?}">`
   wrapping `children`. Per ADR-0016 D11 the component does NOT touch
   Tiptap doc state OR mutate NodeView attrs — it is a passive wrapper
   that lets a consumer compose `<GridContainer><EditorContent
   editor={editor} /></GridContainer>` (OR any other children). The
   `.skb-grid` selector + scoped CSS variables (`--row-h`, `--gap`,
   `--total-cols`) are owned by `apps/site/src/styles/grid.css` (C.2-3
   authority); the editor-shell consumer at the mount site (e.g.,
   `apps/site/src/pages/notes/[slug]/edit.astro` at C.4 wire-up) is
   responsible for importing the same stylesheet — exactly mirroring
   the SSR phase emission per ADR-0016 D9 phase strategy. `GridContainer`
   does NOT own per-block `style.gridColumn` / `style.gridRow` injection
   either (deferred to C.2-5 drag/drop OR C.2-9 responsive transition;
   per ADR-0016 D11 + Risk register row 2). Optional `style` prop forwards
   CSS variable overrides (`--row-h`, `--gap`, `--total-cols`) for testing
   / customization (per ADR-0016 D5 + grid.css scoped vars). JSDoc at
   file head cites ADR-0016 D5 / D8 / D9 / D11 explicitly + cross-refs
   `apps/site/src/styles/grid.css` as CSS authority + cites the Q2 v1.1
   downstream-must-reference C.2-3.5 hard-throw-flip end-state for
   NodeView attr defensive defaults orthogonal-concern note (see
   `## R14 self-check` row 7).

2. NEW `packages/editor-shell/src/use-auto-row-span.ts` (~70-110 LOC).
   `useAutoRowSpan` hook implementing ADR-0016 D3 spec (lines 122-149) +
   D3 §"两阶段稳态" 3-stage rule (lines 157-167). Public signature byte-
   equal to ADR-0016 D3 line 125-130 prose:

   ```typescript
   export function useAutoRowSpan(
     contentRef: RefObject<HTMLElement | null>,
     rowHeightPx?: number,  // default 48 (matches --row-h)
     gapPx?: number,        // default 14 (matches --gap)
   ): number;
   ```

   Returns the computed `rowSpan` integer (≥ 1). 3-stage 抖动收敛:
   - **Stage 1** (first RO event): establishes `initialRowSpan`; UI applies
     transition fade-in (180ms — co-owned with grid.css future drag/resize
     transition seam); does NOT commit to persistent state (consumer
     reducer pipeline lands C.2-8).
   - **Stage 2** (second microtask/rAF after Stage 1): rate-limits any
     additional RO events (font load, image load, code-fence rehydration)
     into a single coalesced commit per rAF window.
   - **Stage 3** (subsequent RO events): threshold-filters at Δ rowSpan ≥
     1 (integer rowSpan diff); Δ = 0 silently ignored (avoids pixel-noise
     spurious updates).

   Internal refs: `lastRowSpanRef` + `firstRoFiredRef` + `pendingFrameRef`
   (rAF id for cleanup). Font-loading special-case: `document.fonts.ready`
   Promise awaited at mount; one-shot post-mount refresh after fonts
   settle. `ResizeObserver` disconnect on unmount (no leak per ADR-0016
   D3 implementation constraint line 155).

3. MODIFIED `packages/editor-shell/src/index.ts` (~3-5 LOC delta). Add
   barrel re-exports for `GridContainer`, `GridContainerProps`,
   `useAutoRowSpan`. Existing 7 exports preserved (no regression).

4. MODIFIED `packages/editor-shell/CONTRACT.md` (~80-110 LOC net delta).
   Add NEW section `## Grid layout (Wave 5)` between the existing
   `## Public surface` section (ends ~L61) and `## Wave 3 Stage A
   expansion outline` section (starts ~L63). Section contents:
   - **W5-2 invariant** prose (NEW; analog to `block-foundation/CONTRACT.md`
     L41 W5-1 invariant). Verbatim phrasing: "**W5-2: editor-shell
     `layoutReducer` + `layoutEpoch` single-source mutation 是 grid block
     position 的唯一权威 mutation site.** 所有 block grid mutations (drag
     from grid container / resize from handle / `useAutoRowSpan`
     auto-measure / responsive transition / undo-redo / mdx-load) 必经过
     此 reducer; 冲突仲裁规则 per ADR-0016 D12 + 权威矩阵 section. CRDT/OT
     协同编辑 OUT OF SCOPE (Phase 2+); editor-shell `layoutEpoch` 是
     single-source ordering, NOT 分布式 vector clock. **C.2-4 forward-
     pointer only**: `layoutReducer` + `layoutEpoch` impl 落地 C.2-8 (per
     Wave 5 plan v1.1 row C.2-8); 此 PR 仅 lock invariant prose +
     `GridContainer` thin wrapper + `useAutoRowSpan` hook public surface."
   - `GridContainer` component public surface: props type
     (`{ children?: React.ReactNode; className?: string; style?:
     React.CSSProperties }`) + minimal usage example pairing it with
     `<EditorContent editor={editor} />`. Cite `.skb-grid` selector
     authority = `apps/site/src/styles/grid.css` (C.2-3 PR squash
     `2586328`); editor-shell consumer at the mount site MUST import
     the stylesheet (mirrors the SSR phase emission per ADR-0016 D9
     phase strategy).
   - `useAutoRowSpan` hook public surface: signature (byte-equal to
     ADR-0016 D3 line 125-130) + 3-stage 抖动收敛 description (Stage 1
     init / Stage 2 rAF coalesce / Stage 3 Δ ≥ 1 threshold) + return
     value semantic (integer ≥ 1).
   - Forward-pointer to ADR-0016 D3 (auto-rowSpan hook spec) / D11
     (Tiptap inside / grid outside) / D12 (layout reducer schema —
     impl deferred C.2-8) / §502 row 4 of 4 (editor-shell sister-doc
     sync site).
   - Cross-package consumer note: `BlockGridPosition` shape from
     `@skb/block-foundation` (W5-1 invariant authority — Pre-A2
     ADR-0016 D2 lock + C.2-2 type materialisation) is the **type
     contract** that editor-shell grid container reads from Tiptap
     NodeView attrs (per ADR-0016 D11 NodeView attrs are passive data).
   - **Q2 v1.1 absorbtion downstream-must-reference 锁 (CRITICAL)**:
     "editor-shell grid container reads NodeView attrs assuming
     **explicit** `col / colSpan / rowSpan` per Wave 5 plan v1.1 row
     C.2-3.5 hard-throw flip end-state (mdx-bridge defensive defaults
     removed); `_gridAttrsExplicit` marker (C.2-1 → C.2-3 transitional)
     SHALL NOT be referenced from editor-shell source. The ADR-0016 D2
     defaults (`col=1, colSpan=12, rowSpan=1`) MAY be honored at
     editor-shell as **React-side defensive-rendering defaults** (an
     orthogonal concern from mdx-bridge defensive defaults; same numeric
     values, distinct enforcement layer)."
   - Forward-pointer: `layoutReducer` + `layoutEpoch` impl deferred to
     C.2-8 (per Wave 5 plan v1.1 row C.2-8); C.2-4 establishes the W5-2
     invariant prose + thin grid container + auto-row-span hook only.

5. NEW `packages/editor-shell/src/__tests__/grid-container.test.tsx`
   (~50-80 LOC). Vitest + happy-dom + @testing-library/react. Covers:
   GridContainer mounts; renders single child wrapped in
   `<div class="skb-grid">`; forwards `className` prop concatenated as
   `"skb-grid {className}"`; forwards `style` prop (CSS variable
   overrides for testing); accepts arbitrary children (incl. nested
   Tiptap `EditorContent` smoke instance). See `## test_cases` for
   full TC matrix.

6. NEW `packages/editor-shell/src/__tests__/use-auto-row-span.test.ts`
   (~80-120 LOC). Vitest + happy-dom. Mocks `ResizeObserver` +
   `document.fonts.ready` + `requestAnimationFrame`. Covers 8 scenarios
   per ADR-0016 D3 implementation constraint line 155 + 167:
   empty content → rowSpan=1; single-line md → rowSpan=1; multi-line
   md → computed rowSpan from scrollHeight; paste-large-md → multiple
   RO events within 16ms coalesced into 1 commit; font-loading
   post-mount refresh fires; image-load triggers Stage 3 update only
   if Δ ≥ 1; unmount during pending RO → no leak (RO `disconnect()`
   called); spurious pixel-noise (Δ < 1) silent. See `## test_cases`.

7. PR.md self-listed per ADR-0006 D8 strict-whitelist.

NEW vitest suites runs under `pnpm --filter @skb/editor-shell test`. NO
new npm dependency (vitest + happy-dom + @testing-library/react +
@tiptap/react ALREADY devDep'd at editor-shell A2; reuses).

The 8 `@skb/block-*` packages are NOT touched (block-side has zero grid
logic per ADR-0016 D11; auto-row-span is host-side hook). `@skb/mdx-bridge`
is NOT touched (C.2-1 / C.2-3.5 scope; defensive-default path → hard-
throw end-state). `@skb/block-foundation` is NOT touched (C.2-2 scope;
W5-1 invariant authority; consumed transitively here as type-source for
`BlockGridPosition`). `apps/site/src/styles/grid.css` is NOT touched
(C.2-3 scope; CSS authority; consumed at editor-shell mount site
downstream at Stage C.4). `packages/heavy-block-boundary` is NOT touched
(C.2-7 scope). NO change to design-tokens (C.3 scope). NO sample MDX
backfill (C.2-3.5 / C.2-9 scope per Wave 5 plan v1.1 row enumeration).

LOCKED implementation path: **thin-wrapper GridContainer + ADR-0016 D3
hook spec verbatim**. Path "wire layoutReducer + layoutEpoch + drag/resize
pipeline now" is **EXPLICITLY FORBIDDEN** in this PR (reason in Risk
register row 2; LOC budget would balloon ≥ 600 LOC, scope creeps into
C.2-5 / C.2-8 territory).

PR.md self-listed per ADR-0006 D8 strict-whitelist.

## files

7 canonical files at PLAN time. NO `package.json` change (no new dep;
all needed devDeps already at A2 lock — `vitest` + `happy-dom` +
`@testing-library/react` + `@tiptap/react`). NO `pnpm-lock.yaml` change.
NO `tsconfig.json` change (no new path / reference; `@skb/block-foundation`
already declared as runtime dep + tsconfig reference at A3). NO change
to the 8 `@skb/block-*` packages. NO change to `@skb/mdx-bridge`. NO
change to `@skb/block-foundation`. NO change to `@skb/heavy-block-boundary`.
NO change to `@skb/kernel-*` (3 packages). NO change to `apps/site/**`.
NO change to `packages/design-tokens/**`. NO new ADR file (D2 row 4 NOT
hit; ADR-0016 already authorises). PR.md self-listed.

- `packages/editor-shell/src/grid-container.tsx` (**NEW**, ~50-80 LOC).
  Thin functional React component. Default export NOT used (named
  export `GridContainer` + named export `GridContainerProps` only —
  matches the existing editor-shell `EditorShell` named-export pattern
  from A2 / `EditorShellProps` from A2). JSDoc at file head cites
  ADR-0016 D5 / D8 / D9 / D11 + cross-refs `apps/site/src/styles/grid.css`
  as the CSS authority. Renders
  `<div className={`skb-grid${className ? ' ' + className : ''}`}
  style={style}>{children}</div>`. NO `'use client'` pragma (consistent
  with `EditorShell` per existing CONTRACT.md L60-61 — consumers decide
  client/server boundary).

- `packages/editor-shell/src/use-auto-row-span.ts` (**NEW**, ~70-110 LOC).
  `useAutoRowSpan` hook impl per ADR-0016 D3 spec verbatim base + 3-stage
  抖动收敛 extension per D3 §"两阶段稳态". JSDoc at file head cites ADR-0016
  D3 / D5 (`--row-h: 48px` + `--gap: 14px` defaults derive from grid.css
  scoped vars; passed as fn args for SSR-safe DI). Uses `useEffect` +
  `useState` + `useRef` (3 internal refs). Internal `computeRowSpan(scrollHeight,
  rowH, gap)` helper exported as named export for direct unit-test
  reach (separate from the React hook surface).

- `packages/editor-shell/src/index.ts` — **MODIFIED** (~3-5 LOC net
  delta). Add 3 barrel exports (`GridContainer`, `GridContainerProps`,
  `useAutoRowSpan`). Append after the existing `proseExtensions`
  re-export at L7. Existing 7 exports UNCHANGED:

  ```ts
  export { EditorShell } from './EditorShell';
  export type { EditorShellProps } from './EditorShell';
  export { registerBlocks } from './registerBlocks';
  export { registerKernels } from './registerKernels';
  export { saveToMdx, loadFromMdx } from './saveLoad';
  export type { SaveLoadOptions } from './saveLoad';
  export { proseExtensions } from '@skb/block-foundation';
  // NEW (Wave 5 C.2-4):
  export { GridContainer } from './grid-container';
  export type { GridContainerProps } from './grid-container';
  export { useAutoRowSpan } from './use-auto-row-span';
  ```

- `packages/editor-shell/CONTRACT.md` — **MODIFIED** (~80-110 LOC net
  delta). Insert NEW section `## Grid layout (Wave 5)` between existing
  `## Public surface` (ends ~L61) and `## Wave 3 Stage A expansion
  outline` (starts ~L63). NO change to existing sections (Public surface
  / Stage A expansion outline / Stage A close / Type variance /
  Modifying / Related ALL UNCHANGED). Per ADR-0016 §502 sister-doc-sync
  row 4 of 4 (`packages/editor-shell/CONTRACT.md`) — this PR is the
  documented same-PR-with-implementation sync site. The
  `## Modifying this file` clause already covers contract section
  additions per ADR-0006 D8 D2 row 1. New section structure outlined
  in `## title` item 4 above. **NO** edit to the existing
  `## Public surface` section bullets — `GridContainer` and
  `useAutoRowSpan` are documented inside the new `## Grid layout (Wave
  5)` section because they are W5-scoped additions, distinct from the
  Stage A 5-bullet public surface (consistent with the pattern set by
  `block-foundation/CONTRACT.md` L41 W5-1 invariant landing as a
  separate `## Invariants` bullet rather than mixing into existing
  public surface lists).

- `packages/editor-shell/src/__tests__/grid-container.test.tsx`
  (**NEW**, ~50-80 LOC, ~6-8 assertions). Vitest with happy-dom env +
  @testing-library/react. Covers TC-1 through TC-6 (see
  `## test_cases`).

- `packages/editor-shell/src/__tests__/use-auto-row-span.test.ts`
  (**NEW**, ~80-120 LOC, ~8 scenarios). Vitest with happy-dom env. Mocks
  `ResizeObserver` (global stub returning controllable instance) +
  `document.fonts.ready` (Promise stub) + `requestAnimationFrame`
  (synchronous flush helper). Covers TC-7 through TC-14 (see
  `## test_cases`).

- `docs/plans/wave-5-main/C.2-4-editor-shell-grid.md` (**NEW**, this
  PR.md). Self-listed.

## test_cases

TDD-front order (codex-generic-executor): write failing
`grid-container.test.tsx` + `use-auto-row-span.test.ts` first → write
`grid-container.tsx` + `use-auto-row-span.ts` impl (test cases turn
GREEN one-by-one) → wire `index.ts` barrel exports → CONTRACT.md
section.

### TC-1 — `GridContainer` mounts + renders `<div class="skb-grid">`

- input: render a GridContainer JSX element wrapping a single `span`
  child with `data-testid="child"`
- expected: queryByTestId("child") returns the span; the span's parent
  HTMLElement.className contains the substring `skb-grid`
- location: `packages/editor-shell/src/__tests__/grid-container.test.tsx`
  describe "GridContainer renders"

### TC-2 — `className` prop concatenated after `skb-grid`

- input: render a GridContainer with `className="custom-x"` prop and
  any text child
- expected: the wrapper element's className === `"skb-grid custom-x"`
  (with the SPACE separator, NOT concatenated as `"skb-gridcustom-x"`)
- location: same file, describe "GridContainer className prop"

### TC-3 — Omitted `className` prop emits exactly `"skb-grid"` (no trailing space)

- input: render a GridContainer with no `className` prop and any text
  child
- expected: wrapper element's className === `"skb-grid"` (exact;
  guards against the off-by-one `"skb-grid "` regex form that breaks
  CSS selector matching in some Astro CSS-tree-shaking edge cases)
- location: same file, same describe

### TC-4 — `style` prop forwards CSS variable overrides

- input: render a GridContainer with
  `style={{ '--row-h': '60px' } as React.CSSProperties}` prop and any
  text child
- expected: wrapper element's `style.getPropertyValue('--row-h')` ===
  `"60px"` (per W3C CSSOM custom-property API)
- location: same file, describe "GridContainer style prop"

### TC-5 — Multiple children render in DOM order

- input: render a GridContainer wrapping two sibling `span` children
  with `data-testid="a"` text "A" and `data-testid="b"` text "B"
- expected: queryAllByTestId of [a, b] returns both spans; the wrapper
  element has exactly 2 children; child[0].textContent === "A" AND
  child[1].textContent === "B" (DOM order preserved)
- location: same file, describe "GridContainer children"

### TC-6 — Composes with Tiptap `EditorContent` smoke

- input: minimal Tiptap editor instance via `useEditor` with
  StarterKit only; render a GridContainer wrapping an `EditorContent`
  element bound to that editor
- expected: wrapper element's className contains `skb-grid`; the Tiptap
  `ProseMirror` contenteditable div is a descendant of the wrapper
  (per `wrapperEl.querySelector('.ProseMirror')` non-null);
  `editor.destroy()` cleanup at test teardown (no leak)
- location: same file, describe "GridContainer composes with Tiptap"

### TC-7 — `useAutoRowSpan` returns 1 for empty content (initial render)

- input: stub `ResizeObserver` so its first observer call carries
  `target.scrollHeight === 0`; render hook with a `contentRef` pointing
  at a happy-dom element with no children
- expected: hook returns `1` (per `Math.max(1, ...)` floor in ADR-0016
  D3 line 139)
- location: `packages/editor-shell/src/__tests__/use-auto-row-span.test.ts`
  describe "useAutoRowSpan empty content"

### TC-8 — `useAutoRowSpan` returns 1 for short single-line content

- input: stub RO carries `scrollHeight === 48` (= rowH default);
  formula: `ceil((48 + 14) / (48 + 14)) === 1`
- expected: hook returns `1`
- location: same file, same describe

### TC-9 — `useAutoRowSpan` computes correct rowSpan from large scrollHeight

- input: stub RO carries `scrollHeight === 358`; formula:
  `ceil((358 + 14) / (48 + 14)) === ceil(372 / 62) === ceil(6.0) === 6`
- expected: hook returns `6` (matches the ADR-0016 D4 prose example
  "rowSpan = 6 → 358px" inverse)
- location: same file, describe "useAutoRowSpan computes rowSpan"

### TC-10 — 3-stage 抖动收敛 Stage 1 + Stage 2 + Stage 3 sequencing

- input: stub RO that emits 3 events within a single rAF window:
  event 1 carries `scrollHeight === 60` (computed rowSpan = 2; Stage 1
  init); event 2 carries `scrollHeight === 110` (computed rowSpan = 2;
  same value, Δ = 0 → Stage 2 coalesce silent); event 3 carries
  `scrollHeight === 172` (computed rowSpan = 3; Δ = 1 → Stage 3
  threshold update)
- expected: across the rAF flush, hook return value transitions
  `1 → 2 → 3` exactly twice (once at Stage 1 init, once at Stage 3
  threshold; Stage 2 silent intermediate); `setRowSpan` (or
  equivalent state-update spy) called exactly 2 times across the 3 RO
  events (NOT 3 times — Stage 2 coalescence verified)
- location: same file, describe "useAutoRowSpan 3-stage 抖动收敛"

### TC-11 — Δ < 1 threshold filter (pixel-noise silent)

- input: stub RO emits 2 events: event 1 `scrollHeight === 100`
  (rowSpan = 2); event 2 `scrollHeight === 105` (rowSpan still =
  `ceil((105+14)/(48+14)) = ceil(119/62) = ceil(1.92) = 2`; Δ = 0
  silent)
- expected: hook return value === 2 throughout; setRowSpan called
  exactly 1 time (initial set; second event filtered)
- location: same file, same describe

### TC-12 — `document.fonts.ready` post-mount refresh fires

- input: stub `document.fonts.ready` as a `Promise` of `FontFaceSet` resolving
  in next microtask; render hook with `contentRef` such that the
  initial RO event reports `scrollHeight === 96` (rowSpan = 2) BUT
  after `fonts.ready` resolves the second forced re-measure reports
  `scrollHeight === 158` (rowSpan = 3)
- expected: hook return value transitions `1 → 2 → 3`; the second
  transition (post-fonts-ready) is observable in the rendered React
  state
- location: same file, describe "useAutoRowSpan font-loading"

### TC-13 — `ResizeObserver.disconnect()` on unmount (no leak)

- input: render hook, capture the RO instance via the global stub;
  unmount the host component; verify the captured RO instance had its
  `disconnect()` method called exactly once
- expected: `disconnectSpy.mock.calls.length === 1`; subsequent fake
  RO event emissions do NOT trigger any state update on the unmounted
  hook (no React act() warning leaked)
- location: same file, describe "useAutoRowSpan unmount cleanup"

### TC-14 — `computeRowSpan` pure helper unit test

- input: direct call `computeRowSpan(0, 48, 14)`; `computeRowSpan(48,
  48, 14)`; `computeRowSpan(110, 48, 14)`; `computeRowSpan(358, 48,
  14)`
- expected: returns `1`, `1`, `2`, `6` respectively (validates the
  ADR-0016 D4 formula `height(px) = rowSpan * 62 - 14` inverse;
  `rowSpan = ceil((scrollHeight + gap) / (rowH + gap))`; `Math.max(1,
  ...)` floor)
- location: same file, describe "computeRowSpan helper"

### TC-15 — Existing `EditorShell.test.tsx` UNCHANGED + still PASS

- input: existing test file (not modified by this PR; verified by
  `git diff origin/main -- packages/editor-shell/src/__tests__/EditorShell.test.tsx
  | wc -l == 0`)
- expected: zero diff against `origin/main`; `pnpm --filter
  @skb/editor-shell test` runs the existing EditorShell A2-A5 test
  suites alongside the 2 new test files; all PASS
- location: meta-test (no new file; `git diff` + vitest re-run)

## contracts_affected

- `packages/editor-shell/CONTRACT.md` — NEW section `## Grid layout
  (Wave 5)` added between `## Public surface` and `## Wave 3 Stage A
  expansion outline`. D2 row 1 hit (CONTRACT.md change). Per ADR-0016
  §502 sister-doc-sync row 4 of 4 — this PR is the documented same-
  PR-with-implementation sync site. The new section establishes the
  **W5-2 invariant** prose anchor (analog to `block-foundation/CONTRACT.md`
  L41 W5-1 invariant authority) + `GridContainer` + `useAutoRowSpan`
  public surface declarations.

- `packages/block-foundation/CONTRACT.md` — **NOT** modified. The W5-1
  invariant prose at L41 + `BlockGridPosition` type authority (Pre-A2
  ADR-0016 D2 lock + C.2-2 type materialisation) is the **target** of
  the new cross-package consumer pointer in
  `packages/editor-shell/CONTRACT.md`; the source-of-truth text is
  unchanged. Editor-shell consumes the type via the existing
  `@skb/block-foundation` workspace dep declared at A3 (no new dep
  needed for type-only re-import).

- `packages/mdx-bridge/CONTRACT.md` — **NOT** modified. C.2-1 already
  extended its `## Grid context attrs (Wave 5)` section + W5-1
  forward-pointer at PR #58 merge. C.2-3.5 (next PR) is the documented
  hard-throw flip site; C.2-4 forward-points to that v1.1 amendment
  but does NOT modify mdx-bridge's CONTRACT.

- `apps/site/CONTRACT.md` — **NOT** modified. C.2-3 already shipped the
  `## Grid layout (Wave 5)` section there with `.skb-grid` selector
  authority + 12/6/1 breakpoint table at PR #60 merge. C.2-4
  cross-references `apps/site/src/styles/grid.css` as the CSS authority
  but does NOT modify `apps/site/CONTRACT.md` (consumer side only).

- `packages/heavy-block-boundary/CONTRACT.md` — **NOT** modified
  (C.2-7 scope; ADR-0014 v0.5 amendment).

- 8 `@skb/block-*` CONTRACT.md files — **NOT** modified.

D2 row 5 (boundary contract change) hit because the new
`packages/editor-shell/CONTRACT.md` `## Grid layout (Wave 5)` section
codifies the React-side grid container + auto-row-span contract that
downstream consumers (Stage C.4 wire-up at `apps/site/src/pages/notes/[slug]/edit.astro`
mount site — must import the same `apps/site/src/styles/grid.css`
authority as the SSR phase per ADR-0016 D9; future C.2-5 / C.2-6
drag/resize handles must dispatch through the future C.2-8 layoutReducer
declared by W5-2 invariant prose) will depend on. PRE-COMMIT CLAUDE
REVIEW (D1 stage 4) FIRES.

## adr_touched

NONE (D2 row 4 NOT hit per Wave 5 plan v1.1 §455+ ROW 4 门槛规则).
ADR-0016 D3 (`useAutoRowSpan` hook spec — lines 122-167 verbatim
including 3-stage 抖动收敛 implementation constraint) + D11 (Tiptap
inside / grid outside 分层) + D12 (layout reducer schema; impl deferred
to C.2-8) + §502 row 4 of 4 (editor-shell sister-doc sync site) already
authorise the entire surface (Pre-A2 lock + Wave 5 plan v1.1 amendment
2026-05-05). PR cites ADR-0016 D-list anchors in source JSDoc +
CONTRACT.md section + this PR.md but does NOT amend the ADR.

ADR-0017 D11 (Tiptap inside / grid outside 分层 architectural rationale)
is referenced by ADR-0016 D8 / D11 — not amended.

ADR-0014 v0.5 amendment (heavy-block boundary `heavyBoundaryDimensions`
联动 colSpan / rowSpan) is on the C.2-7 row — out of scope here.

ADR-0006 class 6 (sister-doc sync) is operationally satisfied (NOT
amended).

**Wave 5 plan v1.1 row C.2-3.5 hard-throw flip** is referenced as the
contract-active end-state anchor for editor-shell's NodeView attr
defensive-default Q2 absorbtion downstream-must-not-reuse constraint
(see CONTRACT.md new section); this PR.md cites the v1.1 amendment but
does NOT amend the plan or the ADR.

## acceptance

15 verifiable acceptance criteria. Each is a single shell command
producing an objectively checkable result. ACCEPT-stage pr-writer (D1
stage 6) re-runs all 15 against the post-commit working tree.

### AC#1 — `grid-container.tsx` exists + exports `GridContainer`

```bash
test -f packages/editor-shell/src/grid-container.tsx && \
  grep -F 'export function GridContainer' \
    packages/editor-shell/src/grid-container.tsx | wc -l
```

Expected: ≥ `1`. Verifies the file exists AND the named export exists.

### AC#2 — `grid-container.tsx` exports `GridContainerProps` type

```bash
grep -E '^export (interface|type) GridContainerProps' \
  packages/editor-shell/src/grid-container.tsx | wc -l
```

Expected: ≥ `1`. Verifies the public type alias.

### AC#3 — `grid-container.tsx` emits `class="skb-grid"` literal

```bash
grep -F 'skb-grid' packages/editor-shell/src/grid-container.tsx | wc -l
```

Expected: ≥ `1`. Verifies the wrapper class string is byte-equal to
the C.2-3 `apps/site/src/styles/grid.css` selector authority.

### AC#4 — `use-auto-row-span.ts` exists + exports `useAutoRowSpan`

```bash
test -f packages/editor-shell/src/use-auto-row-span.ts && \
  grep -F 'export function useAutoRowSpan' \
    packages/editor-shell/src/use-auto-row-span.ts | wc -l
```

Expected: ≥ `1`. Verifies the hook file + named export.

### AC#5 — `use-auto-row-span.ts` signature byte-equal to ADR-0016 D3

```bash
grep -E 'rowHeightPx[^,)]*=\s*48' \
  packages/editor-shell/src/use-auto-row-span.ts | wc -l
grep -E 'gapPx[^,)]*=\s*14' \
  packages/editor-shell/src/use-auto-row-span.ts | wc -l
```

Expected: each ≥ `1`. Verifies the default arg values match
ADR-0016 D3 line 127-128 prose (`rowHeightPx = 48` /
`gapPx = 14`).

### AC#6 — `use-auto-row-span.ts` cites ADR-0016 D3 in JSDoc

```bash
grep -F 'ADR-0016' packages/editor-shell/src/use-auto-row-span.ts | wc -l
```

Expected: ≥ `1`. Verifies the file head JSDoc cross-reference to the
authoritative ADR.

### AC#7 — `index.ts` barrel exports `GridContainer` + `useAutoRowSpan`

```bash
grep -F 'GridContainer' packages/editor-shell/src/index.ts | wc -l
grep -F 'useAutoRowSpan' packages/editor-shell/src/index.ts | wc -l
```

Expected: each ≥ `1`. Verifies the barrel re-exports landed.

### AC#8 — `index.ts` preserves existing 7 exports (no regression)

```bash
grep -F 'EditorShell' packages/editor-shell/src/index.ts | wc -l
grep -F 'registerBlocks' packages/editor-shell/src/index.ts | wc -l
grep -F 'registerKernels' packages/editor-shell/src/index.ts | wc -l
grep -F 'saveToMdx' packages/editor-shell/src/index.ts | wc -l
grep -F 'loadFromMdx' packages/editor-shell/src/index.ts | wc -l
grep -F 'SaveLoadOptions' packages/editor-shell/src/index.ts | wc -l
grep -F 'proseExtensions' packages/editor-shell/src/index.ts | wc -l
```

Expected: each ≥ `1`. Verifies no regression on the 7 A2-A5 exports.

### AC#9 — `editor-shell/CONTRACT.md` has `## Grid layout (Wave 5)` section

```bash
grep -E '^## Grid layout \(Wave 5\)' \
  packages/editor-shell/CONTRACT.md | wc -l
```

Expected: ≥ `1`. Verifies the new section header is present.

### AC#10 — `editor-shell/CONTRACT.md` cites W5-2 invariant prose

```bash
grep -F 'W5-2' packages/editor-shell/CONTRACT.md | wc -l
```

Expected: ≥ `1`. Verifies the W5-2 invariant prose anchor (per
ADR-0016 §502 row 4 of 4 sister-doc sync target).

### AC#11 — `editor-shell/CONTRACT.md` cites Wave 5 plan v1.1 row C.2-3.5 (Q2 downstream constraint)

```bash
grep -F 'C.2-3.5' packages/editor-shell/CONTRACT.md | wc -l
```

Expected: ≥ `1`. Verifies the Q2 v1.1 absorbtion downstream-must-
reference 锁 (CRITICAL constraint on hard-throw end-state).

### AC#12 — `editor-shell` source has NO `_gridAttrsExplicit` symbol (Q2 v1.1 downstream-must-not-reuse mechanical guard)

```bash
grep -RF '_gridAttrsExplicit' packages/editor-shell/src/ | wc -l
```

Expected: `0`. Verifies the C.2-3 era defensive-default marker is NOT
referenced from editor-shell source (per Wave 5 plan v1.1 R14 absorbtion
amendment 2026-05-05; mdx-bridge transitional marker shall not leak
into editor-shell consumer code).

### AC#13 — `pnpm --filter @skb/editor-shell test` PASS

```bash
pnpm --filter @skb/editor-shell test
```

Expected: exit 0. All existing test cases continue to PASS (existing
EditorShell A2-A5 test suites: `EditorShell.test.tsx` /
`registerBlocks.test.ts` / `registerKernels.test.ts` / `saveLoad.test.ts`)
PLUS the 2 new test files (`grid-container.test.tsx` + 6 cases /
`use-auto-row-span.test.ts` + 8 cases). No skipped tests.

### AC#14 — `pnpm check:affected` PASS (lint + typecheck + test + build + size)

```bash
pnpm check:affected
```

Expected: exit 0. Lint + typecheck + test + build + size-check all
PASS for `@skb/editor-shell` and any package transitively affected.
Per memory `feedback_codex_spark_lint_gap` — orchestrator independently
runs `pnpm --filter @skb/editor-shell lint` to catch lint-only issues
that codex executor might miss; per memory
`feedback_git_operator_ci_verification` — uncached
`pnpm --filter @skb/editor-shell typecheck` is also re-run independently
because turbo cache + vitest miss tsc errors.

### AC#15 — Lychee link-check pre-empt clean (PR.md only — orchestrator-self walk)

Manual walk per orchestrator: scan with the autolink-in-backticks
regex (per memory `feedback_lychee_autolink_in_backticks`) and confirm
zero hits — no `{word}`-shaped autolinks inside backticks; no `:line`
suffix on file links; no `npmjs.com` URLs; no markdown-link tilde
paths. Pre-flight grep:

```bash
grep -nE '`[^`]*<\w+>[^`]*`' \
  docs/plans/wave-5-main/C.2-4-editor-shell-grid.md
```

Expected: zero matches. CI Lychee runs against the merged tree as
canonical; orchestrator pre-empts locally.

## verification required

The following commands run by orchestrator-self at D1 stage 4
(PRE-COMMIT CLAUDE REVIEW) and re-run by pr-writer at D1 stage 6
(ACCEPT). All 15 ACs (above) plus the D1 stage-3 codex-pr-reviewer-55
8-class checklist, plus the following augmented checks:

- `pnpm --filter @skb/editor-shell typecheck` PASS (uncached; per
  memory `feedback_git_operator_ci_verification` — turbo cache +
  vitest miss tsc errors).
- `pnpm --filter @skb/editor-shell lint` PASS (per memory
  `feedback_codex_spark_lint_gap` — codex executor doesn't auto-run
  lint; orchestrator runs independently).
- `pnpm --filter @skb/editor-shell build` PASS — `dist/` regenerates
  with the new `grid-container.tsx` + `use-auto-row-span.ts` typed
  emit.
- `pnpm size-check` PASS — every new source file under 500 LOC
  (grid-container.tsx ~80 / use-auto-row-span.ts ~110; both well
  under cap).
- `git diff --cached --stat` post-staging shows exactly the 7
  whitelisted files (no incidental snapshot / `pnpm-lock.yaml` /
  cache contamination — per memory
  `feedback_git_operator_explicit_stage`).
- Manual sanity (post-build): no consumer wire-up at C.2-4 (the
  editor-shell consumer mount site lands at Stage C.4 per Wave 5 plan
  v1.1); the editor-shell standalone build verifies the API surface
  is well-formed.

## Plan-challenger absorbtion

NOT APPLICABLE for an implementation PR per ADR-0011 D7. The Wave 5
plan v1.1 row C.2-4 + ADR-0016 D3 + D11 + D12 + §502 row 4 of 4 +
ADR-0006 8-class audit checklist are the authoritative inputs. No
plan-challenger dispatch occurred at PLAN stage; the Wave 5 plan was
already plan-challenger-vetted at Pre-A5 lock + v1.1 R14 amendment
2026-05-05.

If pr-writer encounters a substantive open question during PLAN draft
(beyond the thin-wrapper-vs-editor-aware-variant question which is
LOCKED at orchestrator-recommended thin-wrapper path), it surfaces the
question in the PLAN-stage SendMessage to orchestrator BEFORE lock —
the open question on `GridContainer` shape ("thin wrapper that just
emits `<div class="skb-grid">` vs editor-aware variant that walks the
Tiptap doc and emits per-block `style.gridColumn` / `style.gridRow`")
is resolved IN FAVOR of the thin wrapper per orchestrator hint; the
per-block style emission lands at C.2-5 drag/drop or C.2-9 responsive
PR per ADR-0016 D11 deferral.

## R14 self-check

R14 = the 14-point pre-flight per ADR-0011 / Wave 5 plan §232 D12
"PR.md PLAN-stage validation":

1. ✅ **Stage scope-fence** — only files inside the locked Stage
   C.2-4 whitelist (7 files; cross-package files NOT touched).
   Row C.2-4 in plan v1.1 cites
   `packages/editor-shell/src/grid-container.tsx` (NEW) +
   `packages/editor-shell/src/use-auto-row-span.ts` (NEW) +
   `packages/editor-shell/CONTRACT.md` (extend); this PR adds
   `packages/editor-shell/src/index.ts` barrel re-exports + 2
   vitest suites + PR.md self-listed (D4 scope refinement; documented
   in row 4 below).
2. ✅ **ADR authoritative source** — ADR-0016 D3 (useAutoRowSpan hook
   spec lines 122-167) + D11 (Tiptap inside / grid outside 分层) + D12
   (layout reducer schema; impl deferred C.2-8) + §502 sister-doc-
   sync row 4 of 4 cited; ADR-0017 D11 referenced for layered
   architecture rationale; ADR-0006 class 6 (sister-doc sync)
   operationally satisfied.
3. ✅ **LOC budget** — ~400 LOC target (plan v1.1 row); breakdown:
   grid-container.tsx ~70 + use-auto-row-span.ts ~100 + index.ts +5
   + CONTRACT.md +95 + grid-container.test.tsx ~70 + use-auto-row-
   span.test.ts ~110 + PR.md (this file) excluded from app LOC count
   = ~450 (slightly above target by 12% — acceptable for the test
   surface's 8-scenario hook coverage; well within 500-line/file cap
   on every individual file).
4. ✅ **Whitelist refinement (barrel + tests)** — Wave 5 plan v1.1 row
   C.2-4 listed only the 3 core files (grid-container.tsx +
   use-auto-row-span.ts + CONTRACT.md); this PR adds `index.ts`
   barrel re-exports (mandatory for public-surface consumers) + 2
   vitest suites (TDD-front order requires test files written
   before impl). Per Wave 5 plan v1.0 D4 thresholds = scope
   refinement (single-package detail; doesn't widen Stage C.2 PR
   count materially OR shift success criteria; absorbable without
   plan amendment). Documented explicitly here AND in
   `## Risk register` row 1.
5. ✅ **No new package** — only `@skb/editor-shell` modified.
6. ✅ **No `pnpm-lock.yaml` change** — no new dependency.
7. ✅ **D2 trigger judgment** — Row 1 (CONTRACT.md change with NEW
   W5-2 invariant + grid container + hook public surface) + Row 5
   (boundary contract change since editor-shell is the React-side
   consumer of `BlockGridPosition` from C.2-2 + the `.skb-grid`
   selector authority from C.2-3) both hit; PRE-COMMIT CLAUDE REVIEW
   (D1 stage 4) FIRES; acknowledged in `## D2 trigger judgment`.
8. ✅ **Plan v1.1 row honored** — slight whitelist refinement
   (barrel + 2 vitest suites added inline) is within D4 scope-
   refinement absorption.
9. ✅ **TDD-front order** — `## test_cases` enumerates 14 cases + 1
   meta-test (15 total); `grid-container.test.tsx` +
   `use-auto-row-span.test.ts` are the first files written by codex
   executor (RED) before grid-container.tsx + use-auto-row-span.ts
   impl (GREEN).
10. ✅ **Deferred items documented** — layoutReducer + layoutEpoch
    impl (C.2-8); per-block `style.gridColumn` / `style.gridRow`
    emission (C.2-5 drag/drop OR C.2-9 responsive); design-tokens-
    derived rowH / gap CSS variable wiring (C.3 stage); ADR-0014 v0.5
    amendment for heavy-block-boundary dims联动 (C.2-7); Stage C.4
    consumer wire-up (`apps/site` notes/[slug]/edit.astro mount site)
    all listed in `## Out of scope` with target-PR-row references.
11. ✅ **Sister-doc sync** — `editor-shell/CONTRACT.md` `## Grid
    layout (Wave 5)` extended in same PR as code change (ADR-0006 D8 +
    D2 row 1 + ADR-0016 §502 row 4 of 4 satisfied).
12. ✅ **Lychee pre-empt** — backtick-autolink scan + `:line`-suffix
    + `npmjs.com` + tilde-path manual checks committed in
    `## acceptance` AC#15.
13. ✅ **Out-of-scope explicit list** — `## Out of scope` section
    enumerates C.2-3.5 / C.2-5..C.2-12 / layoutReducer impl (C.2-8) /
    per-block style emission / design-tokens / ADR amendments /
    consumer wire-up at apps/site (C.4 scope) / sample MDX backfill.
14. ✅ **Codex executor profile** — `codex-generic-executor`
    declared in `## executor`; D1 stage 5 commit staging pre-listed
    in `## Codex commit (D1 stage 5) staging`.

## D2 trigger judgment

Per ADR-0007 D2 trigger matrix:

- **Row 1 — CONTRACT.md change**: ✅ HIT.
  `packages/editor-shell/CONTRACT.md` has a NEW section `## Grid
  layout (Wave 5)` inserted between `## Public surface` and `## Wave
  3 Stage A expansion outline`. Existing sections UNCHANGED. The new
  section establishes the W5-2 invariant prose anchor (analog to W5-1
  in block-foundation) + `GridContainer` + `useAutoRowSpan` public
  surface. Row 1 → PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES.
- **Row 2 — package add/remove**: NOT hit. No new package; no
  removal; no peer-dep addition (all needed devDeps already at A2
  lock).
- **Row 3 — schema strict-narrowing**: NOT hit. No Zod schema /
  TypeScript type narrowing change. The new `GridContainerProps` type
  alias is purely additive (new public surface, distinct from existing
  `EditorShellProps`).
- **Row 4 — new ADR required**: NOT hit per Wave 5 plan v1.1 §455+
  ROW 4 门槛规则 codified in v1.1 amendment 2026-05-05: ROW 4 HIT iff
  (a) D-list/status semantics changed OR (b) NEW ADR added/amended.
  C.2-4 does not amend any ADR D-list; ADR-0016 D3 / D11 / D12 are
  referenced as-is from Pre-A2 lock.
- **Row 5 — boundary contract change**: ✅ HIT. The
  `packages/editor-shell/CONTRACT.md` `## Grid layout (Wave 5)`
  section codifies the React-side grid container + auto-row-span
  contract that downstream consumers (Stage C.4 wire-up at apps/site
  notes/[slug]/edit.astro mount site — must import the same
  `apps/site/src/styles/grid.css` authority as the SSR phase per
  ADR-0016 D9; future C.2-5 / C.2-6 drag/resize handles must dispatch
  through the future C.2-8 layoutReducer per W5-2 invariant prose)
  will depend on. Row 5 → PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES
  (already firing from Row 1; Row 5 reinforces).
- **Row 6 — sister-doc sync gap**: NOT hit.
  `packages/editor-shell/CONTRACT.md` is updated in the same PR as
  the code change; no sister-doc lag. Per ADR-0016 §502 row 4 of 4
  this is the documented sync site.
- **Row 7 — fixture invalidation**: NOT hit. No fixture change. The
  17 RTT fixtures in `@skb/mdx-bridge` are unchanged (mdx-bridge not
  touched).
- **Row 8 — CI / deploy / auth / security**: NOT hit. No CI pipeline
  / GitHub Actions / auth / secrets touched.

Conclusion: **PRE-COMMIT CLAUDE REVIEW (D1 stage 4) FIRES** on Row 1
+ Row 5. Heightened reviewer scrutiny in stage 3 NOT additionally
required (Row 2 + Row 8 NOT hit).

## Risk register

### Risk #1 — Whitelist extension: barrel `index.ts` + 2 vitest suites added beyond plan v1.1 row C.2-4 enumerated set

Wave 5 plan v1.1 row C.2-4 explicitly listed
`packages/editor-shell/src/grid-container.tsx` (NEW) +
`packages/editor-shell/src/use-auto-row-span.ts` (NEW) +
`packages/editor-shell/CONTRACT.md` (extend). This PR adds
`packages/editor-shell/src/index.ts` barrel re-exports (~5 LOC delta)
+ `packages/editor-shell/src/__tests__/grid-container.test.tsx` (NEW)
+ `packages/editor-shell/src/__tests__/use-auto-row-span.test.ts`
(NEW). Without the barrel re-exports, downstream consumers (Stage C.4
mount site) cannot import the new public surface from
`@skb/editor-shell` (would have to deep-import from
`@skb/editor-shell/src/grid-container` — violates package-boundary
discipline per ADR-0008). Without the vitest suites, TDD-front order
mandated by ADR-0011 D1 stage 2 cannot be observed. **Resolution**:
Wave 5 plan v1.0 D4 scope-refinement threshold permits within-package
detail refinements without amendment when (a) PR count not widened,
(b) success criteria not shifted, (c) single-package only. All 3
conditions hold. **Mitigation**: documented explicitly in `## title`
items 3 + 5 + 6 + `## files` + this row + R14 self-check row 4.
Reviewer codex stage 3 audit will flag if the additions expand
further. **Residue**: zero acceptable; the additions are documented
and narrow.

### Risk #2 — `layoutReducer` + `layoutEpoch` impl deferred to C.2-8 — partial-functional grid mutation pipeline

C.2-4 ships only the **W5-2 invariant prose** (forward-pointer to
ADR-0016 D12) + `GridContainer` thin wrapper + `useAutoRowSpan` hook.
The actual `layoutReducer` function + `LayoutMutation` interface +
`LayoutState` interface + conflict arbitration impl (per ADR-0016 D12
prose lines 401-434) are NOT implemented at C.2-4 — deferred to
C.2-8 (per Wave 5 plan v1.1 row C.2-8). Result: at C.2-4 merge, the
grid mutation pipeline is **prose-only**; downstream consumers (C.2-5
drag handles / C.2-6 resize handles) cannot dispatch through it yet
because it does not exist as code. **Mitigation**: (a) ADR-0016 D12
explicitly schedules the impl deferral (the `// editor-shell layout
reducer (Stage C.2 实施 PR scope; ADR-0016 D12 锁 schema)` comment in
the ADR prose at line 406 explicitly marks it as a future-impl
target); (b) C.2-5 / C.2-6 PRs are aware of the deferral via the
plan v1.1 row enumeration and will either depend on C.2-8 first OR
ship interim direct-NodeView-attr-mutation paths (orchestrator decides
at C.2-5 PLAN time); (c) the W5-2 invariant prose at C.2-4 establishes
the forward-pointer contract so reviewers can verify drift-free
implementation when C.2-8 lands. **Residue**: 1 sister PR (C.2-8);
acceptable.

### Risk #3 — `useAutoRowSpan` 3-stage 抖动收敛 happy-dom test fidelity

Vitest + happy-dom mocks `ResizeObserver` + `document.fonts.ready` +
`requestAnimationFrame`. The 3-stage 抖动收敛 logic depends on real
RO timing + font loading + rAF coalescence — all mocked here. Result:
the unit tests verify the **algorithm** correctness given controlled
inputs, NOT the **real-browser rendering** behavior under font-loading
+ image-loading + paste-large-md scenarios. **Mitigation**: (a) per
ADR-0016 AC#5b prose, real-render assertion is reserved for Playwright
(Stage C.5 visual smoke or later; per memory
`feedback_wsl2_chromium_launch` Playwright is CI-only on this host);
(b) the unit-test scenarios cover the 3-stage state machine
transitions, threshold filter, unmount cleanup — sufficient for the
W5-2 invariant prose contract; (c) the `computeRowSpan` pure helper
unit test (TC-14) directly validates the ADR-0016 D4 formula
arithmetic. **Residue**: ≤ 1 sister Playwright spec (C.5 scope);
acceptable.

### Risk #4 — `GridContainer` consumer must import `apps/site/src/styles/grid.css` at mount site

The `GridContainer` component emits `<div class="skb-grid">` but does
NOT import the `apps/site/src/styles/grid.css` stylesheet — the CSS
authority lives in `apps/site` (C.2-3 PR squash `2586328`). Consumers
mounting a `GridContainer` element outside `apps/site` (e.g., Storybook /
Ladle / standalone editor demos) MUST import the stylesheet
explicitly OR replicate the rules. **Mitigation**: (a) at Stage C.4
the canonical mount site is `apps/site/src/pages/notes/[slug]/edit.astro`
which inherits the `BaseLayout.astro` import chain that already pulls
in `grid.css` (per C.2-3 wire-up); (b) the editor-shell CONTRACT.md
new section explicitly cites this consumer-side requirement; (c)
storybook / ladle demos are NOT in Wave 5 scope — when they appear
(Phase 2+), the CSS-authority requirement is part of the
`@skb/editor-shell` consumer onboarding documentation (forward-
pointer documented). **Residue**: zero acceptable; the requirement is
documented explicitly.

### Risk #5 — `useAutoRowSpan` does NOT auto-commit to persistent state at C.2-4

Per ADR-0016 D3 implementation constraint + 3-stage 抖动收敛 Stage 1
prose ("does NOT commit to persistent state"), the hook returns the
computed rowSpan integer **for rendering use only**. Persistent commit
to Tiptap doc state OR layoutEpoch reducer dispatch is the
**consumer's** responsibility (lands at C.2-8 layoutReducer impl PR
where the auto-measure mutation source is wired into the reducer
pipeline per ADR-0016 D12 conflict arbitration table line 428).
Consumers naively wiring `useAutoRowSpan` directly into Tiptap node
attrs without going through layoutReducer will violate the W5-2
invariant. **Mitigation**: (a) the editor-shell CONTRACT.md new
section explicitly cites the W5-2 invariant prose ("ALL block grid
mutations ... 必经过此 reducer"); (b) C.2-5 drag handle PR will
dispatch through layoutReducer (per ADR-0016 D12 source priority
table); (c) reviewer codex 8-class audit at Stage 3 of any consumer
PR will catch direct-mutation violations of W5-2. **Residue**: zero
acceptable when reviewer discipline holds.

### Risk #6 — Q2 v1.1 absorbtion downstream-must-not-reuse `_gridAttrsExplicit` marker

**Row order (Wave 5 plan v1.1 table)**: C.2-3 → C.2-3.5 → C.2-4 →
C.2-5 → ... → C.2-12. **Execution order (this session)**: C.2-3
already merged (squash `2586328`) → C.2-4 (this PR; lands first per
session sequencing) → C.2-3.5 (subsequent PR — table position 3.5 is
fractional; chronological execution order is independent of table
position).

Per Q2 v1.1 absorbtion downstream-must-reference 硬约束: any C.2-4..
C.2-11 PR MUST reference C.2-3.5 hard-throw flip as the active
mdx-bridge contract; MUST NOT reuse the C.2-1 era defensive-default
`_gridAttrsExplicit` marker. **The constraint applies regardless of
chronological order**: even though C.2-3.5 has not yet landed at
C.2-4 merge time (mdx-bridge still has the defensive path active),
editor-shell source treats hard-throw as the contract-active end-state.

Why this is mechanically safe at C.2-4: editor-shell sources read
`BlockGridPosition` from Tiptap NodeView attrs as **passive data**
(per ADR-0016 D11) — they do not call mdx-bridge serialize / parse
directly, so the defensive-default path's transient existence in
mdx-bridge is invisible to editor-shell. The only way editor-shell
could couple to `_gridAttrsExplicit` is by importing the symbol from
mdx-bridge, which AC#12 mechanically forbids.

**Mitigation** (3-layer):
- (a) **mechanical**: AC#12 grep guard verifies zero `_gridAttrsExplicit`
  references in `packages/editor-shell/src/`.
- (b) **prose**: `editor-shell/CONTRACT.md` `## Grid layout (Wave 5)`
  section cites the literal `Wave 5 plan v1.1 row C.2-3.5` constraint.
- (c) **review**: reviewer codex Stage 3 ADR-0006 8-class hunt class
  #4 (single-authority schema consumer) catches any defensive-marker
  reuse drift.

**Residue**: zero acceptable; the guard is mechanical.

### Risk #7 — `document.fonts.ready` stale-callback edge case (low; accepted residue per Stage 3 reviewer)

`useAutoRowSpan` schedules a one-shot post-mount measurement after
`document.fonts.ready` resolves. The callback closure captures the
outer `mountedRef`. If `rowHeightPx` / `gapPx` / `contentRef` change
while the old fonts.ready promise is still pending, a stale callback
could schedule against the new effect's mounted state. **Risk
profile**: low — current defaults (48 / 14) and `contentRef` are
static at consumer sites; the edge case requires dynamic args which
no current consumer exercises. **Mitigation**: deferred to a future
Stage C.2 / Phase 2+ refinement (effect-local cancellation flag);
out-of-scope for C.2-4 since adding it now would expand the LOC
budget without functional gain at static-arg consumer call sites.
**Residue**: accepted per Stage 3 reviewer "PASS-WITH-RESIDUE" verdict;
flagged for future revisit if dynamic-arg consumer surfaces.

## Out of scope

The following items are explicitly OUT OF SCOPE for C.2-4 and tracked
to specific later Wave 5 PRs per plan v1.1 row enumeration:

- **C.2-3.5 hard-throw flip** (mdx-bridge defensive-default path
  removal; ADR-0016 D7 end-state lock; Wave 5 plan v1.1 R14 amendment
  2026-05-05): table position 3.5 (between C.2-3 and C.2-4 per v1.1
  row); subsequent PR in this session's execution order (C.2-4 lands
  first chronologically). Editor-shell source nevertheless treats
  hard-throw as the contract-active end-state per Q2 absorbtion (Risk
  row 6).
- **C.2-5 drag handle PR** (per Wave 5 plan v1.1 row C.2-5): drag-and-
  drop interaction layer; will dispatch through future C.2-8
  layoutReducer per ADR-0016 D12 source-priority table.
- **C.2-6 resize handle PR** (per Wave 5 plan v1.1 row C.2-6): resize
  interaction layer; same dispatch path as C.2-5.
- **C.2-7 heavy-block-boundary dims联动** (ADR-0014 v0.5 amendment):
  per-kind `heavyBoundaryDimensions` derive from colSpan / rowSpan;
  W5-1 联动 site.
- **C.2-8 layoutReducer + layoutEpoch impl** (per Wave 5 plan v1.1
  row C.2-8): the actual function impl deferred per ADR-0016 D12
  schema lock + Risk row 2.
- **C.2-9..C.2-12** other Stage C.2 PRs (responsive transition FSM
  impl / sample MDX grid-aware backfill / 17 RTT fixture grid-aware
  update / Stage C.2 close handoff pack) — none touched here.
- **Per-block `style.gridColumn` / `style.gridRow` emission**: lands
  at C.2-5 drag/drop OR C.2-9 responsive (whichever needs it first;
  ADR-0016 D11 deferral acknowledged).
- **Stage C.3 design-tokens** (ADR-0018 + Pre-A4 PR; OKLCH +
  breakpoint vars + row-h / gap as design-tokens-derived runtime
  constants): not touched at C.2-4.
- **Stage C.4 consumer wire-up** (`apps/site/src/pages/notes/[slug]/edit.astro`
  mount site for the editor-shell `GridContainer`): not touched at
  C.2-4.
- **Sample MDX grid-aware backfill** (`content/notes/sample-blocks/index.mdx`
  + `content/notes/sample-mdx-note.mdx`): C.2-9 OR equivalent scope.
- **Storybook / Ladle / standalone editor demo**: Phase 2+ scope.
- **Playwright real-browser `useAutoRowSpan` font-loading scenario
  test** (per ADR-0016 AC#5b): C.5 visual smoke OR later; per memory
  `feedback_wsl2_chromium_launch` Playwright is CI-only.
- **CRDT/OT collaborative editing** (ADR-0016 D12 explicit Phase 2+
  out-of-scope acknowledgement): not Wave 5.

## executor

`codex-generic-executor` (per Wave 5 plan v1.1 row C.2-4 column 4 +
ADR-0011 D6 default executor profile). TDD-front order: write
`grid-container.test.tsx` + `use-auto-row-span.test.ts` (RED) → write
`grid-container.tsx` + `use-auto-row-span.ts` (GREEN) → wire `index.ts`
barrel re-exports → CONTRACT.md `## Grid layout (Wave 5)` section. The
`computeRowSpan` pure helper is exported as a named export for direct
unit-test reach (TC-14) — separates the React hook surface from the
arithmetic helper.

## Codex commit (D1 stage 5) staging

Per ADR-0006 D8 explicit-file-list staging. Reviewer codex (D1 stage
5) runs:

```bash
git reset HEAD
git add \
  packages/editor-shell/src/grid-container.tsx \
  packages/editor-shell/src/use-auto-row-span.ts \
  packages/editor-shell/src/index.ts \
  packages/editor-shell/CONTRACT.md \
  packages/editor-shell/src/__tests__/grid-container.test.tsx \
  packages/editor-shell/src/__tests__/use-auto-row-span.test.ts \
  docs/plans/wave-5-main/C.2-4-editor-shell-grid.md
git diff --cached --stat
# verify count == 7 + lockfile NOT staged
git commit -m "..."
```

Per memory `feedback_git_operator_explicit_stage` — `git add -A` /
`git add .` are FORBIDDEN; explicit-file-list staging only;
`git diff --cached --stat` line count MUST equal 7 (the 7 whitelisted
files); any incidental file (snapshot / pnpm-lock.yaml / cache / OS
metadata) is a staging contamination → reset + restage.

## Related

- [ADR-0016 D3 + D11 + D12 + §502 row 4 of 4](../../decisions/ADR-0016-grid-data-model.md)
  — useAutoRowSpan hook spec + Tiptap inside / grid outside 分层 +
  layoutReducer schema (impl deferred to C.2-8) + sister-doc-sync
  authoritative anchor for editor-shell.
- [ADR-0017 D11](../../decisions/ADR-0017-drag-drop-ux.md) — referenced
  by ADR-0016 D8 / D11 for layered architecture rationale.
- [ADR-0011 D1+D2+D6](../../decisions/ADR-0011-linear-pipeline-execution-model.md)
  — pipeline + PR.md schema + codex-generic-executor profile.
- [ADR-0006 D8 + class 6](../../decisions/ADR-0006-asymmetry-audit-checklist.md)
  — sister-doc sync + 8-class audit + explicit-file-list staging.
- [Wave 5 plan v1.1 row C.2-4 + R14 amendment 2026-05-05](../../superpowers/plans/2026-05-04-phase-1-wave-5-integration.md)
  — locked Stage C.2 13-PR sequence + C.2-3.5 hard-throw flip
  introduction.
- [packages/editor-shell/CONTRACT.md](../../../packages/editor-shell/CONTRACT.md)
  — Wave 3 Stage A composition layer; new `## Grid layout (Wave 5)`
  section landing here.
- [packages/block-foundation/CONTRACT.md](../../../packages/block-foundation/CONTRACT.md)
  — W5-1 invariant authority (target of cross-package consumer
  pointer).
- [apps/site/src/styles/grid.css](../../../apps/site/src/styles/grid.css)
  — `.skb-grid` selector authority (C.2-3 PR squash `2586328`);
  consumer-side import requirement at editor-shell mount site.
- [Wave 5 C.2-3 PR.md](C.2-3-astro-grid.md) — preceding Stage C.2 PR
  (Astro renderer SSR-side grid container) for cross-PR scope
  context.
- [Wave 5 C.2-2 PR.md](C.2-2-block-foundation-grid.md) — preceding
  Stage C.2 PR (BlockGridPosition + COL_SNAPS + grid-math primitives)
  for `BlockGridPosition` type-source authority.
- [Wave 5 C.2-1 PR.md](C.2-1-mdx-bridge-grid-serialize.md) —
  preceding Stage C.2 PR (mdx-bridge grid attr serialize / parse)
  for transitional defensive-default path context.
