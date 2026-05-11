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
 * Wave 6 cf-24 (2026-05-10) — external-source drag (PaletteSidebar
 * card → editor canvas) arrow-key move announcement. Mirrors
 * `formatDragMove` but uses verb "Inserting" because the source
 * is a NEW block being added (not an existing block being moved).
 *
 * Per WCAG 4.1.3 + cf-22 R1 F1 announce wiring; consumed by the
 * pipeline's external-drag branch in
 * `useDragDropPipeline.handleDragOver` when
 * `isExternalDragSource(sourceBlockId)` is true.
 */
export function formatExternalDragMove(
  blockKind: string,
  col: number,
  totalCols: number,
): string {
  return `Inserting ${friendlyKind(blockKind)} block at column ${col} of ${totalCols}`;
}

/**
 * Wave 6 cf-24 — external-source drag commit announcement
 * (pointer-drop on grid). Verb "Inserted" matches the past-tense
 * `formatDragCommit` "Moved" pattern.
 */
export function formatExternalDragCommit(
  blockKind: string,
  col: number,
): string {
  return `Inserted ${friendlyKind(blockKind)} block at column ${col}`;
}

/**
 * Wave 6 cf-24 R0 F2 fix (2026-05-10) — PaletteSidebar click /
 * Enter insertion announcement (NOT the drag path).
 *
 * The cf-22 R1 F1 silent-scaffolding rule: every consumer surface
 * MUST fire LiveAnnouncer messages, NOT just exist with the
 * provider mounted. Pre-R0 PaletteSidebar's `onInsert` callback
 * was DEFINED on the component but the EditorShellMountInner
 * portal mount never passed it — so click/Enter inserts (the
 * keyboard-a11y path per AC-13) were silent. F2 fix wires the
 * callback + this format helper.
 *
 * Distinct verb "Added" (vs cf-24 drag's "Inserted") signals the
 * different user model: drag = positioning at a specific drop
 * slot; click/Enter = appending at end-of-doc (no drop slot, no
 * column number to announce). Per WCAG 4.1.3 + cf-22 R1 F1
 * announce contract.
 */
export function formatPaletteInsert(blockKind: string): string {
  return `Added ${friendlyKind(blockKind)} block at end of document`;
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
