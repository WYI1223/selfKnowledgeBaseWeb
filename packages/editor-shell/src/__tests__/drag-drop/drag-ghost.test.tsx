import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DragGhost, type GhostKind } from '../../drag-drop/drag-ghost';

afterEach(() => {
  cleanup();
});

function getGhost(container: HTMLElement): HTMLElement {
  const ghost = container.querySelector('.drag-ghost');
  if (!(ghost instanceof HTMLElement)) {
    throw new Error('DragGhost root was not rendered');
  }
  return ghost;
}

describe('DragGhost', () => {
  it('renders fixed, non-interactive cursor-following baseline transform', () => {
    const { container } = render(
      <DragGhost cursorX={100} cursorY={200} kind="canvas" mode="move" />,
    );
    const ghost = getGhost(container);

    expect(ghost.style.position).toBe('fixed');
    expect(ghost.style.pointerEvents).toBe('none');
    expect(ghost.style.transform).toContain('translate(100px, 200px)');
    expect(ghost.style.transform).toContain('rotate(-1.5deg)');
    expect(ghost.textContent).toContain('◇');
  });

  it('applies the four ADR-0017 D10 kind classNames', () => {
    const cases: ReadonlyArray<[GhostKind, string]> = [
      ['canvas', 'ghost-canvas'],
      ['runnable', 'ghost-runnable'],
      ['image', 'ghost-image'],
      ['markdown', 'ghost-markdown'],
    ];

    for (const [kind, className] of cases) {
      const { container, unmount } = render(
        <DragGhost cursorX={0} cursorY={0} kind={kind} mode="create" />,
      );

      expect(getGhost(container).className).toContain(className);
      unmount();
    }
  });

  it('uses positive and negative 5deg rotation when velocity reaches the threshold', () => {
    const positive = render(
      <DragGhost
        cursorX={100}
        cursorY={200}
        kind="canvas"
        mode="move"
        velocity={{ dx: 8, dy: 0 }}
      />,
    );
    expect(getGhost(positive.container).style.transform).toContain('rotate(5deg)');
    positive.unmount();

    const negative = render(
      <DragGhost
        cursorX={100}
        cursorY={200}
        kind="canvas"
        mode="move"
        velocity={{ dx: -8, dy: 0 }}
      />,
    );
    expect(getGhost(negative.container).style.transform).toContain('rotate(-5deg)');
  });

  it('keeps the -1.5deg baseline when velocity is zero or omitted', () => {
    const zeroVelocity = render(
      <DragGhost
        cursorX={100}
        cursorY={200}
        kind="canvas"
        mode="move"
        velocity={{ dx: 0, dy: 0 }}
      />,
    );
    expect(getGhost(zeroVelocity.container).style.transform).toContain(
      'rotate(-1.5deg)',
    );
    zeroVelocity.unmount();

    const omittedVelocity = render(
      <DragGhost cursorX={100} cursorY={200} kind="canvas" mode="move" />,
    );
    expect(getGhost(omittedVelocity.container).style.transform).toContain(
      'rotate(-1.5deg)',
    );
  });

  it('is destroyed when unmounted', () => {
    const { container, unmount } = render(
      <DragGhost cursorX={100} cursorY={200} kind="canvas" mode="move" />,
    );
    expect(container.querySelector('.drag-ghost')).toBeInstanceOf(HTMLElement);

    unmount();

    expect(container.querySelector('.drag-ghost')).toBeNull();
  });
});
