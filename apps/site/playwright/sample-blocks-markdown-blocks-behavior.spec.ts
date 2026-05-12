/**
 * Wave 6 cf-25 R2 F6 — markdown wrapper-block BEHAVIORAL coverage.
 *
 * Companion spec to `sample-blocks-markdown-blocks.spec.ts` (which
 * covers structural assertions: presence, count, palette parity,
 * read-route chrome, side-by-side measurement). This spec PROVES
 * (not just observes) the affordance behaviors the original cf-25
 * PR.md e2e_smoke section claimed:
 *
 *   AC3-2a  drag a markdown block → cf-20c-2 split + Moved announcer
 *   AC3-2b  right-edge resize on markdown → colSpan mutation + Resized
 *   AC3-2c  kebab Duplicate on markdown → copy with same kind + content
 *   AC3-3a  palette Markdown drag → drop on grid → block inserted +
 *           Inserted announcer (full cf-24 external-source pipeline)
 *   AC3-4a  read/edit parity: explicit-wrapper markdown blocks have
 *           the SAME gridColumn + body text on both routes
 *   AC3-5a  responsive viewport sweep [1280, 1024, 768]: mixed-grid
 *           placement + scrollWidth === viewportWidth invariant
 *
 * Split rationale: the structural spec exceeded the 500 LOC hard cap
 * (`scripts/check-size-limits.mjs`) when these behavioral specs were
 * inlined. Splitting into a sibling file keeps both files under cap +
 * mirrors the cf-23 / cf-24 spec separation pattern (notes-route-
 * width-parity.spec.ts is a cf-24 sibling of sample-blocks-palette-
 * sidebar.spec.ts).
 */
import { expect, test } from '@playwright/test';
import {
  AUTOSAVE_SETTLE_MS,
  getSampleBlocksOriginalMdxBytes,
  restoreSampleBlocksFixture,
  SAMPLE_BLOCKS_MDX_PATH,
  SAMPLE_BLOCKS_STATE_PATH,
  sampleBlocksMdxMtimeMs,
  snapshotSampleBlocksFixture,
  waitForAutosaveLanded,
} from './fixtures/sample-blocks-fixture';
import { installCf25MixedGridFixture } from './helpers/cf-25-mixed-grid-fixture';
import { dispatchResizeGesture } from './helpers/resize-pointer-events';

const EDIT_URL = '/notes/sample-blocks/edit';
const READ_URL = '/notes/sample-blocks';

function installCf25Demo(): void {
  installCf25MixedGridFixture(
    getSampleBlocksOriginalMdxBytes(),
    SAMPLE_BLOCKS_MDX_PATH,
    SAMPLE_BLOCKS_STATE_PATH,
  );
}

test.describe('cf-25 R2 F6 — markdown wrapper-block behavioral specs', () => {
  test.beforeAll(snapshotSampleBlocksFixture);
  test.beforeEach(restoreSampleBlocksFixture);
  test.afterEach(restoreSampleBlocksFixture);
  test.afterAll(restoreSampleBlocksFixture);

  test('AC3-2a — drag a markdown block to another block triggers cf-20c-2 split + announcer fires Moved', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: cf-20c-1 split-with-shrink replaced by hole-fill that rejects cursor-on-occupied. New drag-on-empty coverage lands in Phase 2C.',
    );
  });

  test('AC3-2b — right-edge resize on a markdown block mutates colSpan + fires Resized', () => {
    test.skip(true, 'REMOVED-IN-WAVE-7-PHASE-2E (ADR-0020 D7 absolute positioning)');
  });

  test('AC3-2c — kebab Duplicate on a markdown block inserts a copy with same kind + content', async ({
    page,
  }) => {
    // cf-20e Duplicate path applies to markdown identically. Verify
    // the duplicated block has the same data-skb-block-kind AND the
    // same inner .skb-prose body text.
    await page.goto(EDIT_URL);
    await page.waitForSelector('.skb-block-nodeview[data-skb-block-kind="markdown"]');
    await page.waitForTimeout(500);

    const beforeCount = await page
      .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
      .count();
    expect(beforeCount).toBeGreaterThanOrEqual(1);

    const firstMarkdown = page
      .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
      .first();
    const sourceBodyText = await firstMarkdown
      .locator('.skb-prose')
      .textContent();
    expect((sourceBodyText ?? '').trim().length).toBeGreaterThan(0);

    const mtimeBefore = sampleBlocksMdxMtimeMs();

    await firstMarkdown.locator('.skb-block-nodeview__kebab').first().click();
    await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
    await page
      .locator('.skb-kebab-menu [data-skb-kebab-action="duplicate"]')
      .click();

    await expect(
      page.locator('[data-skb-drop-pulse-anchor]').first(),
    ).toBeAttached({ timeout: 1_500 });
    await page.waitForTimeout(400);

    const afterCount = await page
      .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
      .count();
    expect(afterCount).toBe(beforeCount + 1);

    // The duplicated block (immediately after the source per
    // ProseMirror tr.insert positioning) has the SAME body text.
    const wrappers = page.locator(
      '.skb-block-nodeview[data-skb-block-kind="markdown"]',
    );
    const dupBodyText = await wrappers.nth(1).locator('.skb-prose').textContent();
    expect(dupBodyText).toBe(sourceBodyText);

    await waitForAutosaveLanded(page, mtimeBefore, AUTOSAVE_SETTLE_MS);
  });

  test('AC3-3a — palette Markdown item drag → drop on grid inserts a new markdown block + announcer fires Inserted', async ({
    page,
  }) => {
    // cf-24 external-source DnD pipeline routes palette items via
    // application/x-block-kind MIME → commitExternalDrop →
    // appendBlockKind → applyDropMode setNodeMarkup →
    // formatExternalDragCommit announcer. Markdown shares this path
    // identically per ADR-0017 v0.5 D15.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(EDIT_URL);
    await page.waitForFunction(
      () => document.querySelectorAll('.skb-block-nodeview').length > 0,
      undefined,
      { timeout: 15_000 },
    );
    await page.waitForTimeout(500);

    const markdownCountBefore = await page
      .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
      .count();
    const mtimeBefore = sampleBlocksMdxMtimeMs();

    // Drop on the FIRST component-block's right edge (component
    // target isolates the mutation from cf-25 markdown wrappers'
    // chunking interaction; mirrors cf-24 AC3-6 pattern).
    const targetWrapper = page
      .locator('.skb-block-nodeview:not([data-skb-block-kind="markdown"])')
      .first();
    const targetBox = await targetWrapper.boundingBox();
    if (!targetBox) throw new Error('component target has no box');
    const dropX = targetBox.x + targetBox.width - 6;
    const dropY = targetBox.y + targetBox.height / 2;

    await page.evaluate(
      ({ x, y }) => {
        const item = document.querySelector(
          '[data-skb-palette-item][data-skb-palette-kind="markdown"]',
        );
        if (!item) throw new Error('no palette markdown item');
        const grid = document.querySelector('.skb-grid');
        if (!grid) throw new Error('no .skb-grid');
        const dt = new DataTransfer();
        item.dispatchEvent(
          new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
          }),
        );
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            grid.dispatchEvent(
              new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                dataTransfer: dt,
              }),
            );
            requestAnimationFrame(() => {
              grid.dispatchEvent(
                new DragEvent('drop', {
                  bubbles: true,
                  cancelable: true,
                  clientX: x,
                  clientY: y,
                  dataTransfer: dt,
                }),
              );
              requestAnimationFrame(() => resolve());
            });
          });
        });
      },
      { x: dropX, y: dropY },
    );
    await page.waitForTimeout(300);

    await expect
      .poll(
        () =>
          page
            .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
            .count(),
        { timeout: 10_000 },
      )
      .toBe(markdownCountBefore + 1);

    await expect
      .poll(
        () => page.locator('[data-skb-live-announcer]').textContent(),
        { timeout: 5_000 },
      )
      .toContain('Inserted markdown block');

    await waitForAutosaveLanded(page, mtimeBefore, AUTOSAVE_SETTLE_MS);
  });

  test('AC3-4a — read/edit parity: explicit-wrapper markdown blocks have same gridColumn + body text on both routes', async ({
    page,
  }) => {
    // cf-25 D5 round-trip + cf-23 D8 zero-affordance lock together
    // imply: explicitly-wrapped Markdown blocks (col=N colSpan=N)
    // appear on BOTH routes with the same grid placement + same
    // inner prose. The read route emits chrome ONLY for explicit
    // wrappers (default-grid prose unwraps per D5).
    installCf25Demo();
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(EDIT_URL);
    await page.waitForSelector(
      '.skb-block-nodeview[data-skb-block-kind="markdown"]',
    );
    await page.waitForTimeout(500);
    const editState = await page.evaluate(() => {
      const wrappers = Array.from(
        document.querySelectorAll(
          '.skb-block-nodeview[data-skb-block-kind="markdown"]',
        ),
      );
      const explicitMarkdownBodies = wrappers
        .filter((w) => {
          const col = (w as HTMLElement).style.gridColumn;
          return col && !col.includes('span 12');
        })
        .map((w) => ({
          gridColumn: getComputedStyle(w).gridColumn,
          bodyText: w.querySelector('.skb-prose')?.textContent?.trim() ?? '',
        }));
      return { explicitMarkdownBodies };
    });
    expect(editState.explicitMarkdownBodies.length).toBeGreaterThanOrEqual(1);

    await page.goto(READ_URL);
    await page.waitForSelector('.skb-block-static[data-skb-block-kind="callout"]');
    await page.waitForTimeout(500);
    const readState = await page.evaluate(() => {
      const wrappers = Array.from(
        document.querySelectorAll(
          '.skb-block-static[data-skb-block-kind="markdown"]',
        ),
      );
      return wrappers.map((w) => ({
        gridColumn: getComputedStyle(w).gridColumn,
        bodyText: w.querySelector('.skb-prose')?.textContent?.trim() ?? '',
      }));
    });

    expect(readState.length).toBe(editState.explicitMarkdownBodies.length);
    for (let i = 0; i < readState.length; i++) {
      const editBlock = editState.explicitMarkdownBodies[i];
      const readBlock = readState[i];
      expect(readBlock.gridColumn).toBe(editBlock.gridColumn);
      expect(readBlock.bodyText).toBe(editBlock.bodyText);
    }
  });

  // AC3-5a — responsive viewport sweep parameterized over
  // [1280, 1024, 768] per cf-23 D10 4-viewport precedent. At 1280 +
  // 1024 the cf-20b grid is 12 columns (mixed-grid demo renders
  // side-by-side); at 768 the grid flattens to single-column
  // (cf-20b R1 6→1 col flatten — markdown + image stack vertically).
  // All viewports MUST satisfy scrollWidth === viewportWidth (no
  // horizontal overflow per cf-23 D10).
  for (const { viewport, expectSideBySide } of [
    { viewport: { w: 1280, h: 900 }, expectSideBySide: true },
    { viewport: { w: 1024, h: 900 }, expectSideBySide: true },
    { viewport: { w: 768, h: 900 }, expectSideBySide: false },
  ] as const) {
    test(`AC3-5a — viewport ${viewport.w}px: mixed-grid placement + no horizontal overflow`, () => {
      void viewport;
      void expectSideBySide;
      test.skip(true, 'REMOVED-IN-WAVE-7-PHASE-2E (ADR-0020 D7 absolute positioning)');
    });
  }
});
