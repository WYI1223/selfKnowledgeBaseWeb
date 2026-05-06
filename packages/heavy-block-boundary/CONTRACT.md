# @skb/heavy-block-boundary Contract

`@skb/heavy-block-boundary` owns the reusable React runtime boundary
for heavy visualization blocks on the MDX/static render path.

## Public Surface

The public surface is the ADR-0014 D1 component API:

- `HeavyBlockBoundary<P>` component
- `HeavyBlockKindRegistry`
- `HeavyBlockKind`
- `HeavyBlockDimensions`
- `HeavyBlockBoundaryProps<P>`

Known built-in kinds are `jupyter`, `nn-viz`, and `agent-flow`.
`HeavyBlockKind` uses ADR-0014 C6 branded widening so plugin blocks
can provide future string kinds without losing autocomplete for known
kinds.

`HeavyBlockBoundaryProps<P>` exposes:

- `kind: HeavyBlockKind`
- `dims?: HeavyBlockDimensions`
- `load: (init?: { signal?: AbortSignal }) => Promise<{ default: ComponentType<P> }>`
- `loadingText?: string`
- `errorText?: string`
- `retryLabel?: string`
- `maxRetries?: number`
- `childProps: P`
- `fallback?: ReactNode`
- `onLoadError?: (e: unknown, attempt: number) => void`
- `gridContext?` (v0.5 NEW) — optional W5-1 formula-derived dims path. Shape: a readonly object with members `colSpan: number`, `rowSpan: number`, `containerWidth: number`, and optional `geometry` accepting any subset of the GridGeometry fields (`rowH`, `gap`, `totalCols`). Consumes `effectiveColWidth` + `effectiveCellHeight` from `@skb/block-foundation` per ADR-0014 v0.5 D12. See [`grid-math.ts`](../block-foundation/src/grid-math.ts) for the `GridGeometry` interface and `DEFAULT_GRID_GEOMETRY` defaults.

## Invariants

- **SSR byte-equivalence (A2; AC#3)**: server-render via `renderToString` produces DOM byte-equivalent to client first paint; React 18 `hydrateRoot` does NOT log a hydration mismatch warning. Outer container `<div data-block={kind} data-deferred="wave-4" role="status" aria-busy="..." style="width:..px;min-height:..px">` is identical between SSR and CSR pre-effect render.
- **Mount-guard (A2; AC#10)**: post-unmount `setComponent`/`setError` calls are suppressed via a `mountedRef` guard. No React state-update warning fires when `load()` resolves or rejects after `unmount()`.
- **AbortSignal cancellation (A2; AC#11)**: `load()` is invoked with `{ signal: AbortSignal }`; the signal's `aborted` flag flips to `true` on unmount (and on retry — see retry semantics below). Cleanup ordering: `mountedRef.current = false` BEFORE `controller.abort()` so the abort handler doesn't trigger a stale setState.
- **Retry semantics (A3; AC#7+8+9)**: rejection (with `!signal.aborted`) renders error UI (errorText + retry button) + invokes `onLoadError(err, attempt)` telemetry. Retry button click increments `attempt` via `setAttempt(prev => prev + 1)`; useEffect re-runs via `[attempt]` dep array (effect cleanup naturally aborts prior controller; new run constructs fresh one). `maxRetries` (default 2) bounds retries: `canRetry = attempt <= resolvedMaxRetries`. After bound exhaustion, retry button is `disabled`. `setError(null)` on success transitions UI from error → loaded.
- **CSS class invariants (A4; AC#4)**: outer container has class `heavy-block-skeleton heavy-block-skeleton--<kind>`. Children use BEM-style classes: `__frame`, `__spinner`, `__text` (loading state); `__error`, `__error-text`, `__retry` (error state). All design-token CSS variables use `var(--name, #hex-fallback)` form so the package renders meaningfully without `@skb/design-tokens` CSS injection.
- **A11y semantics (A4; AC#12)**: outer container has `role="status"` always + `aria-busy="true"` during loading + retry-loading + `aria-busy="false"` when Component loaded OR error shown. `__text` has `aria-live="polite"` (load text changes are announced). `__frame` and `__spinner` have `aria-hidden="true"` (decorative). Error UI has `role="alert"` (stronger announcement complementing the status container).
- **Reduced-motion (A4; AC#14)**: `@media (prefers-reduced-motion: reduce)` query disables spinner animation. CSS file `src/heavy-block-skeleton.css` is the canonical source.
- **Plugin extensibility (A4; AC#13)**: arbitrary string `kind` values work (per ADR-0014 C6 branded widening); unregistered kinds get class suffix `--<kind>` and load lifecycle. Future plugin blocks need only export `<Kind>RenderView` + `heavyBoundaryDimensions` per ADR-0014 D5 (consumer wires the boundary).
- **Dims-derivation precedence (v0.5; AC#17)**: when both `dims` and `gridContext` are supplied, `dims` wins (explicit beats derivation). When only `gridContext` is supplied, the boundary derives `width = effectiveColWidth(gridContext.colSpan, gridContext.containerWidth, gridContext.geometry)` + `height = effectiveCellHeight(gridContext.rowSpan, gridContext.geometry)` via single-authority delegation to `@skb/block-foundation` (NO local re-implementation of W5-1 formula per ADR-0006 class 4 single-authority + memory `feedback_cross_package_consumer_pattern`). When neither is supplied, the function throws `Error('HeavyBlockBoundary requires either dims or gridContext')` at call time (BEFORE useState), surfacing mis-wiring fast in dev/prod equally. Per ADR-0014 v0.5 D12.
- **gridContext input validation (v0.5; deferred)**: the v0.5 boundary does NOT validate `gridContext` numeric inputs. Negative spans, zero/decimal spans, or non-positive `containerWidth` values propagate raw to `effectiveColWidth` / `effectiveCellHeight`, which currently performs no input validation either. Consumers are responsible for passing positive integer `colSpan` / `rowSpan` and a positive measured `containerWidth`. Hardening (throw or clamp on invalid input) is intentionally deferred — see ADR-0014 v0.5 § "Input validation policy" — to keep v0.5 scope minimal. If invalid inputs become a real consumer problem, a follow-up boundary-side validation pass can land without re-amending the gridContext shape.

This contract is the consumer-side partner for
[`packages/block-foundation/CONTRACT.md`](../block-foundation/CONTRACT.md)
W4-1: heavy `kind='viz'` blocks whose runtime authority cannot SSR in
Astro static build must be wrapped by `HeavyBlockBoundary` when
consumed through the MDX `componentsMap` path.

Editor consumption is out of scope per ADR-0014 D9. Tiptap NodeView
registrations continue to consume heavy block `EditorView` exports
directly unless a future ADR changes that boundary.

## Cross-package authority

The W5-1 formula single authority lives at
[`@skb/block-foundation/src/grid-math.ts`](../block-foundation/src/grid-math.ts).
The v0.5 `gridContext` path delegates to `effectiveColWidth` and
`effectiveCellHeight` from `@skb/block-foundation` per ADR-0016 D9 +
ADR-0014 D12.

## Authority Links

- [ADR-0014 D1](../../docs/decisions/ADR-0014-heavy-block-boundary.md)
  defines the component API.
- [ADR-0014 D7](../../docs/decisions/ADR-0014-heavy-block-boundary.md)
  assigns package ownership to `@skb/heavy-block-boundary`.
- [ADR-0014 D9](../../docs/decisions/ADR-0014-heavy-block-boundary.md)
  keeps editor consumption out of scope.
- [ADR-0016 D6 + D9](../../docs/decisions/ADR-0016-grid-data-model.md)
  define the W5-1 `effectiveColWidth` + `effectiveCellHeight` formula
  authority that the v0.5 `gridContext` path delegates to.
