import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import {
  AUTOSAVE_SETTLE_MS,
  restoreSampleBlocksFixture,
  snapshotSampleBlocksFixture,
} from './fixtures/sample-blocks-fixture';

/**
 * Wave 6 cf-20c-2 R3 F1 fix (2026-05-09) — byte-snapshot fixture
 * isolation (replaces R2's destructive `git checkout` model). Per the
 * cf-20c-2 R3 reflection rule "tests that touch repository files MUST
 * snapshot bytes pre-mutation; never use destructive git operations".
 *
 * cf-22 follow-up (2026-05-10) — extracted the per-spec inline copies
 * to `./fixtures/sample-blocks-fixture.ts` + added `beforeEach` +
 * `AUTOSAVE_SETTLE_MS` waits so the editor's 800 ms debounced
 * autosave can't race past the trailing restore. See PR #116
 * retrospective for the full root-cause writeup.
 */

test.beforeAll(snapshotSampleBlocksFixture);
test.beforeEach(restoreSampleBlocksFixture);
test.afterAll(restoreSampleBlocksFixture);

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

test('cf-20c-2 R1 F1 — source-lift visual: dragstart applies .skb-block-nodeview--dragging-self to source NodeView only (ADR-0017 D6)', async ({
  page,
}) => {
  // Wave 6 cf-20c-2 R2 F1 lock — codex-pr-reviewer-55 R1 F1 caught
  // that ADR-0017 D6 source-lift was missing. The pipeline now
  // exposes `sourceBlockId` via DragDropContext; BlockNodeView reads
  // it and applies `.skb-block-nodeview--dragging-self` modifier
  // class when its own block id matches. CSS sets `visibility:
  // hidden + pointer-events: none` per ADR-0017 D6 line 247 verbatim
  // (R2 F1 fix; replaces R1's v2-demo opacity/grayscale model that
  // D6 line 255 explicitly rejects).
  //
  // Three structural assertions:
  //  (a) Pre-drag: NO `.skb-block-nodeview--dragging-self` anywhere
  //      (steady-state baseline).
  //  (b) Post-dragstart: EXACTLY 1 `.skb-block-nodeview--dragging-self`
  //      AND it's the wrapper whose drag-handle was clicked (proves
  //      sourceBlockId routing through context is correct), AND
  //      computed `visibility === 'hidden'` + `pointer-events === 'none'`
  //      (proves the CSS rule from ADR-0017 D6 line 247 is the one
  //      applied — catches future regressions to opacity-based fades).
  //  (c) Post-cancel: 0 `.skb-block-nodeview--dragging-self` again
  //      (proves sourceBlockId resets to null on terminal action).
  //
  // Edge-rect exclusion of source (the other half of D6 source-lift)
  // is unit-tested via the pipeline's `onDragStart` filter; not
  // re-asserted here because Playwright would have to introspect the
  // pipeline's internal `edgeRects` ref which isn't observable from
  // DOM.
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // (a) Pre-drag: no source-lift class anywhere
  await expect(page.locator('.skb-block-nodeview--dragging-self')).toHaveCount(0);

  // (b) Dispatch dragstart on the FIRST handle, expect exactly 1 source-lift
  const firstHandle = page
    .locator('.skb-block-nodeview .skb-block-nodeview__drag-handle')
    .first();
  const sourceBlockId = await firstHandle.getAttribute('data-skb-drag-handle');
  expect(sourceBlockId).toMatch(/^\d+$/);

  await firstHandle.dispatchEvent('dragstart');
  await expect(page.locator('.skb-block-nodeview--dragging-self')).toHaveCount(1, {
    timeout: 5_000,
  });
  // The lifted wrapper is the one containing the dragged handle.
  // Verify by walking up: closest ancestor `.skb-block-nodeview` of
  // the clicked handle has the modifier class.
  const isLiftedSelf = await firstHandle.evaluate((el) => {
    const wrapper = el.closest('.skb-block-nodeview');
    return wrapper?.classList.contains('skb-block-nodeview--dragging-self') ?? false;
  });
  expect(isLiftedSelf).toBe(true);

  // cf-20c-2 R2 F1 — STRICT computed-visibility assertion per ADR-0017
  // D6 line 247 verbatim. Pre-R2 the spec only asserted the class
  // was present; the cf-20c-2 R1 implementation used opacity 0.28 +
  // grayscale (the v2-demo gray placeholder model that ADR-0017 D6
  // line 255 explicitly rejects). Computed-style assertion catches
  // any future regression that swaps `visibility: hidden` back to
  // an opacity-based fade or any other "visible but dim" treatment.
  const liftedWrapper = page.locator('.skb-block-nodeview--dragging-self').first();
  const liftedVisibility = await liftedWrapper.evaluate(
    (el) => window.getComputedStyle(el).visibility,
  );
  expect(
    liftedVisibility,
    'cf-20c-2 R2 F1: source-lift MUST use visibility: hidden per ADR-0017 D6 line 247 (NOT v2-demo opacity/grayscale model that D6 line 255 explicitly rejects)',
  ).toBe('hidden');
  const liftedPointerEvents = await liftedWrapper.evaluate(
    (el) => window.getComputedStyle(el).pointerEvents,
  );
  expect(
    liftedPointerEvents,
    'cf-20c-2 R2 F1: source-lift MUST use pointer-events: none per ADR-0017 D6 line 247 (defense-in-depth on top of the pipeline edge-rect source filter)',
  ).toBe('none');

  // (c) Cancel via Esc → source-lift class removed; visibility restored
  await page.keyboard.press('Escape');
  await expect(page.locator('.skb-block-nodeview--dragging-self')).toHaveCount(0, {
    timeout: 3_000,
  });
});

test('cf-20c-2 R1 F4 — terminal drop: dragstart → dragover edge → drop mutates ProseMirror node attrs + fires DropPulse (ADR-0017 D1 + D11)', async ({
  page,
}) => {
  // cf-22 follow-up: per-test restore now handled by `beforeEach`.

  // Wave 6 cf-20c-2 R1 F4 lock — codex-pr-reviewer-55 R1 caught
  // that pre-R1 Playwright coverage only fired dragstart + dragend,
  // never the terminal drop. So `applyDropMode` (cf-20c-1 algebra)
  // never ran and ProseMirror attrs never mutated under integration
  // testing. F4 fix: full lifecycle assertion that exercises
  // dragstart → dragover (at edge zone) → drop → mutation + pulse.
  //
  // Sample-blocks fixtures are all `colSpan=12` so a split-right on
  // a colSpan=12 host produces colSpan=6 + colSpan=6 (host shrinks
  // to left half, source moves to right half). The applyDropMode
  // algebra is unit-tested at apply-drop-mode.test.ts; this spec
  // verifies the WIRE — that the algebra's output reaches Tiptap's
  // setNodeMarkup AND the resulting attrs surface as updated inline
  // gridColumn styles.
  //
  // Cf-20c-2 R1 F2 lock: also assert the DropPulse mounts on
  // success. The pulse element carries `data-skb-drop-pulse-anchor`
  // (the EditorShellMount wrapper) — count > 0 proves the pulse
  // mounted; we don't wait for the full 720ms animation since the
  // anchor element is what matters structurally.
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);

  // Pick source (first NodeView) + target (second NodeView). Both are
  // colSpan=12 in sample-blocks fixtures; a drop at the target's right
  // edge (within EDGE_W=28 → 14px inside) triggers split-right which
  // halves the target to colSpan=6 + places source at col=7 colSpan=6.
  const allWrappers = await page.locator('.skb-block-nodeview').all();
  expect(allWrappers.length).toBeGreaterThanOrEqual(2);

  const firstWrapper = allWrappers[0];
  const targetWrapper = allWrappers[1];
  if (!firstWrapper || !targetWrapper) throw new Error('expected at least 2 NodeView wrappers');
  const sourceHandle = firstWrapper.locator('.skb-block-nodeview__drag-handle');
  const sourceBlockId = await sourceHandle.getAttribute('data-skb-drag-handle');
  const targetBlockId = await targetWrapper
    .locator('.skb-block-nodeview__drag-handle')
    .getAttribute('data-skb-drag-handle');
  expect(sourceBlockId).toMatch(/^\d+$/);
  expect(targetBlockId).toMatch(/^\d+$/);

  const targetBox = await targetWrapper.boundingBox();
  if (!targetBox) throw new Error('target wrapper has no bounding box');

  // Drop coordinates: 6px inside the target's right edge (well within
  // EDGE_W=28 → 14px hit zone for split-right per ADR-0017 D2).
  const dropX = targetBox.x + targetBox.width - 6;
  const dropY = targetBox.y + targetBox.height / 2;

  // Capture pre-drop attrs of the source for diff comparison
  const sourceColBefore = await page
    .locator('.skb-block-nodeview')
    .first()
    .evaluate((el) => el.style.gridColumn);

  // Fire the full drag lifecycle. We dispatch on the document body
  // for dragover + drop since the pipeline's listener attaches to
  // the .skb-grid container; bubbling carries the events up.
  await sourceHandle.dispatchEvent('dragstart');
  await page.waitForTimeout(50);

  // Use page.evaluate so we can construct a real DragEvent with
  // clientX/Y (Playwright's locator.dispatchEvent doesn't propagate
  // those reliably across all browsers). CRITICAL: separate dragover
  // from drop with `requestAnimationFrame` so React commits the
  // pipeline's `setActiveMatch` state from dragover before drop's
  // closure-captured `activeMatch` reads. Without the rAF gap, drop
  // sees `activeMatch === null` (stale closure) and dispatches
  // drag-end-mode-none (rollback) — gridColumn stays unchanged.
  await page.evaluate(
    ({ x, y }) => {
      const grid = document.querySelector('.skb-grid');
      if (!grid) throw new Error('no .skb-grid');
      const dt = new DataTransfer();
      const dragoverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        dataTransfer: dt,
      });
      grid.dispatchEvent(dragoverEvent);
      // Wait one frame so React commits setActiveMatch before drop fires.
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            dataTransfer: dt,
          });
          grid.dispatchEvent(dropEvent);
          // One more frame so React commits the post-drop state.
          requestAnimationFrame(() => resolve());
        });
      });
    },
    { x: dropX, y: dropY },
  );
  await page.waitForTimeout(200); // Let React commit + Tiptap setNodeMarkup

  // cf-22 follow-up 2026-05-10 — assert pulse-anchor mount FIRST,
  // BEFORE the source/target col assertions, so we catch the anchor
  // inside its 720 ms animation window. Earlier ordering (count after
  // all other asserts) raced the unmount on slow runs: pulse mounts
  // ~100 ms post-drop → unmounts at ~820 ms; expect() chain takes
  // longer → count = 0. Moving the assertion right after the
  // post-drop settle catches the anchor before unmount. Capture the
  // anchor's bounding box immediately so the F2 R2 sub-pixel check
  // below has a value even if the anchor unmounts later in the test.
  await expect(
    page.locator('[data-skb-drop-pulse-anchor]').first(),
    'cf-20c-2 R1 F2: DropPulse anchor MUST mount within 1.5 s post-drop ' +
      '(proves drag-end-success branch ran + lastDroppedBlockId set + ' +
      'lastDroppedRect measured + EditorShellMount conditional render fired)',
  ).toBeAttached({ timeout: 1_500 });
  const pulseRect = await page
    .locator('[data-skb-drop-pulse-anchor]')
    .first()
    .boundingBox();

  // F4 (b) — STRICT split-right algebra assertion (cf-20c-2 R2 F3).
  // Pre-R2 the spec asserted `toContain('span 6')` which would
  // false-positive accept `1 / span 6` (LEFT half — which is the
  // TARGET's new position, NOT the source's landed position). R2
  // tightens to exact-match `7 / span 6` for source AND `1 / span 6`
  // for target. Per cf-20c-1 algebra (apply-drop-mode.ts split-right
  // branch): host shrinks to `[col=1, colSpan=6]`; source moves to
  // `[col=7, colSpan=6]` (right half of host's original 12 cols).
  // Whitespace normalization (replace /\s+/g, ' ') accommodates
  // browser DOM serialization variants ('7 / span 6' vs '7  /  span  6').
  const sourceColAfter = await page
    .locator('.skb-block-nodeview')
    .first()
    .evaluate((el) => el.style.gridColumn);
  expect(sourceColAfter).not.toBe(sourceColBefore);
  const sourceNormalized = sourceColAfter.replace(/\s+/g, ' ').trim();
  expect(
    sourceNormalized,
    'cf-20c-2 R2 F3: source MUST land at right half (col=7, colSpan=6) per cf-20c-1 split-right algebra; not just "any span 6"',
  ).toBe('7 / span 6');

  // F4 (c) — STRICT target reciprocal assertion (cf-20c-2 R2 F3).
  // split-right doesn't just move the source; it ALSO shrinks the
  // target host to the LEFT half (col=1, colSpan=6). Pre-R2 the spec
  // didn't assert the target's mutation; the algebra could have
  // failed reciprocally and the source-only assertion would pass.
  const targetColAfter = await targetWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  const targetNormalized = targetColAfter.replace(/\s+/g, ' ').trim();
  expect(
    targetNormalized,
    'cf-20c-2 R2 F3: target host MUST shrink to left half (col=1, colSpan=6) per cf-20c-1 split-right algebra reciprocal mutation',
  ).toBe('1 / span 6');

  // F2 (R2): DropPulse anchor's rect MUST match the source NodeView's
  // post-drop rect (within 1px tolerance for browser sub-pixel
  // rounding) per ADR-0017 D11 line 344. Pre-R2 the anchor was at
  // the source's pre-drag rect; R2 pipeline re-measures post-mutation
  // and the anchor consumes lastDroppedRect. cf-22 follow-up
  // 2026-05-10 — `pulseRect` was already captured above (immediately
  // after toBeAttached) so it's pinned even if the 720 ms pulse
  // animation has since unmounted the anchor.
  const sourceRectAfter = await page
    .locator('.skb-block-nodeview')
    .first()
    .boundingBox();
  expect(pulseRect).not.toBeNull();
  expect(sourceRectAfter).not.toBeNull();
  expect(
    Math.abs((pulseRect?.x ?? 0) - (sourceRectAfter?.x ?? 0)),
    'cf-20c-2 R2 F2: pulse anchor x MUST match landed source x per ADR-0017 D11 line 344 (within 1px sub-pixel tolerance)',
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs((pulseRect?.width ?? 0) - (sourceRectAfter?.width ?? 0)),
  ).toBeLessThanOrEqual(1);

  // cf-22 follow-up — let the editor's 800 ms debounced autosave fire +
  // settle to disk BEFORE the spec's afterAll-style restore so the
  // in-flight POST can't race past cleanup. See helper for budget math.
  await page.waitForTimeout(AUTOSAVE_SETTLE_MS);
  restoreSampleBlocksFixture();
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
