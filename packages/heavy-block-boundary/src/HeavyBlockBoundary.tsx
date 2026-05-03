import type { CSSProperties, ComponentType, ReactElement, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

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
  load,
  loadingText,
  childProps,
}: HeavyBlockBoundaryProps<P>): ReactElement {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null);
  const [, /* attempt */] = useState<number>(1);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    load({ signal: controller.signal })
      .then((mod) => {
        if (mountedRef.current) {
          setComponent(() => mod.default);
        }
      })
      .catch((err) => {
        // A3 wires real error UI + onLoadError telemetry + retry button.
        // Suppress abort-driven rejections so unmount cleanup is silent.
        if (!controller.signal.aborted) {
          console.error(`[HeavyBlockBoundary:${kind}] load failed`, err);
        }
        // TODO(A3): retry button + onLoadError + errorText render
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
    // load + kind are intentionally omitted from deps - A2 mounts once;
    // A3 retry path will trigger re-load via attempt-state increment.
  }, []);

  const resolvedLoadingText = loadingText ?? `Loading ${kind}...`;
  const skeletonStyle: CSSProperties = {
    width: `${dims.width}px`,
    minHeight: `${dims.height}px`,
  };

  // TODO(A4): aria-busy toggle + CSS classes + prefers-reduced-motion
  return (
    <div
      data-block={kind}
      data-deferred="wave-4"
      className={`heavy-block-skeleton heavy-block-skeleton--${kind}`}
      role="status"
      aria-busy="true"
      style={skeletonStyle}
    >
      {Component ? (
        <Component {...(childProps as JSX.IntrinsicAttributes & P)} />
      ) : (
        <>
          <div className="heavy-block-skeleton__frame" aria-hidden="true" />
          <div className="heavy-block-skeleton__spinner" aria-hidden="true" />
          <div className="heavy-block-skeleton__text" aria-live="polite">
            {resolvedLoadingText}
          </div>
        </>
      )}
    </div>
  );
}
