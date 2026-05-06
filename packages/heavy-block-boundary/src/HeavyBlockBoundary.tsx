/**
 * ADR-0014 v0.5 adds the gridContext-derived dims path for heavy blocks.
 * ADR-0016 D9 keeps the W5-1 formulae in @skb/block-foundation; this
 * boundary delegates to that single authority instead of reimplementing math.
 */
import type { CSSProperties, ComponentType, ReactElement, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { effectiveCellHeight, effectiveColWidth, type GridGeometry } from '@skb/block-foundation';

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
  readonly dims?: HeavyBlockDimensions;
  readonly load: (init?: { signal?: AbortSignal }) => Promise<{ default: ComponentType<P> }>;
  readonly loadingText?: string; // default: `Loading ${kind}...`
  readonly errorText?: string; // default: `Failed to load ${kind}`
  readonly retryLabel?: string; // default: `Retry`
  readonly maxRetries?: number; // default: 2 (after which retry button disables; per C5 bounded)
  readonly childProps: P; // forwarded to loaded component
  readonly fallback?: ReactNode; // optional override of SSR placeholder
  readonly onLoadError?: (e: unknown, attempt: number) => void; // telemetry hook
  readonly gridContext?: {
    readonly colSpan: number;
    readonly rowSpan: number;
    readonly containerWidth: number;
    readonly geometry?: Partial<GridGeometry>;
  };
}

export function HeavyBlockBoundary<P>({
  kind,
  dims,
  gridContext,
  load,
  loadingText,
  errorText,
  retryLabel,
  maxRetries,
  childProps,
  onLoadError,
}: HeavyBlockBoundaryProps<P>): ReactElement {
  if (dims === undefined && gridContext === undefined) {
    throw new Error('HeavyBlockBoundary requires either dims or gridContext');
  }
  const resolvedDims: HeavyBlockDimensions = dims ?? {
    width: effectiveColWidth(
      gridContext!.colSpan,
      gridContext!.containerWidth,
      gridContext!.geometry,
    ),
    height: effectiveCellHeight(
      gridContext!.rowSpan,
      gridContext!.geometry,
    ),
  };

  const [Component, setComponent] = useState<ComponentType<P> | null>(null);
  const [attempt, setAttempt] = useState<number>(1);
  const [error, setError] = useState<unknown>(null);
  const mountedRef = useRef<boolean>(true);

  const resolvedLoadingText = loadingText ?? `Loading ${kind}...`;
  const resolvedErrorText = errorText ?? `Failed to load ${kind}`;
  const resolvedRetryLabel = retryLabel ?? 'Retry';
  const resolvedMaxRetries = maxRetries ?? 2;
  const canRetry = attempt <= resolvedMaxRetries;

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    load({ signal: controller.signal })
      .then((mod) => {
        if (mountedRef.current) {
          setComponent(() => mod.default);
          setError(null);
        }
      })
      .catch((err) => {
        // Suppress abort-driven rejections so unmount cleanup is silent.
        if (controller.signal.aborted) return;
        if (mountedRef.current) {
          setError(err);
          onLoadError?.(err, attempt);
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
    // load + kind are intentionally omitted from deps - referential stability
    // is the consumer's responsibility. attempt is included to drive retry
    // re-runs when handleRetry increments attempt.
  }, [attempt]);

  const handleRetry = (): void => {
    if (!canRetry) return;
    setError(null);
    setAttempt((prev) => prev + 1);
  };

  const skeletonStyle: CSSProperties = {
    width: `${resolvedDims.width}px`,
    minHeight: `${resolvedDims.height}px`,
  };

  return (
    <div
      data-block={kind}
      data-deferred="wave-4"
      className={`heavy-block-skeleton heavy-block-skeleton--${kind}`}
      role="status"
      aria-busy={Component === null && error === null ? 'true' : 'false'}
      style={skeletonStyle}
    >
      {Component ? (
        <Component {...(childProps as JSX.IntrinsicAttributes & P)} />
      ) : error ? (
        <div className="heavy-block-skeleton__error" role="alert">
          <div className="heavy-block-skeleton__error-text">{resolvedErrorText}</div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={!canRetry}
            className="heavy-block-skeleton__retry"
          >
            {resolvedRetryLabel}
          </button>
        </div>
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
