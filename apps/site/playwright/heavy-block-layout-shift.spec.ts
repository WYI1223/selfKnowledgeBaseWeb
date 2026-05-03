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

    // T0: SSR skeleton paint (aria-busy='true')
    const t0Rect = await outer.boundingBox();
    expect(t0Rect).not.toBeNull();
    expect(t0Rect!.width).toBeCloseTo(EXPECTED_DIMS[kind].width, 0);
    expect(t0Rect!.height).toBeGreaterThanOrEqual(EXPECTED_DIMS[kind].height);

    // Wait for boundary settle: aria-busy='false' (Component loaded OR error)
    await expect(outer).toHaveAttribute('aria-busy', 'false', { timeout: 30_000 });

    // T1: post-hydration paint
    const t1Rect = await outer.boundingBox();
    expect(t1Rect).not.toBeNull();

    // ADR-0014 D2 invariant: WIDTH IDENTICAL (strict)
    expect(t1Rect!.width).toBe(t0Rect!.width);

    // ADR-0014 D2 invariant: HEIGHT MONOTONE NON-DECREASING
    expect(t1Rect!.height).toBeGreaterThanOrEqual(t0Rect!.height);

    // Tolerant bound: real content may exceed dims modestly; 200px caps it
    expect(t1Rect!.height).toBeLessThanOrEqual(t0Rect!.height + 200);
  });
}
