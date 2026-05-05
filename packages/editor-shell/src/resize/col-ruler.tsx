import { DEFAULT_GRID_GEOMETRY } from '@skb/block-foundation';
import type { CSSProperties } from 'react';

/**
 * ADR-0017 D9 resize col-ruler visual primitive.
 *
 * Callers pass activeStops from ADR-0016 D6 Q4 `effectiveColSnaps`.
 * Mobile 1-col viewports return null here even though the valid snap set is
 * `[1]`. TODO(ADR-0018/C.3): migrate the stop highlight literal
 * `oklch(58% 0.16 35 / 0.4)` to the Stage C.3 token authority.
 */
export interface ColRulerProps {
  activeStops: readonly number[];
  hoveredStop: number | null;
  totalCols: number;
  gap?: number;
  className?: string;
}

const STOP_HIGHLIGHT_COLOR = 'oklch(58% 0.16 35 / 0.4)';

type ColRulerStyle = CSSProperties & {
  '--skb-col-ruler-gap': string;
  '--skb-col-ruler-total-cols': number;
};

type ColRulerStopStyle = CSSProperties & {
  '--skb-col-ruler-stop': number;
};

function rootClassName(className: string | undefined): string {
  return className ? `skb-col-ruler ${className}` : 'skb-col-ruler';
}

function stopClassName(active: boolean): string {
  return active
    ? 'skb-col-ruler-stop skb-col-ruler-stop--active'
    : 'skb-col-ruler-stop';
}

function rootStyle(totalCols: number, gap: number): ColRulerStyle {
  return {
    '--skb-col-ruler-gap': `${gap}px`,
    '--skb-col-ruler-total-cols': totalCols,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 0,
    pointerEvents: 'none',
  };
}

function stopStyle(
  stop: number,
  totalCols: number,
  active: boolean,
): ColRulerStopStyle {
  const left = totalCols > 0 ? `${(stop / totalCols) * 100}%` : '0%';

  return {
    '--skb-col-ruler-stop': stop,
    position: 'absolute',
    left,
    top: 0,
    width: 2,
    height: 10,
    transform: 'translateX(-50%)',
    backgroundColor: active ? STOP_HIGHLIGHT_COLOR : 'currentColor',
    opacity: active ? 1 : 0.4,
  };
}

export function ColRuler(props: ColRulerProps): JSX.Element | null {
  const {
    activeStops,
    hoveredStop,
    totalCols,
    gap = DEFAULT_GRID_GEOMETRY.gap,
    className,
  } = props;

  if (totalCols === 1) {
    return null;
  }

  return (
    <div className={rootClassName(className)} style={rootStyle(totalCols, gap)}>
      {activeStops.map((stop) => {
        const active = stop === hoveredStop;

        return (
          <span
            aria-hidden="true"
            className={stopClassName(active)}
            data-stop={stop}
            key={stop}
            style={stopStyle(stop, totalCols, active)}
          />
        );
      })}
    </div>
  );
}
