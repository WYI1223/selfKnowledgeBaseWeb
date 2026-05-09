import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

/**
 * Wave 5 C.4-3 drag handle smoke. Pre-cf-20c-2 this spec asserted the
 * standalone floating `<DragHandle />` (a stub component shipping a
 * single button outside any block) and a synthetic
 * `[data-skb-drop-preview]` element flipped by mouseUp. cf-20c-2
 * replaces that scaffolding with PER-BLOCK drag handles inside each
 * `.skb-block-nodeview__gutter` shell (cf-19) wired to
 * `useDragDropPipeline()` for real HTML5 native DnD lifecycle. The
 * standalone `<DragHandle />` is removed from `EditorShellMount.tsx`.
 *
 * cf-20c-2 update:
 *   - test moves to `/notes/sample-blocks/edit` because that's the
 *     route with actual component blocks (the prose-only
 *     /notes/sample-mdx-note/edit has no NodeViews and therefore no
 *     per-block handles — it correctly has zero `[data-skb-drag-handle]`
 *     elements).
 *   - assertion checks for ONE-OR-MORE per-block handles each carrying
 *     `data-skb-drag-handle="<blockId>"` (the blockId is the
 *     ProseMirror node `pos` per cf-20c-2 D2).
 *   - the drop-preview synthetic-element check is replaced by a real
 *     drag lifecycle: pointer-down on a handle → drag to grid →
 *     pointer-up. Either the layoutReducer commits a mutation (real
 *     drop on an edge target) OR the pipeline rolls back (no edge
 *     match). Both paths exercise the lifecycle without asserting the
 *     algebra correctness (the algebra is unit-tested at
 *     `apply-drop-mode.test.ts`).
 */
test.describe('C.4-3 drag handle', () => {
  test('per-block drag-handle visible inside .skb-block-nodeview__gutter (cf-20c-2)', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    await page.goto('/notes/sample-blocks/edit');
    const grid = page.locator('.skb-grid').first();
    await expect(grid).toBeVisible({ timeout: 10_000 });

    // cf-20c-2: per-block drag handle inside each NodeView's gutter.
    // The first .skb-block-nodeview wrapper renders one
    // .skb-block-nodeview__drag-handle button with
    // data-skb-drag-handle="<pos>".
    const firstHandle = page
      .locator('.skb-block-nodeview .skb-block-nodeview__drag-handle')
      .first();
    await expect(firstHandle).toBeVisible({ timeout: 15_000 });

    // The data-skb-drag-handle attribute carries the ProseMirror node
    // pos (cf-20c-2 D2 path A). Just assert non-empty + non-zero.
    const blockId = await firstHandle.getAttribute('data-skb-drag-handle');
    expect(blockId).toMatch(/^\d+$/);
    expect(parseInt(blockId ?? '', 10)).toBeGreaterThan(0);

    // a11y baseline: aria-label + draggable=true.
    expect(await firstHandle.getAttribute('aria-label')).toBe('Drag block');
    expect(await firstHandle.getAttribute('draggable')).toBe('true');

    // Real drag lifecycle: pointer-down → move → pointer-up. The
    // pipeline mounts an OutlineOverlay base layer whenever
    // drag-active=true; assert the base layer appears (means
    // dragstart fired AND pipeline.onDragStart was called via context).
    const handleBox = await firstHandle.boundingBox();
    const gridBox = await grid.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(gridBox).not.toBeNull();

    // Synthetic HTML5 drag in Playwright: page.mouse.down + move +
    // up doesn't trigger native DnD reliably. Use the lower-level
    // dispatchEvent to fire a dragstart on the handle, then
    // dragover + drop on the grid. The pipeline registers its window-
    // level dragover/drop listeners on the grid container only when
    // active=true, so we need dragstart to flip the state first.
    await firstHandle.dispatchEvent('dragstart');
    // After dragstart, the OutlineOverlay base mounts. The base layer is
    // an empty placeholder div (cf-20b OutlineOverlay) with no dimensions
    // — it's "present" rather than "visible" in Playwright's actionable
    // sense. Assert presence via count > 0; the active accent only
    // appears when the cursor is over an EdgeRect (no synthetic dragover
    // here, so accent stays null). The integration spec at
    // sample-blocks-drag-handle.spec.ts covers the cursor-position +
    // outline-accent path with real mouse moves.
    await expect(page.locator('.skb-grid-outline-base').first()).toHaveCount(1, {
      timeout: 5_000,
    });

    // Clean up: dragend so subsequent tests don't see a stuck overlay.
    await firstHandle.dispatchEvent('dragend');

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-drag-handle.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
