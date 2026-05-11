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
  // Wave 6 cf-25 — count component-block drag-handles only (exclude
  // markdown wrapper-blocks added by the chunking pass; cf-25 adds
  // ~10-11 markdown drag-handles to the pre-cf-25 15 component-block (cf-25 D14 demo +1 image)
  // drag-handles, total fluctuates with fixture content). The cf-25
  // markdown count is asserted by sample-blocks-markdown-blocks.spec.ts.
  const handles = page.locator(
    '.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__drag-handle',
  );
  // The fixture has 15 component-block (cf-25 D14 demo +1 image) NodeViews (4 callout + 1 code + 3 image (cf-25 D14 demo +1) +
  // 2 math + 2 pdf + 1 jupyter + 1 nn-viz + 1 agent-flow). Each gets
  // one drag-handle button. Pre-drag the count is 14.
  await expect(handles).toHaveCount(15);

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
  // editor; the drag is cleanly aborted). cf-25 selector still
  // filters to the 15 component-block (cf-25 D14 demo +1 image) NodeViews.
  await expect(handles).toHaveCount(15);

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
    .locator('.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__drag-handle')
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

test('cf-20c-2 R1 F4 — terminal drop: dragstart → dragover edge → drop mutates ProseMirror node attrs + fires DropPulse (ADR-0017 D1 + D11)', () => {
  test.skip(
    true,
    'REMOVED-IN-WAVE-7-PHASE-2B: cf-20c-1 split-right algebra deleted; replaced by hole-fill placement that rejects cursor-on-occupied. New drag-mutation coverage lands in Phase 2C.',
  );
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
  // Wave 6 cf-25 — filter to component-block drag-handles only
  // (cf-25 chunked markdown blocks add ~10-11 more drag-handles
  // that aren't covered by the pre-cf-25 14-block expectation).
  const handles = page.locator(
    '.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__drag-handle',
  );
  // The handles are still rendered in the React tree (Tiptap NodeView
  // doesn't conditionally render based on viewport); the CSS hides
  // them. Count should still be 14 in DOM but each one's computed
  // display === 'none'.
  await expect(handles).toHaveCount(15);
  const firstDisplay = await handles.first().evaluate((el) => window.getComputedStyle(el).display);
  expect(firstDisplay).toBe('none');
});
