import { COL_SNAPS, type BlockGridPosition } from '@skb/block-foundation';

/**
 * Wave 6 cf-20c-1 — pure mutation algebra for ADR-0017 D1 drop modes.
 *
 * `applyDropMode(input) → GridSnapshotIdentified` computes the post-drop
 * block positions for the 6 drop modes specified at ADR-0017 D1 lines
 * 44-61 (`split-left` / `split-right` / `split-top` / `split-bottom` /
 * `empty` / `none`).
 *
 * The function is pure: same input → same output, no side effects, no
 * IO. Consumer (cf-20c-2 drag-handle UI wire) computes the input from
 * pointer events + edge-rects + tiebreak, calls this function, and
 * dispatches `drag-end-success` to layoutReducer with the result as
 * the `mutation: GridSnapshot` parameter.
 *
 * Throws on invalid input (programmer error from the consumer side):
 *  - `split-left/right` with `host.colSpan / 2` not in COL_SNAPS
 *    (the consumer should have shown the "no-split" cursor per ADR-0017
 *    D6 BEFORE calling this function).
 *  - `empty` without `emptyTarget` or with `col + colSpan - 1 > 12`.
 *  - `sourceBlockId === null` without `newBlock`.
 *  - `split-*` with `hostBlockId === null`.
 */

export interface IdentifiedBlock extends BlockGridPosition {
  /** Stable block identifier; sourced by cf-20c-2 from ProseMirror node IDs. */
  readonly id: string;
}

export interface GridSnapshotIdentified {
  readonly blocks: readonly IdentifiedBlock[];
}

export type DropMode =
  | 'split-left'
  | 'split-right'
  | 'split-top'
  | 'split-bottom'
  | 'empty'
  | 'none';

export interface ApplyDropModeInput {
  readonly baseline: GridSnapshotIdentified;
  readonly mode: DropMode;
  /** null = palette drag (newBlock required). */
  readonly sourceBlockId: string | null;
  /** null only for mode='empty' or 'none'. */
  readonly hostBlockId: string | null;
  /** Required when sourceBlockId === null (palette insertion). */
  readonly newBlock?: IdentifiedBlock;
  /** Required when mode === 'empty'. */
  readonly emptyTarget?: { readonly col: number; readonly row: number };
}

const SPLIT_HALF_VALID = new Set<number>([2, 3, 4, 6]);

export function applyDropMode(input: ApplyDropModeInput): GridSnapshotIdentified {
  const { baseline, mode, sourceBlockId, hostBlockId, newBlock, emptyTarget } = input;

  if (mode === 'none') {
    return { blocks: [...baseline.blocks] };
  }

  const isPaletteInsert = sourceBlockId === null;
  if (isPaletteInsert && !newBlock) {
    throw new Error(
      'applyDropMode: newBlock is required when sourceBlockId is null (palette insertion)',
    );
  }

  if (mode === 'empty') {
    if (!emptyTarget) {
      throw new Error('applyDropMode: emptyTarget is required when mode is "empty"');
    }
    return applyEmpty(baseline, sourceBlockId, newBlock, emptyTarget);
  }

  // From here on, mode is split-{left,right,top,bottom}.
  if (hostBlockId === null) {
    throw new Error(`applyDropMode: hostBlockId is required when mode is "${mode}"`);
  }
  const host = baseline.blocks.find((b) => b.id === hostBlockId);
  if (!host) {
    throw new Error(`applyDropMode: hostBlockId "${hostBlockId}" not found in baseline`);
  }

  switch (mode) {
    case 'split-left':
      return applySplitLeft(baseline, host, sourceBlockId, newBlock);
    case 'split-right':
      return applySplitRight(baseline, host, sourceBlockId, newBlock);
    case 'split-top':
      return applySplitTop(baseline, host, sourceBlockId, newBlock);
    case 'split-bottom':
      return applySplitBottom(baseline, host, sourceBlockId, newBlock);
  }
}

function applyEmpty(
  baseline: GridSnapshotIdentified,
  sourceBlockId: string | null,
  newBlock: IdentifiedBlock | undefined,
  target: { readonly col: number; readonly row: number },
): GridSnapshotIdentified {
  const inserted: IdentifiedBlock = newBlock
    ? { ...newBlock, col: target.col, row: target.row }
    : (() => {
        const source = baseline.blocks.find((b) => b.id === sourceBlockId);
        if (!source) {
          throw new Error(
            `applyDropMode: sourceBlockId "${sourceBlockId}" not found in baseline`,
          );
        }
        return { ...source, col: target.col, row: target.row };
      })();
  validateColumnRange(inserted);
  const remaining = baseline.blocks.filter((b) => b.id !== sourceBlockId);
  return { blocks: [...remaining, inserted] };
}

function applySplitLeft(
  baseline: GridSnapshotIdentified,
  host: IdentifiedBlock,
  sourceBlockId: string | null,
  newBlock: IdentifiedBlock | undefined,
): GridSnapshotIdentified {
  const half = halfColSpan(host.colSpan);
  const newHost: IdentifiedBlock = {
    ...host,
    col: host.col + half,
    colSpan: half,
  };
  const placedSource = placeAtHostHalf(host, sourceBlockId, newBlock, baseline, host.col, half);
  const others = baseline.blocks.filter((b) => b.id !== host.id && b.id !== sourceBlockId);
  return { blocks: [...others, newHost, placedSource] };
}

function applySplitRight(
  baseline: GridSnapshotIdentified,
  host: IdentifiedBlock,
  sourceBlockId: string | null,
  newBlock: IdentifiedBlock | undefined,
): GridSnapshotIdentified {
  const half = halfColSpan(host.colSpan);
  const newHost: IdentifiedBlock = {
    ...host,
    colSpan: half,
  };
  const placedSource = placeAtHostHalf(
    host,
    sourceBlockId,
    newBlock,
    baseline,
    host.col + half,
    half,
  );
  const others = baseline.blocks.filter((b) => b.id !== host.id && b.id !== sourceBlockId);
  return { blocks: [...others, newHost, placedSource] };
}

function applySplitTop(
  baseline: GridSnapshotIdentified,
  host: IdentifiedBlock,
  sourceBlockId: string | null,
  newBlock: IdentifiedBlock | undefined,
): GridSnapshotIdentified {
  const hostRow = host.row ?? 1;
  const cascaded = baseline.blocks.map((b) => {
    if (b.id === sourceBlockId) return null;
    if (b.id === host.id) return { ...b, row: hostRow + 1 };
    if (b.row !== undefined && b.row >= hostRow) return { ...b, row: b.row + 1 };
    return b;
  });
  const placed = makeInserted(host, sourceBlockId, newBlock, baseline, {
    col: host.col,
    row: hostRow,
    colSpan: host.colSpan,
  });
  const filtered = cascaded.filter((b): b is IdentifiedBlock => b !== null);
  return { blocks: [...filtered, placed] };
}

function applySplitBottom(
  baseline: GridSnapshotIdentified,
  host: IdentifiedBlock,
  sourceBlockId: string | null,
  newBlock: IdentifiedBlock | undefined,
): GridSnapshotIdentified {
  const hostRow = host.row ?? 1;
  const hostRowSpan = host.rowSpan;
  const insertRow = hostRow + hostRowSpan;
  const cascaded = baseline.blocks.map((b) => {
    if (b.id === sourceBlockId) return null;
    if (b.row !== undefined && b.row >= insertRow) return { ...b, row: b.row + 1 };
    return b;
  });
  const placed = makeInserted(host, sourceBlockId, newBlock, baseline, {
    col: host.col,
    row: insertRow,
    colSpan: host.colSpan,
  });
  const filtered = cascaded.filter((b): b is IdentifiedBlock => b !== null);
  return { blocks: [...filtered, placed] };
}

function halfColSpan(colSpan: number): number {
  if (colSpan % 2 !== 0) {
    throw new Error(
      `applyDropMode: split-left/right requires host.colSpan to be evenly halvable into COL_SNAPS; got colSpan=${colSpan}`,
    );
  }
  const half = colSpan / 2;
  if (!SPLIT_HALF_VALID.has(half) && !COL_SNAPS.includes(half as (typeof COL_SNAPS)[number])) {
    throw new Error(
      `applyDropMode: split-left/right host.colSpan=${colSpan} half=${half} not in COL_SNAPS=[2,3,4,6,8,12]`,
    );
  }
  return half;
}

function placeAtHostHalf(
  host: IdentifiedBlock,
  sourceBlockId: string | null,
  newBlock: IdentifiedBlock | undefined,
  baseline: GridSnapshotIdentified,
  col: number,
  colSpan: number,
): IdentifiedBlock {
  return makeInserted(host, sourceBlockId, newBlock, baseline, {
    col,
    row: host.row,
    colSpan,
  });
}

interface PlacementOverride {
  col: number;
  row?: number | undefined;
  colSpan: number;
}

function makeInserted(
  host: IdentifiedBlock,
  sourceBlockId: string | null,
  newBlock: IdentifiedBlock | undefined,
  baseline: GridSnapshotIdentified,
  placement: PlacementOverride,
): IdentifiedBlock {
  const base: IdentifiedBlock = newBlock ?? findSourceOrThrow(baseline, sourceBlockId);
  // Only include row in the override if it's a defined integer; otherwise
  // leave the inherited row from `base` (or absence) intact.
  if (placement.row === undefined) {
    return { ...base, col: placement.col, colSpan: placement.colSpan };
  }
  return { ...base, col: placement.col, colSpan: placement.colSpan, row: placement.row };
}

function findSourceOrThrow(
  baseline: GridSnapshotIdentified,
  sourceBlockId: string | null,
): IdentifiedBlock {
  const source = baseline.blocks.find((b) => b.id === sourceBlockId);
  if (!source) {
    throw new Error(`applyDropMode: sourceBlockId "${sourceBlockId}" not found in baseline`);
  }
  return source;
}

function validateColumnRange(block: IdentifiedBlock): void {
  const end = block.col + block.colSpan - 1;
  if (block.col < 1 || end > 12) {
    throw new Error(
      `applyDropMode: block "${block.id}" col=${block.col}+colSpan=${block.colSpan}-1=${end} out of [1,12] range`,
    );
  }
}
