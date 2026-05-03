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
- `dims: HeavyBlockDimensions`
- `load: (init?: { signal?: AbortSignal }) => Promise<{ default: ComponentType<P> }>`
- `loadingText?: string`
- `errorText?: string`
- `retryLabel?: string`
- `maxRetries?: number`
- `childProps: P`
- `fallback?: ReactNode`
- `onLoadError?: (e: unknown, attempt: number) => void`

## Invariants

- **SSR byte-equivalence (A2; AC#3)**: server-render via `renderToString` produces DOM byte-equivalent to client first paint; React 18 `hydrateRoot` does NOT log a hydration mismatch warning. Outer container `<div data-block={kind} data-deferred="wave-4" role="status" aria-busy="..." style="width:..px;min-height:..px">` is identical between SSR and CSR pre-effect render.
- **Mount-guard (A2; AC#10)**: post-unmount `setComponent`/`setError` calls are suppressed via a `mountedRef` guard. No React state-update warning fires when `load()` resolves or rejects after `unmount()`.
- **AbortSignal cancellation (A2; AC#11)**: `load()` is invoked with `{ signal: AbortSignal }`; the signal's `aborted` flag flips to `true` on unmount (and on retry — see retry semantics below). Cleanup ordering: `mountedRef.current = false` BEFORE `controller.abort()` so the abort handler doesn't trigger a stale setState.
- **Retry semantics (A3; AC#7+8+9)**: rejection (with `!signal.aborted`) renders error UI (errorText + retry button) + invokes `onLoadError(err, attempt)` telemetry. Retry button click increments `attempt` via `setAttempt(prev => prev + 1)`; useEffect re-runs via `[attempt]` dep array (effect cleanup naturally aborts prior controller; new run constructs fresh one). `maxRetries` (default 2) bounds retries: `canRetry = attempt <= resolvedMaxRetries`. After bound exhaustion, retry button is `disabled`. `setError(null)` on success transitions UI from error → loaded.
- **CSS class invariants (A4; AC#4)**: outer container has class `heavy-block-skeleton heavy-block-skeleton--<kind>`. Children use BEM-style classes: `__frame`, `__spinner`, `__text` (loading state); `__error`, `__error-text`, `__retry` (error state). All design-token CSS variables use `var(--name, #hex-fallback)` form so the package renders meaningfully without `@skb/design-tokens` CSS injection.
- **A11y semantics (A4; AC#12)**: outer container has `role="status"` always + `aria-busy="true"` during loading + retry-loading + `aria-busy="false"` when Component loaded OR error shown. `__text` has `aria-live="polite"` (load text changes are announced). `__frame` and `__spinner` have `aria-hidden="true"` (decorative). Error UI has `role="alert"` (stronger announcement complementing the status container).
- **Reduced-motion (A4; AC#14)**: `@media (prefers-reduced-motion: reduce)` query disables spinner animation. CSS file `src/heavy-block-skeleton.css` is the canonical source.
- **Plugin extensibility (A4; AC#13)**: arbitrary string `kind` values work (per ADR-0014 C6 branded widening); unregistered kinds get class suffix `--<kind>` and load lifecycle. Future plugin blocks need only export `<Kind>RenderView` + `heavyBoundaryDimensions` per ADR-0014 D5 (consumer wires the boundary).

This contract is the consumer-side partner for
[`packages/block-foundation/CONTRACT.md`](../block-foundation/CONTRACT.md)
W4-1: heavy `kind='viz'` blocks whose runtime authority cannot SSR in
Astro static build must be wrapped by `HeavyBlockBoundary` when
consumed through the MDX `componentsMap` path.

Editor consumption is out of scope per ADR-0014 D9. Tiptap NodeView
registrations continue to consume heavy block `EditorView` exports
directly unless a future ADR changes that boundary.

## Authority Links

- [ADR-0014 D1](../../docs/decisions/ADR-0014-heavy-block-boundary.md)
  defines the component API.
- [ADR-0014 D7](../../docs/decisions/ADR-0014-heavy-block-boundary.md)
  assigns package ownership to `@skb/heavy-block-boundary`.
- [ADR-0014 D9](../../docs/decisions/ADR-0014-heavy-block-boundary.md)
  keeps editor consumption out of scope.
