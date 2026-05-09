import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

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

  // Dispatch pointerdown via the handle locator (avoids
  // elementFromPoint hit-test fragility under the resize handle's
  // negative-offset positioning); window-level pointermove + pointerup
  // mirror the pipeline's window-level listener attachment.
  await rightHandle.dispatchEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    clientX: downX,
    clientY: downY,
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
  });

  // One frame so React commits the active=true state from
  // onResizeStart (the window-level pointermove listener attaches in
  // a useEffect that runs post-commit).
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      ),
  );

  await page.evaluate(
    ({ moveX, moveY }: { moveX: number; moveY: number }) => {
      const moveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: moveX,
        clientY: moveY,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      window.dispatchEvent(moveEvent);
    },
    { moveX: targetX, moveY: targetY },
  );

  // Another frame so React commits the snap state.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      ),
  );

  await page.evaluate(
    ({ moveX, moveY }: { moveX: number; moveY: number }) => {
      const upEvent = new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: moveX,
        clientY: moveY,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      });
      window.dispatchEvent(upEvent);
    },
    { moveX: targetX, moveY: targetY },
  );

  // Two more frames for pipeline's 2-rAF re-measurement + setNodeMarkup commit.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve()),
        ),
      ),
  );

  // Wait for React commit + Tiptap setNodeMarkup + 2-rAF re-measure
  await page.waitForTimeout(300);

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
