import { Window } from 'happy-dom';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Container, type Root } from 'react-dom/client';
import { expect, test } from '@playwright/test';
import {
  computeEdgeRects,
  EDGE_W,
  type BlockLayout,
} from '@skb/editor-shell/src/drag-drop/edge-rects.ts';
import {
  findMatches,
  tiebreak,
  type DragVelocity,
  type EdgeMatch,
} from '@skb/editor-shell/src/drag-drop/tiebreak.ts';
import { OutlineOverlay } from '@skb/editor-shell/src/drag-drop/outline-overlay.tsx';
import { ColRuler } from '@skb/editor-shell/src/resize/col-ruler.tsx';
import {
  blockLayout,
  blockRectMap,
  classifyCursor,
  computeExpectedEdgeRect,
  expectEdgeRect,
  match,
  measureBlockBounds,
  readStaticLayer,
  renderIntoPage,
  renderJsxMarkup,
  simulateCursorAt,
  visibleOverlayClasses,
  type Classification,
} from './grid-drag-drop.fixtures';

/**
 * ADR-0017 AC#1-#12 drag/drop Playwright authority.
 *
 * Path A scope is locked to synthetic helper and DOM-invariant fixtures: no
 * EditorShellMount drag-active state-machine wiring, no real DOM drag, and no
 * mouse-driven drop lifecycle. AC#1-#6, AC#8, and AC#10 are covered here.
 * AC#7, AC#9, AC#11, and AC#12 are deferred to C.4-2 because they require
 * EditorShellMount drag-active state, drag-start, drag-end-success, or global
 * Esc wiring.
 */
const BLOCK_KIND = 'jupyter';

test.describe('AC#1-#5 hit-test geometry against /sample-blocks-astro', () => {
  test('AC#1 — 4 mode classification at edge positions', async ({ page }) => {
    await page.goto('/sample-blocks-astro');

    const bounds = await measureBlockBounds(page, BLOCK_KIND);
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const cases: Array<{ x: number; y: number; expected: Classification }> = [
      { x: bounds.left + 1, y: centerY, expected: 'split-left' },
      { x: bounds.right - 1, y: centerY, expected: 'split-right' },
      { x: centerX, y: bounds.top + 1, expected: 'split-top' },
      { x: centerX, y: bounds.bottom - 1, expected: 'split-bottom' },
      { x: bounds.left - EDGE_W * 2, y: bounds.top - EDGE_W * 2, expected: 'empty' },
      { x: centerX, y: centerY, expected: 'none' },
    ];

    for (const cursor of cases) {
      await simulateCursorAt(page, cursor.x, cursor.y);
      expect(classifyCursor(bounds, cursor.x, cursor.y)).toBe(cursor.expected);
    }

    const edgeRects = computeEdgeRects([blockLayout(BLOCK_KIND, bounds)]);
    for (const mode of ['split-left', 'split-right', 'split-top', 'split-bottom'] as const) {
      const actual = edgeRects.find((edgeRect) => edgeRect.mode === mode);
      expect(actual).toBeDefined();
      expectEdgeRect(actual, computeExpectedEdgeRect(bounds, mode));
    }
  });

  test('AC#2 — EDGE_W boundary half-in/half-out', async ({ page }) => {
    await page.goto('/sample-blocks-astro');

    const bounds = await measureBlockBounds(page, BLOCK_KIND);
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    expect(EDGE_W).toBe(28);
    const cases: Array<{ x: number; y: number; expected: Classification }> = [
      { x: bounds.left + 14, y: centerY, expected: 'split-left' },
      { x: bounds.left + 15, y: centerY, expected: 'none' },
      { x: bounds.left - 14, y: centerY, expected: 'split-left' },
      { x: bounds.left - 15, y: centerY, expected: 'empty' },
      { x: bounds.right - 14, y: centerY, expected: 'split-right' },
      { x: bounds.right - 15, y: centerY, expected: 'none' },
      { x: bounds.right + 14, y: centerY, expected: 'split-right' },
      { x: bounds.right + 15, y: centerY, expected: 'empty' },
      { x: centerX, y: bounds.top + 14, expected: 'split-top' },
      { x: centerX, y: bounds.top + 15, expected: 'none' },
      { x: centerX, y: bounds.top - 14, expected: 'split-top' },
      { x: centerX, y: bounds.top - 15, expected: 'empty' },
      { x: centerX, y: bounds.bottom - 14, expected: 'split-bottom' },
      { x: centerX, y: bounds.bottom - 15, expected: 'none' },
      { x: centerX, y: bounds.bottom + 14, expected: 'split-bottom' },
      { x: centerX, y: bounds.bottom + 15, expected: 'empty' },
    ];

    for (const cursor of cases) {
      expect(classifyCursor(bounds, cursor.x, cursor.y)).toBe(cursor.expected);
    }
  });

  test('AC#3 — tiebreak distance + velocity + spatial + blockId', () => {
    const cases: Array<{
      label: string;
      matches: EdgeMatch[];
      velocity: DragVelocity;
      expected: Pick<EdgeMatch, 'blockId' | 'mode'>;
    }> = [
      {
        label: 'left-biased cursor picks the left block right edge',
        matches: [match('left', 'split-right', 4, 0, 0), match('right', 'split-left', 10, 114, 0)],
        velocity: { vx: 0, vy: 0 },
        expected: { blockId: 'left', mode: 'split-right' },
      },
      {
        label: 'right-biased cursor picks the right block left edge',
        matches: [match('left', 'split-right', 10, 0, 0), match('right', 'split-left', 4, 114, 0)],
        velocity: { vx: 0, vy: 0 },
        expected: { blockId: 'right', mode: 'split-left' },
      },
      {
        label: 'center cursor with vx > 0.5 picks the next split-left edge',
        matches: [match('left', 'split-right', 7, 0, 0), match('right', 'split-left', 7, 114, 0)],
        velocity: { vx: 1, vy: 0 },
        expected: { blockId: 'right', mode: 'split-left' },
      },
      {
        label: 'center static cursor falls back to spatial ordering',
        matches: [match('right', 'split-left', 7, 114, 0), match('left', 'split-right', 7, 0, 0)],
        velocity: { vx: 0.3, vy: 0 },
        expected: { blockId: 'left', mode: 'split-right' },
      },
      {
        label: 'same spatial position falls back to blockId ordering',
        matches: [match('bbb', 'split-left', 7, 0, 0), match('aaa', 'split-left', 7, 0, 0)],
        velocity: { vx: 0, vy: 0 },
        expected: { blockId: 'aaa', mode: 'split-left' },
      },
      {
        label: 'vertical cursor direction picks the downstream split-top edge',
        matches: [match('upper', 'split-bottom', 7, 0, 0), match('lower', 'split-top', 7, 0, 64)],
        velocity: { vx: 0, vy: 1 },
        expected: { blockId: 'lower', mode: 'split-top' },
      },
    ];

    for (const fixture of cases) {
      const winner = tiebreak(fixture.matches, fixture.velocity);
      expect(winner, fixture.label).toMatchObject(fixture.expected);
    }
  });

  test('AC#4 — static layer invariant during drag-over simulation', async ({ page }) => {
    await page.goto('/notes/sample-blocks');
    await expect(page.locator('.skb-grid').first()).toBeVisible({ timeout: 10_000 });

    const before = await readStaticLayer(page, BLOCK_KIND);
    const bounds = await measureBlockBounds(page, BLOCK_KIND);
    const mode = classifyCursor(bounds, bounds.left + 1, bounds.top + bounds.height / 2);

    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.className = 'drag-overlay-synthetic';
      overlay.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;';
      document.body.append(overlay);
    });

    const after = await readStaticLayer(page, BLOCK_KIND);
    expect(mode).toBe('split-left');
    expect(after).toEqual(before);
    expect(await visibleOverlayClasses(page)).toEqual(['drag-overlay-synthetic']);

    await page.evaluate(() => document.querySelector('.drag-overlay-synthetic')?.remove());
  });

  test('AC#5 — outline overlay class inventory by mode', async ({ page }) => {
    const bounds = { left: 100, top: 50, right: 300, bottom: 130, width: 200, height: 80 };
    const blockRects = blockRectMap('callout', bounds);

    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(OutlineOverlay, {
          activeMatch: match('callout', 'split-left', 4, bounds.left, bounds.top),
          blockRects,
        }),
      ),
    );
    await expect(page.locator('.skb-grid-outline-base')).toHaveCount(1);
    await expect(page.locator('.skb-grid-outline-accent')).toHaveCount(1);
    await expect(page.locator('.skb-grid-outline-accent--split-left')).toHaveCount(1);
    expect(
      await page
        .locator('[class]')
        .evaluateAll((nodes) => nodes.flatMap((node) => Array.from(node.classList)).sort()),
    ).toEqual([
      'skb-grid-outline-accent',
      'skb-grid-outline-accent--split-left',
      'skb-grid-outline-base',
    ]);
    expect(
      await page.locator('.skb-grid-outline-accent').evaluate((node) => {
        const style = getComputedStyle(node);
        return { pointerEvents: style.pointerEvents, zIndex: style.zIndex };
      }),
    ).toEqual({ pointerEvents: 'none', zIndex: '30' });

    await renderIntoPage(
      page,
      renderJsxMarkup(React.createElement(OutlineOverlay, { activeMatch: null, blockRects })),
    );
    await expect(page.locator('.skb-grid-outline-base')).toHaveCount(1);
    await expect(page.locator('.skb-grid-outline-accent')).toHaveCount(0);

    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(OutlineOverlay, {
          activeMatch: match('missing', 'split-left', 4, bounds.left, bounds.top),
          blockRects,
        }),
      ),
    );
    await expect(page.locator('.skb-grid-outline-base')).toHaveCount(1);
    await expect(page.locator('.skb-grid-outline-accent')).toHaveCount(0);
  });
});

test.describe('AC#6, #8, #10 helper integration', () => {
  test('AC#6 — hit-test perf budget for 30 synthetic blocks', () => {
    const blocks: BlockLayout[] = Array.from({ length: 30 }, (_, index) => {
      const left = 100 + (index % 6) * 114;
      const top = 100 + Math.floor(index / 6) * 78;
      return blockLayout(`b-${index.toString().padStart(2, '0')}`, {
        left,
        top,
        right: left + 100,
        bottom: top + 50,
        width: 100,
        height: 50,
      });
    });
    const blockRects = new Map(blocks.map((block) => [block.blockId, block.rect]));
    const cursorX = 101;
    const cursorY = 125;

    for (let index = 0; index < 250; index += 1) {
      findMatches(cursorX, cursorY, computeEdgeRects(blocks), blockRects);
    }

    const iterations = 3000;
    const start = performance.now();
    let lastMatchCount = 0;
    for (let index = 0; index < iterations; index += 1) {
      lastMatchCount = findMatches(cursorX, cursorY, computeEdgeRects(blocks), blockRects).length;
    }
    const perEventMs = (performance.now() - start) / iterations;

    expect(lastMatchCount).toBeGreaterThan(0);
    expect(perEventMs).toBeLessThanOrEqual(0.05);
  });

  test('AC#8 — REMOVED in Wave 7 Phase 2A (useAutoRowSpan deleted; rowSpan is integer per ADR-0020 D1)', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2A: useAutoRowSpan + measure-based rowSpan auto-grow deleted; markdown content overflow now scrolls inside the block. New coverage will live in Phase 2B (drag-resize integration).',
    );
  });

  test('AC#10 — col-ruler renders snap stops and highlights one active stop', async ({ page }) => {
    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(ColRuler, {
          activeStops: [2, 3, 4, 6, 8, 12],
          hoveredStop: 4,
          totalCols: 12,
        }),
      ),
    );

    await expect(page.locator('.skb-col-ruler-stop')).toHaveCount(6);
    expect(
      await page
        .locator('.skb-col-ruler-stop')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.stop)),
    ).toEqual(['2', '3', '4', '6', '8', '12']);

    // Selector authority: packages/editor-shell/src/resize/col-ruler.tsx:35-38
    // returns `.skb-col-ruler-stop--active` for hovered stops.
    const activeStop = page.locator('.skb-col-ruler-stop--active');
    await expect(activeStop).toHaveCount(1);
    await expect(activeStop).toHaveAttribute('data-stop', '4');

    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(ColRuler, {
          activeStops: [2, 3, 6],
          hoveredStop: 3,
          totalCols: 6,
        }),
      ),
    );
    await expect(page.locator('.skb-col-ruler-stop')).toHaveCount(3);
    expect(
      await page
        .locator('.skb-col-ruler-stop')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.stop)),
    ).toEqual(['2', '3', '6']);
    await expect(page.locator('.skb-col-ruler-stop--active')).toHaveAttribute('data-stop', '3');
  });
});

test.describe('AC#7, #9, #11, #12 deferred to C.4-2', () => {
  test('AC#7 — 源块 lift mode (drag-active state machine)', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: AC#7 deferred to C.4-2 — requires editor-shell drag-active state machine integration in apps/site/EditorShellMount.tsx; tracked in plan v1.3 row C.4-2 line 715',
    );
  });

  test('AC#9 — 全局 Esc cancel during drag', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: AC#9 deferred to C.4-2 — requires drag-active state machine; tracked in plan v1.3 row C.4-2 line 715',
    );
  });

  test('AC#11 — drag-ghost cursor follow', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: AC#11 deferred to C.4-2 — requires drag-active state machine; tracked in plan v1.3 row C.4-2 line 715',
    );
  });

  test('AC#12 — drop-pulse 720ms post-drop animation', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: AC#12 deferred to C.4-2 — requires drag-active state machine + drag-end-success dispatch wiring; tracked in plan v1.3 row C.4-2 line 715',
    );
  });
});
