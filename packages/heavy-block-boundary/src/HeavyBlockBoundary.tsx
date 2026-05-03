import type { CSSProperties, ComponentType, ReactElement, ReactNode } from 'react';

// These public types mirror ADR-0014 D1.
export interface HeavyBlockKindRegistry {
  readonly jupyter: 'jupyter';
  readonly 'nn-viz': 'nn-viz';
  readonly 'agent-flow': 'agent-flow';
}
export type HeavyBlockKind =
  | keyof HeavyBlockKindRegistry
  | (string & { readonly __heavyBlockKind?: never }); // intentional widening

export interface HeavyBlockDimensions {
  readonly width: number; // CSS px; min-width
  readonly height: number; // CSS px; min-height
}

export interface HeavyBlockBoundaryProps<P> {
  readonly kind: HeavyBlockKind;
  readonly dims: HeavyBlockDimensions;
  readonly load: (init?: { signal?: AbortSignal }) => Promise<{ default: ComponentType<P> }>;
  readonly loadingText?: string; // default: `Loading ${kind}...`
  readonly errorText?: string; // default: `Failed to load ${kind}`
  readonly retryLabel?: string; // default: `Retry`
  readonly maxRetries?: number; // default: 2 (after which retry button disables; per C5 bounded)
  readonly childProps: P; // forwarded to loaded component
  readonly fallback?: ReactNode; // optional override of SSR placeholder
  readonly onLoadError?: (e: unknown, attempt: number) => void; // telemetry hook
}

export function HeavyBlockBoundary<P>({
  kind,
  dims,
  loadingText,
}: HeavyBlockBoundaryProps<P>): ReactElement {
  const resolvedLoadingText = loadingText ?? `Loading ${kind}...`;
  const skeletonStyle: CSSProperties = {
    width: `${dims.width}px`,
    minHeight: `${dims.height}px`,
  };

  // TODO(A2): implement useEffect + AbortController + retry + a11y per ADR-0014 D3
  return (
    <div
      data-block={kind}
      data-deferred="wave-4"
      className={`heavy-block-skeleton heavy-block-skeleton--${kind}`}
      role="status"
      aria-busy="true"
      style={skeletonStyle}
    >
      <div className="heavy-block-skeleton__frame" aria-hidden="true" />
      <div className="heavy-block-skeleton__spinner" aria-hidden="true" />
      <div className="heavy-block-skeleton__text" aria-live="polite">
        {resolvedLoadingText}
      </div>
    </div>
  );
}
