import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 cf-23 (2026-05-10) — D8 zero-affordance lock for the static
 * read route `/notes/<slug>`.
 *
 * # Why this spec exists
 *
 * cf-20a wired the v2 `.gblock` chrome onto the read-route via
 * `.skb-block-static`; cf-20c-2 / cf-20d / cf-20e / cf-22 added per-block
 * editor affordances (drag handle, resize handles, kebab menu, LiveAnnouncer)
 * onto the EDIT route inside `.skb-block-nodeview`. The contract is:
 * the read route must NEVER render any editor affordance, no matter how
 * many editor features ship in future PRs.
 *
 * Without this lock a future PR could accidentally:
 *   (a) mount `EditorShellMount` on the read route by copy-paste from the
 *       edit route's `.astro` template,
 *   (b) leak the cf-22 `<LiveAnnouncer>` into the global page shell
 *       instead of editor-mount-scoped,
 *   (c) copy-paste an editor selector (e.g. `.skb-block-nodeview__gutter`)
 *       onto the static wrapper for some quick-fix reason,
 *
 * and the user would see drag handles + kebab buttons rendered on a
 * pure-read page — which violates the cf-23 user directive
 * "把 edit 和正常模式风格统一一下" (edit and read styling unified MINUS
 * the editing affordances; read should not be a degraded edit page).
 *
 * # What this spec asserts
 *
 * On `/notes/sample-blocks` (a representative production-traffic fixture
 * per ADR-0011 v0.2.2 D9.8):
 *
 * (a) ZERO occurrences of every editor-only DOM token:
 *      - `[data-skb-drag-handle]` (cf-20c-2 drag handle)
 *      - `[data-skb-resize-handle]` (cf-20d resize handle)
 *      - `[data-skb-kebab-block-id]` (cf-20e kebab menu)
 *      - `.skb-live-announcer` (cf-22 LiveAnnouncer)
 *      - `.skb-block-nodeview` (the editor-only wrapper class)
 *      - `.skb-block-nodeview__gutter` (gutter shell)
 *      - `.skb-block-nodeview__kind-chip` (kind chip)
 *      - `.skb-editor-content` (Tiptap EditorContent wrapper)
 *      - `.ProseMirror` (Tiptap render target)
 *
 * (b) >= 8 `.skb-block-static` wrappers present (positive lock — the
 *     sample-blocks fixture renders 14 component-block instances all
 *     wrapped in the static chrome per cf-20a).
 *
 * Pairs with `sample-blocks-read.spec.ts` (cf-20a chrome single-source
 * lock) and `sample-blocks-edit-loads.spec.ts` (cf-19 editor-mount
 * positive lock).
 */

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-23-no-edit-affordances.png',
);

test('read route renders zero edit-mode affordances (cf-23 D8 zero-affordance lock)', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto('/notes/sample-blocks');

  // Static SSR renders synchronously, but if a regression accidentally
  // mounted EditorShellMount the React hydration would surface within
  // ~2s. Wait for the first static wrapper as the positive baseline,
  // then probe for forbidden selectors.
  await expect(page.locator('.skb-block-static').first()).toBeVisible({
    timeout: 15_000,
  });

  const probe = await page.evaluate(() => {
    const count = (selector: string) =>
      document.querySelectorAll(selector).length;
    return {
      // 9 forbidden editor-only tokens; all must be 0 on read route.
      dragHandles: count('[data-skb-drag-handle]'),
      resizeHandles: count('[data-skb-resize-handle]'),
      kebabButtons: count('[data-skb-kebab-block-id]'),
      liveAnnouncer: count('.skb-live-announcer'),
      blockNodeview: count('.skb-block-nodeview'),
      gutter: count('.skb-block-nodeview__gutter'),
      kindChip: count('.skb-block-nodeview__kind-chip'),
      editorContent: count('.skb-editor-content'),
      proseMirror: count('.ProseMirror'),
      // Positive baseline — read-route static wrapper count.
      blockStatic: count('.skb-block-static'),
    };
  });

  // (a) ZERO of each forbidden editor selector.
  expect(probe.dragHandles, 'data-skb-drag-handle leaked into read route').toBe(0);
  expect(probe.resizeHandles, 'data-skb-resize-handle leaked into read route').toBe(0);
  expect(probe.kebabButtons, 'data-skb-kebab-block-id leaked into read route').toBe(0);
  expect(probe.liveAnnouncer, 'cf-22 .skb-live-announcer leaked into read route').toBe(0);
  expect(probe.blockNodeview, '.skb-block-nodeview wrapper leaked into read route').toBe(0);
  expect(probe.gutter, '.skb-block-nodeview__gutter leaked into read route').toBe(0);
  expect(probe.kindChip, '.skb-block-nodeview__kind-chip leaked into read route').toBe(0);
  expect(probe.editorContent, '.skb-editor-content leaked into read route').toBe(0);
  expect(probe.proseMirror, '.ProseMirror Tiptap render target leaked into read route').toBe(0);

  // (b) Positive lock — at least 8 static wrappers present (sample-blocks
  // fixture has 14 component-block instances; if this falls below 8 the
  // fixture itself regressed or the chrome wrapper got stripped).
  expect(
    probe.blockStatic,
    `read route should render >= 8 .skb-block-static wrappers (got ${probe.blockStatic})`,
  ).toBeGreaterThanOrEqual(8);

  // No SSR or hydration errors mentioning the affordance modules
  // (a stricter signal than the chrome console-error scope from cf-20a).
  expect(
    consoleErrors.filter((m) =>
      /skb-(drag|resize|kebab|live-announcer|block-nodeview)/.test(m),
    ),
  ).toEqual([]);

  await page.screenshot({ fullPage: true, path: SCREENSHOT_PATH });
});
