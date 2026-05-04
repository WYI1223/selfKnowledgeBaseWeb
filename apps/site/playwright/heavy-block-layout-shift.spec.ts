import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { expect, test } from '@playwright/test';

function isWsl2(): boolean {
  if (/microsoft|wsl/i.test(os.release())) {
    return true;
  }

  try {
    return /microsoft|wsl/i.test(execFileSync('uname', ['-r'], { encoding: 'utf8' }));
  } catch {
    return false;
  }
}

test.skip(isWsl2(), 'Chromium launch is unreliable under WSL2 in this repo');

const HEAVY_KINDS = ['jupyter', 'nn-viz', 'agent-flow'] as const;

// Hard-coded per ADR-0014 D5 + heavy block heavyBoundaryDimensions exports.
// Memory feedback_cross_package_consumer_pattern: duplication catches silent
// regressions on dimension VALUES (vs importing from heavy block packages).
const EXPECTED_DIMS: Record<(typeof HEAVY_KINDS)[number], { width: number; height: number }> = {
  jupyter: { width: 600, height: 400 },
  'nn-viz': { width: 500, height: 400 },
  'agent-flow': { width: 600, height: 400 },
};

for (const kind of HEAVY_KINDS) {
  test(`AC#5 — ${kind} boundary preserves width + min-height (T0 vs T1, no shrink)`, async ({
    page,
  }) => {
    await page.goto('/notes/sample-blocks');

    const selector = `[data-block="${kind}"]`;
    const outer = page.locator(selector);
    await expect(outer).toBeVisible({ timeout: 10_000 });

    // T0: SSR skeleton paint (initial — aria-busy='true')
    const t0Rect = await outer.boundingBox();
    expect(t0Rect).not.toBeNull();
    expect(t0Rect!.width).toBeCloseTo(EXPECTED_DIMS[kind].width, 0);
    expect(t0Rect!.height).toBeGreaterThanOrEqual(EXPECTED_DIMS[kind].height);

    // Settle wait: give the boundary a window to either (a) load the heavy
    // module successfully (Component renders → aria-busy='false'),
    // (b) reject (error UI → aria-busy='false'), OR (c) stay in skeleton
    // state (heavy modules like Pyodide may legitimately fail to finish
    // initialization in the headless CI env without external network /
    // WASM-streaming support — see CI failure on PR #36 R1). The ADR-0014
    // D2 layout invariants (width strict, height monotone) hold across
    // ALL THREE states, so the test does not require the boundary to
    // actually settle to assert layout stability.
    await page.waitForLoadState('networkidle').catch(() => {
      // networkidle may itself timeout if Pyodide WASM streams indefinitely;
      // fall through to fixed wait.
    });
    await page.waitForTimeout(2000);

    // T1: post-settle paint (whichever state the boundary landed in)
    const t1Rect = await outer.boundingBox();
    expect(t1Rect).not.toBeNull();

    // ADR-0014 D2 invariant: WIDTH IDENTICAL (strict; styled inline px)
    expect(t1Rect!.width).toBe(t0Rect!.width);

    // ADR-0014 D2 invariant: HEIGHT MONOTONE NON-DECREASING (min-height
    // contract; container never shrinks regardless of load state)
    expect(t1Rect!.height).toBeGreaterThanOrEqual(t0Rect!.height);

    // Tolerant bound: real content may exceed dims modestly; 200px caps
    // the practical no-major-shift semantic
    expect(t1Rect!.height).toBeLessThanOrEqual(t0Rect!.height + 200);
  });
}

for (const kind of HEAVY_KINDS) {
  test(`AC#16 — ${kind} boundary hydrates client:load (aria-busy false or data-loaded true)`, async ({
    page,
  }) => {
    await page.goto('/notes/sample-blocks');
    await page.waitForLoadState('load');

    const selector = `[data-block="${kind}"]`;
    const outer = page.locator(selector);
    await expect(outer).toBeVisible({ timeout: 10_000 });

    await expect
      .poll(
        async () => {
          const ariaBusy = await outer.getAttribute('aria-busy');
          const outerLoaded = await outer.getAttribute('data-loaded');
          const loadedDescendants = await outer.locator('[data-loaded="true"]').count();

          return ariaBusy === 'false' || outerLoaded === 'true' || loadedDescendants > 0;
        },
        {
          message: `${kind} should leave the SSR-only skeleton state after client hydration`,
          timeout: 20_000,
        },
      )
      .toBe(true);
  });
}
