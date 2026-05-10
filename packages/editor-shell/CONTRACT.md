# `@skb/editor-shell` — Contract

Wave 3 Stage A composition layer. Composes the 8 block-* packages, 3 editor
sub-modules, kernel-registry adapters, and mdx-bridge into a usable Tiptap
editor surface. Closes the "editor-shell composition" deferral from
[ADR-0010 D7 #3](../../docs/decisions/ADR-0010-wave-2-close.md).

## Public surface

- `EditorShell` — functional React component. Mounts a Tiptap editor via
  `@tiptap/react`'s `useEditor` with the following extension stack
  (Wave 6 carry-forward #15a 2026-05-08):
  - `StarterKit` — prose nodes + marks (Wave 6 carry-forward #15b
    2026-05-08 re-enabled the inline `code` mark; pre-#15b it was
    disabled via `code: false` because the block-Code Tiptap node
    was named `code` and ProseMirror forbids the same name on both
    a node and a mark; the block-Code core was renamed to
    `componentCode` so the collision is gone). `EDITOR_UNSUPPORTED_MARKS`
    in `saveLoad.ts` is correspondingly empty — no marks are
    stripped at load time.
  - `Link.extend({ addAttributes: { title } }).configure({ openOnClick: false })`
    — markdown links survive into the editor as real anchors. The
    `Link.extend` override adds a `title` attribute so
    `[text](url "title")` round-trips without losing the title (default
    `@tiptap/extension-link` schema does not include `title`);
    `openOnClick: false` keeps anchor clicks from navigating away from
    the edit surface.
  - Consumer extensions appended via `EditorShellProps.extensions`
    (block-kind extensions from `wireRegistry` are passed through
    here per Wave 5 C.4).
- `EditorShellProps` — public props type:
  ```ts
  export interface EditorShellProps {
    /** Optional initial editor content (Tiptap doc JSON or HTML string).
     *  Defaults to an empty paragraph. */
    initialContent?: object | string;
    /** Optional change callback fired on each Tiptap update event. */
    onChange?: (editor: Editor) => void;
    /** Optional className applied to the EditorContent root for
     *  consumer-controlled styling. */
    className?: string;
    /** Optional creation hook: invoked once with the constructed editor
     *  instance after mount. Used by tests + future A3 wrappers needing
     *  imperative editor access. */
    onCreate?: (editor: Editor) => void;
    /** Optional consumer extensions appended after the built-in
     *  StarterKit + Link stack (carry-forward #15a 2026-05-08).
     *  Wave 5 C.4 wires the 8 block-kind extensions from `wireRegistry`
     *  through this prop. */
    extensions?: Extensions;
  }
  ```
  `Editor` type re-exported transitively from `@tiptap/core` via
  `@tiptap/react`.
- `registerBlocks(registry: BlockRegistry): void` — wires the 8 Wave 2
  block-* core + ui-default definitions into the supplied `BlockRegistry`
  instance. Idempotent at consumer scope (each registerBlocks call expects a
  fresh registry; calling twice on the same registry throws "Duplicate core
  name" per BlockRegistry contract). Insertion order = locked-plan order:
  callout, componentCode, image (component), math, pdf (render), jupyter,
  nn-viz, agent-flow (viz). Per ADR-0009 D1: 3 component + 2 render + 3
  viz = 8. (Wave 6 carry-forward #15b 2026-05-08 renamed the `code` core
  to `componentCode` to escape the ProseMirror node/mark namespace
  collision with StarterKit's inline `code` mark.)
- `proseExtensions` — Tiptap Extension array re-exported from
  `@skb/block-foundation`. Consumers wire into `useEditor({ extensions: [...] })`
  alongside `StarterKit` for prose-block-aware editing. The
  `EditorShell` component does not consume this barrel; its own
  built-in stack (StarterKit + Link per § Public surface above) is
  layered with consumer-supplied extensions via `EditorShellProps.extensions`.
- `registerKernels(registry: KernelRegistry, adapter?: KernelAdapter): void`
  — wires `PyodideAdapter` (default) into the supplied `KernelRegistry`
  instance. `adapter` parameter lets consumers override with a custom
  `KernelAdapter` implementation. PyodideAdapter constructor is cheap
  (no Pyodide boot until `startSession()`). `KernelAdapter` type imported
  from `@skb/kernel-adapter` (3rd workspace dep added at A4).
- `saveToMdx(editor: Editor, options?: SaveLoadOptions): string` — serialize
  the editor's current document to MDX source. Prose-only at A5 (Stage A);
  component blocks throw via mdx-bridge's existing fail-loud rule until B1
  extends the walker. `options.blockRegistry` is forward-compat (accepted
  but unused at A5; B1 threads through to mdx-bridge per-call injection).
- `loadFromMdx(editor: Editor, source: string, options?: SaveLoadOptions): void`
  — replace the editor's document by parsing MDX source. Same prose-only
  semantics as `saveToMdx`; component-block JSX throws until B1.
- `SaveLoadOptions { blockRegistry?: BlockRegistry }` — public options type
  for the per-call BlockRegistry injection pattern. Threading lands in B1.
- `useResponsiveCols(options?)` — Wave 5 C.2-9 responsive viewport hook.
  Returns `ViewportCols` (`12 | 6 | 1`) and accepts optional
  `onTransitionStart` / `onTransitionEnd` callbacks for consumers that dispatch
  layout-reducer responsive transition actions.
- `RESPONSIVE_BREAKPOINTS` — readonly `{ tablet: 768, desktop: 1024 }` numeric
  bridge for ADR-0016 D5 until Stage C.3-1 lands design-token breakpoint vars.
- `ViewportCols` and `UseResponsiveColsOptions` — public types for the
  responsive viewport hook and `GridContainerProps.viewportCols` handoff.

### NoteSaveAdapter (Wave 5; contract hardened at C.4-1)

ADR-0018 D8 lines 339-451 are the canonical interface authority for the
C.4 save-path public surface:
[ADR-0018 D8](../../docs/decisions/ADR-0018-v2-visual-migration.md).

Public exports:

- `NoteSaveAdapter` — stable interface exposing `slug`, `load()`, and
  `save(state)`. Implementations selected by consumers MUST resolve
  `load()` to a `NoteState` or `null`, and MUST return
  `{ ok: false, error }` for expected save failures instead of throwing.
- `NoteState` — interface carrying `mdxSource`, optional `tiptapState`,
  `lastModified`, and consumer-incremented `version`.
- `ReadonlyJSONValue` — recursive read-only JSON value type for optional
  same-session Tiptap cache data.
- `LocalStorageAdapter` — Wave 5 MVP implementation of `NoteSaveAdapter`
  preserved from C.4-prelude.
- `ApiAdapter` — Wave 6 Stage B.3 network-backed implementation of
  `NoteSaveAdapter` consuming the path-(b) endpoint shipped at
  [`apps/site/src/pages/api/notes/[...slug].ts`](../../apps/site/src/pages/api/notes/%5B...slug%5D.ts).
  Constructor `(slug: string, apiBase = '/api/notes')`. `load()` issues
  `GET ${apiBase}/${slug}` and returns the parsed `NoteState`, or `null`
  on HTTP 404 (no saved state); throws on any other non-2xx status so
  consumers can fall back to LocalStorageAdapter when the network path
  is unavailable. `save()` issues `POST ${apiBase}/${slug}` with a JSON
  body matching `NoteState`; non-2xx responses resolve to
  `{ ok: false, error: 'save failed: <status>' }` and `fetch` rejections
  resolve to `{ ok: false, error }` (never throws). No auth at Wave 6
  Stage B; multi-user/auth boundary lives in the Phase 3+ path-(a)
  separate `apps/api` server.

Storage semantics:

- See sister-doc:
  [apps/site/CONTRACT.md § Edit route (Wave 5)](../../apps/site/CONTRACT.md).
- localStorage key prefix: `skb-note:{slug}` per ADR-0018 D8 lines 454-455.
- `PER_NOTE_MAX_BYTES = 2 MB`; oversized serialized states return
  `{ ok: false, error }` instead of writing.
- `AGGREGATE_WARN_BYTES = 5 MB`; aggregate `skb-note:*` storage above this
  threshold emits a `console.warn` but does not block the save.
- Corrupted JSON and localStorage `SecurityError` during load return `null`
  with a warning. `QuotaExceededError` and `SecurityError` during save return
  `{ ok: false, error }`.

**Wave 6 Stage B.3 promotes ApiAdapter from forward-stub to first-class
public surface** per ADR-0018 v0.6 D11. `save-adapter.ts` defines the
executable class; `index.ts` exports it alongside `LocalStorageAdapter`.
`src/__tests__/api-adapter.test.ts` is the contract test (mocked fetch)
covering load 200/404/non-2xx, save 200/non-2xx/network-rejection, and a
roundtrip through an in-memory storage fake. Adapter selection at the
edit-route mount lands at Wave 6 B.4 (ApiAdapter primary +
LocalStorageAdapter fallback per ADR-0018 v0.6 D13).

The component does NOT include a `'use client'` pragma — consumers (Stage C
apps/site) decide the client/server boundary at integration time.

## Grid layout (Wave 5)

**W5-2: editor-shell `layoutReducer` + `layoutEpoch` single-source mutation 是
grid block position 的唯一权威 mutation site.** 所有 block grid mutations (drag
from grid container / resize from handle / `useAutoRowSpan` auto-measure /
responsive transition / undo-redo / mdx-load) 必经过此 reducer; 冲突仲裁规则 per
ADR-0016 D12 + 权威矩阵 section. CRDT/OT 协同编辑 OUT OF SCOPE (Phase 2+);
editor-shell `layoutEpoch` 是 single-source ordering, NOT 分布式 vector clock.
`layoutReducer` + `layoutEpoch` implementation shipped at C.2-8. C.4-1 keeps
the note-save adapter public surface aligned with this single-source mutation
model: persistence adapters save/load note state at the route boundary, while
grid block position mutation remains owned by the reducer.

`GridContainer` public surface:

```ts
export interface GridContainerProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  viewportCols?: ViewportCols;
}

export function GridContainer(props: GridContainerProps): JSX.Element;
```

`GridContainer` emits a passive `div` with the required `skb-grid` class and
forwards arbitrary React children. It does not walk the Tiptap document, mutate
NodeView attrs (cf-20b reads attrs at render time but does NOT write back; per
ADR-0016 D11 grid attrs are passive data on NodeView wrappers). When
`viewportCols` is supplied, it emits `data-skb-viewport-cols` and adds
`.skb-grid--mobile` for `viewportCols === 1` per ADR-0016 D5 and ADR-0017 D9.
Minimal usage:

```tsx
<GridContainer>
  <EditorContent editor={editor} />
</GridContainer>
```

The `.skb-grid` selector authority is `apps/site/src/styles/grid.css` (C.2-3
PR squash `2586328`; cf-20b 2026-05-09 amendment adds the
`.skb-grid > .skb-editor-content` + `.skb-grid .ProseMirror` two-level
grid rules for the editor-mount path per ADR-0016 v0.2 D11.1 amendment).
The editor-shell consumer at the mount site MUST import that stylesheet,
mirroring the SSR phase emission per ADR-0016 D9 phase strategy.

### Editor-surface grid lock (Wave 6 cf-20b; ADR-0016 v0.2 D11.1 amendment)

cf-20b promotes the editor-surface to a 12-col CSS Grid per the v2 contract
at `/mnt/d/download/web/v2-styles.css:137-147`. Two-level grid:

1. Outer `.skb-grid` (the `<GridContainer>` wrapper) is a 12-col grid (C.2-3
   contract unchanged).
2. Inner `.ProseMirror` (Tiptap's render target) is **also** a 12-col grid
   (cf-20b NEW). The intermediate `.skb-editor-content` div spans
   `grid-column: 1 / -1` so the inner grid inherits the full container
   width. NodeView wrappers `.skb-block-nodeview` (Tiptap's direct
   children inside `.ProseMirror`) become grid items and read their
   placement from `node.attrs.{col, row?, colSpan, rowSpan}` per
   ADR-0016 D2.

`EditorShell` always applies `skb-editor-content` to the `<EditorContent>`
host element so the apps/site grid CSS rule
(`.skb-grid > .skb-editor-content { grid-column: 1 / -1 }`) can target it.
Consumer-supplied `className` is concatenated AFTER the base class.

Per ADR-0016 v0.2 D11.1 amendment, the limitation: ProseMirror's arrow-key
navigation goes to the next document-order node, NOT the visually-above
side-by-side block when two `colSpan ≤ 6` siblings sit in different visual
columns. Document this for end users + future cf-22 keyboard a11y PR; cf-20b
does NOT add a custom keymap.

### Grid placement helpers (Wave 6 cf-20b; shared single source)

The `BlockGridPosition → CSSProperties` mapping is now a single helper
exported from both the editor-shell barrel `@skb/editor-shell` AND the deep
subpath `@skb/editor-shell/src/grid-style.ts` (the deep subpath is required
for Astro SSR consumers — `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`
+ `apps/site/src/lib/mdx-adapter.ts` — to avoid pulling the editor-shell
React/Tiptap dependency tree into the SSR bundle, which would break
`astro build` with `require is not defined in ES module scope` from
transitively-loaded `@tensorflow/tfjs`).

Public surface (added at cf-20b):

```ts
export interface GridPlacementInput {
  readonly col: number;
  readonly row?: number;
  readonly colSpan: number;
  readonly rowSpan: number | 'auto';
}

export interface GridPlacementOptions {
  /** When rowSpan is 'auto', the integer to substitute. Defaults to 1. */
  readonly autoRowSpan?: number;
}

/** React CSSProperties consumer (BlockNodeView.tsx + mdx-adapter.ts). */
export function gridPlacementStyle(
  pos: GridPlacementInput,
  options?: GridPlacementOptions,
): CSSProperties;

/** Astro inline-style-string consumer (3 heavy block .astro wrappers). */
export function gridPlacementStyleAttr(
  pos: GridPlacementInput,
  options?: GridPlacementOptions,
): string;

/** Defensive coercion from arbitrary attrs / props record. */
export function extractGridPosition(
  attrs: Record<string, unknown> | undefined,
): GridPlacementInput | null;
```

Formula (per ADR-0016 D2 CSS application block):
- `gridColumn = ${col} / span ${colSpan}`
- `gridRow = row !== undefined ? ${row} / span ${effectiveRowSpan} : span ${effectiveRowSpan}`
- `effectiveRowSpan = rowSpan === 'auto' ? autoHint : rowSpan` (autoHint
  defaults to 1 until `useAutoRowSpan` integration in cf-20c+).

Three consumers, one source — the formula MUST stay byte-equal across
`BlockNodeView.tsx` (editor), `mdx-adapter.ts` (light-block read), and the
3 heavy `.astro` wrappers (read). Drift detection is via the shared module
import; any future renderer adding a 4th consumer SHOULD import
`gridPlacementStyle` rather than re-deriving the formula.

`useAutoRowSpan` public surface:

```ts
export function useAutoRowSpan(
  contentRef: RefObject<HTMLElement | null>,
  rowHeightPx = 48,           // matches --row-h
  gapPx = 14,                  // matches --gap
): number;
```

The hook returns an integer rowSpan greater than or equal to 1. It implements
ADR-0016 D3's rendering-derived markdown rowSpan behavior: rowSpan is computed
from `scrollHeight` and is not itself a persistent document write. Its 3-stage
抖动收敛 behavior is:

1. Stage 1: first ResizeObserver event establishes the initial rowSpan.
2. Stage 2: later font, image, and code-fence height changes inside one rAF
   window coalesce into a single render commit.
3. Stage 3: subsequent ResizeObserver events update only when the integer
   rowSpan delta is at least 1; delta 0 is ignored as pixel noise.

Forward-pointers:

- ADR-0016 D3 owns the auto-rowSpan hook spec and ResizeObserver constraints.
- ADR-0016 D11 owns the Tiptap inside / grid outside layering.
- ADR-0016 D12 owns the layout reducer schema and conflict arbitration; code
  implementation shipped at C.2-8 in `src/drag-drop/layout-reducer.ts` (epoch += 1
  only on drag-end-success; cancel + mode-none rollback to S0 snapshot).
- ADR-0016 section 502 row 4 of 4 names this CONTRACT.md as the editor-shell
  sister-doc sync site.

Cross-package consumer note: `BlockGridPosition` from `@skb/block-foundation`
(W5-1 invariant authority; Pre-A2 ADR-0016 D2 lock + C.2-2 type
materialisation) is the type contract editor-shell reads from Tiptap NodeView
attrs. Per ADR-0016 D11 those attrs are passive data; active mutation flows
through the future W5-2 reducer.

Q2 v1.1 absorbtion downstream-must-reference lock: editor-shell grid container
reads NodeView attrs assuming explicit `col` / `colSpan` / `rowSpan` per
Wave 5 plan v1.1 row C.2-3.5 hard-throw flip end-state (mdx-bridge defensive
defaults removed); `_gridAttrsExplicit` marker (C.2-1 to C.2-3 transitional)
SHALL NOT be referenced from editor-shell source. The ADR-0016 D2 defaults
(`col=1`, `colSpan=12`, `rowSpan=1`) MAY be honored at editor-shell as
React-side defensive-rendering defaults, an orthogonal concern from mdx-bridge
defensive defaults with the same numeric values but a distinct enforcement
layer.

### Drag/Drop layer (C.2-5 + C.2-8 + C.2-9)

C.2-5 and C.2-8 add the editor-side drag/drop UX primitives under
`packages/editor-shell/src/drag-drop/`:

- `edge-rects.ts` exports `EDGE_W`, `GAP`, `EdgeRect`, `BlockLayout`, and
  `computeEdgeRects(blocks)`. It pre-computes the 4 half-in / half-out edge
  rectangles per snapshot block per ADR-0017 D2 and D5 option 1.
- `tiebreak.ts` exports `EdgeMatch`, `DragVelocity`, `tiebreak(matches,
  velocity)`, and `findMatches(cursorX, cursorY, edgeRects, blockRects)`.
  It implements ADR-0017 D3's signed-distance formula, primary
  `Math.abs(distance)` ordering, velocity-direction tiebreak at
  epsilon 0.5px/frame, spatial fallback, and `blockId.localeCompare` stable
  terminator.
- `outline-overlay.tsx` exports `OutlineOverlay` and `OutlineOverlayProps`.
  It implements the C.2-5 subset of ADR-0017 D4 scheme A: static base plus
  one active dashed accent for the affected edge. The `host` and
  `shifted-block` outline classes remain later integration scope.
- `drop-pulse.ts` exports `DropPulse`, `DropPulseProps`, and
  `dropPulseClassName`. It implements ADR-0017 D11: a 720ms success halo
  using `box-shadow: 0 0 0 4px var(--accent-success, oklch(70% 0.12 145 / 0.5))`.
  Consumers mount it only for `drag-end-success`; cancel, mode-none, and
  outside-grid drops do not trigger the pulse. The fallback is the ADR-0018
  Stage C.3 bridge until `--accent-success` lands in design tokens.
- `drag-ghost.ts` exports `DragGhost`, `DragGhostProps`, and
  `GhostKind = 'canvas' | 'runnable' | 'image' | 'markdown'`. It implements
  ADR-0017 D10 with `position: fixed`, cursor `translate(...)`, a
  `-1.5deg` baseline rotation, velocity-driven `+/-5deg` rotation at
  5px/frame, and the public `.ghost-canvas` / `.ghost-runnable` /
  `.ghost-image` / `.ghost-markdown` class roster. The glyph is plain text
  `◇`; SVG or icon-font styling is Stage C.3 scope.
- `esc-cancel.ts` exports `useEscCancel` and `EscCancelOptions`. It implements
  ADR-0017 D8 + Q8: the hook owns the global `keydown` subscription, calls
  `preventDefault()` and `stopPropagation()` only when `dragActive === true`,
  dispatches `drag-end-cancel` through the consumer callback, lets native Esc
  behavior pass through when inactive, and restores the drag-start focus target
  on drag-end.
- `layout-reducer.ts` exports `layoutReducer`, `LayoutAction`, `LayoutState`,
  and `GridSnapshot`. It implements ADR-0017 D12 plus ADR-0016 D12/Q12:
  `drag-start` saves S0 without changing epoch, `drag-over` is reference-equal
  no-op preview, `drag-end-success` commits S1 with `epoch + 1`, and
  `drag-end-cancel` / `drag-end-mode-none` roll back to S0 without changing
  epoch. `responsiveTransition: 'in-progress'` rejects `drag-start` inside
  the pure reducer. C.2-9 adds `responsive-transition-start` and
  `responsive-transition-end` action variants; both leave `epoch` unchanged and
  only flip `responsiveTransition` between `'in-progress'` and `'idle'`.
- `applyDropMode(input)` (Wave 6 cf-20c-1, 2026-05-09) — pure mutation algebra
  for ADR-0017 D1 drop modes. Computes the post-drop block positions for
  `split-left` / `split-right` / `split-top` / `split-bottom` / `empty` /
  `none`. Throws on invalid input (split with non-halvable colSpan; empty
  without target; palette insertion without newBlock; split-* without
  hostBlockId). Consumer (cf-20c-2 drag-handle UI wire) computes the input
  from pointer events + edge-rects + tiebreak, calls this function, and
  dispatches `drag-end-success` to layoutReducer with the result as the
  `mutation: GridSnapshot` parameter. Co-exported types: `ApplyDropModeInput`,
  `DropMode`, `GridSnapshotIdentified`, `IdentifiedBlock` (extends
  `BlockGridPosition` with stable `id` from ProseMirror node IDs at the
  consumer layer; `BlockGridPosition` itself is unchanged in
  `@skb/block-foundation`).
- `DragHandleButton` / `DragHandleButtonProps` / `DRAG_HANDLE_MIME` (Wave 6
  cf-20c-2, 2026-05-09) — per-block drag-handle button rendered inside
  `.skb-block-nodeview__gutter` (cf-19 shell). Uses HTML5 native DnD per
  Q7 spike result (verified pre-implementation: native DnD survives
  ProseMirror inside `contenteditable=false` gutter without needing
  pointer-events fallback). Dispatches drag-start / drag-end via
  `DragDropContext`; `DRAG_HANDLE_MIME = 'application/x-skb-block-id'`
  is the private dataTransfer MIME type so other DnD handlers don't
  pick up our payload. The button emits `data-skb-drag-handle="<blockId>"`
  (replaces the cf-19 standalone floating `<DragHandle />` which is
  removed from `EditorShellMount.tsx`).
- `DragDropContext` / `DragDropProvider` / `DragDropContextValue`
  (Wave 6 cf-20c-2) — React context bridging the per-block presentational
  drag-handle button to the lifecycle owner (`useDragDropPipeline()` mounted
  at `EditorShellMount.tsx`). Provider value: `{ onDragStart(blockId, origin),
  onDragEnd(origin), sourceBlockId }`. The `sourceBlockId` field
  (Wave 6 cf-20c-2 R2 F1 fix 2026-05-09) exposes the currently-lifted
  drag source so `BlockNodeView.tsx` can apply the
  `.skb-block-nodeview--dragging-self` modifier class for the ADR-0017
  D6 line 247 source-lift visual (`visibility: hidden +
  pointer-events: none + transition: none` — preserves grid layout
  space while hiding the visual; replaces R1's v2-demo opacity +
  grayscale model that ADR-0017 D6 line 255 explicitly rejects); null
  = no active drag (steady state). Default context value null =
  degraded mode (button renders, drag callbacks no-op, no lift).
- `useDragDropPipeline({editor, gridSelector?})` (Wave 6 cf-20c-2) — drag/drop
  lifecycle owner hook. Composes the existing primitives (snapshot,
  edge-rects, tiebreak, `applyDropMode`, layoutReducer, OutlineOverlay,
  DragGhost, DropPulse, useEscCancel) into the actual interactive drag.
  Returns `{state, layoutState, onDragStart, onDragEnd, clearLastDropped}`.
  The `state.active` / `state.activeMatch` / `state.cursor` /
  `state.lastDroppedBlockId` fields drive `<OutlineOverlay>` +
  `<DragGhost>` + `<DropPulse>` mounts at the consumer layer.
  `clearLastDropped()` (Wave 6 cf-20c-2 R1 F2 fix 2026-05-09) is wired
  to `<DropPulse onAnimationEnd={clearLastDropped} />` at the consumer
  layer so the pulse unmounts after its 720ms keyframe; `lastDroppedBlockId`
  resets to null preparing for the next drag cycle. Block ID source per
  cf-20c-2 D2: ProseMirror node `pos` as string (Path A; UUID-based
  stable IDs deferred to a future schema-mod PR). ADR-0017 D6
  source-lift (cf-20c-2 R2 F1 fix; replaces R1's v2-demo
  opacity/grayscale model that ADR-0017 D6 line 255 explicitly
  rejects): `onDragStart` filters the source out of the snapshot
  layouts BEFORE computing edge-rects (so the lifted source can never
  self-match in tiebreak), AND the source NodeView wrapper applies
  `.skb-block-nodeview--dragging-self` modifier (`visibility: hidden +
  pointer-events: none` per ADR-0017 D6 line 247 verbatim). Velocity
  unit per ADR-0017 D3: pipeline multiplies raw `delta px / delta ms`
  by `VELOCITY_WINDOW_MS = 16` so `tiebreak()` reads `vx`/`vy` in the
  contracted `px/frame at 60fps` unit (cf-20c-2 R1 F3 fix). Threshold
  math: `tiebreak()` direction filter fires when `speed > 0.5 px/frame`;
  at 60fps (16.67ms/frame) that's `~30 px/sec` minimum velocity to
  trigger the direction-aware tiebreak. Pre-R1 the pipeline passed
  raw `px/ms` (1 px/ms = 60000 px/sec at 60fps); the threshold check
  required `raw_vx > 0.5 px/ms = 30000 px/sec` to fire — virtually
  never reached by real cursor drags (typical drag 200-2000 px/sec).
  R1 fix landed the unit alignment so the `> 0.5 px/frame` threshold
  fires for any drag faster than ~30 px/sec (the intended threshold
  per ADR-0017 D3). DropPulse landed-rect (cf-20c-2 R2 F2 fix;
  replaces R1's pre-drag snapshot rect model): pipeline re-measures
  the source NodeView via `editor.view.nodeDOM(livePos).getBoundingClientRect()`
  AFTER Tiptap setNodeMarkup commits + 2 rAFs (React commit cycle +
  browser layout pass), and exposes the result as
  `state.lastDroppedRect` so the consumer's `<DropPulseAtRect>` mounts
  at the LANDED position per ADR-0017 D11 line 344 ("源块进入新 grid
  位置 + outline fade-out 完成"). Pre-R2 the consumer used the
  snapshotted rect (pre-drag full-width source position) which
  produced a pulse at the wrong location.
- **Rapid-action animation isolation pattern (cf-20c-2 R3 F2 fix
  2026-05-09)** — `useDragDropPipeline` exposes a monotonic
  `state.dropEpoch: number` counter incremented each successful drop.
  Consumers MUST pass `key={pipeline.state.dropEpoch}` on the
  `<DropPulseAtRect>` (or any animation component driven by
  `lastDroppedBlockId` / `lastDroppedRect`) so React unmounts +
  remounts the animation cleanly across rapid drops. Pre-R3 a drag →
  drop → drag → drop sequence within 720ms (faster than the prior
  pulse animation) produced a stale half-faded pulse at the new
  landed position because React's reconciliation reused the prior
  `<DropPulse>` instance and the keyframe didn't restart. The
  `dropEpoch` key is the canonical "rapid-action animation isolation"
  pattern; cf-20d resize will adopt it for its own success-pulse
  mount.

  Atomic state transitions (cf-20c-2 R3 F2): the pipeline ALSO clears
  `lastDroppedBlockId` + `lastDroppedRect` to null AT THE START of
  the drop handler (BEFORE the 2-rAF re-measure scheduling), then
  sets both fields atomically together with the new `dropEpoch + 1`
  value when the rect measurement completes. Consumers should NEVER
  see a state where `lastDroppedBlockId !== null && lastDroppedRect
  === null` — the conditional render `lastDroppedBlockId !== null &&
  lastDroppedRect !== null` is defense-in-depth against any future
  pipeline bug that breaks the atomic invariant.

Drag/drop edge-width is coupled to grid `--gap` via `EDGE_W = 2 * GAP`.
`EDGE_W = 28` and `GAP = 14` ensure the 14px gap between adjacent blocks is
fully covered by both neighbours' edge rects, eliminating the dead zone where
a cursor in the gap would miss every edge. Cross-package consumer parity:
`apps/site/src/styles/grid.css` owns `.skb-grid { --gap: 14px }` from C.2-3;
that value MUST stay byte-equal to the `GAP = 14` export from
`edge-rects.ts`. Drift is an algorithm replication failure mode, not a visual
token preference.

The drag/drop layer consumes the W5-1 `BlockGridPosition` shape authority from
`@skb/block-foundation` conceptually: block bounding boxes are derived from
grid `{ col, row?, colSpan, rowSpan }` dimensions per ADR-0016 D11's Tiptap
inside / grid outside layering. The modules do not mutate NodeView attrs; they
emit geometric data and visual feedback for the layoutReducer (shipped at C.2-8)
which arbitrates drag-end-success vs drag-end-cancel mutations.

Wave 5 plan v1.1 row C.2-3.5 is the active downstream constraint: drag/drop
modules MUST NOT reference `_gridAttrsExplicit`, the mdx-bridge transitional
marker removed at the hard-throw flip end-state (`b019a31`). ADR-0016 D2
numeric defaults may still be used as React-side defensive rendering defaults
at a future `BlockLayout` input boundary; that is orthogonal to mdx-bridge
hard-throw enforcement.

`layoutReducer` + `layoutEpoch` shipped at C.2-8 per Wave 5 plan v1.3 row
C.2-8. C.2-4 establishes the W5-2 invariant prose, thin grid container, and
auto-row-span hook; C.2-8 realizes the ADR-0017 D8/D10/D11/D12 public surfaces
and the ADR-0016 D12 single-user, single-session mutation pipeline.

### Resize layer (C.2-6)

C.2-6 adds the editor-side resize visual primitives under
`packages/editor-shell/src/resize/`:

- `col-ruler.tsx` exports `ColRuler` and `ColRulerProps`. It renders the
  active column snap stops during resize and returns `null` when
  `totalCols === 1` per ADR-0017 D9's mobile 1-col view-only branch.
- `size-tooltip.tsx` exports `SizeTooltip`, `SizeTooltipProps`, and
  `colSpanToFraction(colSpan, totalCols)`. It renders the fixed cursor tooltip
  at `cursorX + 12` / `cursorY - 8` and uses ADR-0017 D9's canonical fraction
  tokens such as `1/2`, `2/3`, and `full`.

`ColRuler` consumes snap sets produced by `effectiveColSnaps(viewportCols)` from
`@skb/block-foundation` (ADR-0016 D6 Q4 authority). That helper is intentionally
not re-exported from the editor-shell barrel; consumers import it from
`@skb/block-foundation` directly while importing `ColRuler`, `SizeTooltip`, and
`colSpanToFraction` from editor-shell.

The stop highlight literal `oklch(58% 0.16 35 / 0.4)` remains in the C.2-6
source per ADR-0017 D9, with migration to design tokens deferred to ADR-0018
and Stage C.3. Resize-handle DOM emission, pointer event wiring, and snap commit
remain later integration scope. C.2-9 ships the `.skb-grid--mobile` state
emission contract; the CSS rules under that selector land in C.2-11.

Cross-package consumer parity: the `gap` default in `ColRuler` comes from
`@skb/block-foundation` `DEFAULT_GRID_GEOMETRY.gap` and MUST stay byte-equal to
`apps/site/src/styles/grid.css` `.skb-grid { --gap: 14px }` plus
`@skb/editor-shell` `drag-drop/edge-rects.ts` `GAP = 14`. Drift here is an
algorithmic-constant replication failure, not a visual-token preference.

Wave 5 plan v1.1 row C.2-3.5 remains the active downstream constraint for the
resize layer: modules MUST NOT reference `_gridAttrsExplicit`, the mdx-bridge
transitional marker removed at the hard-throw flip end-state (`b019a31`).

#### Resize wire (Wave 6 cf-20d 2026-05-09)

Wave 6 cf-20d composes the C.2-6 visual primitives (`ColRuler`, `SizeTooltip`)
plus a new `RowLadder` per `/mnt/d/download/web/v2-styles.css:359-385` into
the actual interactive resize wire. Public surface added under
`packages/editor-shell/src/resize/`:

- `resize-handles.tsx` exports `ResizeHandles({blockId, gridKind?})`. Per-block
  presentational component that renders 3 `<div class="gblock-handle right|bottom|corner">`
  on the `.skb-block-nodeview` wrapper per v2-styles.css:256-311. Right handle
  is always rendered; bottom + corner are gated by `gridKind !== 'prose'` per
  ADR-0017 D9 (defensive default `gridKind === undefined` → render-all-3 since
  the 8 sample-blocks BlockUIDefinition entries don't currently set `gridKind`,
  and they're all non-prose component/render/viz).
- `use-resize-pipeline.ts` exports `useResizePipeline({editor, totalCols,
  activeColSnaps, rowH?, gap?, onCommitSuccess?, gridSelector?})`. Lifecycle
  owner: snapshot at pointerdown → window-level pointermove updates snap state
  (drives ColRuler + SizeTooltip + RowLadder) → pointerup commits via Tiptap
  `setNodeMarkup` → 2-rAF re-measure → `onCommitSuccess(blockId, liveRect)`
  callback for the success-pulse. `setNodeMarkup` is the SOLE mutation path;
  pointermove NEVER mutates Tiptap state per the cf-20c-2 R1 reflection rule
  "snapshot at start, mutate at commit, NEVER mid-drag" (extended to resize).
- `resize-context.tsx` exports `ResizeContext`, `ResizeProvider`,
  `ResizeContextValue`, `ResizeAxis = 'right' | 'bottom' | 'corner'`. Mirrors
  cf-20c-2's `DragDropContext` exactly — bridges per-block `<ResizeHandles>` to
  the lifecycle owner without prop-drilling through the Tiptap NodeView
  ReactNodeViewRenderer subtree boundary.
- `row-ladder.tsx` exports `RowLadder({rowCount, activeRow, blockRect, rowH,
  gap})`. Right-margin ladder visualizing row snap stops per
  v2-styles.css:359-385. Position: `fixed` anchored to the resizing block's
  `right` edge + 8px offset.
- `resize-snap.ts` exports pure helpers
  `snapToColSpan(cursorDeltaX, startColSpan, startCol, containerWidth, gap,
  totalCols, activeSnaps)` → `{colSpan, rawColSpan}`,
  `snapToRowSpan(cursorDeltaY, startRowSpan, rowH, gap)` → integer rowSpan ≥ 1,
  and `buildResizeNextAttrs(axis, nextColSpan, nextRowSpan, colChanged,
  rowChanged)` → `Record<string, number>` (axis-aware attr diff for
  setNodeMarkup; right omits rowSpan, bottom omits colSpan, corner writes
  both — per cf-20d D11 R1 F3 fix preserving prose `rowSpan='auto'`).
  Round-to-nearest-snap per cf-20d D6 (NOT round-up; tie-break rounds UP
  to honor ADR-0016 D6 Q4 default tiebreak).
  R1 F2 fix (2026-05-09): `snapToColSpan` filters `activeSnaps` to the
  non-overflowing subset `snap <= totalCols - startCol + 1` BEFORE
  nearest-snap selection per ADR-0016 D2 grid-position invariant. If the
  filter empties the set (e.g. col=12 + smallest snap=2 → overflow),
  returns `startColSpan` as a no-op; user must drag-move leftward first.
  R2 F1 fix (2026-05-09): `useResponsiveCols` switched to MAX-WIDTH
  matchMedia queries (`(max-width: 768px)` + `(max-width: 1024px)`) to
  match grid.css verbatim. Bucket truth table: width<=768→1,
  768<width<=1024→6, width>1024→12. Pre-R2 the hook used min-width
  which gave off-by-one at exact 1024/768 boundaries. Boundary widths
  MUST appear in the unit-test matrix.
  R2 F2 + R3 F1 fix (2026-05-09): pipeline detects persisted overflow
  UNCONDITIONALLY before setNodeMarkup (regardless of axis). R3 F1
  amendment normalizes the `{col, colSpan}` PAIR atomically via the new
  pure helper `normalizeOverflowPosition(startCol, startColSpan,
  totalCols, activeColSnaps)` (R2 only normalized colSpan; missed
  `col > totalCols` case where R2's `max(1, totalCols-startCol+1)` left
  `col` untouched AND produced `colSpan=1` which violates `COL_SNAPS`).
  R3 left-clamps `col` to `[1, totalCols]` (preserves the largest
  fitting colSpan on the new viewport — better than right-clamp), then
  picks the largest `activeColSnaps` member ≤ `(totalCols - clampedCol
  + 1)` with fallback to 1 (mobile `[1]` covers this naturally). The
  pipeline writes BOTH `col` AND `colSpan` from the helper's return
  value into the same setNodeMarkup transaction (single atomic write —
  recovery, not corruption — fixes the race scenario where a block
  saved at desktop with valid attrs becomes invalid at tablet/mobile
  viewport and a bottom-only resize at the smaller viewport pre-R3
  would have written invalid recovery state). console.warn emitted so
  operators see the recovery in dev tools.

`ResizeHandles` is mounted inside `BlockNodeView` so each Tiptap NodeView
emits the 3 handles. `<ResizeProvider value={...}>` MUST wrap the editor
surface (typically nested inside cf-20c-2's `<DragDropProvider>`); the
consumer reads `pipeline.state.{active, axis, cursor, snapColSpan,
snapRowSpan, sourceRect}` to mount overlays during active resize.

Drop-pulse reuse (cf-20d D3 + cf-20c-2 R3 dropEpoch pattern): the
`useDragDropPipeline` return now exposes `setLastDroppedFromExternal(blockId,
rect)` so cf-20d's `onCommitSuccess` callback routes the resize success-pulse
through the SAME canonical "rapid-action animation isolation" infrastructure
(atomic clear-then-set + dropEpoch increment for React-key remount). Per
cf-20c-2 R3 reflection: dropEpoch is generic "action-succeeded pulse", not
drag-specific.

Commit-on-release semantics (cf-20d D1): per v2-styles.css:172-176
`.gblock.resizing > .gblock-body { visibility: hidden }`, the source body is
hidden during pointermove and the actual setNodeMarkup commits at pointerup.
The `.skb-block-nodeview--resizing` modifier (in `BlockNodeView.css`) applies
the v2 dashed accent outline + body-hidden treatment. Esc cancel rolls back
without mutation per ADR-0017 D8.

Mobile (≤768px) view-only path per ADR-0017 D9: ALL resize affordances hidden
via `@media (max-width: 768px) { .gblock-handle, .skb-col-ruler, .skb-row-ladder,
.skb-size-tooltip { display: none } }` in `resize-handles.css`. Mirrors the
cf-20c-2 drag-handle-button.css mobile pattern.

#### Kebab menu wire (Wave 6 cf-20e 2026-05-09)

Wave 6 cf-20e adds per-block actions (Delete / Duplicate / Change kind…) via
a kebab button + floating menu inside the cf-19 gutter shell. Public surface
added under `packages/editor-shell/src/kebab/`:

- `kebab-button.tsx` exports `KebabButton({blockId, label?})`. Per-block
  presentational component renders `<button class="skb-block-nodeview__kebab"
  aria-label="Block actions" aria-haspopup="menu" aria-expanded={open}>⋮
  </button>` inside a `.skb-block-nodeview__kebab-wrapper` (`position:
  relative` host for the floating menu). Local `useState` for open + document-
  level mousedown listener for click-outside (cf-20e D8) + keydown listener
  for Esc-to-close. Pointer-events: auto override on the cf-19 gutter
  pointer-events: none baseline.
- `kebab-menu.tsx` exports `KebabMenu({blockId, kinds, onDelete, onDuplicate,
  onChangeKind, onClose})`. Floating menu container rendered when the button
  is open. 3 menu items: Delete (danger color) / Duplicate / Change kind…
  (toggles inline sub-menu). Sub-menu lists the 8 BlockKindOption labels;
  each item fires `onChangeKind(blockId, kind)` then `onClose()`.
- `kebab-context.tsx` exports `KebabContext`, `KebabProvider`,
  `KebabContextValue`. Mirrors cf-20c-2 `DragDropContext` / cf-20d
  `ResizeContext` shape (per cf-20e D5 — consumer is single owner of editor
  mutations across all 3 contexts; per-block components stay
  presentational). The `kinds` field exposes `BLOCK_KIND_OPTIONS` so the
  change-kind sub-menu doesn't import registry-wire directly.
- `change-kind-attrs.ts` exports `buildChangeKindAttrs(sourceAttrs,
  targetKind, targetDefaults)` — pure helper per cf-20e D3 drop-and-default
  decision. Preserves universal grid attrs (`col`, `row?`, `colSpan`,
  `rowSpan`) from source; supplies all kind-specific fields from target
  defaults; drops all other source fields silently. Identity case (source
  kind === target kind) is an intended "reset to defaults" affordance.
  The `targetKind` param is `_targetKind`-prefixed (informational + future-
  proofing for a per-kind translation table; cf-20e+ may amend D3).

`KebabButton` is mounted inside `BlockNodeView` next to the cf-20c-2
`DragHandleButton` so each Tiptap NodeView emits a kebab in the gutter row.
`<KebabProvider value={...}>` MUST wrap the editor surface (typically nested
inside cf-20c-2's `<DragDropProvider>` + cf-20d's `<ResizeProvider>`); the
consumer (apps/site `EditorShellMount.tsx`) closures over the live Tiptap
editor + dispatches the 3 imperative actions.

Per cf-20e D6 + cf-20c-2 R3 dropEpoch reuse: the Duplicate action fires
the success-pulse via the SAME `setLastDroppedFromExternal` infrastructure
that drag-commit + resize-commit use (canonical "rapid-action animation
isolation" pattern; cf-20e is the third action that exercises this field).
Delete + change-kind do NOT fire pulses (delete removes; change-kind keeps
the block in place — no positional change).

Per cf-20e D7: duplicate uses the ProseMirror `tr.insert(insertPos,
node.copy())` primitive directly (NOT Tiptap's high-level `insertContentAt(
pos, node.toJSON())` which silently no-ops on schema-mismatch — cf-20e R0
empirically saw this with the sample-blocks fixture; the direct
`tr.insert(pos, copy)` path works reliably).

Mobile (≤768px) view-only path per ADR-0017 D9: kebab + menu hidden via
`@media (max-width: 768px) { .skb-block-nodeview__kebab-wrapper,
.skb-block-nodeview__kebab, .skb-kebab-menu { display: none } }` in
`kebab-menu.css`. Mirrors the cf-20c-2 drag-handle + cf-20d resize-handles
mobile patterns.

#### Keyboard a11y wire (Wave 6 cf-22 2026-05-09; ADR-0017 D13 amendment)

Wave 6 cf-22 adds keyboard-mode parity for all 3 cf-20 per-block affordances
(drag / resize / kebab) per WCAG 2.1.1 + 2.4.3 + 2.4.7 + 4.1.3. Public
surface added under `packages/editor-shell/src/a11y/`:

- `live-announcer.tsx` exports `<LiveAnnouncer/>` component + `useAnnounce()`
  hook. Single shared `aria-live="polite" aria-atomic="true"` region rendered
  ONCE at the editor mount level (per cf-22 D6). 100ms throttle on updates
  so rapid arrow-key spam doesn't flood AT.
- `use-focus-return.ts` exports `useFocusReturn({active, restoreEl?})`.
  Generalizes the focus snap-and-restore pattern from `useEscCancel` per
  WCAG 2.4.3. Snapshots `document.activeElement` on `active: false → true`;
  restores via `.focus()` on `active: true → false` (deferred via
  `setTimeout(0)` to wait for React commit).
- `keyboard-step.ts` exports pure helpers `keyboardSnapStep(currentColSpan,
  direction, activeColSnaps)` (resize ±1 snap-step per cf-22 D2),
  `keyboardGridStep(currentCol, direction, totalCols, colSpan)` (drag ±1
  cell with right-clamp at `totalCols - colSpan + 1`), and
  `keyboardRowStep(currentRowSpan, direction)` (integer ±1 clamped ≥ 1).
- `announce-format.ts` exports `formatDragMove` / `formatDragCommit` /
  `formatDragCancel` / `formatResizeChange` / `formatResizeCancel` /
  `formatKebabAction` — pure WCAG 4.1.3 message formatters (English
  baseline; localization is future cf-30+).

Pipeline extensions:

- `DragDropContextValue` adds optional `onDragStartKeyboard?(blockId)` for
  Enter/Space-on-handle to enter keyboard-drag mode. The drag pipeline's
  `useDragDropPipeline` return adds `state.keyboardActive: boolean` +
  `onDragStartKeyboard` method. The keyboard-drag lifecycle (Arrow synthesizes
  cursor moves through edge-rect/tiebreak; Enter commits via
  `commitDropAtMatch`) is extracted to `drag-drop/keyboard-drag-mode.ts`
  (size-check forced split; the keyboard mode is logically separate per
  cf-22 D3).
- `commit-drop.ts` exports `commitDropAtMatch(editor, activeMatch,
  sourceBlockId, snapshot)` — extracted from the inline pointerup handler
  so pointer-drop and keyboard-Enter share the SAME mutation path.
- `ResizeContextValue` adds optional `onResizeStartKeyboard?(blockId, axis)`.
  The resize pipeline's `useResizePipeline` return adds
  `state.keyboardActive: boolean` + `onResizeStartKeyboard`. Keyboard-
  resize lifecycle extracted to `resize/keyboard-resize-mode.ts` with the
  `startKeyboardResize` snapshot helper + the `useKeyboardResizeMode` hook
  (Arrow keys snap-step via `keyboardSnapStep`/`keyboardRowStep`; Enter
  commits via SAME `setNodeMarkup` + `buildResizeNextAttrs` path as pointer
  pointerup).

Component extensions:

- `DragHandleButton` adds `onKeyDown` for Enter/Space → calls
  `ctx.onDragStartKeyboard(blockId)` then preventDefault.
- `ResizeHandles` converted from `<div>` to `<button>` (per cf-22 D4 —
  keyboard-focusable + AT-reachable). Wrapper `aria-hidden` REMOVED (cf-20d
  had it set; was silently breaking AT discoverability since cf-20d
  shipped). Each handle gets `aria-label` ("Resize block width" / "Resize
  block height" / "Resize block width and height").
- `KebabMenu` adds full keyboard nav: auto-focus first item on open per
  cf-22 D8; ArrowDown/ArrowUp cycle focus through items; ArrowRight on
  "Change kind…" expands sub-menu + auto-focuses first sub-item;
  ArrowLeft from sub-item collapses + restores focus to "Change kind…"
  parent. Refs array tracks each item's button DOM node.
- `KebabButton` consumes `useFocusReturn({active: open, restoreEl:
  buttonRef.current})` so menu close (Esc OR action commit OR click-outside)
  returns focus to the kebab button per cf-22 D5.

Per cf-22 D7: keyboard-commit reuses the cf-20c-2 R3 dropEpoch
infrastructure (the canonical "rapid-action animation isolation" pattern;
cf-22 keyboard-commit is the 4th action joining drag-pointer-commit +
resize-pointer-commit + kebab-duplicate).

Per cf-22 D9 / D10 (mobile): no new mobile @media rules. Keyboard handles
are the SAME DOM elements as pointer handles; the mobile `display: none`
rules from cf-20c-2 / cf-20d / cf-20e CSS apply equally. The
`<LiveAnnouncer/>` is sr-only (NOT mobile-gated; AT works on mobile).

##### R1 amendment (2026-05-10 codex-pr-reviewer-55 round 1; F1+F2+F3)

R1 strengthens the keyboard contract per the ADR-0017 D13 amendment 2026-05-10 update:

- **F2 (HIGH; grid-coord parity)**: `keyboard-drag-mode.ts` rewritten to track grid coordinates `{col, row}` directly (NOT a synthesized pixel cursor). NEW exported helper `keyboardGridRowStep(currentRow, direction)` for vertical movement (returns row ±1 clamped to ≥ 1). NEW exported interface `KeyboardDragSnapshot` carrying `{blockId, startCol, startRow, colSpan, rowSpan, hasRowAttr}` captured at `onDragStartKeyboard`. Pipeline state `keyboardCol` + `keyboardRow` initialized from `sourceBlock.{col, row}`; arrow handlers mutate via `keyboardGridStep`/`keyboardGridRowStep`; commit writes `setNodeMarkup({col: keyboardCol, ...(hasRowAttr ? {row: keyboardRow} : {})})` directly via Tiptap tr (NOT through `applyDropMode`/`commitDropAtMatch`). `commit-drop.ts` is now pointer-path-only.
- **F1 (HIGH; announcer wiring)**: `useDragDropPipeline` now accepts optional `totalCols?: number` (default 12) + `onAnnounceMove?(blockKind, col, totalCols)` + `onAnnounceCommit?(blockKind, col)` + `onAnnounceCancel?()` callbacks. `useResizePipeline` accepts `onAnnounceChange?(axis, colSpan, rowSpan, fraction)` + `onAnnounceCancel?()`. Each pipeline invokes the callbacks at the appropriate mutation-success / cancel sites (after `setNodeMarkup` for commits; in `onDragEnd` / `onResizeEnd` for cancels). Consumer (apps/site `EditorShellMountInner.tsx`) wraps the format helpers in `useCallback` factories + passes them in. `LiveAnnouncer` now actually consumed (was silent pre-R1 — exists but no caller).
- **F3 (MEDIUM; Tab as exit path)**: keyboard-drag-mode + keyboard-resize-mode `keydown` handlers now treat Tab = sync `commit()`, Shift+Tab = sync `cancel()`. NO `preventDefault` so the browser advances focus naturally per WCAG 2.4.3. This cleans up `keyboardActive` state without leaving stale active-mode flags.

Operational rule landed (cf-22 R1 reflection rule #19): scaffolding (helpers / hooks / components) MUST have a verified consumer in the same PR. Exporting + unit-testing the helper is NOT the contract; the consumer wiring is.

### Responsive viewport (C.2-9)

C.2-9 adds `responsive-cols.ts` as the editor-shell owner for ADR-0016 D5's
desktop/tablet/mobile viewport FSM. `useResponsiveCols(options?)` subscribes to
two `matchMedia` queries, `(max-width: 768px)` and `(max-width: 1024px)`
(byte-equivalent to `apps/site/src/styles/grid.css:97,105` per Wave 6 cf-20d
R2 F1 boundary alignment fix; pre-R2 the hook used min-width which had off-
by-one at the EXACT 1024 / 768 boundaries), and maps them to
`ViewportCols = 12 | 6 | 1` per the bucket truth table:
- `width <= 768`        → 1   (matches `(max-width: 768px)`)
- `768 < width <= 1024` → 6   (matches `(max-width: 1024px)` but NOT `(max-width: 768px)`)
- `width > 1024`        → 12  (no max-width @media matches)

`RESPONSIVE_BREAKPOINTS` is the hardcoded bridge `{ tablet: 768, desktop: 1024 }`
until Stage C.3-1 lands `--bp-tablet` and `--bp-desktop` in design tokens.

Consumers that participate in the W5-2 single-source mutation pipeline pass
`onTransitionStart` and `onTransitionEnd` callbacks which dispatch
`responsive-transition-start` / `responsive-transition-end` through
`layoutReducer`. Those actions do not mutate grid positions or increment
`layoutEpoch`; they only mark the responsive transition as in progress or idle
so the existing `drag-start` guard can reject drag during the transition per
ADR-0016 D12 and ADR-0017 D12.

`GridContainerProps.viewportCols` is optional for backward compatibility.
When supplied, `GridContainer` emits `data-skb-viewport-cols` for test and
consumer selectors. `viewportCols === 1` also emits `.skb-grid--mobile`, the
ADR-0017 D9 class authority for the mobile 1-col view-only path. The CSS rules
under `.skb-grid--mobile` land in C.2-11; C.2-9 owns the editor-shell emission
side of the contract.

Mobile rowSpan remains rendering-derived: consumers branch on
`viewportCols === 1` and use the existing `useAutoRowSpan` path so
`rowSpan='auto'` is measured at render time without persisting a replacement
integer. The EditorShellMount wire-up for that per-block branch lands in C.4-2.

## Wave 3 Stage A expansion outline

A2-A5 each Modify this CONTRACT.md as new exports land:

- **A2** — `EditorShell` React component delivered in this PR (Tiptap
  `useEditor` mounting a 4-prop API surface; the original A2 build
  shipped with `[StarterKit]` only as the built-in extension list).
  Adds `@tiptap/{core,react,starter-kit}`, `react`, `react-dom`
  peer/runtime deps + happy-dom + @testing-library/react devDeps.
  *(Historical: Wave 6 carry-forward #15a 2026-05-08 added the
  extended `Link` extension to the built-in stack and a 5th prop
  `extensions?: Extensions`; see § Public surface above for the
  current shape.)*
- **A3** — `registerBlocks(registry)` helper delivered in this PR. Wires the
  8 block-* core + ui-default definitions into a `BlockRegistry` instance.
  Added 8 `@skb/block-*` + `@skb/block-foundation` workspace deps + 9
  composite-project tsconfig references. Also re-exports `proseExtensions`
  from block-foundation as a barrel convenience. `proseExtensions` is NOT
  exposed as an `EditorShell` prop in A3 (the speculative A2-outline form);
  consumers compose it directly into their `useEditor` extensions array.
- **A4** — `registerKernels(registry, adapter?)` helper delivered in this
  PR. Wires `PyodideAdapter` (default) into `kernel-registry`. Added
  `@skb/kernel-registry` + `@skb/kernel-pyodide` + `@skb/kernel-adapter`
  workspace deps (3 not 2 — `KernelAdapter` type lives in `@skb/kernel-adapter`,
  not re-exported by registry/pyodide).
- **A5** — `saveToMdx(editor, options?)` + `loadFromMdx(editor, source, options?)`
  delivered in this PR. Wraps `@skb/mdx-bridge`'s `tiptapToMdx` /
  `mdxToTiptap` for **prose-only** RTT. The `options.blockRegistry`
  parameter is forward-compat at the public API surface; threading
  through to mdx-bridge's per-call injection is deferred to B1 (because
  mdx-bridge does not yet accept a `{ blockRegistry }` option). Added
  `@skb/mdx-bridge` workspace dep — 13th `@skb/*` and Stage A close.

## Stage A close note

All 5 Stage A PRs are now delivered. Consumers can:

1. Mount `EditorShell` (Tiptap useEditor with the built-in StarterKit + Link stack per § Public surface; A2 originally shipped with just StarterKit, and carry-forward #15a 2026-05-08 layered Link in)
2. Call `registerBlocks(registry)` to wire 8 block-* into a BlockRegistry (A3)
3. Call `registerKernels(registry, adapter?)` to wire PyodideAdapter into a KernelRegistry (A4)
4. Call `saveToMdx(editor, options?)` + `loadFromMdx(editor, source, options?)`
   for **prose-only** RTT (A5)

**Component-block RTT is NOT yet operational** — Stage B (B1-B8) extends
mdx-bridge with `mdxJsxFlowElement` routing + per-call BlockRegistry
injection. Until B1 lands, attempting to save/load any document containing
the 8 Wave 2 component blocks (Callout / Code / Image / Math / Pdf /
Jupyter / NnViz / AgentFlow) will throw via mdx-bridge's existing
fail-loud rule. The `SaveLoadOptions.blockRegistry` parameter at the
saveLoad public API is accepted-but-unused until B1 threads it through.

[ADR-0008 D1](../../docs/decisions/ADR-0008-wave-2-entry-policies.md) dead-dep
policy is satisfied at A5 by construction: every declared `@skb/*` workspace
dep has at least one `from '@skb/{pkg}'` source import. The 13 declared deps
+ 13 source imports (across `registerBlocks.ts` / `registerKernels.ts` /
`saveLoad.ts` / `index.ts`) + 13 tsconfig references hold three-way exact-match
symmetry.

## Type variance note (Stage A A3 R3 retrospective; codified Wave 4 B4)

`registerBlocks` casts 5 of 8 ui-defaults via `XxxUiDefault as unknown as BlockUIDefinition` and leaves the remaining 3 uncast. The asymmetry is structural, not historical: it traces ComponentType contravariance under `exactOptionalPropertyTypes: true`.

- **5 with cast** (callout / code / image / math / pdf): each
  package's `XxxUiDefault` is typed
  `BlockUIDefinition<typeof XxxCore.propsSchema>` — a NARROW schema
  via `defineUI`'s generic. The narrow schema's
  `EditorView`/`RenderView` is `ComponentType<BlockViewProps&lt;NarrowSchema&gt;>`,
  which is NOT assignable to the registry's wider
  `ComponentType<BlockViewProps&lt;ZodTypeAny&gt;>` due to ComponentType
  contravariance. The cast collapses the variance gap. ESLint's
  `no-unnecessary-type-assertion` does NOT flag these casts because
  the assertion is genuinely required by tsc.
- **3 without cast** (jupyter / nn-viz / agent-flow): each package's
  `XxxUiDefault` resolves through `defineUI` with a wider component
  type signature that already accepts `BlockViewProps&lt;ZodTypeAny&gt;`
  without contravariance issue (verified at A3 EXECUTE 2026-05-01;
  tsc accepts the direct registration). Adding the cast here would
  be a no-op; ESLint's `no-unnecessary-type-assertion` would flag it.

**Implication**: the 5/3 split is locked-in until the underlying
ui-default package types converge. Future blocks SHOULD pick the
3-camp signature shape (no cast required) when authoring new
ui-defaults; A3 R3 incident notes the asymmetry was first
surfaced when a contributor uniformly cast all 8, which lint then
rejected on the 3 unnecessary-cast cases. The cast-required vs
cast-free behavior is verified at every `pnpm typecheck` run +
`pnpm lint` run on `registerBlocks.ts`; any drift will surface
immediately.

## C.4-3 user-affordance public surface

C.4-3 adds the editor-facing affordance layer that `apps/site`
mounts around the Tiptap instance. The barrel exports these React
components and types:

- `Palette` / `PaletteProps`: opens on Ctrl/Cmd+K, lists the eight
  Wave 2 block kinds, and calls `insertBlockKind(editor, kind)` when
  a kind is selected.
- `SlashMenu` / `SlashMenuProps`: listens on the editor DOM for `/`
  at line start, supports arrow-key navigation, and inserts the
  selected block on Enter or click.
- `DragHandle` / `DragHandleProps`: **DEPRECATED at Wave 6 cf-20c-2
  (2026-05-09)** — was the C.4-3 standalone floating drag-handle stub
  used pre-cf-20c-2 (single button rendered outside any block; clicking
  it flipped a synthetic `[data-skb-drop-preview]` flag). cf-20c-2
  replaced it with PER-BLOCK drag handles (`DragHandleButton`) inside
  each `.skb-block-nodeview__gutter` shell, wired to
  `useDragDropPipeline()` for real HTML5 native DnD lifecycle. The
  `DragHandle` export remains in the barrel for backward-compat
  consumers (none in-tree post cf-20c-2; `EditorShellMount.tsx` no
  longer renders it). Removal scheduled for a future cleanup PR.
- `Toolbar` / `ToolbarProps`: renders Bold / Italic controls while a
  non-empty Tiptap text selection exists, and delegates to
  `editor.chain().focus().toggleBold()/toggleItalic().run()`.
- `EditModeBanner` / `EditModeBannerProps`: renders the top edit-mode
  banner only when `editMode` is true.
- `SaveIndicator` / `SaveIndicatorProps` / `SaveIndicatorStatus`:
  renders the bottom-corner `Unsaved changes` / `Saving...` /
  `Saved at HH:MM` state owned by the consumer's save debounce.

`registry-wire.tsx` exports `BLOCK_KIND_OPTIONS`, `insertBlockKind`,
and `wireRegistry(options)`. `wireRegistry` returns the canonical
eight `blockKinds`, Tiptap node extensions for those kinds, and the
insertion helper. It also idempotently registers mdx-bridge JSX
dispatch entries for the eight block packages so editor-built
component nodes can serialize through `saveToMdx(editor, { blockRegistry })`.

When `wireRegistry({ blockRegistry })` receives a registry (Wave 6
carry-forward #18, 2026-05-08), each generated extension also installs
`addNodeView: () => ReactNodeViewRenderer(makeBlockNodeView({registry}))`,
which mounts the block's registered `EditorView` React component
inside a two-layer DOM:
- the outer `NodeViewWrapper` carries `data-skb-block-kind="<kind>"`
  (this attribute survives even on the unregistered fallback wrapper
  for downstream Tiptap inspectors / future drag-handle wiring),
- the inner non-editable host div carries `data-skb-block-host="<kind>"`
  (only present when the registry resolved a UI; absent on fallbacks).

Real PDF iframes, KaTeX, React Flow graphs, syntax-highlighted code
bodies, images, callout containers, NN-Viz SVG topology, and Jupyter
containers all materialize on the edit surface. Without a registry
the extension falls back to the legacy `renderHTML` placeholder
("`<Label> block`" — preserved for no-registry test mounts; the
unregistered NodeView fallback wrapper additionally carries the
`skb-block-nodeview--unregistered` modifier class). The
`makeBlockNodeView` factory is exported from the package barrel for
downstream NodeView smoke tests.

### BlockNodeView wrapper styles (Wave 6 cf-19 v0.2 + R2; 2026-05-09; cf-20a chrome split 2026-05-09)

`@skb/editor-shell` ships TWO side-effect stylesheets that together bring
the v2 `.gblock` card chrome onto every block surface (per the v2
reference design at /mnt/d/download/web/v2-styles.css:154-249, plus the
v2-design-granularity "Block 容器（.gblock）状态" table):

- **`@skb/editor-shell/block-chrome.css`** — Wave 6 cf-20a single source
  of card geometry + per-kind 2px top stripe. Two structural classes
  consume the rules: `.skb-block-nodeview` (editor mount) and
  `.skb-block-static` (apps/site read route via the
  `makeMdxAdapter(RenderView, kind)` adapter + the 3 heavy block Astro
  wrappers). Both classes carry `data-skb-block-kind="<kind>"` and
  resolve the same per-kind hue token. Pre-cf-20a the chrome lived in
  TWO places (the editor wrapper rule AND each block's inner CSS); the
  inner stripes were zeroed under `.skb-block-nodeview` via a
  nested-suppression rule. cf-20a deletes the inner stripes and the
  suppression rule, routing all 8 inner blocks through this shared
  module so a single edit fans out to both routes.
- **`@skb/editor-shell/BlockNodeView.css`** — editor-mount-only
  affordances layered on top: ProseMirror selected-node accent ring,
  focus-within border bridge, per-kind chip tint redefinitions
  (editor-local CSS variables), gutter shell + kind chip layout, body
  padding (offsets the absolutely-positioned gutter chip), unregistered
  fallback placeholder. The first line of this file is
  `@import './block-chrome.css'` so the editor wrapper inherits the
  chrome via either a direct global.css import OR transitively through
  BlockNodeView.css.

Consumers (apps/site `global.css` is the canonical example) MUST import
both at app boot:

```css
@import '@skb/editor-shell/block-chrome.css';   /* shared chrome */
@import '@skb/editor-shell/BlockNodeView.css';  /* editor-only affordances */
```

DOM contract emitted by `BlockNodeView.tsx` (cf-19 v0.2):

```
.skb-block-nodeview                    ← v2 .gblock card (carries data-skb-block-kind)
  .skb-block-nodeview__gutter          ← v2 .gblock-gutter shell (cf-20 button drop-in)
    .skb-block-nodeview__kind-chip     ← visible kind label (mono uppercase)
  .skb-block-nodeview__body            ← v2 .gblock-body padding shell (carries data-skb-block-host)
    <inner block component />          ← CalloutBody / CodeBody / etc.
```

Public selectors:

- `.skb-block-nodeview` — v2 `.gblock` card. `background: var(--surface)`
  + `border: 1px solid var(--border)` + `border-radius: 7px` +
  `margin-block: 8px`. Geometry is stable across hover/selected/focus
  state toggles (transparent baseline shadow that lights up on hover;
  border-color toggles within the existing 1px width).
- `.skb-block-nodeview:hover` — `border-color: var(--border-strong)` +
  `box-shadow: var(--shadow-sm)` (v2-styles.css:171).
- `.skb-block-nodeview.ProseMirror-selectednode` —
  `border-color: var(--accent)` + `box-shadow: 0 0 0 2px var(--skb-block-nodeview--accent-soft)`
  (v2-styles.css:172). ProseMirror sets this class on `NodeSelection`.
  The `--skb-block-nodeview--accent-soft` is an editor-local CSS variable
  scoped to the wrapper (R2 P2 honesty fix; see § Editor-local CSS
  variables below).
- `.skb-block-nodeview:focus-within:not(.ProseMirror-selectednode)` —
  softer accent border bridge so jupyter Run / nn-viz range focus reads
  as block-active without flashing the full selected ring.
- `.skb-block-nodeview[data-skb-block-kind="<kind>"]` — per-kind 2px
  top stripe (ADR-0018 D3 hue tokens). Hue map: callout/componentCode
  → runnable 145°; image → 60°; math → 280°; pdf → 0°; jupyter → 90°;
  nn-viz → 325°; agent-flow → 180°. Hue lives on the wrapper instead
  of the inner component CSS so the stripe sits flush with the card
  top edge per v2 `.gblock.k-canvas { border-top: ... }` model.
- `.skb-block-nodeview__gutter` — v2 `.gblock-gutter` shell. Absolutely
  positioned top-left, `opacity: 0.45` baseline, `1` on hover/focus/
  selected. Empty placeholder for cf-20 drag-handle + kebab buttons.
- `.skb-block-nodeview__kind-chip` — mono uppercase kind label, 10px,
  per-kind tinted background matching the top stripe hue (canvas-soft /
  runnable-soft / image-soft analog per v2 palette glyph treatment).
  The chip label collapses `componentCode` → `code` (the cf-15b internal
  rename was for ProseMirror namespace isolation; the user-facing name
  stays "code").
- `.skb-block-nodeview__body` — v2 `.gblock-body` padding shell.
  `padding: 28px 12px 8px` reserves room for the absolutely-positioned
  gutter chip. Canvas/image/runnable-family kinds (image/pdf/math/
  jupyter/nn-viz/agent-flow) drop side+bottom padding to `4px` per v2
  `.gblock-body.fit` analog.
- `.skb-block-nodeview--unregistered` + `.skb-block-nodeview__fallback`
  — dashed border-strong outline + monospaced placeholder body for the
  unregistered fallback path (no registry threaded into `wireRegistry`).

#### Editor-local CSS variables (R2 P2 honesty fix)

`BlockNodeView.css` declares a small set of CSS custom properties scoped
to `.skb-block-nodeview` itself (NOT promoted to global `:root`); each
`[data-skb-block-kind="<kind>"]` selector redefines them per-kind. They
are NOT exported via `@skb/design-tokens` because they are
editor-decoration-only and would balloon the global token surface
without clear cross-package reuse. Promotion to design-tokens is
documented as an out-of-scope cf-21+ candidate in the cf-19 PR.md.

| editor-local CSS var | role | redefined per-kind? |
| --- | --- | --- |
| `--skb-block-nodeview--accent-soft` | wrapper outer-ring color on `.ProseMirror-selectednode` | no (single shared accent-soft) |
| `--skb-block-nodeview--chip-bg` | gutter chip background tint | yes (each kind matches its top-stripe hue) |
| `--skb-block-nodeview--chip-border` | gutter chip border tint | yes |
| `--skb-block-nodeview--chip-text` | gutter chip text color | yes |

#### Per-block stripe single source (Wave 6 cf-20a 2026-05-09)

The 8 block packages' `ui-default/<kind>.css` files NO LONGER ship
their own `border-top: 2px solid var(--accent-X)` rule. The chrome
authority is `@skb/editor-shell/src/block-chrome.css`, which selects on
both `.skb-block-nodeview[data-skb-block-kind="<kind>"]` (editor wrapper
emitted by `BlockNodeView.tsx`) AND `.skb-block-static[data-skb-block-kind="<kind>"]`
(read-route wrapper emitted by `apps/site/src/lib/mdx-adapter.ts`'s
`makeMdxAdapter(RenderView, kind)` plus the 3 heavy block Astro
wrappers `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`).

Because the inner-component stripe rules are gone, the cf-19 R2 P3
nested-suppression block in `BlockNodeView.css` is also gone — there's
nothing to suppress. The wrapper is the single source of stripe truth
on BOTH routes; sister block packages keep their layout-only inner
rules (flex / grid / padding / variant tints / surface bg) without
duplicating chrome geometry.

Sister block CONTRACT.md files document the cf-20a chrome handover
under their respective "Public surface" sections.

`EditorShellProps.extensions` is now the sanctioned composition hook
for consumer-owned Tiptap extensions layered after the built-in
`StarterKit` (no `code: false` configuration post-#15b — the
block-Code Tiptap node was renamed from `code` to `componentCode`
so StarterKit's inline `code` mark is enabled) + `Link.extend({ addAttributes: { title } }).configure({ openOnClick: false })`
stack (carry-forwards #15a + #15b). C.4-3 uses it only for the block insertion
node specs produced by `wireRegistry`; block package implementations
remain untouched. StarterKit's inline `code` mark is enabled post-#15b
(the component-block formerly named `code` was renamed to
`componentCode`, so the ProseMirror namespace collision is gone).
StarterKit's `codeBlock` node remains available for Markdown fences.

## Modifying this file

Each A2-A5 PR Modifies this file to extend "Public surface" as exports land.
The "Wave 3 Stage A expansion outline" section is informational; once A5
closes Stage A, that section may be retired in favor of a stable public-surface
declaration (orchestrator decision at Stage A close ceremony).

## Related

- [ADR-0010 D7 #3](../../docs/decisions/ADR-0010-wave-2-close.md) — editor-shell composition deferral closed by Stage A
- [ADR-0011 D1+D6](../../docs/decisions/ADR-0011-linear-pipeline-execution-model.md) — pipeline + codex profiles
- [Wave 3 plan, Stage A](../../docs/superpowers/plans/2026-05-01-phase-1-wave-3-integration.md) — locked Stage A scope
- [packages/block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md) — registry consumer pattern A3 will use
- [packages/mdx-bridge/CONTRACT.md](../mdx-bridge/CONTRACT.md) — per-call injection pattern B1 will thread through saveLoad
