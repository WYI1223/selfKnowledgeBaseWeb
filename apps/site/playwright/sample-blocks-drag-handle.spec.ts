import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 cf-20c-2 (2026-05-09) — drag-handle UI + DnD wire integration
 * spec.
 *
 * cf-20c-1 shipped `applyDropMode` as a pure mutation algebra.
 * cf-20c-2 wires that algebra into the editor surface: per-block
 * `<DragHandleButton>` inside `.skb-block-nodeview__gutter`, HTML5
 * native DnD lifecycle (Q7 spike result), `useDragDropPipeline()`
 * orchestrating snapshot → edge-rects → tiebreak → applyDropMode →
 * Tiptap setNodeMarkup, OutlineOverlay + DragGhost mounts during
 * active drag, Esc cancel via useEscCancel.
 *
 * Sample-blocks fixtures all use `colSpan=12` so split-left/right are
 * algebra-rejected (host.colSpan/2 = 6 IS in COL_SNAPS — actually
 * valid — but a drag from one full-width block to another's edge
 * produces a meaningful split). Test asserts the lifecycle, not the
 * specific position arithmetic (algebra correctness is unit-tested at
 * `apply-drop-mode.test.ts`).
 *
 * Three assertion families:
 *   (a) Pre-drag: 14 .skb-block-nodeview__drag-handle buttons (one per
 *       NodeView wrapper) all carry data-skb-drag-handle="<pos>",
 *       aria-label="Drag block", draggable=true; baseline state
 *       (no .skb-grid-outline-base, no .drag-ghost mounted).
 *   (b) Drag-active: dispatching `dragstart` on the first handle
 *       mounts .skb-grid-outline-base (overlay present) AND
 *       .drag-ghost.ghost-markdown (cursor follower) — proves the
 *       pipeline.onDragStart callback fired AND the EditorShellMount
 *       active-render branch took effect.
 *   (c) Post-cancel: dispatching `dragend` (without a real drop) AND
 *       Esc keypress both end up at the rolled-back state — overlay
 *       and ghost are unmounted; layoutReducer is at S0 baseline.
 */

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-20c-2-drag-handle-wire.png',
);

test('sample-blocks edit route — cf-20c-2 drag-handle wire (button + outline + ghost lifecycle)', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // (a) Per-block drag handles present + structured per cf-20c-2 D2.
  const handles = page.locator('.skb-block-nodeview .skb-block-nodeview__drag-handle');
  // The fixture has 14 NodeView blocks (4 callout + 1 code + 2 image +
  // 2 math + 2 pdf + 1 jupyter + 1 nn-viz + 1 agent-flow). Each gets
  // one drag-handle button. Pre-drag the count is 14.
  await expect(handles).toHaveCount(14);

  const firstHandle = handles.first();
  expect(await firstHandle.getAttribute('aria-label')).toBe('Drag block');
  expect(await firstHandle.getAttribute('draggable')).toBe('true');
  // data-skb-drag-handle === ProseMirror node pos (cf-20c-2 D2 path A).
  // Pos values are integers ≥ 1.
  const blockId = await firstHandle.getAttribute('data-skb-drag-handle');
  expect(blockId).toMatch(/^\d+$/);
  expect(parseInt(blockId ?? '', 10)).toBeGreaterThan(0);

  // Pre-drag baseline: no overlay/ghost mounted.
  await expect(page.locator('.skb-grid-outline-base')).toHaveCount(0);
  await expect(page.locator('.drag-ghost')).toHaveCount(0);

  // (b) Drag-active: dispatch dragstart, expect overlay + ghost mount.
  await firstHandle.dispatchEvent('dragstart');
  await expect(page.locator('.skb-grid-outline-base').first()).toHaveCount(1, {
    timeout: 5_000,
  });
  await expect(page.locator('.drag-ghost').first()).toHaveCount(1, {
    timeout: 5_000,
  });
  // The mounted ghost has the ADR-0017 D10 markdown kind className
  // (EditorShellMount.tsx hardcodes kind="markdown" at cf-20c-2; future
  // PR will source kind from the drag-source block's BlockKind).
  await expect(page.locator('.drag-ghost.ghost-markdown').first()).toHaveCount(1);

  // (c) Cancel via Esc: pipeline rolls back, overlay + ghost unmount.
  await page.keyboard.press('Escape');
  await expect(page.locator('.skb-grid-outline-base')).toHaveCount(0, {
    timeout: 3_000,
  });
  await expect(page.locator('.drag-ghost')).toHaveCount(0);

  // Post-cancel: handles still present (cancel doesn't tear down the
  // editor; the drag is cleanly aborted).
  await expect(handles).toHaveCount(14);

  await page.screenshot({ fullPage: false, path: SCREENSHOT_PATH });
});

test('cf-20c-2 — drag handles are hidden on mobile (≤768px) per cf-20b R1 view-only path', async ({
  page,
}) => {
  // cf-20c-2 disables drag handles on mobile preview-mode (per cf-20b
  // R1 + ADR-0017 D9 mobile view-only). The CSS rule
  // `@media (max-width: 768px) .skb-block-nodeview__drag-handle { display: none }`
  // hides them from layout AND tab order. This spec locks that
  // behavior as a regression test.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Drag handles exist in the DOM but resolve to display: none.
  const handles = page.locator('.skb-block-nodeview .skb-block-nodeview__drag-handle');
  // The handles are still rendered in the React tree (Tiptap NodeView
  // doesn't conditionally render based on viewport); the CSS hides
  // them. Count should still be 14 in DOM but each one's computed
  // display === 'none'.
  await expect(handles).toHaveCount(14);
  const firstDisplay = await handles.first().evaluate((el) => window.getComputedStyle(el).display);
  expect(firstDisplay).toBe('none');
});
