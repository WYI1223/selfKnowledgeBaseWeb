/**
 * @skb/editor-shell announce-format — pure WCAG 4.1.3 status
 * message formatters.
 *
 * Wave 6 cf-22 (2026-05-09) — pure helpers consumed by the cf-22
 * keyboard-mode lifecycle to push aria-live announcements into the
 * shared `<LiveAnnouncer/>`. No React, no DOM — fully unit-testable
 * from vitest.
 *
 * Per WCAG 4.1.3 (Status Messages, Level AA): "Status messages can
 * be programmatically determined through role or properties such
 * that they can be presented to the user by assistive technologies
 * without receiving focus." cf-22's `<LiveAnnouncer/>` uses
 * `aria-live="polite"` (announce after current AT speech finishes,
 * NOT interrupt) which is the canonical implementation.
 *
 * Message templates are intentionally short (AT verbosity tradeoff)
 * + use the user-facing block kind label (NOT the internal
 * `componentCode` identifier; that's a cf-15b internal-name detail).
 * cf-22 ships English baseline; localization is future cf-30+.
 */

/**
 * Drag arrow-key move (every Arrow press during keyboard-drag mode).
 * Throttled to 100ms by `<LiveAnnouncer/>` so rapid arrow spam
 * announces only the latest position.
 */
export function formatDragMove(
  blockKind: string,
  col: number,
  totalCols: number,
): string {
  return `${friendlyKind(blockKind)} block at column ${col} of ${totalCols}`;
}

/**
 * Drag commit (Enter/Tab in keyboard-drag mode; pointer drop in
 * pointer-drag mode).
 */
export function formatDragCommit(blockKind: string, col: number): string {
  return `Moved ${friendlyKind(blockKind)} block to column ${col}`;
}

/** Drag Esc cancel (no mutation). */
export function formatDragCancel(): string {
  return 'Move cancelled, block restored';
}

/**
 * Resize change (every Arrow press during keyboard-resize mode +
 * the final commit message).
 *
 * @param axis     'right' (col only) | 'bottom' (row only) | 'corner' (both)
 * @param colSpan  current colSpan (for 'right' / 'corner' axes)
 * @param rowSpan  current rowSpan (for 'bottom' / 'corner' axes)
 * @param fraction human-readable colSpan fraction (e.g. '1/2', 'full')
 */
export function formatResizeChange(
  axis: 'right' | 'bottom' | 'corner',
  colSpan: number,
  rowSpan: number,
  fraction: string,
): string {
  if (axis === 'right') {
    return `Resized to ${fraction} width`;
  }
  if (axis === 'bottom') {
    return `Resized to ${rowSpan} ${pluralRows(rowSpan)} tall`;
  }
  // axis === 'corner'
  return `Resized to ${fraction} width and ${rowSpan} ${pluralRows(rowSpan)} tall`;
}

/** Resize Esc cancel (no mutation). */
export function formatResizeCancel(): string {
  return 'Resize cancelled, block restored';
}

/**
 * Kebab action (Delete / Duplicate / Change kind).
 *
 * @param action     'delete' | 'duplicate' | 'change kind'
 * @param blockKind  the source block's kind label
 * @param newKind    optional — for change-kind, the new kind label
 */
export function formatKebabAction(
  action: 'delete' | 'duplicate' | 'change kind',
  blockKind: string,
  newKind?: string,
): string {
  if (action === 'delete') {
    return `Deleted ${friendlyKind(blockKind)} block`;
  }
  if (action === 'duplicate') {
    return `Duplicated ${friendlyKind(blockKind)} block`;
  }
  // action === 'change kind'
  if (newKind) {
    return `Changed ${friendlyKind(blockKind)} block to ${friendlyKind(newKind)}`;
  }
  return `Changed ${friendlyKind(blockKind)} block kind`;
}

/**
 * Helper: collapse the cf-15b internal name `componentCode` to the
 * user-facing label `code`. Keeps the same friendly-name mapping
 * used by BlockNodeView's `chipLabel` so AT announcements + visual
 * chips stay consistent.
 */
function friendlyKind(kind: string): string {
  if (kind === 'componentCode') return 'code';
  return kind;
}

function pluralRows(rowSpan: number): string {
  return rowSpan === 1 ? 'row' : 'rows';
}
