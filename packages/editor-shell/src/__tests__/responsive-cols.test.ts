import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RESPONSIVE_BREAKPOINTS, useResponsiveCols } from '../responsive-cols';

// R2 F1 fix (2026-05-09): hook now uses max-width queries (`mobile`
// + `tablet`) to match grid.css verbatim. Pre-R2 the mock keys were
// 'desktop' (min-width: 1024px) + 'tablet' (min-width: 768px).
type QueryKey = 'mobile' | 'tablet';
type MatchListener = (event: MediaQueryListEvent) => void;

interface MockMediaQueryList {
  readonly media: string;
  matches: boolean;
  readonly addEventListener: ReturnType<typeof vi.fn>;
  readonly removeEventListener: ReturnType<typeof vi.fn>;
  readonly listeners: Set<MatchListener>;
  trigger: (matches: boolean) => void;
}

function createMediaQueryList(media: string, matches: boolean): MockMediaQueryList {
  const listeners = new Set<MatchListener>();
  return {
    media,
    matches,
    listeners,
    addEventListener: vi.fn((event: string, listener: MatchListener) => {
      if (event === 'change') listeners.add(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: MatchListener) => {
      if (event === 'change') listeners.delete(listener);
    }),
    trigger(nextMatches: boolean) {
      this.matches = nextMatches;
      const event = { matches: nextMatches, media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function installMatchMedia(matches: Record<QueryKey, boolean>) {
  const queries: Record<QueryKey, MockMediaQueryList> = {
    mobile: createMediaQueryList('(max-width: 768px)', matches.mobile),
    tablet: createMediaQueryList('(max-width: 1024px)', matches.tablet),
  };
  const matchMedia = vi.fn((query: string) => {
    if (query === queries.mobile.media) return queries.mobile as unknown as MediaQueryList;
    if (query === queries.tablet.media) return queries.tablet as unknown as MediaQueryList;
    throw new Error(`Unexpected media query: ${query}`);
  });

  vi.stubGlobal('matchMedia', matchMedia);
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });

  return { matchMedia, queries };
}

/**
 * R2 F1 fix (2026-05-09) — semantic helper for boundary tests. Maps
 * a viewport pixel width to the matchMedia matches truth table per
 * grid.css buckets:
 *   width <= 768  → mobile=true,  tablet=true   → 1
 *   768 < width <= 1024 → mobile=false, tablet=true   → 6
 *   width > 1024  → mobile=false, tablet=false  → 12
 */
function matchesForWidth(width: number): Record<QueryKey, boolean> {
  return {
    mobile: width <= 768,
    tablet: width <= 1024,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useResponsiveCols initial state', () => {
  it('desktop returns 12', () => {
    // Desktop = width > 1024 → mobile=false, tablet=false
    installMatchMedia({ mobile: false, tablet: false });

    const { result } = renderHook(() => useResponsiveCols());

    expect(result.current).toBe(12);
  });

  it('tablet returns 6', () => {
    // Tablet = 768 < width <= 1024 → mobile=false, tablet=true
    installMatchMedia({ mobile: false, tablet: true });

    const { result } = renderHook(() => useResponsiveCols());

    expect(result.current).toBe(6);
  });

  it('mobile returns 1', () => {
    // Mobile = width <= 768 → mobile=true, tablet=true (max-width
    // queries cascade)
    installMatchMedia({ mobile: true, tablet: true });

    const { result } = renderHook(() => useResponsiveCols());

    expect(result.current).toBe(1);
  });
});

/**
 * R2 F1 fix lock (2026-05-09) — boundary semantics matrix. Pre-R2
 * the hook used min-width queries which gave 1024px=12 + 768px=6;
 * grid.css uses max-width which gives 1024px=6 + 768px=1. R2
 * aligns the hook to grid.css. These boundary tests pin the
 * alignment.
 */
describe('useResponsiveCols R2 F1 — exact boundary widths align with grid.css max-width buckets', () => {
  it('width=768 (mobile/tablet boundary) → 1 col (matches max-width: 768px)', () => {
    installMatchMedia(matchesForWidth(768));
    const { result } = renderHook(() => useResponsiveCols());
    expect(result.current).toBe(1);
  });

  it('width=769 (just above mobile boundary) → 6 col', () => {
    installMatchMedia(matchesForWidth(769));
    const { result } = renderHook(() => useResponsiveCols());
    expect(result.current).toBe(6);
  });

  it('width=1024 (tablet/desktop boundary) → 6 col (matches max-width: 1024px; pre-R2 hook gave 12 here — REGRESSION LOCK)', () => {
    installMatchMedia(matchesForWidth(1024));
    const { result } = renderHook(() => useResponsiveCols());
    expect(result.current).toBe(6);
  });

  it('width=1025 (just above tablet boundary) → 12 col', () => {
    installMatchMedia(matchesForWidth(1025));
    const { result } = renderHook(() => useResponsiveCols());
    expect(result.current).toBe(12);
  });

  it('width=375 (typical mobile, well below 768) → 1 col', () => {
    installMatchMedia(matchesForWidth(375));
    const { result } = renderHook(() => useResponsiveCols());
    expect(result.current).toBe(1);
  });

  it('width=900 (typical tablet, between 768 and 1024) → 6 col', () => {
    installMatchMedia(matchesForWidth(900));
    const { result } = renderHook(() => useResponsiveCols());
    expect(result.current).toBe(6);
  });

  it('width=1440 (typical desktop, well above 1024) → 12 col', () => {
    installMatchMedia(matchesForWidth(1440));
    const { result } = renderHook(() => useResponsiveCols());
    expect(result.current).toBe(12);
  });
});

describe('useResponsiveCols transition lifecycle', () => {
  it('desktop to tablet fires start then 320ms-delayed end', () => {
    // R2 F1: starting at desktop (>1024) → mobile=false, tablet=false → 12.
    // Trigger transition to tablet by setting tablet=true (viewport
    // shrunk to ≤1024).
    vi.useFakeTimers();
    const { queries } = installMatchMedia({ mobile: false, tablet: false });
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();

    const { result } = renderHook(() =>
      useResponsiveCols({ onTransitionStart, onTransitionEnd }),
    );

    act(() => {
      queries.tablet.trigger(true);
    });

    expect(result.current).toBe(6);
    expect(onTransitionStart).toHaveBeenCalledTimes(1);
    expect(onTransitionEnd).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onTransitionEnd).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it('preserves pending transition-end timer across rerender with new callback identities', () => {
    vi.useFakeTimers();
    const { queries } = installMatchMedia({ mobile: false, tablet: false });
    const dispatch1 = vi.fn();
    const dispatch2 = vi.fn();

    const { rerender } = renderHook(
      ({ dispatch }: { readonly dispatch: (event: string) => void }) =>
        useResponsiveCols({
          onTransitionStart: () => dispatch('responsive-transition-start'),
          onTransitionEnd: () => dispatch('responsive-transition-end'),
        }),
      { initialProps: { dispatch: dispatch1 } },
    );

    act(() => {
      queries.tablet.trigger(true);
    });

    expect(dispatch1).toHaveBeenCalledWith('responsive-transition-start');

    rerender({ dispatch: dispatch2 });

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(dispatch1).not.toHaveBeenCalledWith('responsive-transition-end');
    expect(dispatch2).toHaveBeenCalledWith('responsive-transition-end');
  });

  it('unmount cleans up both listeners and clears pending timer', () => {
    vi.useFakeTimers();
    const { queries } = installMatchMedia({ mobile: false, tablet: false });
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();

    const { unmount } = renderHook(() =>
      useResponsiveCols({ onTransitionStart, onTransitionEnd }),
    );

    expect(queries.mobile.listeners.size).toBe(1);
    expect(queries.tablet.listeners.size).toBe(1);

    act(() => {
      queries.tablet.trigger(true);
    });

    expect(onTransitionStart).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(onTransitionEnd).not.toHaveBeenCalled();
    expect(queries.mobile.removeEventListener).toHaveBeenCalledTimes(1);
    expect(queries.tablet.removeEventListener).toHaveBeenCalledTimes(1);
    expect(queries.mobile.listeners.size).toBe(0);
    expect(queries.tablet.listeners.size).toBe(0);
  });
});

describe('RESPONSIVE_BREAKPOINTS', () => {
  it('uses ADR-0016 D5 tablet 768 and desktop 1024 values', () => {
    expect(RESPONSIVE_BREAKPOINTS.tablet).toBe(768);
    expect(RESPONSIVE_BREAKPOINTS.desktop).toBe(1024);
  });
});

describe('useResponsiveCols SSR safety', () => {
  it('returns 12 default and does not subscribe when window is unavailable', () => {
    const { matchMedia } = installMatchMedia({ mobile: false, tablet: false });
    vi.stubGlobal('window', undefined);
    const values: number[] = [];

    function SsrProbe() {
      const cols = useResponsiveCols();
      values.push(cols);
      return createElement('div', null, String(cols));
    }

    expect(renderToString(createElement(SsrProbe))).toContain('12');
    expect(values).toEqual([12]);
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('handles missing window.matchMedia gracefully', () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });

    const { result } = renderHook(() => useResponsiveCols());

    expect([12, 6, 1]).toContain(result.current);
    expect(result.current).toBe(12);
    expect(window.matchMedia).toBeUndefined();
  });
});
