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

  // Wave 6 carry-forward #18 — every component block kind now mounts via
  // `ReactNodeViewRenderer` → `BlockNodeView` → registry-resolved
  // `EditorView`. Pre-#18 the editor showed 14 placeholder divs reading
  // "{Label} block" (no PDF iframe, no React Flow, no KaTeX, etc.).
  //
  // The NodeView DOM has two layers:
  //   - outer `NodeViewWrapper` → `data-skb-block-kind="<kind>"`
  //     (survives on both registered + unregistered fallback variants)
  //   - inner non-editable host div → `data-skb-block-host="<kind>"`
  //     (only present when the registry resolved a UI for the kind)
  // The `data-skb-block-host` count is therefore the strong assertion
  // for "real component mounted".
  //
  // Strong DOM-marker assertions per kind (counts mirror the production
  // sample-blocks fixture — 4× Callout, 1× Code, 2× Image, 2× Math,
  // 2× Pdf, 1× Jupyter, 1× NnViz, 1× AgentFlow):
  //
  // 1. Each registered NodeView's inner host div carries
  //    `data-skb-block-host` — 14 total (one per fixture instance),
  //    with at least one per kind.
  await expect(editor.locator('[data-skb-block-host]')).toHaveCount(14);
  for (const kind of [
    'callout',
    'componentCode',
    'image',
    'math',
    'pdf',
    'jupyter',
    'nn-viz',
    'agent-flow',
  ] as const) {
    const host = editor.locator(`[data-skb-block-host="${kind}"]`).first();
    await expect(host).toBeVisible({ timeout: 5_000 });
  }
  // 2. None of the NodeViews fell back to the "Unregistered block …"
  //    placeholder (would imply registry not threaded into wireRegistry).
  await expect(
    editor.locator('.skb-block-nodeview--unregistered'),
  ).toHaveCount(0);
  // 3. Real-component DOM markers — proves the registered EditorView
  //    actually mounted, not just an empty NodeViewWrapper:
  await expect(editor.locator('iframe').first()).toBeVisible({ timeout: 5_000 }); // PDF
  await expect(editor.locator('img').first()).toBeVisible({ timeout: 5_000 }); // Image
  await expect(editor.locator('.katex').first()).toBeVisible({ timeout: 5_000 }); // Math
  await expect(editor.locator('.react-flow').first()).toBeVisible({ timeout: 10_000 }); // AgentFlow
  await expect(editor.locator('pre code').first()).toBeVisible({ timeout: 5_000 }); // Code body

  // Wave 6 hotfix Bug B verification: nothing thrown to the page console
  // (the silent-catch class would have hidden a throw, but the test would
  // still see `pageerror` if the React error-boundary surfaced it).
  expect(consoleErrors.filter((m) => /loadFromMdx|mdx-bridge/.test(m))).toEqual([]);

  // Wave 6 carry-forward #19 — visual identity regression lock per
  // ADR-0018 D3 + cf-19 plan. Two assertions:
  //
  //  (a) Each component-block kind has a non-zero per-kind visual
  //      signature on the editor surface. Light blocks + heavy blocks
  //      satisfy this via 2px top stripe; inline math (data-display='false')
  //      satisfies it via the canvas-soft tint background.
  //
  //  (b) The .skb-block-nodeview wrapper has non-zero margin-block so
  //      4 sequential same-kind blocks read as 4 distinct units, plus
  //      the wrapper's outline rule is reachable (proves the
  //      @skb/editor-shell/BlockNodeView.css import in apps/site
  //      global.css is wired through the bundler).
  const visualProbe = await page.evaluate(() => {
    const pm = document.querySelector('.ProseMirror');
    if (!pm) return { error: 'no ProseMirror' };
    const sel = (q: string) => pm.querySelector(q);
    const px = (v: string) => parseFloat(v) || 0;
    const stripe = (kind: string, innerSelector: string) => {
      const host = sel(`[data-skb-block-host="${kind}"]`);
      if (!host) return { kind, error: 'no host' };
      const inner = host.querySelector(innerSelector);
      if (!inner) return { kind, error: `no inner ${innerSelector}` };
      const cs = window.getComputedStyle(inner);
      return {
        kind,
        borderTopWidth: px(cs.borderTopWidth),
        bg: cs.backgroundColor,
      };
    };
    const wrap = sel('.skb-block-nodeview');
    const wrapCs = wrap ? window.getComputedStyle(wrap) : null;
    return {
      perKind: [
        stripe('callout', '[data-callout-variant]'),
        stripe('componentCode', '[data-code-language]'),
        stripe('image', '[data-image-loading]'),
        stripe('math', "[data-block='math']"),
        stripe('pdf', "[data-block='pdf']"),
        stripe('jupyter', "[data-block='jupyter']"),
        stripe('nn-viz', "[data-block='nn-viz']"),
        stripe('agent-flow', "[data-block='agent-flow']"),
      ],
      wrapperMarginTop: wrapCs ? px(wrapCs.marginTop) : 0,
      wrapperMarginBottom: wrapCs ? px(wrapCs.marginBottom) : 0,
      wrapperOutlineStyle: wrapCs?.outlineStyle ?? 'none',
    };
  });
  // (a) Per-kind signature: stripe OR tint.
  for (const entry of visualProbe.perKind ?? []) {
    if ('error' in entry) throw new Error(`visual probe ${entry.kind}: ${entry.error}`);
    const hasStripe = entry.borderTopWidth >= 2;
    const hasTint = entry.bg !== 'rgba(0, 0, 0, 0)' && entry.bg !== 'transparent';
    expect(
      hasStripe || hasTint,
      `kind ${entry.kind} must have a 2px+ top stripe OR a non-transparent background tint (got border-top=${entry.borderTopWidth}px, bg=${entry.bg})`,
    ).toBe(true);
  }
  // (b) Wrapper margin: non-zero on both sides so adjacent blocks breathe.
  expect(visualProbe.wrapperMarginTop ?? 0).toBeGreaterThanOrEqual(8);
  expect(visualProbe.wrapperMarginBottom ?? 0).toBeGreaterThanOrEqual(8);
  // (b cont.) Outline style is 'solid' (the transparent baseline); the color
  // toggles between transparent and accent on selected/focus, but the style
  // staying 'solid' proves the .skb-block-nodeview rule is reachable via
  // the @skb/editor-shell/BlockNodeView.css import in apps/site global.css.
  expect(visualProbe.wrapperOutlineStyle).toBe('solid');

  await page.screenshot({ fullPage: true, path: SCREENSHOT_PATH });
});
