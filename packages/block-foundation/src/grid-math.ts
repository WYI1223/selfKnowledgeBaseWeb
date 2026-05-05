import type { BlockUIDefinition } from './registry';
import {
  COL_SNAPS,
  type BlockGridKind,
  type BlockGridPosition,
} from './types';

/** Grid geometry constants consumed by ADR-0016 D9 W5-1 math helpers. */
export interface GridGeometry {
  readonly rowH: number;
  readonly gap: number;
  readonly totalCols: number;
}

/**
 * ADR-0016 D9 default W5-1 geometry.
 *
 * Wave 5 Stage C.3 may switch callers to design-token-derived constants;
 * until then these literals are the block-foundation authority.
 */
export const DEFAULT_GRID_GEOMETRY: GridGeometry = {
  rowH: 48,
  gap: 14,
  totalCols: 12,
} as const;

type GridPositionValidationInput = BlockGridPosition & {
  readonly gridKind?: BlockGridKind;
};

function resolveGeometry(geometry?: Partial<GridGeometry>): GridGeometry {
  return { ...DEFAULT_GRID_GEOMETRY, ...geometry };
}

/**
 * ADR-0016 D9 W5-1 height formula:
 * rowSpan * row-h + (rowSpan - 1) * gap.
 */
export function effectiveCellHeight(
  rowSpan: number,
  geometry?: Partial<GridGeometry>,
): number {
  const resolved = resolveGeometry(geometry);
  return rowSpan * resolved.rowH + (rowSpan - 1) * resolved.gap;
}

/**
 * ADR-0016 D9 W5-1 width formula:
 * colSpan * 1fr + (colSpan - 1) * gap.
 */
export function effectiveColWidth(
  colSpan: number,
  containerWidth: number,
  geometry?: Partial<GridGeometry>,
): number {
  const resolved = resolveGeometry(geometry);
  const oneFr =
    (containerWidth - (resolved.totalCols - 1) * resolved.gap) /
    resolved.totalCols;
  return colSpan * oneFr + (colSpan - 1) * resolved.gap;
}

/**
 * ADR-0016 D2/D10 row-span resolver for editor-shell consumers.
 */
export function effectiveRowSpan(
  rowSpan: number | 'auto',
  autoIntegerHint: number,
): number {
  return rowSpan === 'auto' ? autoIntegerHint : rowSpan;
}

/**
 * ADR-0016 D2/D6/D7 validation for explicit grid positions.
 *
 * Throws on explicit invalid input; callers decide how to surface errors.
 */
export function validateGridPosition(
  pos: GridPositionValidationInput,
  totalCols = DEFAULT_GRID_GEOMETRY.totalCols,
): void {
  if (!Number.isInteger(pos.col) || pos.col < 1 || pos.col > totalCols) {
    throw new Error(`col must be a 1-based integer between 1 and ${totalCols}`);
  }

  if (!COL_SNAPS.some((snap) => snap === pos.colSpan)) {
    throw new Error(`colSpan must be one of COL_SNAPS: ${COL_SNAPS.join(', ')}`);
  }

  if (pos.col + pos.colSpan - 1 > totalCols) {
    throw new Error(`grid position overflow: col + colSpan - 1 exceeds ${totalCols}`);
  }

  if (
    pos.row !== undefined &&
    (!Number.isInteger(pos.row) || pos.row < 1)
  ) {
    throw new Error('row must be a 1-based integer when provided');
  }

  if (pos.rowSpan === 'auto') {
    if (pos.gridKind !== undefined && pos.gridKind !== 'prose') {
      throw new Error("rowSpan='auto' is only valid for prose gridKind");
    }
    return;
  }

  if (!Number.isInteger(pos.rowSpan) || pos.rowSpan < 1) {
    throw new Error('rowSpan must be an integer >= 1 or auto');
  }
}

/**
 * ADR-0016 D10 auto-row-span query.
 *
 * Runtime `gridKind` mirroring from BlockKind is deferred to C.2-4, so
 * missing fields are treated as the backward-compatible integer path here.
 */
export function isAutoRowSpan(
  uiDef: Pick<BlockUIDefinition, 'rowSpanSemantic' | 'gridKind'>,
): boolean {
  return uiDef.rowSpanSemantic === 'auto' || uiDef.gridKind === 'prose';
}
