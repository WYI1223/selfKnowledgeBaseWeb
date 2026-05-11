import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { OutlineOverlay } from '../../drag-drop/outline-overlay';
import type { DropIntent } from '@skb/grid-engine';

afterEach(() => {
  cleanup();
});

function rect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return new DOMRectReadOnly(x, y, width, height);
}

function intent(
  override: Partial<DropIntent> & Pick<DropIntent, 'intent'>,
): DropIntent {
  return {
    col: 0,
    row: 0,
    colSpan: 6,
    rowSpan: 2,
    ...override,
  };
}

function getAccent(container: HTMLElement): HTMLElement {
  const accent = container.querySelector('.skb-grid-outline-accent');
  if (!(accent instanceof HTMLElement)) {
    throw new Error('Outline accent was not rendered');
  }
  return accent;
}

describe('OutlineOverlay (Wave 7 Phase 2B.2 — hole-fill intent rect)', () => {
  const gridRect = rect(0, 0, 1200, 600);
  const oneFrPx = 100;
  const rowPx = 62;

  it('null intent renders base only', () => {
    const { container } = render(
      <OutlineOverlay
        activeIntent={null}
        gridRect={gridRect}
        oneFrPx={oneFrPx}
        rowPx={rowPx}
      />,
    );
    expect(container.querySelectorAll('.skb-grid-outline-base')).toHaveLength(1);
    expect(container.querySelector('.skb-grid-outline-accent')).toBeNull();
  });

  it('place intent renders green-class rect at intent anchor', () => {
    const { container } = render(
      <OutlineOverlay
        activeIntent={intent({ intent: 'place', col: 3, row: 1, colSpan: 6, rowSpan: 2 })}
        gridRect={gridRect}
        oneFrPx={oneFrPx}
        rowPx={rowPx}
      />,
    );
    const accent = getAccent(container);
    expect(accent.className).toContain('skb-grid-outline-accent--place');
    expect(accent.getAttribute('data-skb-drop-intent')).toBe('place');
    expect(accent.style.position).toBe('absolute');
    expect(accent.style.left).toBe('300px'); // 3 * 100
    expect(accent.style.top).toBe('62px'); // 1 * 62
    expect(accent.style.width).toBe('600px'); // 6 * 100
    expect(accent.style.height).toBe('124px'); // 2 * 62
  });

  it('reject intent renders red-class rect at intent anchor', () => {
    const { container } = render(
      <OutlineOverlay
        activeIntent={intent({ intent: 'reject', col: 0, row: 0, colSpan: 6, rowSpan: 2 })}
        gridRect={gridRect}
        oneFrPx={oneFrPx}
        rowPx={rowPx}
      />,
    );
    const accent = getAccent(container);
    expect(accent.className).toContain('skb-grid-outline-accent--reject');
    expect(accent.getAttribute('data-skb-drop-intent')).toBe('reject');
  });

  it('null gridRect renders base only (overlay defensive)', () => {
    const { container } = render(
      <OutlineOverlay
        activeIntent={intent({ intent: 'place' })}
        gridRect={null}
        oneFrPx={oneFrPx}
        rowPx={rowPx}
      />,
    );
    expect(container.querySelectorAll('.skb-grid-outline-base')).toHaveLength(1);
    expect(container.querySelector('.skb-grid-outline-accent')).toBeNull();
  });

  it('unmount cleanup leaves no nodes', () => {
    const host = document.createElement('section');
    const { unmount } = render(
      <OutlineOverlay
        activeIntent={intent({ intent: 'place' })}
        gridRect={gridRect}
        oneFrPx={oneFrPx}
        rowPx={rowPx}
      />,
      { container: host },
    );
    unmount();
    expect(host.childElementCount).toBe(0);
  });
});
