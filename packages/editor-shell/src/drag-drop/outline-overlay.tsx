import type { CSSProperties } from 'react';
import type { EdgeMatch } from './tiebreak';

/**
 * ADR-0017 D4 outline overlay scheme A.
 *
 * C.2-5 ships the stateless active accent layer: the static base is always
 * present, and the active `EdgeMatch` draws one non-interactive dashed accent
 * at the affected block edge. Host, shifted-block, drag-ghost, drop-pulse,
 * Esc cancel, and layoutEpoch reducer wiring remain deferred to C.2-8.
 */
export interface OutlineOverlayProps {
  activeMatch: EdgeMatch | null;
  blockRects: Map<string, DOMRectReadOnly>;
  className?: string;
}

const ACCENT_W = 4;

function baseClassName(className: string | undefined): string {
  return className ? `skb-grid-outline-base ${className}` : 'skb-grid-outline-base';
}

function accentStyle(activeMatch: EdgeMatch, rect: DOMRectReadOnly): CSSProperties {
  const baseStyle: CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 30,
  };

  switch (activeMatch.mode) {
    case 'split-left':
      return {
        ...baseStyle,
        left: rect.left,
        top: rect.top,
        width: ACCENT_W,
        height: rect.height,
      };
    case 'split-right':
      return {
        ...baseStyle,
        left: rect.right - ACCENT_W,
        top: rect.top,
        width: ACCENT_W,
        height: rect.height,
      };
    case 'split-top':
      return {
        ...baseStyle,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: ACCENT_W,
      };
    case 'split-bottom':
      return {
        ...baseStyle,
        left: rect.left,
        top: rect.bottom - ACCENT_W,
        width: rect.width,
        height: ACCENT_W,
      };
  }
}

export function OutlineOverlay(props: OutlineOverlayProps): JSX.Element {
  const { activeMatch, blockRects, className } = props;
  const activeRect = activeMatch ? blockRects.get(activeMatch.blockId) : undefined;

  return (
    <>
      <div
        className={baseClassName(className)}
        style={{ pointerEvents: 'none' }}
      />
      {activeMatch && activeRect ? (
        <div
          className={`skb-grid-outline-accent skb-grid-outline-accent--${activeMatch.mode}`}
          style={accentStyle(activeMatch, activeRect)}
        />
      ) : null}
    </>
  );
}
