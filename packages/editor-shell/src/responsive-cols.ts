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
 * Wave 6 cf-20d R2 F1 fix (2026-05-09) — boundary alignment with grid.css.
 * Pre-R2 the hook used `(min-width: 1024px)` + `(min-width: 768px)` which
 * gave: 1024px exactly → 12, but `apps/site/src/styles/grid.css:97`
 * `(max-width: 1024px)` → 6-col grid (≤1024 = 6). At the EXACT 1024px
 * boundary the hook said 12 while the CSS painted a 6-col grid; tablet
 * users at that pixel hit 12-col snap stops on a 6-col grid. Same off-by-
 * one at 768px boundary. R2 fix: switch to MAX-WIDTH queries that match
 * the CSS buckets byte-equivalent.
 *
 * Bucket truth table (matches grid.css verbatim):
 *   width <= 768   → 1 col   (matches `@media (max-width: 768px)`)
 *   768 < width <= 1024 → 6 col   (matches `@media (max-width: 1024px)`
 *                                  but NOT `(max-width: 768px)`)
 *   width > 1024   → 12 col  (no max-width @media matches)
 *
 * Operational rule landed (cf-20d R2 reflection): when a hook drives
 * layout decisions paired with CSS @media, the breakpoint queries MUST
 * be byte-equivalent to the CSS rules (same operator: max-width vs
 * min-width; same threshold pixel; same inclusivity). Off-by-one at the
 * EXACT boundary breaks deterministic behavior. Adding `1024` and
 * `768` to the unit-test boundary matrix as mandatory cases.
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

/**
 * R2 F1 fix: bucket the viewport from max-width matches (CSS-aligned).
 *
 * @param mobileMatches  `(max-width: 768px)` matches → ≤768px → 1 col
 * @param tabletMatches  `(max-width: 1024px)` matches AND mobile DOESN'T → 6 col
 * @returns 12 / 6 / 1 per CSS-bucket truth table above.
 */
function colsFromMatches(
  mobileMatches: boolean,
  tabletMatches: boolean,
): ViewportCols {
  if (mobileMatches) return 1;
  if (tabletMatches) return 6;
  return 12;
}

function currentViewportCols(): ViewportCols {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 12;

  return colsFromMatches(
    window.matchMedia('(max-width: 768px)').matches,
    window.matchMedia('(max-width: 1024px)').matches,
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

    // R2 F1 fix: max-width queries match grid.css verbatim. Pre-R2
    // the hook used min-width which caused an off-by-one at the
    // EXACT 1024 / 768 boundaries.
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const tabletQuery = window.matchMedia('(max-width: 1024px)');

    const clearEndTimer = () => {
      if (endTimerRef.current !== null) {
        clearTimeout(endTimerRef.current);
        endTimerRef.current = null;
      }
    };

    const handleChange = () => {
      const nextCols = colsFromMatches(mobileQuery.matches, tabletQuery.matches);
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

    mobileQuery.addEventListener('change', handleChange);
    tabletQuery.addEventListener('change', handleChange);

    return () => {
      mobileQuery.removeEventListener('change', handleChange);
      tabletQuery.removeEventListener('change', handleChange);
      clearEndTimer();
    };
  }, []);

  return viewportCols;
}
