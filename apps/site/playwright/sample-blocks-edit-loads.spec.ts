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
  //    `data-skb-block-host` — 14 component-block instances (one per
  //    fixture), with at least one per kind. Wave 6 cf-25 — count
  //    component-block hosts only (exclude markdown wrapper-blocks
  //    added by the chunking pass; markdown chunk count is asserted
  //    by sample-blocks-markdown-blocks.spec.ts).
  await expect(
    editor.locator('[data-skb-block-host]:not([data-skb-block-host="markdown"])'),
  ).toHaveCount(14);
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

  // Wave 6 carry-forward #19 v0.2 + R2 — v2 `.gblock` card chrome
  // regression lock per /mnt/d/download/web/v2-styles.css:154-249
  // reference design. R2 P4 fix: stripe color distinctness assertion
  // catches "all kinds share fallback color" / "wrong kind→hue mapping"
  // regressions.
  //
  // Wave 6 carry-forward #20a (2026-05-09) — chrome single-source
  // migration. The card border + per-kind 2px top stripe now resolve
  // through `@skb/editor-shell/src/block-chrome.css` (shared with the
  // read-route `.skb-block-static` wrapper). Pre-cf-20a both the
  // wrapper rule AND each block's inner CSS painted a stripe; cf-19 R2
  // P3 added a `.skb-block-nodeview <inner> { border-top: 0 }` nested
  // suppression. cf-20a deletes BOTH the inner stripe rules and the
  // suppression block. The assertions below remain valid because
  // block-chrome.css is now the only stripe authority — wrapper and
  // wrapped both resolve through one rule.
  //
  // Four assertion families:
  //
  //  (a) Per-kind 2px top stripe lives on the .skb-block-nodeview
  //      wrapper (cf-19 v0.2 D2 — moved from inner component CSS so
  //      the stripe sits flush with the card top edge; cf-20a keeps
  //      this on the wrapper, just sourced from the shared
  //      block-chrome.css). Width≥2 + style solid + color
  //      non-transparent FOR ALL 8 KINDS.
  //
  //  (b) (R2 P4) stripe colors are distinct across kinds: 7 unique
  //      computed colors (callout + componentCode intentionally share
  //      the runnable hue; the other 6 are unique per ADR-0018 D3).
  //      Distinctness is sufficient to detect "all kinds resolved to
  //      the same fallback" / "wrong kind→hue mapping" without doing
  //      OKLCH→rgb token math in the test.
  //
  //  (c) Wrapper carries the v2 .gblock card chrome — border, radius,
  //      surface bg, margin-block. Hover/selected toggles stay
  //      testable via static computed-style probes.
  //
  //  (d) Per-block .skb-block-nodeview__gutter shell exists with kind
  //      chip whose text matches the kind (collapsing the cf-15b
  //      internal `componentCode` rename back to user-facing `code`).
  //      4 sequential same-kind blocks each get their own chip →
  //      visually distinct.
  const visualProbe = await page.evaluate(() => {
    const pm = document.querySelector('.ProseMirror');
    if (!pm) return { error: 'no ProseMirror' };
    const px = (v: string) => parseFloat(v) || 0;

    const wrappers = Array.from(pm.querySelectorAll('.skb-block-nodeview'));
    const stripeByKind = (kind: string) => {
      const wrap = pm.querySelector(`.skb-block-nodeview[data-skb-block-kind="${kind}"]`);
      if (!wrap) return { kind, error: 'no wrapper' };
      const cs = window.getComputedStyle(wrap);
      const gutter = wrap.querySelector('.skb-block-nodeview__gutter');
      const chip = wrap.querySelector('.skb-block-nodeview__kind-chip');
      return {
        kind,
        borderTopWidth: px(cs.borderTopWidth),
        borderTopStyle: cs.borderTopStyle,
        borderTopColor: cs.borderTopColor,
        gutterPresent: gutter !== null,
        chipText: chip?.textContent?.trim() ?? null,
      };
    };

    const firstWrap = wrappers[0] ?? null;
    const firstCs = firstWrap ? window.getComputedStyle(firstWrap) : null;
    return {
      kinds: [
        stripeByKind('callout'),
        stripeByKind('componentCode'),
        stripeByKind('image'),
        stripeByKind('math'),
        stripeByKind('pdf'),
        stripeByKind('jupyter'),
        stripeByKind('nn-viz'),
        stripeByKind('agent-flow'),
      ],
      wrapperCount: wrappers.length,
      // .gblock card chrome on first wrapper (any wrapper would do; all
      // share the base card rules)
      cardChrome: firstCs
        ? {
            borderLeftWidth: px(firstCs.borderLeftWidth),
            borderLeftStyle: firstCs.borderLeftStyle,
            borderRadius: firstCs.borderTopLeftRadius,
            backgroundColor: firstCs.backgroundColor,
            marginTop: px(firstCs.marginTop),
            marginBottom: px(firstCs.marginBottom),
          }
        : null,
    };
  });

  // (a) Per-kind 2px wrapper stripe present on all 8 kinds.
  for (const entry of visualProbe.kinds ?? []) {
    if ('error' in entry) throw new Error(`visual probe ${entry.kind}: ${entry.error}`);
    expect(
      entry.borderTopWidth,
      `kind ${entry.kind} wrapper must carry a 2px+ top stripe (got ${entry.borderTopWidth}px)`,
    ).toBeGreaterThanOrEqual(2);
    expect(entry.borderTopStyle).toBe('solid');
    // Color must not be transparent (means the per-kind rule resolved
    // a real --accent-X token, not the wrapper's default black border).
    expect(entry.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
  }

  // (b) (R2 P4) stripe colors are distinct across kinds. 7 unique
  // computed colors expected (callout & componentCode share the
  // runnable hue per ADR-0018 D3 + cf-19 D2 table); the 6 single-hue
  // kinds (image / math / pdf / jupyter / nn-viz / agent-flow) plus
  // the shared runnable hue = 7 unique colors. This catches "all
  // kinds resolved to the same fallback" / "wrong kind→hue mapping"
  // without browser-specific OKLCH→rgb math.
  const stripeColors = (visualProbe.kinds ?? [])
    .map((e) => ('error' in e ? null : e.borderTopColor))
    .filter((c): c is string => c !== null);
  const uniqueColors = new Set(stripeColors);
  expect(
    uniqueColors.size,
    `stripe colors are distinct across kinds: expected 7 unique computed colors (callout & componentCode share runnable hue), got ${uniqueColors.size} from [${stripeColors.join(', ')}]`,
  ).toBe(7);
  // Sanity: callout and componentCode (the hue-sharing pair) MUST
  // resolve to the same color.
  const calloutColor = visualProbe.kinds?.find(
    (e) => !('error' in e) && e.kind === 'callout',
  );
  const codeColor = visualProbe.kinds?.find(
    (e) => !('error' in e) && e.kind === 'componentCode',
  );
  expect(
    calloutColor && !('error' in calloutColor) ? calloutColor.borderTopColor : null,
  ).toBe(codeColor && !('error' in codeColor) ? codeColor.borderTopColor : 'unreachable');

  // (c) v2 .gblock card chrome on wrapper.
  expect(visualProbe.cardChrome?.borderLeftWidth ?? 0).toBeGreaterThanOrEqual(1);
  expect(visualProbe.cardChrome?.borderLeftStyle).toBe('solid');
  expect(parseFloat(visualProbe.cardChrome?.borderRadius ?? '0')).toBeGreaterThanOrEqual(6);
  // Background must be non-transparent (the v2 surface white).
  expect(visualProbe.cardChrome?.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  // Margin-block: at least 8px on each side so adjacent cards breathe.
  expect(visualProbe.cardChrome?.marginTop ?? 0).toBeGreaterThanOrEqual(8);
  expect(visualProbe.cardChrome?.marginBottom ?? 0).toBeGreaterThanOrEqual(8);

  // (d) Gutter shell + kind chip per kind. Chip text equals the kind
  // name except `componentCode` collapses to `code`.
  for (const entry of visualProbe.kinds ?? []) {
    if ('error' in entry) continue;
    expect(entry.gutterPresent, `kind ${entry.kind} missing gutter shell`).toBe(true);
    const expectedChip = entry.kind === 'componentCode' ? 'code' : entry.kind;
    expect(entry.chipText).toBe(expectedChip);
  }

  await page.screenshot({ fullPage: true, path: SCREENSHOT_PATH });
});
