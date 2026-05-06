/**
 * @skb/editor-shell responsive viewport columns for ADR-0016 D5 and ADR-0017 D9.
 *
 * Load-bearing constants: tablet 768px and desktop 1024px mirror ADR-0016 D5
 * for the 12 / 6 / 1 viewport switch and the T0-T4 transition budget. The
 * 320ms delay marks the stable transition boundary where consumers may
 * re-measure rendering-derived mobile rowSpan='auto' without persisting the
 * integer rowSpan. ADR-0017 D9 keeps the mobile 1-col path view-only via the
 * `.skb-grid--mobile` class emitted by GridContainer.
 *
 * TODO(Stage C.3-1): replace the hardcoded numeric bridge with design-token
 * breakpoint vars once `--bp-tablet` and `--bp-desktop` land.
 */
import { useEffect, useRef, useState } from 'react';

export type ViewportCols = 12 | 6 | 1;

export interface UseResponsiveColsOptions {
  readonly onTransitionStart?: () => void;
  readonly onTransitionEnd?: () => void;
}

export const RESPONSIVE_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

const TRANSITION_END_MS = 320;

function colsFromMatches(desktopMatches: boolean, tabletMatches: boolean): ViewportCols {
  if (desktopMatches && tabletMatches) return 12;
  if (!desktopMatches && tabletMatches) return 6;
  if (!desktopMatches && !tabletMatches) return 1;

  return 12;
}

function currentViewportCols(): ViewportCols {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 12;

  return colsFromMatches(
    window.matchMedia('(min-width: 1024px)').matches,
    window.matchMedia('(min-width: 768px)').matches,
  );
}

export function useResponsiveCols(options: UseResponsiveColsOptions = {}): ViewportCols {
  const { onTransitionStart, onTransitionEnd } = options;
  const [viewportCols, setViewportCols] = useState<ViewportCols>(() => currentViewportCols());
  const viewportColsRef = useRef(viewportCols);
  const onTransitionStartRef = useRef(onTransitionStart);
  const onTransitionEndRef = useRef(onTransitionEnd);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onTransitionStartRef.current = onTransitionStart;
  }, [onTransitionStart]);

  useEffect(() => {
    onTransitionEndRef.current = onTransitionEnd;
  }, [onTransitionEnd]);

  useEffect(() => {
    viewportColsRef.current = viewportCols;
  }, [viewportCols]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const tabletQuery = window.matchMedia('(min-width: 768px)');

    const clearEndTimer = () => {
      if (endTimerRef.current !== null) {
        clearTimeout(endTimerRef.current);
        endTimerRef.current = null;
      }
    };

    const handleChange = () => {
      const nextCols = colsFromMatches(desktopQuery.matches, tabletQuery.matches);
      if (nextCols === viewportColsRef.current) return;

      onTransitionStartRef.current?.();

      viewportColsRef.current = nextCols;
      setViewportCols(nextCols);
      clearEndTimer();
      endTimerRef.current = setTimeout(() => {
        endTimerRef.current = null;
        onTransitionEndRef.current?.();
      }, TRANSITION_END_MS);
    };

    desktopQuery.addEventListener('change', handleChange);
    tabletQuery.addEventListener('change', handleChange);

    return () => {
      desktopQuery.removeEventListener('change', handleChange);
      tabletQuery.removeEventListener('change', handleChange);
      clearEndTimer();
    };
  }, []);

  return viewportCols;
}
