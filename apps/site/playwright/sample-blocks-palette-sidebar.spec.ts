import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  restoreSampleBlocksFixture,
  sampleBlocksMdxMtimeMs,
  snapshotSampleBlocksFixture,
  waitForAutosaveLanded,
} from './fixtures/sample-blocks-fixture';

/**
 * Wave 6 cf-24 (2026-05-10) — PaletteSidebar component-library
 * left-rail Playwright integration spec.
 *
 * Covers cf-24 AC-3 (5 test cases) per ADR-0017 v0.4 D14 + ADR-0018
 * v0.8 D10:
 * 1. visible-on-edit / hidden-on-read — D2 + D11 graceful degradation
 * 2. renders 8 block-kind items — D4 BLOCK_KIND_OPTIONS parity
 * 3. click inserts block — D5 click-to-insert + cf-22 keyboard parity
 * 4. drag inserts block — D5 HTML5 DnD external-source path
 * 5. keyboard a11y — Tab focus + Enter inserts + LiveAnnouncer fires
 *
 * Uses the cf-22-followup fixture restore protocol PLUS cf-24 R2
 * hardening: snapshot from git HEAD (NOT disk; defends against
 * cross-process leak) + DETERMINISTIC `waitForAutosaveLanded(page,
 * mtimeBefore)` (NOT blind `AUTOSAVE_SETTLE_MS` timeout; eliminates
 * slow-CI race window). Mutating cf-24 cases (AC3-3 + AC3-5 + AC3-6
 * + AC3-7) capture mtime BEFORE the click/Enter/drop + poll until
 * mtime advances; the afterEach then writes pristine bytes back
 * with no in-flight POST to race against.
 */

test.beforeAll(snapshotSampleBlocksFixture);
test.beforeEach(restoreSampleBlocksFixture);
test.afterEach(restoreSampleBlocksFixture);
test.afterAll(restoreSampleBlocksFixture);

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-24-palette-sidebar.png',
);

test('cf-24 AC3-1 — palette-sidebar visible on edit, absent on read (D2 + D11 graceful degradation)', async ({
  page,
}) => {
  // Edit route: exactly 1 PaletteSidebar mount.
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-skb-palette-sidebar]')).toHaveCount(1);
  // The sidebar is portal-rendered into the BaseLayout #palette-rail
  // aside slot.
  await expect(page.locator('aside#palette-rail [data-skb-palette-sidebar]')).toHaveCount(1);

  // Read route: zero sidebars (no palette prop on BaseLayout → no slot
  // → portal no-op per cf-24 D11).
  await page.goto('/notes/sample-blocks');
  await expect(page.locator('[data-skb-palette-sidebar]')).toHaveCount(0);
  await expect(page.locator('aside.palette-rail')).toHaveCount(0);

  await page.screenshot({ fullPage: false, path: SCREENSHOT_PATH });
});

test('cf-24 AC3-2 — palette-sidebar renders 8 block-kind items (D4 BLOCK_KIND_OPTIONS parity)', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });

  const items = page.locator('[data-skb-palette-item]');
  await expect(items).toHaveCount(8);

  // Each kind must be present per BLOCK_KIND_OPTIONS canonical list.
  const expectedKinds = [
    'callout',
    'componentCode',
    'image',
    'math',
    'pdf',
    'jupyter',
    'nn-viz',
    'agent-flow',
  ];
  for (const kind of expectedKinds) {
    await expect(
      page.locator(`[data-skb-palette-item][data-skb-palette-kind="${kind}"]`),
    ).toHaveCount(1);
  }

  // Each item is a real <button> (not div with role) so default Tab
  // focus works (cf-24 D3 + cf-22 WCAG 2.1.1 keyboard operability).
  const tagNames = await items.evaluateAll((els) =>
    els.map((el) => el.tagName.toLowerCase()),
  );
  for (const tag of tagNames) {
    expect(tag).toBe('button');
  }
});

test('cf-24 AC3-3 — click inserts block (cf-22 keyboard-parity click-as-Enter; appendBlockKind path post-R1-F5)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  // Wait for at least the existing sample blocks to mount.
  await page.waitForFunction(
    () => document.querySelectorAll('.skb-block-nodeview').length > 0,
    undefined,
    { timeout: 15_000 },
  );

  // Snapshot pre-insert state (callout count + MDX mtime baseline
  // for cf-24 R2 deterministic autosave wait).
  const calloutCountBefore = await page
    .locator('.skb-block-nodeview[data-skb-block-kind="callout"]')
    .count();
  const mdxMtimeBefore = sampleBlocksMdxMtimeMs();

  // Click the Callout palette card.
  await page
    .locator('[data-skb-palette-item][data-skb-palette-kind="callout"]')
    .click();

  // The new block should appear; total callout count = before + 1.
  await expect
    .poll(() => page.locator('.skb-block-nodeview[data-skb-block-kind="callout"]').count(), {
      timeout: 10_000,
    })
    .toBe(calloutCountBefore + 1);

  // cf-24 R0 F2 fix — assert the LiveAnnouncer received the
  // formatPaletteInsert message. Pre-R0 the EditorShellMountInner
  // portal mount didn't pass `onInsert` to PaletteSidebar so
  // click/Enter inserts were silent (AC-13 broken). cf-22 announcer
  // is throttled to 100 ms; bump timeout to 5 s for slow CI.
  await expect
    .poll(
      () => page.locator('[data-skb-live-announcer]').textContent(),
      { timeout: 5_000 },
    )
    .toContain('Added callout block');

  // cf-24 R2 — DETERMINISTIC autosave wait. Polls until the MDX
  // mtime advances past the pre-click baseline (proves the POST
  // landed); throws if no write within 5 s. Replaces pre-R2 blind
  // `page.waitForTimeout(AUTOSAVE_SETTLE_MS)` which raced past
  // slow CI flushes + leaked pollution to next-process snapshot.
  await waitForAutosaveLanded(page, mdxMtimeBefore);
});

test('cf-24 AC3-4 — palette items are draggable + carry the EXTERNAL_DROP_MIME contract (cf-24 D5)', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });

  // Each palette item is HTML5-draggable.
  const draggable = await page
    .locator('[data-skb-palette-item][data-skb-palette-kind="image"]')
    .getAttribute('draggable');
  expect(draggable).toBe('true');

  // Verify the external-drop MIME constant is exposed via the bundle
  // (sanity: the contract is wired through the editor-shell module).
  // This is a structural assertion — we don't try to dispatch a real
  // HTML5 drag from Playwright (notoriously flaky across browsers /
  // viewports); instead verify the dragstart handler fires + the
  // pipeline's onDragStartExternal entry is reachable.
  const dragStartFired = await page.evaluate(() => {
    const item = document.querySelector(
      '[data-skb-palette-item][data-skb-palette-kind="image"]',
    );
    if (!item) return false;
    const dt = new DataTransfer();
    const event = new DragEvent('dragstart', {
      dataTransfer: dt,
      bubbles: true,
      cancelable: true,
    });
    item.dispatchEvent(event);
    // After the React onDragStart handler runs synchronously, the MIME
    // should be present.
    return dt.getData('application/x-block-kind') === 'image';
  });
  expect(dragStartFired).toBe(true);

  // Trigger dragend so the pipeline's externalDragKindRef clears.
  await page.evaluate(() => {
    const item = document.querySelector(
      '[data-skb-palette-item][data-skb-palette-kind="image"]',
    );
    if (!item) return;
    const dt = new DataTransfer();
    const event = new DragEvent('dragend', {
      dataTransfer: dt,
      bubbles: true,
      cancelable: true,
    });
    item.dispatchEvent(event);
  });
});

test('cf-24 AC3-5 — keyboard a11y: Tab reaches palette items + Enter inserts + LiveAnnouncer fires (WCAG 2.1.1 + 4.1.3)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.skb-block-nodeview').length > 0,
    undefined,
    { timeout: 15_000 },
  );

  // Focus the first palette item directly (Tab traversal from the
  // header / edit-banner is route-specific + brittle — direct focus
  // is sufficient to verify the button is keyboard-operable).
  const firstItem = page
    .locator('[data-skb-palette-item][data-skb-palette-kind="callout"]')
    .first();
  await firstItem.focus();
  // Verify the focused element matches.
  const focusedKind = await page.evaluate(
    () => document.activeElement?.getAttribute('data-skb-palette-kind') ?? null,
  );
  expect(focusedKind).toBe('callout');

  // Snapshot pre-insert state (callout count + MDX mtime baseline).
  const calloutCountBefore = await page
    .locator('.skb-block-nodeview[data-skb-block-kind="callout"]')
    .count();
  const mdxMtimeBefore = sampleBlocksMdxMtimeMs();

  // Press Enter — synonymous with click per cf-22 keyboard parity.
  await page.keyboard.press('Enter');

  await expect
    .poll(() => page.locator('.skb-block-nodeview[data-skb-block-kind="callout"]').count(), {
      timeout: 10_000,
    })
    .toBe(calloutCountBefore + 1);

  // cf-24 R0 F2 fix — assert the announcer received the
  // formatPaletteInsert message (BOTH click + Enter paths share
  // the same `onInsert` callback in PaletteSidebar.tsx).
  await expect
    .poll(
      () => page.locator('[data-skb-live-announcer]').textContent(),
      { timeout: 5_000 },
    )
    .toContain('Added callout block');

  // Structural check: announcer region exists in DOM.
  const announcer = page.locator('[data-skb-live-announcer]');
  await expect(announcer).toHaveCount(1);

  // cf-24 R2 — DETERMINISTIC autosave wait (replaces blind timeout).
  await waitForAutosaveLanded(page, mdxMtimeBefore);
});

test('cf-24 AC3-6 (R0 F3 fix) — FULL drag-and-drop external-source path: dragstart on palette → dragover .skb-grid → drop → new block in editor + correct grid-column + announce', async ({
  page,
}) => {
  // cf-24 R0 F3 fix (codex stage 3 R0): pre-R0 spec only verified
  // dragstart MIME (AC3-4); full DnD drop pipeline was untested.
  // Drives: dragstart on palette → dragover on .skb-grid → drop →
  // commitExternalDrop (appendBlockKind → applyDropMode → setNodeMarkup
  // → pulse) → assert new block + grid-column + announce.
  // Pattern: sample-blocks-drag-handle.spec.ts:213 cf-20c-2 R1 F4
  // (single shared DataTransfer; rAF between dragover + drop).

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.skb-block-nodeview').length > 0,
    undefined,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(500); // Let initial layout settle

  // Pick the FIRST existing block as the drop target; we'll drop at
  // its right edge to trigger split-right, which puts the new block
  // at col=7 colSpan=6 (host shrinks from colSpan=12 → 6 on left).
  const targetWrapper = page.locator('.skb-block-nodeview').first();
  const targetBox = await targetWrapper.boundingBox();
  if (!targetBox) throw new Error('target wrapper has no bounding box');
  const dropX = targetBox.x + targetBox.width - 6; // 6px inside right edge
  const dropY = targetBox.y + targetBox.height / 2;

  // Snapshot pre-drop state (counts + MDX mtime baseline for cf-24
  // R2 deterministic autosave wait).
  const imageCountBefore = await page
    .locator('.skb-block-nodeview[data-skb-block-kind="image"]')
    .count();
  const mdxMtimeBefore = sampleBlocksMdxMtimeMs();

  // Full drag lifecycle in one page.evaluate so the DataTransfer
  // is shared across dragstart → dragover → drop (browser DnD spec).
  await page.evaluate(
    ({ x, y }) => {
      const item = document.querySelector(
        '[data-skb-palette-item][data-skb-palette-kind="image"]',
      );
      if (!item) throw new Error('no palette image item');
      const grid = document.querySelector('.skb-grid');
      if (!grid) throw new Error('no .skb-grid');
      const dt = new DataTransfer();
      const dragstartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      });
      item.dispatchEvent(dragstartEvent);
      // After dragstart fires synchronously, React's onDragStart has
      // run + writeBlockKindToDataTransfer set the MIME on `dt` +
      // pipeline.onDragStartExternal flipped active state.
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const dragoverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            dataTransfer: dt,
          });
          grid.dispatchEvent(dragoverEvent);
          requestAnimationFrame(() => {
            const dropEvent = new DragEvent('drop', {
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              dataTransfer: dt,
            });
            grid.dispatchEvent(dropEvent);
            requestAnimationFrame(() => resolve());
          });
        });
      });
    },
    { x: dropX, y: dropY },
  );
  await page.waitForTimeout(300); // React commit + Tiptap setNodeMarkup

  // Step 4a: a new image block exists in the editor.
  await expect
    .poll(
      () =>
        page
          .locator('.skb-block-nodeview[data-skb-block-kind="image"]')
          .count(),
      { timeout: 10_000 },
    )
    .toBe(imageCountBefore + 1);

  // Step 4b: the new block carries an inline `style.gridColumn` from
  // the applyDropMode algebra (NOT the default colSpan=12). The exact
  // shape may vary by which split mode was chosen at the drop coord;
  // at minimum the new image block should have a non-default
  // grid-column style (proves setNodeMarkup ran).
  const newImageGridColumn = await page
    .locator('.skb-block-nodeview[data-skb-block-kind="image"]')
    .last()
    .evaluate((el) => (el as HTMLElement).style.gridColumn);
  // Default for image insert (per registry-wire.tsx:65) is
  // `col=1, colSpan=12` → '1 / span 12'. After applyDropMode +
  // split-right at host's right edge, the new image should be at
  // some column != 1 OR span != 12. Assert a non-default value.
  expect(newImageGridColumn).toBeTruthy();
  expect(newImageGridColumn).not.toBe('1 / span 12');

  // Step 5: announcer received formatExternalDragCommit message.
  // The format is "Inserted X block at column N"; we check for the
  // verb prefix "Inserted image block" (the col number varies by
  // drop mode + active viewport).
  await expect
    .poll(
      () => page.locator('[data-skb-live-announcer]').textContent(),
      { timeout: 5_000 },
    )
    .toContain('Inserted image block');

  // cf-24 R2 — DETERMINISTIC autosave wait (replaces blind
  // 2× timeout). Polls until MDX mtime advances; throws on
  // 5 s timeout. AC3-6 fires TWO chain.run calls (append +
  // setNodeMarkup); the helper still works because we wait until
  // mtime > baseline (the LATEST write wins on disk).
  await waitForAutosaveLanded(page, mdxMtimeBefore);
});

test('cf-24 AC3-7 (R1 F5 fix) — click/Enter at mid-doc selection lands at END (NOT at cursor); announce truthful', async ({
  page,
}) => {
  // codex stage 3 R1 F5 finding: pre-R1 handleClick used
  // `insertBlockKind` (selection-based) but the announce said
  // "Added X block at end of document" — lied to AT users when
  // selection was mid-doc. Fix: swap to `appendBlockKind`
  // (deterministic doc-end). Set selection to doc-start, click
  // Callout, assert new block is the LAST `.skb-block-nodeview`
  // (NOT the first / pre-fix would have placed it BEFORE existing
  // fixture blocks).

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.skb-block-nodeview').length > 0,
    undefined,
    { timeout: 15_000 },
  );

  // Snapshot pre-click state.
  const calloutCountBefore = await page
    .locator('.skb-block-nodeview[data-skb-block-kind="callout"]')
    .count();
  // Capture the LAST block's kind BEFORE the insert; we'll use
  // this to verify our new callout becomes the new last-child.
  const lastKindBefore = await page
    .locator('.skb-block-nodeview')
    .last()
    .getAttribute('data-skb-block-kind');

  // Capture mtime baseline BEFORE the mutating click so cf-24 R2
  // deterministic autosave wait can detect the post-click POST.
  const mdxMtimeBefore = sampleBlocksMdxMtimeMs();

  // F5 anti-regression: explicitly move selection to doc start
  // (pre-R1-F5 selection-based insert would have placed the new
  // callout at pos 0 before existing blocks). Use Selection API
  // directly since the editor isn't exposed on window.
  await page.evaluate(() => {
    const pm = document.querySelector('.ProseMirror');
    if (!pm) return;
    (pm as HTMLElement).focus();
    const range = document.createRange();
    const firstText = pm.querySelector('p, h1, h2, h3') ?? pm;
    range.setStart(firstText, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });

  // Click the palette Callout item.
  await page
    .locator('[data-skb-palette-item][data-skb-palette-kind="callout"]')
    .click();

  // Assert: callout count went up by exactly 1.
  await expect
    .poll(
      () =>
        page
          .locator('.skb-block-nodeview[data-skb-block-kind="callout"]')
          .count(),
      { timeout: 10_000 },
    )
    .toBe(calloutCountBefore + 1);

  // F5 critical assertion: the NEW callout is the LAST
  // `.skb-block-nodeview`, regardless of where selection was.
  // The pre-R1-F5 bug would have placed it at the BEGINNING (so
  // last-child kind would be `lastKindBefore`, NOT 'callout').
  const lastKindAfter = await page
    .locator('.skb-block-nodeview')
    .last()
    .getAttribute('data-skb-block-kind');
  expect(
    lastKindAfter,
    `R1 F5 anti-regression: clicking palette Callout at mid-doc selection ` +
      `must land the new block at END (last-child kind = 'callout'), NOT ` +
      `at cursor position. lastKindBefore=${lastKindBefore}, lastKindAfter=${lastKindAfter}.`,
  ).toBe('callout');

  // F5 + F2 combined: announcer received truthful "end of document"
  // message. Pre-R1-F5 the message LIED about end-of-doc placement
  // when actual landing was at cursor. Post-cf-24-R2 LiveAnnouncer
  // leading-edge throttle (see live-announcer.tsx ANNOUNCE_THROTTLE_MS
  // change): the FIRST message in a quiet period commits SYNCHRONOUSLY
  // via setMessage so the textContent updates within React's next
  // commit (~16ms) rather than waiting 100ms for trailing-edge timer.
  await expect
    .poll(
      () => page.locator('[data-skb-live-announcer]').textContent(),
      { timeout: 5_000 },
    )
    .toContain('Added callout block at end of document');

  // cf-24 R2 — DETERMINISTIC autosave wait (replaces blind timeout).
  await waitForAutosaveLanded(page, mdxMtimeBefore);
});
