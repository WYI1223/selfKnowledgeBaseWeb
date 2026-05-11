import { expect, type Page } from '@playwright/test';
import * as React from 'react';

/**
 * Wave 7 Phase 2B.2 (ADR-0020 D2) — the 4-mode classification helpers
 * (`computeExpectedEdgeRect`, `classifyCursor`, `expectEdgeRect`,
 * `match`, `blockLayout`, `blockRectMap`, `EdgeMode`, `Classification`)
 * are removed alongside the deleted `edge-rects` / `tiebreak` modules.
 * Specs that exercised AC#1-#5 (4-mode hit-test) skip with
 * `REMOVED-IN-WAVE-7-PHASE-2B` markers.
 *
 * Remaining helpers: pixel-level block measurement +
 * setContent-based render fixtures (including the React-function-
 * component evaluator used by AC#10 / TC2.x ColRuler + SizeTooltip
 * tests).
 */

export interface BlockBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

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

export async function simulateCursorAt(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y);
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
    return renderJsxMarkup((element.type as (props: unknown) => unknown)(element.props ?? {}));
  }
  if (element.type === React.Fragment || String(element.type).includes('react.fragment')) {
    return renderJsxMarkup(element.props?.['children']);
  }
  if (typeof element.type !== 'string') return renderJsxMarkup(element.props?.['children']);

  const attrs = Object.entries(element.props ?? {}).map(([name, value]) =>
    renderAttr(name, value),
  );
  return `<${element.type}${attrs.join('')}>${renderJsxMarkup(
    element.props?.['children'],
  )}</${element.type}>`;
}
