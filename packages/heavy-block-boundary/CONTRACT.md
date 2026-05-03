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

Full invariants land at A2-A4: mount guard, `AbortSignal` cancellation,
SSR byte-equivalence, a11y semantics, retry behavior, and
reduced-motion handling. Wave 4 Stage A closes those gates per
ADR-0014 acceptance criteria #3-#15.

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
