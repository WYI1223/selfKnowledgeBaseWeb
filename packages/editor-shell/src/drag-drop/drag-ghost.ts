/**
 * @skb/editor-shell drag-ghost — cursor-tracking drag preview with per-kind coloring.
 *
 * Per ADR-0017 D10:
 *  - position: fixed; transform: translate(x, y) rotate(angle)
 *  - Per-kind className: .ghost-canvas / .ghost-runnable / .ghost-image / .ghost-markdown
 *  - Cursor velocity ≥ 5px/frame → angle ±5° (sign matches velocity direction)
 *  - Velocity < 5 → -1.5° baseline (load-bearing constant; ADR-0017 D10 line 333+)
 *  - Glyph: plain text `◇` (Stage C.3 may upgrade to SVG/icon-font)
 */
import { createElement } from 'react';
import type { CSSProperties, ReactElement } from 'react';

export type GhostKind = 'canvas' | 'runnable' | 'image' | 'markdown';

export interface DragGhostVelocity {
  dx: number;
  dy: number;
}

export interface DragGhostProps {
  cursorX: number;
  cursorY: number;
  kind: GhostKind;
  mode: 'create' | 'move';
  velocity?: DragGhostVelocity;
  className?: string;
}

const GHOST_CLASS_BY_KIND: Readonly<Record<GhostKind, string>> = {
  canvas: 'ghost-canvas',
  runnable: 'ghost-runnable',
  image: 'ghost-image',
  markdown: 'ghost-markdown',
};

const GHOST_LABEL_BY_KIND: Readonly<Record<GhostKind, string>> = {
  canvas: 'Canvas',
  runnable: 'Runnable',
  image: 'Image',
  markdown: 'Markdown',
};

const VELOCITY_THRESHOLD_PX_PER_FRAME = 5;
const BASELINE_ROTATION_DEG = -1.5;
const ACTIVE_ROTATION_DEG = 5;

function rotationDeg(velocity: DragGhostVelocity | undefined): number {
  if (!velocity) return BASELINE_ROTATION_DEG;

  const magnitude = Math.hypot(velocity.dx, velocity.dy);
  if (magnitude < VELOCITY_THRESHOLD_PX_PER_FRAME || velocity.dx === 0) {
    return BASELINE_ROTATION_DEG;
  }

  return velocity.dx > 0 ? ACTIVE_ROTATION_DEG : -ACTIVE_ROTATION_DEG;
}

function ghostClassName(kind: GhostKind, className: string | undefined): string {
  const baseClassName = `drag-ghost ${GHOST_CLASS_BY_KIND[kind]}`;
  return className ? `${baseClassName} ${className}` : baseClassName;
}

function ghostLabel(kind: GhostKind, mode: DragGhostProps['mode']): string {
  const prefix = mode === 'create' ? '+ ' : '⤴ ';
  return `${prefix}◇ ${GHOST_LABEL_BY_KIND[kind]}`;
}

function ghostStyle(
  cursorX: number,
  cursorY: number,
  velocity: DragGhostVelocity | undefined,
): CSSProperties {
  return {
    position: 'fixed',
    left: 0,
    top: 0,
    transform: `translate(${cursorX}px, ${cursorY}px) rotate(${rotationDeg(velocity)}deg)`,
    pointerEvents: 'none',
  };
}

export function DragGhost(props: DragGhostProps): ReactElement {
  const { cursorX, cursorY, kind, mode, velocity, className } = props;

  return createElement(
    'div',
    {
      className: ghostClassName(kind, className),
      style: ghostStyle(cursorX, cursorY, velocity),
      'aria-hidden': true,
    },
    ghostLabel(kind, mode),
  );
}
