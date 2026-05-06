import { cleanup, render } from '@testing-library/react';
import { type ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { effectiveCellHeight, effectiveColWidth } from '@skb/block-foundation';

import { HeavyBlockBoundary } from '../index';

const pendingLoad = (): Promise<{
  default: ComponentType<Record<string, never>>;
}> => new Promise(() => {});

function getOuter(container: HTMLElement, kind = 'jupyter'): HTMLElement {
  const outer = container.querySelector<HTMLElement>(`[data-block="${kind}"]`);
  if (!outer) {
    throw new Error(`Expected ${kind} boundary container`);
  }
  return outer;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HeavyBlockBoundary v0.5 dims precedence', () => {
  it('gridContext-derived dims are byte-equal to block-foundation helpers', () => {
    const expectedWidth = effectiveColWidth(6, 1200);
    const expectedHeight = effectiveCellHeight(4);

    const { container } = render(
      <HeavyBlockBoundary
        kind="jupyter"
        gridContext={{ colSpan: 6, rowSpan: 4, containerWidth: 1200 }}
        load={pendingLoad}
        childProps={{}}
      />,
    );

    const outer = getOuter(container);
    expect(outer.getAttribute('style')).toBe(
      `width: ${expectedWidth}px; min-height: ${expectedHeight}px;`,
    );
    expect(outer.style.width).toBe(`${expectedWidth}px`);
    expect(outer.style.minHeight).toBe(`${expectedHeight}px`);
  });

  it('geometry override propagates to W5-1 derivation', () => {
    const expectedWidth = effectiveColWidth(6, 600, { rowH: 60 });
    const expectedHeight = effectiveCellHeight(2, { rowH: 60 });

    const { container } = render(
      <HeavyBlockBoundary
        kind="jupyter"
        gridContext={{
          colSpan: 6,
          rowSpan: 2,
          containerWidth: 600,
          geometry: { rowH: 60 },
        }}
        load={pendingLoad}
        childProps={{}}
      />,
    );

    const outer = getOuter(container);
    expect(outer.style.minHeight).toBe(`${expectedHeight}px`);
    expect(outer.style.width).toBe(`${expectedWidth}px`);
    expect(outer.style.minHeight).toBe('134px');
  });

  it('gridContext-only path derives finite dimensions without NaN', () => {
    const expectedWidth = effectiveColWidth(6, 1200);
    const expectedHeight = effectiveCellHeight(4);

    const { container } = render(
      <HeavyBlockBoundary
        kind="jupyter"
        gridContext={{ colSpan: 6, rowSpan: 4, containerWidth: 1200 }}
        load={pendingLoad}
        childProps={{}}
      />,
    );

    const outer = getOuter(container);
    const styleAttr = outer.getAttribute('style') ?? '';
    expect(styleAttr).not.toMatch(/NaN/);
    expect(outer.style.width).toBe(`${expectedWidth}px`);
    expect(outer.style.minHeight).toBe(`${expectedHeight}px`);
  });

  it('explicit dims wins when dims and gridContext are both supplied', () => {
    const { container } = render(
      <HeavyBlockBoundary
        kind="jupyter"
        dims={{ width: 999, height: 888 }}
        gridContext={{ colSpan: 6, rowSpan: 4, containerWidth: 1200 }}
        load={pendingLoad}
        childProps={{}}
      />,
    );

    const outer = getOuter(container);
    expect(outer.style.width).toBe('999px');
    expect(outer.style.minHeight).toBe('888px');
  });

  it('throws on neither dims nor gridContext supplied', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <HeavyBlockBoundary
          kind="jupyter"
          load={pendingLoad}
          childProps={{}}
        />,
      ),
    ).toThrow('HeavyBlockBoundary requires either dims or gridContext');
  });

  it('dims-only path remains backward compatible with v0.4 call sites', () => {
    const { container } = render(
      <HeavyBlockBoundary
        kind="jupyter"
        dims={{ width: 480, height: 360 }}
        load={pendingLoad}
        childProps={{}}
      />,
    );

    const outer = getOuter(container);
    expect(outer.style.width).toBe('480px');
    expect(outer.style.minHeight).toBe('360px');
  });
});
