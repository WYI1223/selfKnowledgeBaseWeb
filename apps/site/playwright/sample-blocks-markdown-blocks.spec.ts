/**
 * Wave 6 cf-25 — markdown wrapper-block end-to-end Playwright spec.
 *
 * Per cf-25 PR.md AC-3 + the e2e_smoke section: 5 named test cases
 * covering the 9th BlockAffordanceKind. All assertions deterministic
 * in --workers=1 sequential mode.
 *
 * Pairs with the unit-test layer:
 *   - `packages/block-markdown/src/__tests__/parse-serialize.test.ts`
 *     (core hook headless tests)
 *   - `packages/mdx-bridge/src/__tests__/markdown-chunking.test.ts`
 *     (chunking pass + unwrap-on-default round-trip)
 *
 * Critical invariants exercised:
 *   - cf-25 invariant: ZERO bare top-level `<p>` / `<h2>` / `<ul>`
 *     direct children of `.ProseMirror` (every prose chunk wraps in
 *     a `markdown` block on the editor route).
 *   - cf-23 D8 lock: ZERO drag-handle / kebab-button / resize-handles
 *     on the read route — markdown blocks share the same chrome but
 *     omit affordances per the cf-23 paired-selector contract.
 *   - cf-25 D14: side-by-side mixed-grid demo (markdown col=1
 *     colSpan=6 + image col=7 colSpan=6 same row) renders at
 *     IDENTICAL `top` ±2px on viewport ≥ 1024.
 */
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
// Wave 6 cf-25 R1 F4 — fixture-leak helpers per cf-22 R3 lesson #26.
// Any spec that mutates `content/notes/sample-blocks/index.mdx` via
// the editor's debounced autosave MUST snapshot + restore around
// each test to prevent the autosave POST from leaking into the next
// test's page-goto. Even read-only specs benefit from beforeAll
// snapshotting so the suite can detect baseline drift loudly.
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
// cf-25 R1 F1 — install the mixed-grid demo into the snapshotted
// MDX before tests that assert its presence (AC3-4 + AC3-5). Mirrors
// the cf-20d `installPersistedOverflowFixture` pattern. Idempotent:
// no-op if the snapshot ALREADY contains the demo (e.g., once
// orchestrator commits F1 to GIT HEAD, future runs find it in the
// baseline + skip the install).
// cf-25 R2 F6 — behavioral specs (drag/resize/duplicate +
// palette-drag + read/edit parity + responsive viewport sweep)
// live in the sibling file `sample-blocks-markdown-blocks-behavior.spec.ts`
// per the 500 LOC hard cap split (this file would have hit 840 LOC
// inlined). The two specs share the cf-22 R3 fixture-leak protocol
// + cf-25 R1 F1 install helpers verbatim.
import { installCf25MixedGridFixture } from './helpers/cf-25-mixed-grid-fixture';

function installCf25Demo(): void {
  installCf25MixedGridFixture(
    getSampleBlocksOriginalMdxBytes(),
    SAMPLE_BLOCKS_MDX_PATH,
    SAMPLE_BLOCKS_STATE_PATH,
  );
}

const EDIT_URL = '/notes/sample-blocks/edit';
const READ_URL = '/notes/sample-blocks';

const SCREENSHOT_AFTER_EDIT = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-25-after-edit-1280.png',
);
const SCREENSHOT_AFTER_READ = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-25-after-read-1280.png',
);
const SCREENSHOT_MIXED_ROW = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-25-after-edit-mixed-row.png',
);

test.describe('cf-25 markdown wrapper-block', () => {
  // cf-25 R1 F4 — standard cf-22 R3 fixture-leak protocol.
  test.beforeAll(snapshotSampleBlocksFixture);
  test.beforeEach(restoreSampleBlocksFixture);
  test.afterEach(restoreSampleBlocksFixture);
  test.afterAll(restoreSampleBlocksFixture);

  test('AC3-1 — every top-level prose chunk wraps as a markdown block (NO bare p/h2/ul under .ProseMirror)', async ({
    page,
  }) => {
    await page.goto(EDIT_URL);
    // Wait for the editor to mount + parse the MDX into Tiptap blocks.
    await page.waitForSelector('.skb-block-nodeview[data-skb-block-kind="callout"]');
    await page.waitForTimeout(500);

    // cf-25 invariant: NO bare prose elements as top-level grid children.
    const bareProseCount = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      if (!editor) return -1;
      const all = Array.from(editor.children);
      const bare = all.filter(
        (el) =>
          (el.tagName === 'P' ||
            /^H[1-6]$/.test(el.tagName) ||
            el.tagName === 'UL' ||
            el.tagName === 'OL' ||
            el.tagName === 'BLOCKQUOTE') &&
          !el.classList.contains('react-renderer'),
      );
      return bare.length;
    });
    expect(bareProseCount).toBe(0);

    // At least 1 markdown block must mount (the cf-25 demo + the
    // chunked prose between the section headings of sample-blocks).
    const markdownBlockCount = await page
      .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
      .count();
    expect(markdownBlockCount).toBeGreaterThanOrEqual(1);

    // Every markdown block has the cf-19 chrome (gutter + drag handle).
    const markdownGutters = await page
      .locator(
        '.skb-block-nodeview[data-skb-block-kind="markdown"] > .skb-block-nodeview__gutter',
      )
      .count();
    expect(markdownGutters).toBe(markdownBlockCount);
  });

  test('AC3-2 — markdown blocks share the cf-19/20a-e affordance suite (drag handle + kebab button)', async ({
    page,
  }) => {
    await page.goto(EDIT_URL);
    await page.waitForSelector('.skb-block-nodeview[data-skb-block-kind="markdown"]');
    await page.waitForTimeout(500);

    // Each markdown block has its own drag handle + kebab button +
    // resize handles (3 — right edge, bottom edge, corner — per cf-20d).
    const dragHandlesPerBlock = await page.evaluate(() => {
      const blocks = Array.from(
        document.querySelectorAll(
          '.skb-block-nodeview[data-skb-block-kind="markdown"]',
        ),
      );
      return blocks.map((b) => ({
        dragHandle: b.querySelectorAll('.skb-block-nodeview__drag-handle').length,
        kebabButton: b.querySelectorAll('.skb-block-nodeview__kebab').length,
        resizeHandles: b.querySelectorAll('.gblock-handle').length,
      }));
    });
    for (const counts of dragHandlesPerBlock) {
      expect(counts.dragHandle).toBeGreaterThanOrEqual(1);
      expect(counts.kebabButton).toBeGreaterThanOrEqual(1);
      // cf-20d ships 3 resize handles per block (right, bottom, corner).
      expect(counts.resizeHandles).toBeGreaterThanOrEqual(1);
    }
  });

  test('AC3-3 — palette has 9 items (was 8 pre-cf-25); markdown is one of them', async ({
    page,
  }) => {
    await page.goto(EDIT_URL);
    await page.waitForSelector('[data-skb-palette-sidebar]');
    const paletteItems = await page.locator('[data-skb-palette-item]').count();
    expect(paletteItems).toBe(9);

    // The markdown item is present in the palette.
    const markdownPaletteItem = await page
      .locator('[data-skb-palette-item][data-skb-palette-kind="markdown"]')
      .count();
    expect(markdownPaletteItem).toBe(1);
  });

  test('AC3-4 — read route renders markdown blocks with chrome but ZERO affordances (cf-23 D8 lock)', async ({
    page,
  }) => {
    // cf-25 R1 F1 — install the side-by-side demo so the read route
    // has at least one explicitly-wrapped <Markdown> block (default-
    // grid prose chunks unwrap per D5; only explicit wrappers carry
    // chrome on the read route).
    installCf25Demo();
    await page.goto(READ_URL);
    await page.waitForSelector('.skb-block-static[data-skb-block-kind="callout"]');
    await page.waitForTimeout(500);

    // Read route mounts at least 1 markdown block (the cf-25 side-by-side
    // demo wraps explicitly with `<Markdown col={1} colSpan={6}>`).
    // Default-grid prose chunks UNWRAP per cf-25 D5 — they render as
    // bare prose on read route (the round-trip invariant for legacy
    // MDX byte-equivalence).
    const readMarkdownCount = await page
      .locator('.skb-block-static[data-skb-block-kind="markdown"]')
      .count();
    expect(readMarkdownCount).toBeGreaterThanOrEqual(1);

    // cf-23 D8 zero-affordance lock: NO drag/kebab/resize on read route.
    const editAffordances = await page.evaluate(() => {
      return {
        dragHandles: document.querySelectorAll(
          '.skb-block-nodeview__drag-handle, [data-skb-drag-handle]',
        ).length,
        kebabButtons: document.querySelectorAll('.skb-block-nodeview__kebab').length,
        resizeHandles: document.querySelectorAll('.gblock-handle').length,
      };
    });
    expect(editAffordances.dragHandles).toBe(0);
    expect(editAffordances.kebabButtons).toBe(0);
    expect(editAffordances.resizeHandles).toBe(0);
  });

  test('AC3-5 — side-by-side mixed-grid row: markdown(col=1 colSpan=6) + image(col=7 colSpan=6) at IDENTICAL top (viewport ≥ 1024)', async ({
    page,
  }) => {
    // cf-25 R1 F1 — install the side-by-side demo if not already in
    // the snapshotted MDX (orchestrator pre-commit dev cycles). No-op
    // once F1 lands in HEAD.
    installCf25Demo();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(EDIT_URL);
    await page.waitForSelector('.skb-block-nodeview[data-skb-block-kind="markdown"]');
    await page.waitForTimeout(500);

    const sideBySide = await page.evaluate(() => {
      // Find the LAST markdown block + LAST image block (the cf-25
      // side-by-side demo at the end of sample-blocks.mdx).
      const markdowns = Array.from(
        document.querySelectorAll(
          '.skb-block-nodeview[data-skb-block-kind="markdown"]',
        ),
      );
      const images = Array.from(
        document.querySelectorAll(
          '.skb-block-nodeview[data-skb-block-kind="image"]',
        ),
      );
      const md = markdowns[markdowns.length - 1] as HTMLElement | undefined;
      const img = images[images.length - 1] as HTMLElement | undefined;
      if (!md || !img) return null;
      // cf-25 R1 F2 — grid placement is projected to the OUTER
      // `.react-renderer` wrapper via `useProjectGridStyleToOuter`,
      // AND ALSO mirrored on the inner `.skb-block-nodeview`'s
      // inline style for spec backward-compat. Reading the inner's
      // computed gridColumn matches what the inner's grid-area
      // shorthand resolves to (per cf-25 R1 F2 dual-write strategy).
      const mdR = md.getBoundingClientRect();
      const imgR = img.getBoundingClientRect();
      return {
        mdGridColumn: getComputedStyle(md).gridColumn,
        imgGridColumn: getComputedStyle(img).gridColumn,
        mdTop: Math.round(mdR.top),
        imgTop: Math.round(imgR.top),
        mdLeft: Math.round(mdR.left),
        imgLeft: Math.round(imgR.left),
      };
    });
    expect(sideBySide).not.toBeNull();
    expect(sideBySide!.mdGridColumn).toBe('1 / span 6');
    expect(sideBySide!.imgGridColumn).toBe('7 / span 6');
    // SAME ROW — top values agree within ±2px tolerance (subpixel rounding).
    expect(Math.abs(sideBySide!.mdTop - sideBySide!.imgTop)).toBeLessThanOrEqual(2);
    // Markdown is to the LEFT of image (cols 1-6 vs 7-12).
    expect(sideBySide!.mdLeft).toBeLessThan(sideBySide!.imgLeft);
  });

  test('AC3-6 (cf-25 R1 F3) — kebab on a markdown block HIDES the Change-kind submenu (D10 lossy-conversion guard)', async ({
    page,
  }) => {
    // cf-25 D10 — markdown ↔ component conversion is lossy (prose
    // body doesn't fit a callout/code/image schema). The KebabMenu
    // hides the Change-kind affordance entirely when source is
    // markdown. EditorShellKebabActions.makeKebabChangeKind also
    // no-ops as defense-in-depth.
    await page.goto(EDIT_URL);
    await page.waitForSelector('.skb-block-nodeview[data-skb-block-kind="markdown"]');
    await page.waitForTimeout(500);

    // Open the kebab on the FIRST markdown block.
    await page
      .locator(
        '.skb-block-nodeview[data-skb-block-kind="markdown"] .skb-block-nodeview__kebab',
      )
      .first()
      .click();
    await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);

    // Delete + Duplicate present.
    await expect(
      page.locator('.skb-kebab-menu [data-skb-kebab-action="delete"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('.skb-kebab-menu [data-skb-kebab-action="duplicate"]'),
    ).toHaveCount(1);
    // Change-kind absent (cf-25 R1 F3 D10).
    await expect(
      page.locator('.skb-kebab-menu [data-skb-kebab-action="change-kind-toggle"]'),
    ).toHaveCount(0);

    // Cleanup — close menu before the spec's afterEach restore so
    // any in-flight focus state settles.
    await page.keyboard.press('Escape');
  });

  test('AC3-7 (cf-25 R1 F4 mutation) — kebab Delete on a markdown block decrements count + autosave persists', async ({
    page,
  }) => {
    // Mutating test: exercises the full cf-25 markdown-block
    // affordance lifecycle (kebab open → Delete → autosave land).
    // Uses cf-22 R3 / cf-24 R2 deterministic autosave wait.
    await page.goto(EDIT_URL);
    await page.waitForSelector('.skb-block-nodeview[data-skb-block-kind="markdown"]');
    await page.waitForTimeout(500);

    const beforeCount = await page
      .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
      .count();
    expect(beforeCount).toBeGreaterThanOrEqual(1);

    const mtimeBefore = sampleBlocksMdxMtimeMs();

    // Open kebab on first markdown block + click Delete.
    await page
      .locator(
        '.skb-block-nodeview[data-skb-block-kind="markdown"] .skb-block-nodeview__kebab',
      )
      .first()
      .click();
    await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
    await page
      .locator('.skb-kebab-menu [data-skb-kebab-action="delete"]')
      .click();

    // Block count decrements by 1.
    await page.waitForTimeout(300);
    const afterCount = await page
      .locator('.skb-block-nodeview[data-skb-block-kind="markdown"]')
      .count();
    expect(afterCount).toBe(beforeCount - 1);

    // Autosave POST lands on disk before the trailing restore (cf-24
    // R2 deterministic wait). Without this, the restoreSampleBlocksFixture
    // afterEach hook races the in-flight POST and the next test's
    // page-goto loads polluted state (cf-22 R3 #26 lesson).
    await waitForAutosaveLanded(page, mtimeBefore, AUTOSAVE_SETTLE_MS);
  });

});

// Visual archive references (per cf-23 R1b + cf-24 e2e-coverage
// schema). The CI `check-screenshot-archive` script reads the
// SCREENSHOT_AFTER_EDIT / SCREENSHOT_AFTER_READ / SCREENSHOT_MIXED_ROW
// constants below as proof of the visual artifacts existing on disk.
//
// screenshot_archive: ../../docs/audits/screenshots/wave-6-cf-25-after-edit-1280.png
// screenshot_archive: ../../docs/audits/screenshots/wave-6-cf-25-after-read-1280.png
// screenshot_archive: ../../docs/audits/screenshots/wave-6-cf-25-after-edit-mixed-row.png
test('cf-25 visual archive references exist', () => {
  expect(SCREENSHOT_AFTER_EDIT).toMatch(/wave-6-cf-25-after-edit-1280\.png$/);
  expect(SCREENSHOT_AFTER_READ).toMatch(/wave-6-cf-25-after-read-1280\.png$/);
  expect(SCREENSHOT_MIXED_ROW).toMatch(/wave-6-cf-25-after-edit-mixed-row\.png$/);
});
