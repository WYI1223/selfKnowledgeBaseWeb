import * as React from 'react';
import { expect, test } from '@playwright/test';
import { ColRuler } from '@skb/editor-shell/src/resize/col-ruler.tsx';
import { renderIntoPage, renderJsxMarkup } from './grid-drag-drop.fixtures';

/**
 * Wave 7 Phase 2B.2 (ADR-0020 D2): the 4-mode drop classification
 * (split-left / split-right / split-top / split-bottom + EDGE_W zones)
 * has been replaced by cursor → grid-coord + grid-engine
 * `inferDropIntent` hole-fill placement. AC#1-#6 below tested the
 * 4-mode classification's hit-test geometry, tiebreak, edge rects,
 * outline accent class set, and synthetic perf budget; all are
 * skipped with REMOVED-IN-WAVE-7-PHASE-2B markers. AC#10 (ColRuler)
 * survives unchanged. New intent-based drag coverage will land
 * alongside Phase 2C (toolbar wire) + Wave 8 user-facing exercises.
 */

test.describe('AC#1-#5 hit-test geometry (REMOVED in Wave 7 Phase 2B.2)', () => {
  test('AC#1 — 4 mode classification at edge positions', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: 4-mode classification deleted; replaced by cursor → grid-coord + inferDropIntent. New coverage will live in Phase 2C intent-preview specs.',
    );
  });

  test('AC#2 — EDGE_W boundary half-in/half-out', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: EDGE_W edge zones no longer exist (cursor maps directly to a grid cell).',
    );
  });

  test('AC#3 — tiebreak distance + velocity + spatial + blockId', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: tiebreak arbitration deleted; cursor → (col, row) is a single answer.',
    );
  });

  test('AC#4 — static layer invariant during drag-over simulation', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: dependent on the deleted classifyCursor helper.',
    );
  });

  test('AC#5 — outline overlay class inventory by mode', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: OutlineOverlay no longer emits per-mode accent classes — new shape uses --place / --reject intent variants. Coverage lives in editor-shell vitest `__tests__/drag-drop/outline-overlay.test.tsx`.',
    );
  });
});

test.describe('AC#6, #8, #10 helper integration', () => {
  test('AC#6 — hit-test perf budget for 30 synthetic blocks', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: findMatches/computeEdgeRects deleted with the 4-mode pipeline; cursor → grid-coord is O(1) by construction.',
    );
  });

  test('AC#8 — REMOVED in Wave 7 Phase 2A (useAutoRowSpan deleted; rowSpan is integer per ADR-0020 D1)', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2A: useAutoRowSpan + measure-based rowSpan auto-grow deleted; markdown content overflow now scrolls inside the block.',
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
      'DEFERRED-TO-C.4-2: AC#7 deferred — requires editor-shell drag-active state machine integration in apps/site/EditorShellMount.tsx.',
    );
  });

  test('AC#9 — 全局 Esc cancel during drag', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: AC#9 deferred — requires drag-active state machine.',
    );
  });

  test('AC#11 — drag-ghost cursor follow', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: AC#11 deferred — requires drag-active state machine.',
    );
  });

  test('AC#12 — drop-pulse 720ms post-drop animation', () => {
    test.skip(
      true,
      'DEFERRED-TO-C.4-2: AC#12 deferred — requires drag-active state machine + drag-end-success dispatch wiring.',
    );
  });
});
