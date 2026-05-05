import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { OutlineOverlay } from '../../drag-drop/outline-overlay';
import type { EdgeMatch } from '../../drag-drop/tiebreak';

afterEach(() => {
  cleanup();
});

function rect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return new DOMRectReadOnly(x, y, width, height);
}

function activeMatch(mode: EdgeMatch['mode'], blockId = 'b1'): EdgeMatch {
  return { blockId, mode, distance: 4, blockBounds: { left: 100, top: 50 } };
}

function getAccent(container: HTMLElement): HTMLElement {
  const accent = container.querySelector('.skb-grid-outline-accent');
  if (!(accent instanceof HTMLElement)) {
    throw new Error('Outline accent was not rendered');
  }
  return accent;
}

describe('OutlineOverlay', () => {
  it('null match renders base only', () => {
    const { container } = render(<OutlineOverlay activeMatch={null} blockRects={new Map()} />);

    expect(container.querySelectorAll('.skb-grid-outline-base')).toHaveLength(1);
    expect(container.querySelector('.skb-grid-outline-accent')).toBeNull();
  });

  it('split-left renders left-edge accent', () => {
    const blockRects = new Map([['b1', rect(100, 50, 200, 80)]]);
    const { container } = render(
      <OutlineOverlay activeMatch={activeMatch('split-left')} blockRects={blockRects} />,
    );

    const accent = getAccent(container);
    expect(accent.className).toContain('skb-grid-outline-accent--split-left');
    expect(accent.style.position).toBe('absolute');
    expect(accent.style.left).toBe('100px');
    expect(accent.style.top).toBe('50px');
    expect(accent.style.width).toBe('4px');
    expect(accent.style.height).toBe('80px');
  });

  it('3 remaining modes render correctly', () => {
    const blockRects = new Map([['b1', rect(100, 50, 200, 80)]]);
    const cases = [
      ['split-right', { left: '296px', top: '50px', width: '4px', height: '80px' }],
      ['split-top', { left: '100px', top: '50px', width: '200px', height: '4px' }],
      ['split-bottom', { left: '100px', top: '126px', width: '200px', height: '4px' }],
    ] as const;

    for (const [mode, expectedStyle] of cases) {
      const { container, unmount } = render(
        <OutlineOverlay activeMatch={activeMatch(mode)} blockRects={blockRects} />,
      );
      const accent = getAccent(container);

      expect(accent.className).toContain(`skb-grid-outline-accent--${mode}`);
      expect(accent.style.position).toBe('absolute');
      expect(accent.style.left).toBe(expectedStyle.left);
      expect(accent.style.top).toBe(expectedStyle.top);
      expect(accent.style.width).toBe(expectedStyle.width);
      expect(accent.style.height).toBe(expectedStyle.height);
      unmount();
    }
  });

  it('unknown blockId falls back to base only', () => {
    const { container } = render(
      <OutlineOverlay activeMatch={activeMatch('split-left', 'unknown')} blockRects={new Map()} />,
    );

    expect(container.querySelectorAll('.skb-grid-outline-base')).toHaveLength(1);
    expect(container.querySelector('.skb-grid-outline-accent')).toBeNull();
  });

  it('unmount cleanup leaves no nodes', () => {
    const blockRects = new Map([['b1', rect(100, 50, 200, 80)]]);
    const host = document.createElement('section');
    const { unmount } = render(
      <OutlineOverlay activeMatch={activeMatch('split-left')} blockRects={blockRects} />,
      { container: host },
    );

    unmount();

    expect(host.childElementCount).toBe(0);
    expect(document.body.childElementCount).toBe(0);
  });
});
