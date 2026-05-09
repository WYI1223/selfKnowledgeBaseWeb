import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { dispatchResizeGesture } from './helpers/resize-pointer-events';

/**
 * Wave 6 cf-20d (2026-05-09) — resize-handles UI + commit wire integration spec.
 *
 * cf-20d wires the v2 resize affordance per ADR-0017 D9: 3 handles
 * (right / bottom / corner) per `.skb-block-nodeview` + ColRuler /
 * SizeTooltip / RowLadder overlays + commit-on-release semantics.
 *
 * Byte-snapshot fixture isolation per cf-20c-2 R3 F1 reflection rule:
 * "tests that touch repository files MUST snapshot bytes pre-mutation;
 * never use destructive git operations". The right-edge resize commit
 * test triggers a Tiptap setNodeMarkup → tiptapToMdx → ApiAdapter.save
 * chain that writes to disk; we snapshot before + restore after. Same
 * pattern as cf-20c-2 sample-blocks-drag-handle.spec.ts.
 */
const SAMPLE_BLOCKS_MDX = resolve(
  process.cwd(),
  '../../content/notes/sample-blocks/index.mdx',
);
const SAMPLE_BLOCKS_STATE = resolve(
  process.cwd(),
  '../../content/notes/sample-blocks/state.json',
);

let originalMdxBytes: string | null = null;
let originalStateBytes: string | null = null;

test.beforeAll(() => {
  originalMdxBytes = readFileSync(SAMPLE_BLOCKS_MDX, 'utf8');
  originalStateBytes = existsSync(SAMPLE_BLOCKS_STATE)
    ? readFileSync(SAMPLE_BLOCKS_STATE, 'utf8')
    : null;
});

function restoreSampleBlocksFixture(): void {
  if (originalMdxBytes !== null) {
    writeFileSync(SAMPLE_BLOCKS_MDX, originalMdxBytes, 'utf8');
  }
  if (originalStateBytes !== null) {
    writeFileSync(SAMPLE_BLOCKS_STATE, originalStateBytes, 'utf8');
  } else if (existsSync(SAMPLE_BLOCKS_STATE)) {
    unlinkSync(SAMPLE_BLOCKS_STATE);
  }
}

test.afterAll(() => {
  restoreSampleBlocksFixture();
});

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-20d-resize-handles.png',
);

test('sample-blocks edit route — cf-20d resize-handles wire (handle visibility + right-edge commit + drop-pulse reuse)', async ({
  page,
}) => {
  // cf-20c-2 R2 fixture isolation pattern: restore baseline MDX +
  // clear state sidecar BEFORE the test runs (the resize-commit
  // mutation will otherwise persist via ApiAdapter.save → file write).
  restoreSampleBlocksFixture();

  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // (a) Handle visibility — each NodeView wrapper renders 3 handles
  // (right + bottom + corner). 14 sample-blocks fixtures all non-prose
  // → 14 right + 14 bottom + 14 corner.
  const rightHandles = page.locator('.skb-block-nodeview .gblock-handle.right');
  const bottomHandles = page.locator(
    '.skb-block-nodeview .gblock-handle.bottom',
  );
  const cornerHandles = page.locator(
    '.skb-block-nodeview .gblock-handle.corner',
  );
  await expect(rightHandles).toHaveCount(14);
  await expect(bottomHandles).toHaveCount(14);
  await expect(cornerHandles).toHaveCount(14);

  // First right handle has the expected ADR-0017 D9 + cf-20d data
  // attributes + ew-resize cursor per v2-styles.css:271.
  const firstRight = rightHandles.first();
  expect(await firstRight.getAttribute('data-skb-resize-axis')).toBe('right');
  const blockId = await firstRight.getAttribute('data-skb-resize-block-id');
  expect(blockId).toMatch(/^\d+$/);
  const cursorComputed = await firstRight.evaluate(
    (el) => window.getComputedStyle(el).cursor,
  );
  expect(cursorComputed).toBe('ew-resize');

  // Pre-resize baseline: no resize state in DOM.
  await expect(page.locator('.skb-block-nodeview--resizing')).toHaveCount(0);
  await expect(page.locator('[data-skb-resize-col-ruler-anchor]')).toHaveCount(
    0,
  );
  await expect(page.locator('[data-skb-row-ladder]')).toHaveCount(0);

  await page.screenshot({ fullPage: false, path: SCREENSHOT_PATH });
});

test('cf-20d — right-edge resize commit mutates colSpan + reuses cf-20c-2 dropEpoch infrastructure (ADR-0017 D9 + D11)', async ({
  page,
}) => {
  restoreSampleBlocksFixture();

  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);

  // Capture pre-resize gridColumn (sample-blocks fixtures are all
  // colSpan=12 → '1 / span 12').
  const firstWrapper = page.locator('.skb-block-nodeview').first();
  const colBefore = await firstWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  expect(colBefore.replace(/\s+/g, ' ').trim()).toBe('1 / span 12');

  const wrapperBox = await firstWrapper.boundingBox();
  if (!wrapperBox) throw new Error('first wrapper has no bounding box');

  // Resolve handle's actual bounding box (it's at `right: -7px` from
  // the wrapper, so its viewport position straddles the wrapper's
  // right edge).
  const rightHandle = firstWrapper.locator('.gblock-handle.right').first();
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error('right handle has no bounding box');

  const downX = handleBox.x + handleBox.width / 2;
  const downY = handleBox.y + handleBox.height / 2;

  // Target X: shrink to ~half the wrapper width. The actual snap is
  // ADR-0016 D6 round-to-nearest in COL_SNAPS — we assert "smaller
  // than 12 + ∈ valid set" rather than an exact value.
  const targetX = wrapperBox.x + wrapperBox.width / 2;
  const targetY = downY;

  // Full pointer lifecycle via shared helper (handle pointerdown +
  // window pointermove + pointerup with rAF barriers + 2-rAF re-
  // measure + 300ms settle). Per cf-20c-2 R1 reflection rule rAF
  // barriers separate React-state-driven event chains.
  await dispatchResizeGesture(
    page,
    rightHandle,
    downX,
    downY,
    targetX,
    targetY,
  );

  // (a) ColSpan mutated — wrapper's gridColumn no longer '1 / span 12'.
  const colAfter = await firstWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  expect(colAfter).not.toBe(colBefore);
  // The exact snap depends on container width; assert "snapped to a
  // valid COL_SNAP < 12 starting at col=1" per ADR-0016 D6.
  const colNormalized = colAfter.replace(/\s+/g, ' ').trim();
  expect(
    colNormalized,
    'cf-20d D1: right-edge resize commit MUST snap colSpan to one of [2, 3, 4, 6, 8] (smaller than starting 12) per ADR-0016 D6 round-to-nearest-snap',
  ).toMatch(/^1 \/ span (2|3|4|6|8)$/);

  // (b) DropPulse anchor mounted via cf-20c-2 dropEpoch reuse (cf-20d
  // D3 — onCommitSuccess routes through setLastDroppedFromExternal).
  await page.waitForTimeout(50);
  const pulseAnchorCount = await page
    .locator('[data-skb-drop-pulse-anchor]')
    .count();
  expect(
    pulseAnchorCount,
    'cf-20d D3: resize commit MUST mount [data-skb-drop-pulse-anchor] via the SAME cf-20c-2 dropEpoch infrastructure (consumer-side onCommitSuccess → pipeline.setLastDroppedFromExternal)',
  ).toBeGreaterThanOrEqual(1);

  // (c) Post-commit: no .skb-block-nodeview--resizing remains.
  await expect(page.locator('.skb-block-nodeview--resizing')).toHaveCount(0);

  // Restore fixture — the test's mutation persisted to disk via
  // ApiAdapter.save → file write; restore so other specs see the
  // pristine baseline.
  restoreSampleBlocksFixture();
});

test('cf-20d — resize handles hidden on mobile (≤768px) per ADR-0017 D9 view-only contract', async ({
  page,
}) => {
  // cf-20d disables resize affordances on mobile preview-mode per
  // ADR-0017 D9 view-only contract. The CSS rule
  // `@media (max-width: 768px) { .gblock-handle, .skb-col-ruler,
  // .skb-row-ladder, .skb-size-tooltip { display: none } }`
  // hides them from layout AND prevents pointerdown interaction.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Right handles still exist in the React tree (NodeView doesn't
  // conditionally render based on viewport); the CSS hides them.
  const rightHandles = page.locator('.skb-block-nodeview .gblock-handle.right');
  await expect(rightHandles).toHaveCount(14);
  const firstDisplay = await rightHandles.first().evaluate(
    (el) => window.getComputedStyle(el).display,
  );
  expect(firstDisplay).toBe('none');

  // Bottom + corner handles also hidden.
  const bottomHandles = page.locator('.skb-block-nodeview .gblock-handle.bottom');
  const cornerHandles = page.locator('.skb-block-nodeview .gblock-handle.corner');
  await expect(bottomHandles).toHaveCount(14);
  await expect(cornerHandles).toHaveCount(14);
  expect(
    await bottomHandles.first().evaluate(
      (el) => window.getComputedStyle(el).display,
    ),
  ).toBe('none');
  expect(
    await cornerHandles.first().evaluate(
      (el) => window.getComputedStyle(el).display,
    ),
  ).toBe('none');
});

test('cf-20d R1 F1 — tablet (≤1024px, 6-col) right-edge resize uses [2, 3, 6] snaps NOT [2, 3, 4, 6, 8, 12]', async ({
  page,
}) => {
  // R1 F1 fix lock (2026-05-09): EditorShellMount.tsx now derives
  // `viewportCols` via `useResponsiveCols`; the resize pipeline
  // consumes `effectiveColSnaps(viewportCols)` instead of the
  // pre-R1 hardcoded `effectiveColSnaps(12)`. Tablet viewport
  // (768 < width ≤ 1024) → 6-col grid → snaps `[2, 3, 6]` per
  // ADR-0016 D6 + D5.
  //
  // Approach: at viewport=900px (tablet range), perform a right-
  // edge resize from colSpan=12 with a generous-leftward delta
  // (~600px). The pre-R1 12-col snap set would have allowed
  // colSpan=8 or 4 as snap targets; the R1 6-col snap set forces
  // landing at one of [2, 3, 6]. Assert the post-commit gridColumn
  // matches `1 / span (2|3|6)`.
  restoreSampleBlocksFixture();

  await page.setViewportSize({ width: 900, height: 1024 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);

  // Verify 6-col grid is active (.skb-grid emits its --total-cols=6
  // CSS var via the @media (max-width: 1024px) rule in grid.css).
  const gridTotalCols = await page
    .locator('.skb-grid')
    .first()
    .evaluate(
      (el) =>
        getComputedStyle(el).getPropertyValue('--total-cols').trim(),
    );
  expect(gridTotalCols).toBe('6');

  const firstWrapper = page.locator('.skb-block-nodeview').first();
  const wrapperBox = await firstWrapper.boundingBox();
  if (!wrapperBox) throw new Error('first wrapper has no bounding box');
  const rightHandle = firstWrapper.locator('.gblock-handle.right').first();
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error('right handle has no bounding box');

  const downX = handleBox.x + handleBox.width / 2;
  const downY = handleBox.y + handleBox.height / 2;
  // Drag well leftward — past several "would-be 12-col snap stops"
  // — so the snap MUST land at a fitting member of [2, 3, 6] in
  // the 6-col viewport.
  const targetX = wrapperBox.x + wrapperBox.width * 0.4;
  const targetY = downY;

  await dispatchResizeGesture(
    page,
    rightHandle,
    downX,
    downY,
    targetX,
    targetY,
  );

  const colAfter = await firstWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  const colNormalized = colAfter.replace(/\s+/g, ' ').trim();
  expect(
    colNormalized,
    'cf-20d R1 F1: tablet (6-col) right-edge resize MUST snap colSpan to one of [2, 3, 6] per ADR-0016 D6 effectiveColSnaps(6); pre-R1 hardcoded 12-col snaps would have allowed 4 or 8 here',
  ).toMatch(/^1 \/ span (2|3|6)$/);

  restoreSampleBlocksFixture();
});

/**
 * R2 F2 fix lock (2026-05-09) — UNCONDITIONAL persisted-overflow
 * defense. Pre-R2 the overflow check ran ONLY when colChanged was
 * true (col-mutating axes), so a bottom-only resize on a block with
 * already-invalid persisted col/colSpan (e.g. saved at desktop with
 * col=4 colSpan=6 then reloaded at tablet 6-col) preserved the
 * invalid attrs through the spread merge. R2 fix: pipeline detects
 * `startCol + startColSpan - 1 > totalCols` UNCONDITIONALLY before
 * setNodeMarkup; if true, normalizes colSpan to `max(1, totalCols -
 * startCol + 1)` and includes it in THIS commit's transaction
 * (single atomic write — recovery, not corruption).
 *
 * Test mechanics: install a fixture MDX whose first Callout has
 * persisted-overflow grid attrs (col=4 colSpan=6 → at tablet
 * viewport=900 → 4+6-1=9 > 6 INVALID). Load at tablet, perform a
 * BOTTOM-only resize (NOT a col-mutating axis), observe BOTH the
 * intended rowSpan AND the normalized colSpan land in the
 * gridColumn inline style.
 */
function installPersistedOverflowFixture(): void {
  if (originalMdxBytes === null) throw new Error('originalMdxBytes not snapshotted');
  // Replace the FIRST Callout's grid attrs with persisted-overflow
  // (col=4, colSpan=6). At tablet viewport (totalCols=6) this is
  // invalid: 4 + 6 - 1 = 9 > 6.
  const overflowMdx = originalMdxBytes.replace(
    /<Callout col=\{1\} colSpan=\{12\} rowSpan=\{1\} variant="note" title="Sampler scope">/,
    '<Callout col={4} colSpan={6} rowSpan={1} variant="note" title="Sampler scope">',
  );
  if (overflowMdx === originalMdxBytes) {
    throw new Error('installPersistedOverflowFixture: replacement pattern not found in fixture');
  }
  writeFileSync(SAMPLE_BLOCKS_MDX, overflowMdx, 'utf8');
  // Clear sidecar so ApiAdapter loads from MDX (not stale state.json).
  if (existsSync(SAMPLE_BLOCKS_STATE)) {
    unlinkSync(SAMPLE_BLOCKS_STATE);
  }
}

test('cf-20d R2 F2 — bottom-only resize on persisted-overflow block normalizes colSpan in same setNodeMarkup transaction', async ({
  page,
}) => {
  // R2 F2 lock: this test is the regression for the reviewer's
  // identified race scenario — block saved at desktop with valid
  // attrs becomes invalid at tablet/mobile viewport; a bottom-only
  // resize at the smaller viewport must normalize the colSpan
  // (NOT preserve the invalid attrs through the spread).
  installPersistedOverflowFixture();

  await page.setViewportSize({ width: 900, height: 1024 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);

  // Verify 6-col tablet grid (R2 F1 lock).
  const gridTotalCols = await page
    .locator('.skb-grid')
    .first()
    .evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--total-cols').trim(),
    );
  expect(gridTotalCols).toBe('6');

  // Pre-resize: block has persisted-overflow attrs. The grid
  // placement is `4 / span 6` (overflow), but CSS may visually
  // clip; we just assert the inline style reflects the persisted
  // (invalid) state at load time.
  const firstWrapper = page.locator('.skb-block-nodeview').first();
  const colBefore = await firstWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  const colBeforeNormalized = colBefore.replace(/\s+/g, ' ').trim();
  expect(
    colBeforeNormalized,
    'pre-resize: fixture should load persisted-overflow attrs as inline gridColumn (col=4, colSpan=6)',
  ).toBe('4 / span 6');

  // Find the BOTTOM handle on the first wrapper.
  const bottomHandle = firstWrapper.locator('.gblock-handle.bottom').first();
  const handleBox = await bottomHandle.boundingBox();
  if (!handleBox) throw new Error('bottom handle has no bounding box');

  const downX = handleBox.x + handleBox.width / 2;
  const downY = handleBox.y + handleBox.height / 2;
  // Drag DOWN by ~80 px (~1 row + gap = 48 + 14 = 62 → snap to +1 row).
  const targetX = downX;
  const targetY = downY + 80;

  await dispatchResizeGesture(
    page,
    bottomHandle,
    downX,
    downY,
    targetX,
    targetY,
  );

  // Post-resize assertion: the gridColumn MUST be normalized.
  // Persisted-overflow `col=4 colSpan=6` at totalCols=6 normalizes
  // to `colSpan = max(1, 6 - 4 + 1) = 3`. So new gridColumn = `4 / span 3`.
  const colAfter = await firstWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  const colAfterNormalized = colAfter.replace(/\s+/g, ' ').trim();
  expect(
    colAfterNormalized,
    'cf-20d R2 F2: bottom-only resize on persisted-overflow block MUST normalize colSpan to (totalCols - col + 1) = (6 - 4 + 1) = 3 in the SAME setNodeMarkup transaction. Pre-R2 the bottom-only axis preserved the invalid colSpan=6 through the spread merge.',
  ).toBe('4 / span 3');

  restoreSampleBlocksFixture();
});
