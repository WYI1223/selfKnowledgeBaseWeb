import type { CSSProperties } from 'react';

/**
 * ADR-0017 D9 resize size-tooltip visual primitive.
 *
 * The fixed tooltip follows the cursor at (+12px, -8px), and the fraction
 * labels mirror ADR-0016 D6's 12/6/1 snap ladder.
 */
export interface SizeTooltipProps {
  cursorX: number;
  cursorY: number;
  fraction: string;
  rowSpan?: number;
  className?: string;
}

const CURSOR_OFFSET_X = 12;
const CURSOR_OFFSET_Y = -8;
const ROW_SPAN_SEPARATOR = ' \u00b7 ';

const FRACTIONS_BY_TOTAL_COLS: Readonly<
  Record<number, Readonly<Record<number, string>>>
> = {
  12: {
    12: 'full',
    8: '2/3',
    6: '1/2',
    4: '1/3',
    3: '1/4',
    2: '1/6',
  },
  6: {
    6: 'full',
    3: '1/2',
    2: '1/3',
  },
  1: {
    1: 'full',
  },
};

function tooltipClassName(className: string | undefined): string {
  return className ? `skb-size-tooltip ${className}` : 'skb-size-tooltip';
}

function tooltipText(fraction: string, rowSpan: number | undefined): string {
  return rowSpan === undefined
    ? fraction
    : `${fraction}${ROW_SPAN_SEPARATOR}${rowSpan} rows`;
}

function tooltipStyle(cursorX: number, cursorY: number): CSSProperties {
  return {
    position: 'fixed',
    left: cursorX + CURSOR_OFFSET_X,
    top: cursorY + CURSOR_OFFSET_Y,
    pointerEvents: 'none',
  };
}

export function colSpanToFraction(colSpan: number, totalCols: number): string {
  const fraction = FRACTIONS_BY_TOTAL_COLS[totalCols]?.[colSpan];

  if (fraction !== undefined) {
    return fraction;
  }

  throw new Error(`unsupported colSpan/totalCols pair: ${colSpan}/${totalCols}`);
}

export function SizeTooltip(props: SizeTooltipProps): JSX.Element {
  const { cursorX, cursorY, fraction, rowSpan, className } = props;

  return (
    <div
      className={tooltipClassName(className)}
      style={tooltipStyle(cursorX, cursorY)}
    >
      {tooltipText(fraction, rowSpan)}
    </div>
  );
}
