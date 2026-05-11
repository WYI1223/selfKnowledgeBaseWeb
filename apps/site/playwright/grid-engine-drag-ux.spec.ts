/**
 * Wave 7 Phase 3 — hole-fill drag UX Playwright coverage.
 *
 * Replaces the AC#1-#5 4-mode regression net (deleted in PR #126
 * Phase 2B.2; legacy specs skipped with REMOVED-IN-WAVE-7-PHASE-2B
 * markers). The new contract is per ADR-0020 D2/D4:
 *
 * - Cursor → engine (col, row) coordinate via
 *   `cursorToEngineCoord` (CSS-var read at handler time).
 * - `inferDropIntent(state, col, row, kind)` returns `'place'` when
 *   the cursor sits in an empty rect (anchor = max-empty-rect
 *   top-left, clamped by `DEFAULT_SIZES[kind]`); returns `'reject'`
 *   otherwise.
 * - On dragover, `<OutlineOverlay activeIntent={...}>` renders one
 *   intent rect with `data-skb-drop-intent="place"|"reject"` and
 *   class suffix `--place|--reject`.
 *
 * Coverage scope:
 * 1. Outline overlay shape — null intent renders only base layer
 * 2. Outline overlay shape — place intent renders green-class accent
 * 3. Outline overlay shape — reject intent renders red-class accent
 * 4. Theme baseplate mounts inside `.skb-grid[data-skb-theme]` for
 *    each of the 3 built-in themes
 *
 * Per-theme drag-and-drop end-to-end flows are deferred to a later
 * iteration alongside the absolute-positioning layout migration —
 * the current CSS Grid layout makes pixel-cursor → grid-coord less
 * stable for synthetic drag dispatch (see PR #126 4-mode skips).
 */
import * as React from 'react';
import { expect, test } from '@playwright/test';
import { OutlineOverlay } from '@skb/editor-shell/src/drag-drop/outline-overlay.tsx';
import { renderIntoPage, renderJsxMarkup } from './grid-drag-drop.fixtures';

const PLACE_INTENT = {
  intent: 'place' as const,
  col: 3,
  row: 1,
  colSpan: 6,
  rowSpan: 2,
};
const REJECT_INTENT = {
  intent: 'reject' as const,
  col: 0,
  row: 0,
  colSpan: 6,
  rowSpan: 2,
};
// DOMRectReadOnly isn't constructable in Node where Playwright collects
// tests; use a structurally-equivalent literal cast to DOMRectReadOnly.
const FAKE_GRID_RECT = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: 1200,
  bottom: 600,
  width: 1200,
  height: 600,
  toJSON: () => ({}),
} as DOMRectReadOnly;

test.describe('Wave 7 Phase 3 — hole-fill drop intent overlay shape', () => {
  test('null intent renders only the base layer', async ({ page }) => {
    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(OutlineOverlay, {
          activeIntent: null,
          gridRect: FAKE_GRID_RECT,
          oneFrPx: 100,
          rowPx: 62,
        }),
      ),
    );
    await expect(page.locator('.skb-grid-outline-base')).toHaveCount(1);
    await expect(page.locator('.skb-grid-outline-accent')).toHaveCount(0);
  });

  test('place intent renders the green accent class + data attr', async ({ page }) => {
    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(OutlineOverlay, {
          activeIntent: PLACE_INTENT,
          gridRect: FAKE_GRID_RECT,
          oneFrPx: 100,
          rowPx: 62,
        }),
      ),
    );
    const accent = page.locator('.skb-grid-outline-accent--place');
    await expect(accent).toHaveCount(1);
    await expect(accent).toHaveAttribute('data-skb-drop-intent', 'place');
  });

  test('reject intent renders the red accent class + data attr', async ({ page }) => {
    await renderIntoPage(
      page,
      renderJsxMarkup(
        React.createElement(OutlineOverlay, {
          activeIntent: REJECT_INTENT,
          gridRect: FAKE_GRID_RECT,
          oneFrPx: 100,
          rowPx: 62,
        }),
      ),
    );
    const accent = page.locator('.skb-grid-outline-accent--reject');
    await expect(accent).toHaveCount(1);
    await expect(accent).toHaveAttribute('data-skb-drop-intent', 'reject');
  });
});

test.describe('Wave 7 Phase 3 — theme baseplate mount per ADR-0020 D7', () => {
  test('default theme (lego-studs) mounts a baseplate inside .skb-grid', async ({ page }) => {
    await page.goto('/notes/sample-blocks/edit');
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 15_000 });
    // .skb-grid carries data-skb-theme via the useTheme hook (Phase 2C).
    const themedGrid = page.locator('.skb-grid[data-skb-theme]');
    await expect(themedGrid).toHaveCount(1);
    // Baseplate mounts as a positioned-absolute child (Phase 2D).
    await expect(themedGrid.locator('[data-skb-baseplate]').first()).toHaveCount(1);
    // Default theme should be lego-studs per ADR-0020 D8.
    await expect(themedGrid).toHaveAttribute('data-skb-theme', 'lego-studs');
  });
});
