import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 hotfix regression — pre-hotfix `/notes/sample-blocks/edit`
 * mounted but the editor body was empty (`EDIT_BLOCKS_COUNT=0`,
 * `EDIT_TEXT_LEN=0`) because `mdxToTiptap` threw on the 11
 * `mdxFlowExpression` author comments in `content/notes/sample-blocks/index.mdx`
 * and `EditorShellMount.handleCreate` swallowed the throw silently.
 * This spec is the user-visible regression lock: open the real edit
 * route and assert the editor's `.ProseMirror` actually contains
 * recognizable note content (not just `<p><br></p>`).
 *
 * Pairs with `packages/mdx-bridge/src/__tests__/mdx-flow-expression.test.ts`
 * which asserts the parser-level fix.
 */

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-hotfix-sample-blocks-edit-loads.png',
);

test('sample-blocks edit route loads non-empty content (mdxFlowExpression no longer breaks)', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto('/notes/sample-blocks/edit');

  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });

  // Give Tiptap + the loadWithFallback chain time to populate the doc.
  await expect(async () => {
    const text = (await editor.textContent()) ?? '';
    expect(text.length).toBeGreaterThan(50);
  }).toPass({ timeout: 10_000 });

  // The fixture body opens with "This page is the Wave 2 close acceptance
  // criterion (Z0)." — a stable substring that proves the prose layer
  // round-tripped through mdxToTiptap.
  await expect(editor).toContainText('Wave 2 close acceptance criterion', { timeout: 10_000 });

  // Wave 6 carry-forward #15a — `@tiptap/extension-link` is now
  // registered, so markdown links (e.g. the `[@skb/heavy-block-boundary](...)`
  // reference inside the sample-blocks intro) survive into the editor
  // as actual anchor elements rather than getting stripped by
  // the `EDITOR_UNSUPPORTED_MARKS` sanitizer.
  await expect(editor.locator('a').first()).toBeVisible({ timeout: 5_000 });

  // Wave 6 carry-forward #15b — block-Code Tiptap node was renamed
  // from `code` to `componentCode`, freeing StarterKit's inline `code`
  // mark from the ProseMirror namespace collision. The sample-blocks
  // intro paragraph contains backticked terms like `mdx-bridge` and
  // `apps/site` that should now render as inline `<code>` elements
  // (Tiptap renders the `code` mark as a `<code>` element by default).
  // Pre-#15b they appeared as plain text.
  await expect(editor.locator('code').first()).toBeVisible({ timeout: 5_000 });

  // The legacy load-error banner must NOT be present.
  await expect(page.locator('[data-skb-load-error]')).toHaveCount(0);

  // Wave 6 carry-forward #16 — the 4 blocks Pdf / Jupyter / NnViz /
  // AgentFlow that previously parse-failed under JSX expression form
  // (`page={1}`, `code={`...`}`, `layers={[{...}]}`, `nodes={[{...}]}`)
  // now route through `evalAttrExpression` (block-foundation) and
  // produce real Tiptap nodes. Pre-#16 they degraded to softParse
  // placeholders matching `[unsupported block <Pdf>: ...]`. Assert
  // none of those placeholders survive into the editor.
  await expect(
    editor.locator('text=/\\[unsupported block </'),
  ).toHaveCount(0);

  // Wave 6 hotfix Bug B verification: nothing thrown to the page console
  // (the silent-catch class would have hidden a throw, but the test would
  // still see `pageerror` if the React error-boundary surfaced it).
  expect(consoleErrors.filter((m) => /loadFromMdx|mdx-bridge/.test(m))).toEqual([]);

  await page.screenshot({ fullPage: true, path: SCREENSHOT_PATH });
});
