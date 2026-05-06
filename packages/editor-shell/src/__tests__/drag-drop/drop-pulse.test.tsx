import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DropPulse, dropPulseClassName } from '../../drag-drop/drop-pulse';

afterEach(() => {
  cleanup();
});

function getPulse(container: HTMLElement): HTMLElement {
  const pulse = container.querySelector(`.${dropPulseClassName}`);
  if (!(pulse instanceof HTMLElement)) {
    throw new Error('DropPulse root was not rendered');
  }
  return pulse;
}

describe('DropPulse', () => {
  it('renders an absolute 4px box-shadow halo overlay', () => {
    const { container } = render(<DropPulse onAnimationEnd={() => undefined} />);
    const pulse = getPulse(container);

    expect(pulse.style.position).toBe('absolute');
    expect(pulse.style.inset).toBe('0');
    expect(pulse.style.boxShadow).toMatch(/0 0 0 4px/);
  });

  it('uses the ADR-0017 D11 720ms animation duration', () => {
    const { container } = render(<DropPulse />);
    const pulse = getPulse(container);

    expect(pulse.style.animation).toContain('720ms');
  });

  it('consumes the accent-success token with the ADR-0018 fallback', () => {
    const { container } = render(<DropPulse />);
    const pulse = getPulse(container);

    expect(pulse.style.boxShadow).toMatch(
      /var\(--accent-success,\s*oklch\(70% 0\.12 145 \/ 0\.5\)\)/,
    );
  });

  it('does not render when the consumer phase is drag-end-cancel', () => {
    function Consumer({ phase }: { phase: 'drag-end-success' | 'drag-end-cancel' }) {
      return phase === 'drag-end-success' ? <DropPulse /> : null;
    }

    const { container, rerender } = render(<Consumer phase="drag-end-success" />);
    expect(container.querySelector(`.${dropPulseClassName}`)).toBeInstanceOf(HTMLElement);

    rerender(<Consumer phase="drag-end-cancel" />);

    expect(container.querySelector(`.${dropPulseClassName}`)).toBeNull();
  });
});
