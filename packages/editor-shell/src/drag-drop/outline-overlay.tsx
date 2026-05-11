import type { CSSProperties } from 'react';
import type { DropIntent } from '@skb/grid-engine';

/**
 * ADR-0017 D4 outline overlay — refactored Wave 7 Phase 2B.2.
 *
 * Pre-2B.2: rendered a dashed accent at the host block's affected
 * edge per the 4-mode `EdgeMatch`. Post-2B.2 (ADR-0020 D2): renders a
 * single hole-fill preview rect at the cursor's inferred drop intent.
 * Green/red variant via `data-skb-drop-intent` + class suffix.
 *
 * Geometry can be passed explicitly (`gridRect` + `oneFrPx` + `rowPx`)
 * for testability, OR omitted and the overlay reads its own geometry
 * from the `.skb-grid` element + `--row-h` / `--gap` CSS vars (the
 * common production path used by EditorShellMountInner).
 */
export interface OutlineOverlayProps {
  activeIntent: DropIntent | null;
  /** Pass explicitly for tests; omit for prod (overlay reads
   *  `.skb-grid` element rect from the live DOM). */
  gridRect?: DOMRectReadOnly | null;
  oneFrPx?: number;
  rowPx?: number;
  className?: string;
}

function baseClassName(className: string | undefined): string {
  return className ? `skb-grid-outline-base ${className}` : 'skb-grid-outline-base';
}

function intentStyle(
  intent: DropIntent,
  gridRect: DOMRectReadOnly,
  oneFrPx: number,
  rowPx: number,
): CSSProperties {
  return {
    position: 'absolute',
    left: gridRect.left + intent.col * oneFrPx,
    top: gridRect.top + intent.row * rowPx,
    width: intent.colSpan * oneFrPx,
    height: intent.rowSpan * rowPx,
    pointerEvents: 'none',
    zIndex: 30,
  };
}

function readLiveGeometry():
  | { rect: DOMRectReadOnly; oneFrPx: number; rowPx: number }
  | null {
  if (typeof document === 'undefined') return null;
  const grid = document.querySelector('.skb-grid');
  if (!grid) return null;
  const rect = grid.getBoundingClientRect();
  const style = getComputedStyle(grid);
  const rowH = parseFloat(style.getPropertyValue('--row-h')) || 48;
  const gap = parseFloat(style.getPropertyValue('--gap')) || 14;
  return { rect, rowPx: rowH + gap, oneFrPx: (rect.width + gap) / 12 };
}

export function OutlineOverlay(props: OutlineOverlayProps): JSX.Element {
  const { activeIntent, className } = props;
  const live = props.gridRect === undefined ? readLiveGeometry() : null;
  const gridRect = props.gridRect ?? live?.rect ?? null;
  const oneFrPx = props.oneFrPx ?? live?.oneFrPx ?? 100;
  const rowPx = props.rowPx ?? live?.rowPx ?? 62;
  const showIntent = activeIntent !== null && gridRect !== null;
  return (
    <>
      <div className={baseClassName(className)} style={{ pointerEvents: 'none' }} />
      {showIntent ? (
        <div
          data-skb-drop-intent={activeIntent.intent}
          className={`skb-grid-outline-accent skb-grid-outline-accent--${activeIntent.intent}`}
          style={intentStyle(activeIntent, gridRect, oneFrPx, rowPx)}
        />
      ) : null}
    </>
  );
}
