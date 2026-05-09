import type { Page, Locator } from '@playwright/test';

/**
 * @apps/site/playwright/helpers — pointer-event boilerplate for the
 * cf-20d resize wire integration tests.
 *
 * Wave 6 cf-20d R2 (2026-05-09) — extraction motivated by the spec
 * file growing past the 500-line size-check hard limit after R2 F2
 * test addition. The pointer-event sequence (pointerdown via
 * locator.dispatchEvent → rAF gap → window pointermove → rAF gap →
 * window pointerup → 2-rAF gap for re-measure) is verbatim across
 * all 3 commit-style tests; consolidating here keeps the spec
 * focused on assertions.
 *
 * The helpers DO NOT take a Playwright page over the network bridge
 * for each line; they batch the pointer events into single
 * `page.evaluate` calls when possible to keep the cross-process
 * round-trip count low.
 */

const POINTER_OPTS = {
  button: 0,
  pointerId: 1,
  pointerType: 'mouse',
} as const;

/**
 * Wait for one animation frame from the page side. Used as the
 * "React commit barrier" between event dispatches per the cf-20c-2
 * R1 reflection rule (React state from one dispatch must commit
 * before the next dispatch's closure-captured reads).
 */
export async function rafBarrier(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      ),
  );
}

/**
 * Wait for two animation frames (the pipeline's post-mutation
 * re-measure budget: React commit + browser layout pass per
 * cf-20c-2 R2 F2).
 */
export async function doubleRafBarrier(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve()),
        ),
      ),
  );
}

/**
 * Dispatch pointerdown on the handle locator at the given client
 * coordinates. Uses `locator.dispatchEvent` so the event bubbles
 * from the actual DOM element (avoids `elementFromPoint` hit-test
 * fragility under negative-offset positioning that the resize
 * handles use).
 */
export async function pointerDownOn(
  handle: Locator,
  clientX: number,
  clientY: number,
): Promise<void> {
  await handle.dispatchEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    ...POINTER_OPTS,
  });
}

/**
 * Dispatch pointermove on `window` at the given client coordinates.
 * The cf-20d pipeline's pointermove listener is window-level (added
 * via useEffect when pipeline.active === true), so the event must
 * be dispatched on the window object — not on the handle.
 */
export async function windowPointerMove(
  page: Page,
  clientX: number,
  clientY: number,
): Promise<void> {
  await page.evaluate(
    ({ x, y, opts }: { x: number; y: number; opts: typeof POINTER_OPTS }) => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          ...opts,
        }),
      );
    },
    { x: clientX, y: clientY, opts: POINTER_OPTS },
  );
}

/**
 * Dispatch pointerup on `window`. Same window-level rationale as
 * `windowPointerMove`.
 */
export async function windowPointerUp(
  page: Page,
  clientX: number,
  clientY: number,
): Promise<void> {
  await page.evaluate(
    ({ x, y, opts }: { x: number; y: number; opts: typeof POINTER_OPTS }) => {
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          ...opts,
        }),
      );
    },
    { x: clientX, y: clientY, opts: POINTER_OPTS },
  );
}

/**
 * Composed: full resize lifecycle — pointerdown on the handle,
 * single rAF, pointermove on window, single rAF, pointerup on
 * window, 2 rAFs, settle wait. Matches the canonical sequence
 * used by all 3 commit-style cf-20d tests.
 *
 * Caller passes the down + target coordinates; the helper handles
 * the rAF barriers + post-commit settle.
 */
export async function dispatchResizeGesture(
  page: Page,
  handle: Locator,
  downX: number,
  downY: number,
  targetX: number,
  targetY: number,
): Promise<void> {
  await pointerDownOn(handle, downX, downY);
  await rafBarrier(page);
  await windowPointerMove(page, targetX, targetY);
  await rafBarrier(page);
  await windowPointerUp(page, targetX, targetY);
  await doubleRafBarrier(page);
  await page.waitForTimeout(300);
}
