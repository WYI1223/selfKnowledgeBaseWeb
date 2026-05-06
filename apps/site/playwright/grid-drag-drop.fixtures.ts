import { expect, type Page } from '@playwright/test';
import * as React from 'react';
import {
  computeEdgeRects,
  type BlockLayout,
  type EdgeMode,
} from '@skb/editor-shell/src/drag-drop/edge-rects.ts';
import { findMatches, tiebreak, type EdgeMatch } from '@skb/editor-shell/src/drag-drop/tiebreak.ts';

export interface BlockBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ExpectedEdgeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Classification = EdgeMode | 'empty' | 'none';

const EDGE_W = 28;

export async function measureBlockBounds(page: Page, blockKind: string): Promise<BlockBounds> {
  const block = page.locator(`[data-block="${blockKind}"]`).first();
  await expect(block).toBeVisible({ timeout: 10_000 });

  const box = await block.boundingBox();
  if (!box) {
    throw new Error(`No bounding box for [data-block="${blockKind}"]`);
  }

  return {
    left: box.x,
    top: box.y,
    right: box.x + box.width,
    bottom: box.y + box.height,
    width: box.width,
    height: box.height,
  };
}

export function computeExpectedEdgeRect(bounds: BlockBounds, mode: EdgeMode): ExpectedEdgeRect {
  switch (mode) {
    case 'split-left':
      return {
        x: bounds.left - EDGE_W / 2,
        y: bounds.top,
        width: EDGE_W,
        height: bounds.height,
      };
    case 'split-right':
      return {
        x: bounds.right - EDGE_W / 2,
        y: bounds.top,
        width: EDGE_W,
        height: bounds.height,
      };
    case 'split-top':
      return {
        x: bounds.left,
        y: bounds.top - EDGE_W / 2,
        width: bounds.width,
        height: EDGE_W,
      };
    case 'split-bottom':
      return {
        x: bounds.left,
        y: bounds.bottom - EDGE_W / 2,
        width: bounds.width,
        height: EDGE_W,
      };
  }
}

export async function simulateCursorAt(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y);
}

export function rectFromBounds(bounds: BlockBounds): DOMRectReadOnly {
  return {
    x: bounds.left,
    y: bounds.top,
    left: bounds.left,
    top: bounds.top,
    right: bounds.right,
    bottom: bounds.bottom,
    width: bounds.width,
    height: bounds.height,
    toJSON: () => bounds,
  };
}

export function blockLayout(blockId: string, bounds: BlockBounds): BlockLayout {
  return { blockId, rect: rectFromBounds(bounds) };
}

export function blockRectMap(blockId: string, bounds: BlockBounds): Map<string, DOMRectReadOnly> {
  return new Map([[blockId, rectFromBounds(bounds)]]);
}

export function classifyCursor(bounds: BlockBounds, x: number, y: number): Classification {
  const blockId = 'fixture';
  const edgeRects = computeEdgeRects([blockLayout(blockId, bounds)]);
  const matches = findMatches(x, y, edgeRects, blockRectMap(blockId, bounds));
  const winner = tiebreak(matches, { vx: 0, vy: 0 });
  if (winner) return winner.mode;

  const inside = x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  return inside ? 'none' : 'empty';
}

export function expectEdgeRect(actual: unknown, expected: ExpectedEdgeRect): void {
  const edgeRect = actual as ExpectedEdgeRect;
  expect(edgeRect.x).toBeCloseTo(expected.x, 4);
  expect(edgeRect.y).toBeCloseTo(expected.y, 4);
  expect(edgeRect.width).toBeCloseTo(expected.width, 4);
  expect(edgeRect.height).toBeCloseTo(expected.height, 4);
}

export function match(
  blockId: string,
  mode: EdgeMode,
  distance: number,
  left: number,
  top: number,
): EdgeMatch {
  return { blockId, mode, distance, blockBounds: { left, top } };
}

export async function readStaticLayer(page: Page, blockKind: string) {
  return page.evaluate((kind) => {
    const grid = document.querySelector<HTMLElement>('.skb-grid');
    const block = document.querySelector<HTMLElement>(`[data-block="${kind}"]`);
    if (!grid || !block) throw new Error(`Missing grid or [data-block="${kind}"]`);

    const gridStyle = getComputedStyle(grid);
    const blockStyle = getComputedStyle(block);
    return {
      gridTemplateColumns: gridStyle.gridTemplateColumns,
      gridAutoRows: gridStyle.gridAutoRows,
      gap: gridStyle.gap,
      blockGridColumn: blockStyle.gridColumn,
      blockGridRow: blockStyle.gridRow,
    };
  }, blockKind);
}

export async function visibleOverlayClasses(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>('[class*="overlay"]'))
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .flatMap((element) => Array.from(element.classList))
      .sort();
  });
}

export function renderIntoPage(page: Page, markup: string): Promise<void> {
  return page.setContent('<' + 'main' + '>' + markup + '</' + 'main' + '>');
}

type JsxLikeElement = {
  type: unknown;
  props?: Record<string, unknown>;
};

const UNIT_LESS_STYLE_PROPS = new Set(['opacity', 'zIndex']);

function stringifyMarkupValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value) ?? '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function cssName(prop: string): string {
  return prop.startsWith('--') ? prop : prop.replace(/[A-Z]/g, '-$&').toLowerCase();
}

function styleToCss(style: Record<string, unknown>): string {
  return Object.entries(style)
    .map(([prop, value]) => {
      const cssValue =
        typeof value === 'number' && !UNIT_LESS_STYLE_PROPS.has(prop) && !prop.startsWith('--')
          ? `${value}px`
          : stringifyMarkupValue(value);
      return `${cssName(prop)}:${cssValue}`;
    })
    .join(';');
}

function renderAttr(name: string, value: unknown): string {
  if (value === undefined || value === null || value === false) return '';
  if (name === 'children' || name === 'key') return '';
  if (name === 'className') return ` class="${escapeHtml(stringifyMarkupValue(value))}"`;
  if (name === 'style' && isRecord(value)) {
    return ` style="${escapeHtml(styleToCss(value))}"`;
  }
  return ` ${name}="${escapeHtml(stringifyMarkupValue(value))}"`;
}

export function renderJsxMarkup(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escapeHtml(String(node));
  if (Array.isArray(node)) return node.map(renderJsxMarkup).join('');

  const element = node as JsxLikeElement;
  if (typeof element.type === 'function') {
    return renderJsxMarkup(element.type(element.props ?? {}));
  }
  if (element.type === React.Fragment || String(element.type).includes('react.fragment')) {
    return renderJsxMarkup(element.props?.children);
  }
  if (typeof element.type !== 'string') return renderJsxMarkup(element.props?.children);

  const attrs = Object.entries(element.props ?? {}).map(([name, value]) => renderAttr(name, value));
  return `<${element.type}${attrs.join('')}>${renderJsxMarkup(
    element.props?.children,
  )}</${element.type}>`;
}
