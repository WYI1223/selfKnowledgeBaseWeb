# `@skb/editor-shell` — Contract

Wave 3 Stage A composition layer. Composes the 8 block-* packages, 3 editor
sub-modules, kernel-registry adapters, and mdx-bridge into a usable Tiptap
editor surface. Closes the "editor-shell composition" deferral from
[ADR-0010 D7 #3](../../docs/decisions/ADR-0010-wave-2-close.md).

## Public surface

- `EditorShell` — functional React component. Mounts a Tiptap editor via
  `@tiptap/react`'s `useEditor` with the following extension stack
  (Wave 6 carry-forward #15a 2026-05-08):
  - `StarterKit.configure({ code: false })` — prose nodes + marks. The
    inline `code` mark stays disabled because the block-Code package
    registers a Tiptap NODE named `code` and ProseMirror forbids the
    same name on both a node and a mark; the `loadFromMdx`
    `EDITOR_UNSUPPORTED_MARKS` strip handles MDX-emitted `code` marks
    until the rename in carry-forward #15b lands.
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
  callout, code, image (component), math, pdf (render), jupyter, nn-viz,
  agent-flow (viz). Per ADR-0009 D1: 3 component + 2 render + 3 viz = 8.
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
NodeView attrs, or inject per-block `style.gridColumn` / `style.gridRow`;
those mutation and placement paths remain deferred to the later Wave 5 editor
grid PRs. When `viewportCols` is supplied, it emits
`data-skb-viewport-cols` and adds `.skb-grid--mobile` for `viewportCols === 1`
per ADR-0016 D5 and ADR-0017 D9. Minimal usage:

```tsx
<GridContainer>
  <EditorContent editor={editor} />
</GridContainer>
```

The `.skb-grid` selector authority is `apps/site/src/styles/grid.css` (C.2-3
PR squash `2586328`). The editor-shell consumer at the mount site MUST import
that stylesheet, mirroring the SSR phase emission per ADR-0016 D9 phase
strategy.

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

### Responsive viewport (C.2-9)

C.2-9 adds `responsive-cols.ts` as the editor-shell owner for ADR-0016 D5's
desktop/tablet/mobile viewport FSM. `useResponsiveCols(options?)` subscribes to
two `matchMedia` queries, `(min-width: 1024px)` and `(min-width: 768px)`, and
maps them to `ViewportCols = 12 | 6 | 1`. `RESPONSIVE_BREAKPOINTS` is the
hardcoded bridge `{ tablet: 768, desktop: 1024 }` until Stage C.3-1 lands
`--bp-tablet` and `--bp-desktop` in design tokens.

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
- `DragHandle` / `DragHandleProps`: emits a draggable per-block handle
  (`data-skb-drag-handle`) and shows the C.2-8 `DropPulse` preview
  after drag completion.
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
eight `blockKinds`, minimal Tiptap node extensions for those kinds,
and the insertion helper. It also idempotently registers mdx-bridge
JSX dispatch entries for the eight block packages so editor-built
component nodes can serialize through `saveToMdx(editor, { blockRegistry })`.

`EditorShellProps.extensions` is now the sanctioned composition hook
for consumer-owned Tiptap extensions layered after the built-in
`StarterKit.configure({ code: false })` + `Link.extend({ addAttributes: { title } }).configure({ openOnClick: false })`
stack (carry-forward #15a). C.4-3 uses it only for the block insertion
node specs produced by `wireRegistry`; block package implementations
remain untouched.
StarterKit's inline `code` mark is disabled in this composition so the
component-block `code` node can own the `code` schema name. The
StarterKit `codeBlock` node remains available for Markdown fences.

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
