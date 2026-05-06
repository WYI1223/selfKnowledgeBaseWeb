/**
 * @skb/editor-shell drop-pulse — 720ms green halo on drag-end-success.
 *
 * Per ADR-0017 D11: drop-pulse fires ONLY on drag-end-success; cancel +
 * mode-none + grid-外松手 do NOT trigger pulse (D11 explicit non-trigger).
 *
 * Visual contract:
 *  - Duration: 720ms (load-bearing constant; ADR-0017 D11 line 342+)
 *  - Box-shadow: `0 0 0 4px var(--accent-success, oklch(70% 0.12 145 / 0.5))` → fade-out
 *  - Token source: ADR-0018 `--accent-success` (Stage C.3-1 forward-pointer); fallback hex bridges Wave 5 v0.5 → C.3 token landing.
 */
import { Fragment, createElement } from 'react';
import type { CSSProperties, ReactElement } from 'react';

export interface DropPulseProps {
  className?: string;
  onAnimationEnd?: () => void;
}

export const dropPulseClassName = 'skb-drop-pulse';

const DROP_PULSE_SHADOW =
  '0 0 0 4px var(--accent-success, oklch(70% 0.12 145 / 0.5))';

const DROP_PULSE_ANIMATION = 'skb-drop-pulse-fadeout 720ms ease-out forwards';

const DROP_PULSE_KEYFRAMES = `
@keyframes skb-drop-pulse-fadeout {
  from {
    box-shadow: ${DROP_PULSE_SHADOW};
    opacity: 1;
  }
  to {
    box-shadow: 0 0 0 4px transparent;
    opacity: 0;
  }
}`;

const dropPulseStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  boxShadow: DROP_PULSE_SHADOW,
  animation: DROP_PULSE_ANIMATION,
};

function pulseClassName(className: string | undefined): string {
  return className ? `${dropPulseClassName} ${className}` : dropPulseClassName;
}

export function DropPulse(props: DropPulseProps): ReactElement {
  const { className, onAnimationEnd } = props;

  return createElement(
    Fragment,
    null,
    createElement('style', { 'data-skb-drop-pulse-keyframes': '' }, DROP_PULSE_KEYFRAMES),
    createElement('div', {
      className: pulseClassName(className),
      onAnimationEnd,
      style: dropPulseStyle,
    }),
  );
}
