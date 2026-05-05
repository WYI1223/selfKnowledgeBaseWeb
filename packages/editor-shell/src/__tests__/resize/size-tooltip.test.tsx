import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import {
  SizeTooltip,
  colSpanToFraction,
} from '../../resize/size-tooltip';

afterEach(() => {
  cleanup();
});

function getTooltip(container: HTMLElement): HTMLElement {
  const tooltip = container.querySelector('.skb-size-tooltip');
  if (!(tooltip instanceof HTMLElement)) {
    throw new Error('SizeTooltip root was not rendered');
  }
  return tooltip;
}

describe('SizeTooltip', () => {
  it('fraction only no rowSpan', () => {
    const { container } = render(
      <SizeTooltip cursorX={100} cursorY={50} fraction="1/2" />,
    );

    expect(getTooltip(container).textContent).toBe('1/2');
  });

  it('fraction with rowSpan suffix', () => {
    const { container } = render(
      <SizeTooltip cursorX={100} cursorY={50} fraction="full" rowSpan={3} />,
    );

    expect(getTooltip(container).textContent).toBe('full \u00b7 3 rows');
  });

  it('position is fixed', () => {
    const { container } = render(
      <SizeTooltip cursorX={100} cursorY={50} fraction="1/2" />,
    );

    expect(getTooltip(container).style.position).toBe('fixed');
  });

  it('left is cursorX plus 12', () => {
    const { container } = render(
      <SizeTooltip cursorX={100} cursorY={50} fraction="1/2" />,
    );

    expect(getTooltip(container).style.left).toBe('112px');
  });

  it('top is cursorY minus 8', () => {
    const { container } = render(
      <SizeTooltip cursorX={100} cursorY={50} fraction="1/2" />,
    );

    expect(getTooltip(container).style.top).toBe('42px');
  });
});

describe('colSpanToFraction', () => {
  it('12 of 12 is full', () => {
    expect(colSpanToFraction(12, 12)).toBe('full');
  });

  it('8 of 12 is 2/3', () => {
    expect(colSpanToFraction(8, 12)).toBe('2/3');
  });

  it('12-col ladder fractions', () => {
    expect(colSpanToFraction(6, 12)).toBe('1/2');
    expect(colSpanToFraction(4, 12)).toBe('1/3');
    expect(colSpanToFraction(3, 12)).toBe('1/4');
    expect(colSpanToFraction(2, 12)).toBe('1/6');
  });

  it('6 of 6 is full', () => {
    expect(colSpanToFraction(6, 6)).toBe('full');
  });

  it('6-col ladder fractions', () => {
    expect(colSpanToFraction(3, 6)).toBe('1/2');
    expect(colSpanToFraction(2, 6)).toBe('1/3');
  });

  it('1 of 1 is full', () => {
    expect(colSpanToFraction(1, 1)).toBe('full');
  });

  it('out of table throws', () => {
    expect(() => colSpanToFraction(5, 12)).toThrow(Error);
  });
});
