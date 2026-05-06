import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RESPONSIVE_BREAKPOINTS, useResponsiveCols } from '../responsive-cols';

type QueryKey = 'desktop' | 'tablet';
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
    desktop: createMediaQueryList('(min-width: 1024px)', matches.desktop),
    tablet: createMediaQueryList('(min-width: 768px)', matches.tablet),
  };
  const matchMedia = vi.fn((query: string) => {
    if (query === queries.desktop.media) return queries.desktop as unknown as MediaQueryList;
    if (query === queries.tablet.media) return queries.tablet as unknown as MediaQueryList;
    throw new Error(`Unexpected media query: ${query}`);
  });

  vi.stubGlobal('matchMedia', matchMedia);
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });

  return { matchMedia, queries };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useResponsiveCols initial state', () => {
  it('desktop returns 12', () => {
    installMatchMedia({ desktop: true, tablet: true });

    const { result } = renderHook(() => useResponsiveCols());

    expect(result.current).toBe(12);
  });

  it('tablet returns 6', () => {
    installMatchMedia({ desktop: false, tablet: true });

    const { result } = renderHook(() => useResponsiveCols());

    expect(result.current).toBe(6);
  });

  it('mobile returns 1', () => {
    installMatchMedia({ desktop: false, tablet: false });

    const { result } = renderHook(() => useResponsiveCols());

    expect(result.current).toBe(1);
  });
});

describe('useResponsiveCols transition lifecycle', () => {
  it('desktop to tablet fires start then 320ms-delayed end', () => {
    vi.useFakeTimers();
    const { queries } = installMatchMedia({ desktop: true, tablet: true });
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();

    const { result } = renderHook(() =>
      useResponsiveCols({ onTransitionStart, onTransitionEnd }),
    );

    act(() => {
      queries.desktop.trigger(false);
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
    const { queries } = installMatchMedia({ desktop: true, tablet: true });
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
      queries.desktop.trigger(false);
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
    const { queries } = installMatchMedia({ desktop: true, tablet: true });
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();

    const { unmount } = renderHook(() =>
      useResponsiveCols({ onTransitionStart, onTransitionEnd }),
    );

    expect(queries.desktop.listeners.size).toBe(1);
    expect(queries.tablet.listeners.size).toBe(1);

    act(() => {
      queries.desktop.trigger(false);
    });

    expect(onTransitionStart).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(onTransitionEnd).not.toHaveBeenCalled();
    expect(queries.desktop.removeEventListener).toHaveBeenCalledTimes(1);
    expect(queries.tablet.removeEventListener).toHaveBeenCalledTimes(1);
    expect(queries.desktop.listeners.size).toBe(0);
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
    const { matchMedia } = installMatchMedia({ desktop: false, tablet: false });
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
