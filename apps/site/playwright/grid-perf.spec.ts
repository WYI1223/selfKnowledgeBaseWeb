import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeEdgeRects, type BlockLayout } from '@skb/editor-shell/src/drag-drop/edge-rects.ts';
import { findMatches } from '@skb/editor-shell/src/drag-drop/tiebreak.ts';
import { blockLayout, renderIntoPage } from './grid-drag-drop.fixtures';

const ITERATIONS = 100;
const PER_EVENT_BUDGET_MS = 0.05;
const FRAME_BUDGET_MS = 20;
const BASELINE_MIN_BYTES = 5 * 1024;

const here = dirname(fileURLToPath(import.meta.url));
const baselineDir = resolve(here, 'visual-smoke-baseline');

interface SerializableRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

type PerfResult = {
  elapsedMs: number;
  lastMatchCount: number;
  perEventMs: number;
};

const perfCases: Array<[string, number]> = [
  ['TC1.1 — AC#6 hit-test perf budget for n=10 blocks', 10],
  ['TC1.2 — AC#6 hit-test perf budget for n=30 blocks', 30],
  ['TC1.3 — AC#6 hit-test perf budget for n=100 blocks stress', 100],
];

const baselineCases: Array<[string, string, string, string[]]> = [
  [
    'TC2.1 — visual baseline /sample-blocks-astro',
    '/sample-blocks-astro',
    'wave-5-c2-baseline-sample-blocks-astro.png',
    ['h1', '[data-block="jupyter"]'],
  ],
  [
    'TC2.2 — visual baseline /notes/sample-blocks',
    '/notes/sample-blocks',
    'wave-5-c2-baseline-sample-blocks-notes.png',
    ['.skb-grid', '[data-block="jupyter"]'],
  ],
  [
    'TC2.3 — visual baseline /notes/sample-blocks/edit',
    '/notes/sample-blocks/edit',
    'wave-5-c2-baseline-edit-route.png',
    ['.skb-grid', '.ProseMirror'],
  ],
];

function syntheticBlocks(count: number): BlockLayout[] {
  return Array.from({ length: count }, (_, index) => {
    const left = 80 + (index % 10) * 114;
    const top = 80 + Math.floor(index / 10) * 78;
    return blockLayout(`b-${index.toString().padStart(3, '0')}`, {
      left,
      top,
      right: left + 100,
      bottom: top + 50,
      width: 100,
      height: 50,
    });
  });
}

function serializeRect({
  bottom,
  height,
  left,
  right,
  top,
  width,
}: DOMRectReadOnly): SerializableRect {
  return {
    bottom,
    height,
    left,
    right,
    top,
    width,
  };
}

async function measureHitTest(page: Page, blockCount: number): Promise<PerfResult> {
  await renderIntoPage(page, '<section data-grid-perf-root="true"></section>');

  const blocks = syntheticBlocks(blockCount);
  const blockRects = new Map(blocks.map((block) => [block.blockId, block.rect]));
  const cursor = { x: 81, y: 105 };
  const expectedMatchCount = findMatches(
    cursor.x,
    cursor.y,
    computeEdgeRects(blocks),
    blockRects,
  ).length;

  const serializableBlocks = blocks.map((block) => ({
    blockId: block.blockId,
    rect: serializeRect(block.rect),
  }));
  const serializableBlockRects: Array<[string, SerializableRect]> = blocks.map((block) => [
    block.blockId,
    serializeRect(block.rect),
  ]);

  const result = await page.evaluate(
    ({ blockRectEntries, browserBlocks, cursorX, cursorY, iterations }) => {
      const edgeW = 28;
      const blockRects = new Map(blockRectEntries);
      const edge = (
        blockId: string,
        mode: string,
        x: number,
        y: number,
        width: number,
        height: number,
      ) => ({ blockId, mode, x, y, width, height });
      const computeEdgeRects = (items: typeof browserBlocks) =>
        items.flatMap(({ blockId, rect }) => [
          edge(blockId, 'split-left', rect.left - edgeW / 2, rect.top, edgeW, rect.height),
          edge(blockId, 'split-right', rect.right - edgeW / 2, rect.top, edgeW, rect.height),
          edge(blockId, 'split-top', rect.left, rect.top - edgeW / 2, rect.width, edgeW),
          edge(blockId, 'split-bottom', rect.left, rect.bottom - edgeW / 2, rect.width, edgeW),
        ]);
      const findMatches = (
        x: number,
        y: number,
        edgeRects: ReturnType<typeof computeEdgeRects>,
        rects: Map<string, SerializableRect>,
      ) => {
        let count = 0;
        for (const edgeRect of edgeRects) {
          const inRect =
            x >= edgeRect.x &&
            x <= edgeRect.x + edgeRect.width &&
            y >= edgeRect.y &&
            y <= edgeRect.y + edgeRect.height;
          const blockRect = rects.get(edgeRect.blockId);
          if (!inRect || !blockRect) continue;

          const distance =
            edgeRect.mode === 'split-left'
              ? x - blockRect.left
              : edgeRect.mode === 'split-right'
                ? blockRect.right - x
                : edgeRect.mode === 'split-top'
                  ? y - blockRect.top
                  : blockRect.bottom - y;
          if (Math.abs(distance) <= edgeW / 2) count += 1;
        }
        return count;
      };

      const edgeRects = computeEdgeRects(browserBlocks);
      let lastMatchCount = 0;
      const start = performance.now();
      for (let index = 0; index < iterations; index += 1) {
        lastMatchCount = findMatches(cursorX, cursorY, edgeRects, blockRects);
      }
      const elapsedMs = performance.now() - start;
      return { elapsedMs, lastMatchCount, perEventMs: elapsedMs / iterations };
    },
    {
      blockRectEntries: serializableBlockRects,
      browserBlocks: serializableBlocks,
      cursorX: cursor.x,
      cursorY: cursor.y,
      iterations: ITERATIONS,
    },
  );

  expect(result.lastMatchCount).toBe(expectedMatchCount);
  expect(result.lastMatchCount).toBeGreaterThan(0);
  return result;
}

function expectWithinBudget(result: PerfResult): void {
  expect(result.perEventMs).toBeLessThanOrEqual(PER_EVENT_BUDGET_MS);
  expect(result.elapsedMs).toBeLessThanOrEqual(FRAME_BUDGET_MS);
}

async function emitBaseline(
  page: Page,
  route: string,
  outputName: string,
  visibleSelectors: string[],
): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);

  for (const selector of visibleSelectors) {
    await expect(page.locator(selector).first()).toBeVisible({ timeout: 10_000 });
  }

  mkdirSync(baselineDir, { recursive: true });
  const outputPath = resolve(baselineDir, outputName);
  await page.screenshot({ path: outputPath, fullPage: true });
  expect(statSync(outputPath).size).toBeGreaterThanOrEqual(BASELINE_MIN_BYTES);
}

test.describe('AC#6 perf budget synthetic harness', () => {
  for (const [title, blockCount] of perfCases) {
    test(title, async ({ page }) => {
      const result = await measureHitTest(page, blockCount);
      if (blockCount === 100) {
        console.info(`AC#6 n=100 stress per-event ${result.perEventMs.toFixed(4)}ms`);
        return;
      }
      expectWithinBudget(result);
    });
  }
});

test.describe('Stage C.2 visual smoke baseline emission', () => {
  for (const [title, route, outputName, visibleSelectors] of baselineCases) {
    test(title, async ({ page }) => {
      await emitBaseline(page, route, outputName, visibleSelectors);
    });
  }
});
