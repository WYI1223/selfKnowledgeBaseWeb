import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import * as designTokens from '../index';

const { tokens, themeNames, STORAGE_KEY } = designTokens;
const fallbackPath = resolve(process.cwd(), 'src/tokens-fallback.css');

type TokensV2Shape = {
  color: Record<string, string>;
  layout: Record<string, string>;
  font: Record<string, string>;
  accentKind?: Record<string, string>;
};

const expectedAccentKindVarsV2 = {
  accentCanvas: 'var(--accent-canvas)',
  accentRunnable: 'var(--accent-runnable)',
  accentImage: 'var(--accent-image)',
  accentMath: 'var(--accent-math)',
  accentPdf: 'var(--accent-pdf)',
  accentJupyter: 'var(--accent-jupyter)',
  accentNnViz: 'var(--accent-nn-viz)',
  accentAgentFlow: 'var(--accent-agent-flow)',
} as const;

const expectedBaseFallbacks: Record<string, string> = {
  bg: '#fefbf8',
  panel: '#faf8f5',
  border: '#e6e4e1',
  'border-strong': '#d3d1cd',
  text: '#1d1a15',
  'text-2': '#58554f',
  'text-3': '#898680',
  accent: '#c64e31',
  'accent-soft': '#ffe9e0',
  'accent-success': '#6cb26f',
  canvas: '#0092b0',
  'canvas-soft': '#e3faff',
  'grid-line': '#e0deda',
  'grid-line-strong': '#c6c4c0',
};

const expectedAccentKindFallbacks: Record<string, string> = {
  'accent-canvas': '#0092b0',
  'accent-runnable': '#2f7434',
  'accent-image': '#ac713e',
  'accent-math': '#5552bb',
  'accent-pdf': '#b73f6e',
  'accent-jupyter': '#b08a00',
  'accent-nn-viz': '#93329a',
  'accent-agent-flow': '#008974',
};

function readFallbacks(): Record<string, string> {
  const css = readFileSync(fallbackPath, 'utf8');
  const actual: Record<string, string> = {};
  for (const match of css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)) {
    const [, tokenName, hexValue] = match;
    if (tokenName && hexValue) actual[tokenName] = hexValue;
  }
  return actual;
}

function getTokensV2(): TokensV2Shape {
  const tokensV2 = (designTokens as { tokensV2?: TokensV2Shape }).tokensV2;
  expect(tokensV2).toBeDefined();
  return tokensV2!;
}

describe('design-tokens public API', () => {
  it('exposes both light and dark theme names', () => {
    expect(themeNames).toEqual(['light', 'dark']);
  });

  it('STORAGE_KEY is the shared storage key', () => {
    expect(STORAGE_KEY).toBe('skb-theme');
  });

  it('color tokens use CSS var notation', () => {
    expect(tokens.color.bg).toMatch(/^var\(--color-bg\)$/);
    expect(tokens.color.accent).toMatch(/^var\(--color-accent\)$/);
  });

  it('space tokens use CSS var notation', () => {
    expect(tokens.space['4']).toMatch(/^var\(--space-4\)$/);
  });

  it('exposes 13 color tokens (6 surface + 2 accent + 5 semantic)', () => {
    expect(Object.keys(tokens.color)).toHaveLength(13);
  });

  it('exposes 15 v2 visual color tokens (14 OKLCH + 1 hex --surface)', () => {
    expect(getTokensV2().color).toEqual({
      bg: 'var(--bg)',
      panel: 'var(--panel)',
      surface: 'var(--surface)',
      border: 'var(--border)',
      borderStrong: 'var(--border-strong)',
      text: 'var(--text)',
      text2: 'var(--text-2)',
      text3: 'var(--text-3)',
      accent: 'var(--accent)',
      accentSoft: 'var(--accent-soft)',
      accentSuccess: 'var(--accent-success)',
      canvas: 'var(--canvas)',
      canvasSoft: 'var(--canvas-soft)',
      gridLine: 'var(--grid-line)',
      gridLineStrong: 'var(--grid-line-strong)',
    });
  });

  it('exposes 3 v2 layout tokens (--row-h / --gap / --radius)', () => {
    expect(getTokensV2().layout).toEqual({
      rowH: 'var(--row-h)',
      gap: 'var(--gap)',
      radius: 'var(--radius)',
    });
  });

  it('exposes 2 v2 font tokens (--sans / --mono)', () => {
    expect(getTokensV2().font).toEqual({
      sans: 'var(--sans)',
      mono: 'var(--mono)',
    });
  });

  it('exposes 8 v2 block-kind hue tokens', () => {
    expect(getTokensV2().accentKind).toEqual(expectedAccentKindVarsV2);
    expect(Object.keys(getTokensV2().accentKind ?? {})).toHaveLength(8);
  });

  it('OKLCH→hex fallback covers all 8 v2 block-kind hues', () => {
    const actual = readFallbacks();

    for (const [tokenName, hexValue] of Object.entries(expectedAccentKindFallbacks)) {
      expect(actual[tokenName]).toBe(hexValue);
    }
  });

  it('OKLCH→hex fallback values are stable (Culori snapshot guard)', () => {
    const expected: Record<string, string> = {
      ...expectedBaseFallbacks,
      ...expectedAccentKindFallbacks,
    };
    const actual = readFallbacks();

    expect(actual).toEqual(expected);
    expect(Object.values(actual)).toEqual(
      expect.arrayContaining(Object.values(expected)),
    );
    for (const value of Object.values(actual)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
