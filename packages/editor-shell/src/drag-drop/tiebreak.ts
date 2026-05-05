import { EDGE_W } from './edge-rects';
import type { EdgeMode, EdgeRect } from './edge-rects';

/**
 * ADR-0017 D3 tiebreak formula for overlapping edge rects.
 *
 * The signed `distance` follows the ADR distance table, but all hit tests and
 * primary ordering use `Math.abs(distance)`. `findMatches()` uses the closed
 * Q2 interval `abs(distance) <= EDGE_W / 2`, and `tiebreak()` suppresses
 * velocity jitter at epsilon 0.5px/frame before falling back to stable spatial
 * ordering.
 */
export interface EdgeMatch {
  blockId: string;
  mode: EdgeMode;
  distance: number;
  blockBounds: {
    left: number;
    top: number;
  };
}

export interface DragVelocity {
  vx: number;
  vy: number;
}

function isXMode(mode: EdgeMode): boolean {
  return mode === 'split-left' || mode === 'split-right';
}

function signedDistance(
  cursorX: number,
  cursorY: number,
  mode: EdgeMode,
  blockRect: DOMRectReadOnly,
): number {
  switch (mode) {
    case 'split-left':
      return cursorX - blockRect.left;
    case 'split-right':
      return blockRect.right - cursorX;
    case 'split-top':
      return cursorY - blockRect.top;
    case 'split-bottom':
      return blockRect.bottom - cursorY;
  }
}

function pointInRect(cursorX: number, cursorY: number, edgeRect: EdgeRect): boolean {
  return (
    cursorX >= edgeRect.x &&
    cursorX <= edgeRect.x + edgeRect.width &&
    cursorY >= edgeRect.y &&
    cursorY <= edgeRect.y + edgeRect.height
  );
}

export function tiebreak(matches: EdgeMatch[], velocity: DragVelocity): EdgeMatch | null {
  if (matches.length === 0) {
    return null;
  }
  if (matches.length === 1) {
    return matches[0] ?? null;
  }

  const minAbs = Math.min(...matches.map((match) => Math.abs(match.distance)));
  const closest = matches.filter((match) => Math.abs(match.distance) === minAbs);
  if (closest.length === 1) {
    return closest[0] ?? null;
  }

  const speed = Math.hypot(velocity.vx, velocity.vy);
  if (speed > 0.5) {
    const dominantAxis = Math.abs(velocity.vx) > Math.abs(velocity.vy) ? 'x' : 'y';
    const dominantSign = dominantAxis === 'x' ? Math.sign(velocity.vx) : Math.sign(velocity.vy);
    const directionFiltered = closest.filter((match) => {
      if (dominantAxis === 'x' && isXMode(match.mode)) {
        return (
          (dominantSign > 0 && match.mode === 'split-left') ||
          (dominantSign < 0 && match.mode === 'split-right')
        );
      }
      if (dominantAxis === 'y' && !isXMode(match.mode)) {
        return (
          (dominantSign > 0 && match.mode === 'split-top') ||
          (dominantSign < 0 && match.mode === 'split-bottom')
        );
      }
      return false;
    });
    const directionWinner = directionFiltered[0];
    if (directionWinner) {
      return directionWinner;
    }
  }

  const sorted = closest.slice().sort((a, b) => {
    const aIsX = isXMode(a.mode);
    const bIsX = isXMode(b.mode);
    if (aIsX && bIsX) {
      const dx = a.blockBounds.left - b.blockBounds.left;
      if (dx !== 0) {
        return dx;
      }
    }
    if (!aIsX && !bIsX) {
      const dy = a.blockBounds.top - b.blockBounds.top;
      if (dy !== 0) {
        return dy;
      }
    }
    return a.blockId.localeCompare(b.blockId);
  });

  return sorted[0] ?? null;
}

export function findMatches(
  cursorX: number,
  cursorY: number,
  edgeRects: EdgeRect[],
  blockRects: Map<string, DOMRectReadOnly>,
): EdgeMatch[] {
  const threshold = EDGE_W / 2;
  const matches: EdgeMatch[] = [];

  for (const edgeRect of edgeRects) {
    if (!pointInRect(cursorX, cursorY, edgeRect)) {
      continue;
    }
    const blockRect = blockRects.get(edgeRect.blockId);
    if (!blockRect) {
      continue;
    }
    const distance = signedDistance(cursorX, cursorY, edgeRect.mode, blockRect);
    if (Math.abs(distance) > threshold) {
      continue;
    }
    matches.push({
      blockId: edgeRect.blockId,
      mode: edgeRect.mode,
      distance,
      blockBounds: {
        left: blockRect.left,
        top: blockRect.top,
      },
    });
  }

  return matches;
}
