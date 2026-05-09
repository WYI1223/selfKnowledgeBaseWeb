import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 cf-20a (2026-05-09) — read-route chrome single-source lock.
 *
 * The static read route `/notes/<slug>` mounts each block via
 * `apps/site/src/components.ts` componentsMap. Pre-cf-20a each block's
 * inner CSS rule (`[data-callout-variant]`, `[data-block='math']`,
 * etc.) painted its own border + per-kind stripe; the editor wrapper
 * `.skb-block-nodeview` painted a SECOND chrome on top, with cf-19 R2
 * P3 suppressing the inner one only on the editor path.
 *
 * cf-20a moves the chrome to a single source — `block-chrome.css` in
 * `@skb/editor-shell/src/` — consumed by both the editor wrapper
 * `.skb-block-nodeview` AND a NEW `.skb-block-static` wrapper emitted
 * by:
 *   - the 5 light blocks via `makeMdxAdapter(RenderView, kind)` in
 *     `apps/site/src/lib/mdx-adapter.ts`
 *   - the 3 heavy blocks via the Astro wrappers
 *     `apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro`
 *
 * This spec verifies:
 *  (a) Every kind on the read route is wrapped in `.skb-block-static`
 *      with `data-skb-block-kind` matching the BlockKind literal.
 *  (b) The wrapper resolves the per-kind 2px top stripe (width >= 2,
 *      solid, non-transparent color); 7 unique colors across 8 kinds
 *      because callout + componentCode share `--accent-runnable`.
 *  (c) The wrapper carries the v2 `.gblock` card chrome — border-left
 *      >= 1px solid, border-radius >= 6px, non-transparent surface bg,
 *      margin-block >= 8px on each side.
 *
 * Pairs with `sample-blocks-edit-loads.spec.ts` which exercises the
 * editor-mount path (`.skb-block-nodeview`). Both routes consume the
 * same `block-chrome.css`, so a regression to one usually shows up in
 * the other.
 */

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-20a-sample-blocks-read.png',
);

test('sample-blocks read route shares v2 .gblock chrome via .skb-block-static (cf-20a single source)', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto('/notes/sample-blocks');

  // Static SSR renders synchronously, but heavy-block islands hydrate
  // client-side. Wait for the first card to be present before probing.
  await expect(page.locator('.skb-block-static').first()).toBeVisible({
    timeout: 15_000,
  });

  // Each kind in the sample-blocks fixture maps 1:1 to a BlockKind
  // literal that matches `data-skb-block-kind`. block-Code's literal
  // is `componentCode` (cf-15b ProseMirror namespace rename).
  const visualProbe = await page.evaluate(() => {
    const px = (v: string) => parseFloat(v) || 0;

    const wrappers = Array.from(
      document.querySelectorAll('.skb-block-static'),
    );

    const stripeByKind = (kind: string) => {
      const wrap = document.querySelector(
        `.skb-block-static[data-skb-block-kind="${kind}"]`,
      );
      if (!wrap) return { kind, error: 'no wrapper' };
      const cs = window.getComputedStyle(wrap);
      return {
        kind,
        borderTopWidth: px(cs.borderTopWidth),
        borderTopStyle: cs.borderTopStyle,
        borderTopColor: cs.borderTopColor,
      };
    };

    const firstWrap = wrappers[0] ?? null;
    const firstCs = firstWrap ? window.getComputedStyle(firstWrap) : null;
    return {
      wrapperCount: wrappers.length,
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
    if ('error' in entry) {
      throw new Error(
        `read-route visual probe ${entry.kind}: ${entry.error} — ` +
          `expected a .skb-block-static[data-skb-block-kind="${entry.kind}"] in the read route DOM`,
      );
    }
    expect(
      entry.borderTopWidth,
      `kind ${entry.kind} static wrapper must carry a 2px+ top stripe (got ${entry.borderTopWidth}px)`,
    ).toBeGreaterThanOrEqual(2);
    expect(entry.borderTopStyle).toBe('solid');
    expect(entry.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
  }

  // (b) Stripe colors are distinct across kinds: 7 unique computed
  //     colors (callout + componentCode share runnable hue per cf-19
  //     D2 / ADR-0018 D3).
  const stripeColors = (visualProbe.kinds ?? [])
    .map((e) => ('error' in e ? null : e.borderTopColor))
    .filter((c): c is string => c !== null);
  const uniqueColors = new Set(stripeColors);
  expect(
    uniqueColors.size,
    `read-route stripe colors are distinct across kinds: expected 7 unique computed colors (callout & componentCode share runnable hue), got ${uniqueColors.size} from [${stripeColors.join(', ')}]`,
  ).toBe(7);

  // Sanity: callout and componentCode (the hue-sharing pair) MUST
  // resolve to the same color on the read route too.
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
  expect(visualProbe.cardChrome?.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(visualProbe.cardChrome?.marginTop ?? 0).toBeGreaterThanOrEqual(8);
  expect(visualProbe.cardChrome?.marginBottom ?? 0).toBeGreaterThanOrEqual(8);

  // No SSR errors leaked into the page console.
  expect(
    consoleErrors.filter((m) => /skb-block-static|block-chrome/.test(m)),
  ).toEqual([]);

  await page.screenshot({ fullPage: true, path: SCREENSHOT_PATH });
});
