import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ColRuler } from '../../resize/col-ruler';

afterEach(() => {
  cleanup();
});

function getStops(container: HTMLElement): NodeListOf<HTMLElement> {
  return container.querySelectorAll('.skb-col-ruler-stop');
}

describe('ColRuler', () => {
  it('12-col renders 6 stops', () => {
    const { container } = render(
      <ColRuler
        activeStops={[2, 3, 4, 6, 8, 12]}
        hoveredStop={null}
        totalCols={12}
      />,
    );

    expect(getStops(container)).toHaveLength(6);
  });

  it('6-col renders 3 stops', () => {
    const { container } = render(
      <ColRuler activeStops={[2, 3, 6]} hoveredStop={null} totalCols={6} />,
    );

    expect(getStops(container)).toHaveLength(3);
  });

  it('1-col mobile returns null', () => {
    const { container } = render(
      <ColRuler activeStops={[1]} hoveredStop={null} totalCols={1} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('hoveredStop applies active class', () => {
    const { container } = render(
      <ColRuler
        activeStops={[2, 3, 4, 6, 8, 12]}
        hoveredStop={6}
        totalCols={12}
      />,
    );
    const activeStops = container.querySelectorAll(
      '.skb-col-ruler-stop--active',
    );

    expect(activeStops).toHaveLength(1);
    expect(activeStops[0]).toBeInstanceOf(HTMLElement);
    expect((activeStops[0] as HTMLElement).dataset.stop).toBe('6');
  });

  it('null hoveredStop no active class', () => {
    const { container } = render(
      <ColRuler
        activeStops={[2, 3, 4, 6, 8, 12]}
        hoveredStop={null}
        totalCols={12}
      />,
    );

    expect(container.querySelectorAll('.skb-col-ruler-stop--active')).toHaveLength(0);
  });

  it('unknown hoveredStop no-op', () => {
    const { container } = render(
      <ColRuler activeStops={[2, 3, 4, 6, 8, 12]} hoveredStop={5} totalCols={12} />,
    );

    expect(container.querySelectorAll('.skb-col-ruler-stop')).toHaveLength(6);
    expect(container.querySelectorAll('.skb-col-ruler-stop--active')).toHaveLength(0);
  });

  it('default gap is 14', () => {
    const { container } = render(
      <ColRuler
        activeStops={[2, 3, 4, 6, 8, 12]}
        hoveredStop={null}
        totalCols={12}
      />,
    );
    const root = container.querySelector('.skb-col-ruler');

    expect(root).toBeInstanceOf(HTMLElement);
    expect((root as HTMLElement).style.getPropertyValue('--skb-col-ruler-gap')).toBe(
      '14px',
    );
  });

  it('unmount cleanup leaves no nodes', () => {
    const host = document.createElement('section');
    const { unmount } = render(
      <ColRuler
        activeStops={[2, 3, 4, 6, 8, 12]}
        hoveredStop={null}
        totalCols={12}
      />,
      { container: host },
    );

    unmount();

    expect(host.childElementCount).toBe(0);
    expect(document.body.childElementCount).toBe(0);
  });
});
