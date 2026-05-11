import { Window } from 'happy-dom';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Container, type Root } from 'react-dom/client';
import { expect, test } from '@playwright/test';
import { effectiveColSnaps } from '@skb/block-foundation';
import { GridContainer } from '@skb/editor-shell/src/grid-container.tsx';
import {
  RESPONSIVE_BREAKPOINTS,
  useResponsiveCols,
} from '@skb/editor-shell/src/responsive-cols.ts';
import { ColRuler } from '@skb/editor-shell/src/resize/col-ruler.tsx';
import { colSpanToFraction, SizeTooltip } from '@skb/editor-shell/src/resize/size-tooltip.tsx';
import { renderIntoPage, renderJsxMarkup } from './grid-drag-drop.fixtures';

/**
 * ADR-0017 D9 / AC#10 resize-feedback primitive authority and ADR-0016 D5
 * responsive 12 / 6 / 1 viewport-switch coverage for Wave 5 C.2-11.
 * C.2-10 owns the ColRuler rendering-invariant slice; this spec owns the
 * synthetic resize-feedback, mobile view-only, responsive switch, and
 * rowSpan-adapt slices. Real mouse resize-drag stays deferred to C.4-2.
 * The diff is Playwright-only, so ADR-0011 D9.6 e2e-smoke gating remains
 * mechanically skipped for ui_touch=false PRs.
 */

type GlobalSnapshot = Record<string, unknown>;

type MatchMediaController = {
  setWidth: (width: number) => void;
};

const GLOBAL_KEYS = [
  'window',
  'document',
  'HTMLElement',
  'ResizeObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'IS_REACT_ACT_ENVIRONMENT',
] as const;

function installHappyDomGlobals(win: Window, resizeObserver?: unknown): () => void {
  const globalScope = globalThis as GlobalSnapshot;
  const previous: GlobalSnapshot = Object.fromEntries(
    GLOBAL_KEYS.map((key) => [key, globalScope[key]]),
  );

  globalScope.window = win;
  globalScope.document = win.document;
  globalScope.HTMLElement = win.HTMLElement;
  if (resizeObserver !== undefined) globalScope.ResizeObserver = resizeObserver;
  globalScope.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(performance.now()), 0) as unknown as number;
  };
  globalScope.cancelAnimationFrame = (id: number) => clearTimeout(id);
  globalScope.IS_REACT_ACT_ENVIRONMENT = true;

  return () => {
    for (const key of GLOBAL_KEYS) {
      if (previous[key] === undefined) delete globalScope[key];
      else globalScope[key] = previous[key];
    }
  };
}

function queryMatchesWidth(query: string, width: number): boolean {
  // min-width queries (legacy; preserved for any consumer still using them)
  if (query === `(min-width: ${RESPONSIVE_BREAKPOINTS.desktop}px)`) {
    return width >= RESPONSIVE_BREAKPOINTS.desktop;
  }
  if (query === `(min-width: ${RESPONSIVE_BREAKPOINTS.tablet}px)`) {
    return width >= RESPONSIVE_BREAKPOINTS.tablet;
  }
  // max-width queries — Wave 6 cf-20d R2 F1: useResponsiveCols
  // switched to max-width to match grid.css verbatim. Pre-R2 the
  // hook used min-width which caused off-by-one at 1024px / 768px
  // boundaries.
  if (query === `(max-width: ${RESPONSIVE_BREAKPOINTS.desktop}px)`) {
    return width <= RESPONSIVE_BREAKPOINTS.desktop;
  }
  if (query === `(max-width: ${RESPONSIVE_BREAKPOINTS.tablet}px)`) {
    return width <= RESPONSIVE_BREAKPOINTS.tablet;
  }

  throw new Error(`unsupported matchMedia query: ${query}`);
}

function installMatchMedia(win: Window, initialWidth: number): MatchMediaController {
  let width = initialWidth;
  const lists = new Map<
    string,
    {
      mql: MediaQueryList;
      listeners: Set<(event: MediaQueryListEvent) => void>;
    }
  >();

  function mediaQueryList(query: string): MediaQueryList {
    const existing = lists.get(query);
    if (existing) return existing.mql;

    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mql = {
      get matches() {
        return queryMatchesWidth(query, width);
      },
      media: query,
      onchange: null,
      addEventListener: (
        _type: string,
        listener: ((event: MediaQueryListEvent) => void) | null,
      ) => {
        if (listener) listeners.add(listener);
      },
      removeEventListener: (
        _type: string,
        listener: ((event: MediaQueryListEvent) => void) | null,
      ) => {
        if (listener) listeners.delete(listener);
      },
      addListener: (listener: ((event: MediaQueryListEvent) => void) | null) => {
        if (listener) listeners.add(listener);
      },
      removeListener: (listener: ((event: MediaQueryListEvent) => void) | null) => {
        if (listener) listeners.delete(listener);
      },
      dispatchEvent: (event: Event) => {
        for (const listener of listeners) {
          listener(event as MediaQueryListEvent);
        }
        return true;
      },
    } as MediaQueryList;

    lists.set(query, { mql, listeners });
    return mql;
  }

  Object.defineProperty(win, 'matchMedia', {
    configurable: true,
    value: (query: string) => mediaQueryList(query),
  });

  return {
    setWidth(nextWidth: number): void {
      const previousMatches = new Map(
        Array.from(lists, ([query, entry]) => [query, entry.mql.matches]),
      );
      width = nextWidth;

      for (const [query, entry] of lists) {
        if (previousMatches.get(query) === entry.mql.matches) continue;

        const event = {
          matches: entry.mql.matches,
          media: query,
        } as MediaQueryListEvent;
        entry.mql.onchange?.call(entry.mql, event);
        for (const listener of entry.listeners) {
          listener.call(entry.mql, event);
        }
      }
    },
  };
}

test.describe('AC#10 resize feedback primitives synthetic harness', () => {
  test('AC#10 — colSpanToFraction maps colSpan/totalCols per FRACTIONS_BY_TOTAL_COLS table', () => {
    // Table authority: packages/editor-shell/src/resize/size-tooltip.tsx:21-40.
    expect(colSpanToFraction(12, 12)).toBe('full');
    expect(colSpanToFraction(8, 12)).toBe('2/3');
    expect(colSpanToFraction(6, 12)).toBe('1/2');
    expect(colSpanToFraction(4, 12)).toBe('1/3');
    expect(colSpanToFraction(3, 12)).toBe('1/4');
    expect(colSpanToFraction(2, 12)).toBe('1/6');
    expect(colSpanToFraction(6, 6)).toBe('full');
    expect(colSpanToFraction(3, 6)).toBe('1/2');
    expect(colSpanToFraction(2, 6)).toBe('1/3');
    expect(colSpanToFraction(1, 1)).toBe('full');
    expect(() => colSpanToFraction(5, 12)).toThrow(/unsupported colSpan\/totalCols pair/);
  });

  test('AC#10 — SizeTooltip renders fraction + cursor offset', async ({ page }) => {
    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(SizeTooltip, {
          cursorX: 400,
          cursorY: 300,
          fraction: '1/2',
        }),
      ),
    );

    // Selector authority: packages/editor-shell/src/resize/size-tooltip.tsx:42-43.
    const tooltip = page.locator('.skb-size-tooltip');
    await expect(tooltip).toHaveCount(1);
    await expect(tooltip).toHaveText('1/2');
    expect(
      await tooltip.evaluate((node) => {
        const style = getComputedStyle(node as HTMLElement);
        return { left: style.left, position: style.position, top: style.top };
      }),
    ).toEqual({ left: '412px', position: 'fixed', top: '292px' });

    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(SizeTooltip, {
          cursorX: 100,
          cursorY: 150,
          fraction: '2/3',
          rowSpan: 4,
        }),
      ),
    );
    await expect(page.locator('.skb-size-tooltip')).toHaveText('2/3 · 4 rows');
  });

  test('AC#10 — ColRuler hoveredStop cursor transition', async ({ page }) => {
    async function renderRuler(hoveredStop: number | null): Promise<void> {
      await renderIntoPage(
        page,
        renderJsxMarkup(
          React.createElement(ColRuler, {
            activeStops: [2, 3, 4, 6, 8, 12],
            hoveredStop,
            totalCols: 12,
          }),
        ),
      );
    }

    await renderRuler(2);
    // Selector authority: packages/editor-shell/src/resize/col-ruler.tsx:35-38.
    await expect(page.locator('.skb-col-ruler-stop--active')).toHaveAttribute('data-stop', '2');

    await renderRuler(6);
    await expect(page.locator('.skb-col-ruler-stop--active')).toHaveCount(1);
    await expect(page.locator('.skb-col-ruler-stop--active')).toHaveAttribute('data-stop', '6');

    await renderRuler(null);
    await expect(page.locator('.skb-col-ruler-stop--active')).toHaveCount(0);

    await renderRuler(5);
    await expect(page.locator('.skb-col-ruler-stop--active')).toHaveCount(0);
    await expect(page.locator('.skb-col-ruler-stop[data-stop="5"]')).toHaveCount(0);
  });

  test('AC#10 — ColRuler returns null for totalCols=1', async ({ page }) => {
    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(ColRuler, {
          activeStops: [1],
          hoveredStop: 1,
          totalCols: 1,
        }),
      ),
    );

    // Selector authority: packages/editor-shell/src/resize/col-ruler.tsx:31-38.
    await expect(page.locator('.skb-col-ruler')).toHaveCount(0);
    await expect(page.locator('.skb-col-ruler-stop')).toHaveCount(0);
  });

  test('AC#10 — effectiveColSnaps authority', () => {
    // Snap authority: packages/block-foundation/src/grid-math.ts:75-89.
    expect(Array.from(effectiveColSnaps(12))).toEqual([2, 3, 4, 6, 8, 12]);
    expect(Array.from(effectiveColSnaps(6))).toEqual([2, 3, 6]);
    expect(Array.from(effectiveColSnaps(1))).toEqual([1]);
  });
});

test.describe('ADR-0016 D5 responsive viewport switch + GridContainer wire', () => {
  test('AC#10 — useResponsiveCols matchMedia -> ViewportCols', () => {
    // Wave 6 cf-20d R2 F1 boundary alignment (2026-05-09): hook
    // switched from min-width to max-width queries to match
    // grid.css verbatim. New bucket truth table:
    //   width <= 768  → 1 col
    //   768 < width <= 1024 → 6 col
    //   width > 1024  → 12 col
    // Pre-R2 widths AT the boundary returned the higher bucket
    // (off-by-one). Test now uses widths CLEARLY OUTSIDE each
    // bucket boundary so the assertion is independent of the
    // boundary inclusivity (which has its own dedicated boundary
    // tests in packages/editor-shell/src/__tests__/responsive-cols.test.ts).
    const win = new Window();
    const controller = installMatchMedia(
      win,
      RESPONSIVE_BREAKPOINTS.desktop + 1, // 1025 → desktop bucket (12)
    );
    const restoreGlobals = installHappyDomGlobals(win);

    function ColsHarness() {
      const cols = useResponsiveCols();
      return React.createElement('div', { 'data-cols': String(cols) });
    }

    let root: Root | null = null;
    try {
      const host = win.document.createElement('section');
      win.document.body.append(host);
      act(() => {
        root = createRoot(host as unknown as Container);
        root.render(React.createElement(ColsHarness));
      });

      // Match authority: packages/editor-shell/src/responsive-cols.ts:30-44.
      const target = () => host.querySelector('[data-cols]') as HTMLElement | null;
      expect(target()?.dataset.cols).toBe('12');

      // Tablet bucket: 768 < width <= 1024. Pick 900 (clearly inside).
      act(() => controller.setWidth(900));
      expect(target()?.dataset.cols).toBe('6');

      // Mobile bucket: width <= 768. Pick 375 (typical mobile, clearly inside).
      act(() => controller.setWidth(375));
      expect(target()?.dataset.cols).toBe('1');
    } finally {
      act(() => root?.unmount());
      restoreGlobals();
    }
  });

  test('AC#10 — GridContainer emits .skb-grid--mobile + data-skb-viewport-cols', async ({
    page,
  }) => {
    async function renderGrid(viewportCols?: 12 | 6 | 1): Promise<void> {
      await renderIntoPage(
        page,
        renderJsxMarkup(React.createElement(GridContainer, { viewportCols }, 'x')),
      );
    }

    await renderGrid(12);
    // Selector authority: packages/editor-shell/src/grid-container.tsx:35-43.
    await expect(page.locator('.skb-grid')).toHaveCount(1);
    await expect(page.locator('.skb-grid--mobile')).toHaveCount(0);
    await expect(page.locator('.skb-grid')).toHaveAttribute('data-skb-viewport-cols', '12');

    await renderGrid(6);
    await expect(page.locator('.skb-grid--mobile')).toHaveCount(0);
    await expect(page.locator('.skb-grid')).toHaveAttribute('data-skb-viewport-cols', '6');

    await renderGrid(1);
    await expect(page.locator('.skb-grid--mobile')).toHaveCount(1);
    await expect(page.locator('.skb-grid')).toHaveAttribute('data-skb-viewport-cols', '1');

    await renderGrid();
    await expect(page.locator('.skb-grid')).toHaveCount(1);
    await expect(page.locator('.skb-grid--mobile')).toHaveCount(0);
    await expect(page.locator('.skb-grid')).not.toHaveAttribute('data-skb-viewport-cols');
  });

  test('AC#10 — useAutoRowSpan REMOVED in Wave 7 Phase 2A (rowSpan is integer per ADR-0020 D1)', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2A: useAutoRowSpan + measure-based rowSpan auto-grow deleted; markdown content overflow now scrolls inside the block. Responsive viewport switching no longer changes rowSpan semantics — integer rowSpan persists across viewport changes by definition.',
    );
  });
});

test.describe('AC#10 real-mouse resize-drag deferred to C.4-2', () => {
  test('AC#10 — real mousedown / mousemove / mouseup on .gblock-handle.right triggers ColRuler hoveredStop transition, SizeTooltip fraction update, and snap-to-COL_SNAPS commit on release', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: requires .gblock-handle.right DOM emission and pointer-event handler dispatching layoutReducer resize action wired in EditorShellMount mount site at C.4-2 per plan v1.3 row C.4-2 line 715. C.2-11 covers synthetic helpers, props, and matchMedia mocks; C.4-2 lifts this test.skip by wiring real mouse events to editor-shell layoutReducer.',
    );
  });
});
