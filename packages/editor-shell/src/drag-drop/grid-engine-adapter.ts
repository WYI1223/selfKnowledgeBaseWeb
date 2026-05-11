/**
 * @skb/editor-shell — grid-engine adapter.
 *
 * Wave 7 Phase 2B (ADR-0020 D2): bridges the editor's Tiptap document
 * state ↔ `@skb/grid-engine` `GridState`, and exposes commit/intent
 * helpers that replace the cf-20c-1 `applyDropMode` 4-mode algebra.
 *
 * Coordinate systems (CRITICAL):
 * - **Editor** (Tiptap attrs + ADR-0016 D2): `col` 1-based (1..12),
 *   `row` 1-based + OPTIONAL (undefined → grid-auto-flow places it).
 * - **Engine** (`@skb/grid-engine`): `col` 0-based (0..11), `row`
 *   0-based + ALWAYS explicit.
 *
 * `toEngineState` walks the editor snapshot, assigns explicit rows to
 * any block with `row === undefined` via a row-packing pass (matches
 * CSS `grid-auto-flow: row`), and translates 1-based ↔ 0-based.
 * `toEditorMutation` reverses the translation for setNodeMarkup writes.
 *
 * UX semantics replaced by this adapter (ADR-0020 D2 vs ADR-0017 D1):
 * - **Was**: drag onto block-B's edge → mode=split-{left,right,top,bottom}
 *   → block-B shrinks half to make space → new block fills the freed half
 * - **Now**: drag anywhere → cursor → (col, row) → `inferDropIntent`
 *   computes the largest empty rect containing cursor (clamped by
 *   `DEFAULT_SIZES[kind]`) → place at that rect's top-left
 * - Gravity invariant runs after every op (Option A locked per
 *   ADR-0020 D3). Caller may opt out via `{gravity: false}` for
 *   PowerPoint-style free placement (not currently exposed in editor).
 */
import type { Editor } from '@tiptap/core';
import {
  type Block,
  type BlockKind,
  type DropIntent,
  type GridState,
  TOTAL_COLS,
  inferDropIntent,
  insertBlock,
  transformBlock,
} from '@skb/grid-engine';
import { liveBlockPositions, type SerializedBlock } from './pipeline-snapshot';

/**
 * Build engine `GridState` from an editor snapshot. Assigns explicit
 * rows to blocks missing `row` via a row-packing pass (CSS
 * grid-auto-flow analog): walks blocks in doc order, tracks per-column
 * "next available row", places each block at the max of its columns'
 * next-available rows.
 *
 * The block `kind` is derived from the snapshot's `nodeName` (block
 * type name): see `nodeNameToKind` below for the mapping.
 */
export function toEngineState(snapshot: readonly SerializedBlock[]): {
  state: GridState;
  /** Doc-order index → block.id, for blocks that gained an implicit row. */
  resolvedRows: Map<string, number>;
} {
  // colNextRow[c] = next free row (0-indexed) in column c.
  const colNextRow: number[] = Array.from({ length: TOTAL_COLS }, () => 0);
  const blocks: Block[] = [];
  const resolvedRows = new Map<string, number>();

  for (const b of snapshot) {
    const engineCol = b.col - 1;
    let engineRow: number;
    if (b.row !== undefined) {
      engineRow = b.row - 1;
    } else {
      // grid-auto-flow analog: find max of next-available across the
      // block's column span.
      let maxNext = 0;
      for (let c = engineCol; c < engineCol + b.colSpan; c++) {
        if (c >= 0 && c < TOTAL_COLS) {
          const v = colNextRow[c];
          if (typeof v === 'number' && v > maxNext) maxNext = v;
        }
      }
      engineRow = maxNext;
      resolvedRows.set(b.id, engineRow + 1); // back to 1-based editor row
    }
    // Update colNextRow for the assigned cells.
    for (let c = engineCol; c < engineCol + b.colSpan; c++) {
      if (c >= 0 && c < TOTAL_COLS) colNextRow[c] = engineRow + b.rowSpan;
    }
    blocks.push({
      id: b.id,
      col: engineCol,
      row: engineRow,
      colSpan: b.colSpan,
      rowSpan: b.rowSpan,
      kind: nodeNameToKind(b.nodeName),
    });
  }
  return { state: { blocks, totalCols: TOTAL_COLS }, resolvedRows };
}

/**
 * Translate engine block coords back to editor attrs (1-based col/row).
 */
export function engineBlockToEditorAttrs(b: Block): {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
} {
  return {
    col: b.col + 1,
    row: b.row + 1,
    colSpan: b.colSpan,
    rowSpan: b.rowSpan,
  };
}

/**
 * Translate a pixel cursor position on the editor's grid container into
 * engine grid coords (0-indexed). `oneFrPx` = the width of one column
 * (including its share of the gap), `rowPx` = row-h + gap.
 *
 * Returns `{ col, row }` clamped to engine bounds (col 0..totalCols-1,
 * row 0..∞).
 */
export function cursorToEngineCoord(
  cursorX: number,
  cursorY: number,
  containerRect: { left: number; top: number },
  oneFrPx: number,
  rowPx: number,
): { col: number; row: number } {
  const col = Math.max(
    0,
    Math.min(TOTAL_COLS - 1, Math.floor((cursorX - containerRect.left) / oneFrPx)),
  );
  const row = Math.max(0, Math.floor((cursorY - containerRect.top) / rowPx));
  return { col, row };
}

/**
 * Infer the drop intent at a cursor position for a MOVE op. Builds a
 * baseline state with the source block REMOVED (so the source's own
 * area is available for hole-fill), runs `inferDropIntent`, then
 * overrides the result's size to the source's actual size (move
 * preserves size).
 *
 * Returns `null` when the source block is missing from the baseline
 * (caller dispatches mode-none).
 */
export function intentForMove(
  state: GridState,
  sourceId: string,
  cursorCol: number,
  cursorRow: number,
): DropIntent | null {
  const source = state.blocks.find((b) => b.id === sourceId);
  if (!source) return null;
  const withoutSource: GridState = {
    ...state,
    blocks: state.blocks.filter((b) => b.id !== sourceId),
  };
  const probe = inferDropIntent(withoutSource, cursorCol, cursorRow, source.kind);
  if (probe.intent !== 'place') return probe;
  return {
    intent: 'place',
    col: probe.col,
    row: probe.row,
    colSpan: source.colSpan,
    rowSpan: source.rowSpan,
  };
}

/**
 * Infer the drop intent at a cursor position for an INSERT op (palette
 * drag). Direct passthrough to `inferDropIntent` against the full
 * state.
 */
export function intentForInsert(
  state: GridState,
  blockKind: BlockKind,
  cursorCol: number,
  cursorRow: number,
): DropIntent {
  return inferDropIntent(state, cursorCol, cursorRow, blockKind);
}

/**
 * Commit a MOVE op at the given cursor coord: source block moves to
 * the intent's anchor with its current size, gravity collapses, all
 * mutated blocks get setNodeMarkup writes.
 *
 * Returns `{didMutate, mutation}`. `mutation: null` on reject /
 * source-missing / engine error.
 */
export function commitMoveAtCursor(
  editor: Editor,
  snapshot: readonly SerializedBlock[],
  sourceId: string,
  cursorCol: number,
  cursorRow: number,
): CommitResult {
  const { state, resolvedRows } = toEngineState(snapshot);
  const intent = intentForMove(state, sourceId, cursorCol, cursorRow);
  if (!intent || intent.intent !== 'place') {
    return { didMutate: false, mutation: null };
  }
  const r = transformBlock(state, sourceId, {
    col: intent.col,
    row: intent.row,
    colSpan: intent.colSpan,
    rowSpan: intent.rowSpan,
  });
  if (!r.ok) return { didMutate: false, mutation: null };
  return writeBackMutations(editor, snapshot, state, r.state, resolvedRows);
}

/**
 * Commit an INSERT op at the given cursor coord: new block of the given
 * kind inserts at the intent's anchor with the intent's hole-fill size,
 * gravity collapses. The new block's id is `newBlockId`; the inserted
 * doc-position is at `insertPos` (caller's responsibility to call
 * Tiptap insert FIRST then commitInsertAtCursor on the resulting
 * snapshot).
 *
 * Returns `{didMutate, mutation}`. `mutation: null` on reject / engine
 * error.
 */
export function commitInsertAtCursor(
  editor: Editor,
  snapshot: readonly SerializedBlock[],
  newBlockId: string,
  kind: BlockKind,
  cursorCol: number,
  cursorRow: number,
): CommitResult {
  const { state, resolvedRows } = toEngineState(snapshot);
  const intent = inferDropIntent(state, cursorCol, cursorRow, kind);
  if (intent.intent !== 'place') {
    return { didMutate: false, mutation: null };
  }
  const r = insertBlock(state, {
    id: newBlockId,
    col: intent.col,
    row: intent.row,
    colSpan: intent.colSpan,
    rowSpan: intent.rowSpan,
    kind,
  });
  if (!r.ok) return { didMutate: false, mutation: null };
  return writeBackMutations(editor, snapshot, state, r.state, resolvedRows);
}

export interface CommitResult {
  readonly didMutate: boolean;
  /** The full post-op GridState (in engine coords) — for reducer dispatch + telemetry. */
  readonly mutation: GridState | null;
}

/**
 * Diff old vs new engine state, emit setNodeMarkup transactions for
 * every mutated block (col / row / colSpan / rowSpan changes).
 * Implicit-row blocks (those in `resolvedRows`) ALSO get explicit row
 * written if their position changed, so subsequent reads see explicit
 * row attrs.
 */
function writeBackMutations(
  editor: Editor,
  snapshot: readonly SerializedBlock[],
  oldState: GridState,
  newState: GridState,
  resolvedRows: Map<string, number>,
): CommitResult {
  const livePositions = liveBlockPositions(editor, snapshot);
  const chain = editor.chain();
  let didMutate = false;
  for (const next of newState.blocks) {
    const prev = oldState.blocks.find((b) => b.id === next.id);
    const live = livePositions.get(next.id);
    if (!live) {
      // New block — handled by the caller's prior insert; skip here.
      continue;
    }
    const editorAttrs = engineBlockToEditorAttrs(next);
    const sameCol = prev && prev.col === next.col;
    const sameRow = prev && prev.row === next.row;
    const sameColSpan = prev && prev.colSpan === next.colSpan;
    const sameRowSpan = prev && prev.rowSpan === next.rowSpan;
    const hadImplicitRow = resolvedRows.has(next.id);
    if (prev && sameCol && sameRow && sameColSpan && sameRowSpan && !hadImplicitRow) {
      continue;
    }
    chain.command(({ tr }) => {
      const node = tr.doc.nodeAt(live.pos);
      if (!node) return false;
      const nextAttrs = {
        ...node.attrs,
        col: editorAttrs.col,
        row: editorAttrs.row,
        colSpan: editorAttrs.colSpan,
        rowSpan: editorAttrs.rowSpan,
      };
      tr.setNodeMarkup(live.pos, undefined, nextAttrs);
      return true;
    });
    didMutate = true;
  }
  if (didMutate) chain.run();
  return { didMutate, mutation: newState };
}

/**
 * Map a Tiptap node type name to a grid-engine BlockKind. Node names
 * use kebab-case (e.g. `nn-viz`, `agent-flow`); editor-shell's
 * registry-wire maps `BlockAffordanceKind` ↔ node name. Unrecognized
 * names default to `'markdown'` (treated as prose).
 */
function nodeNameToKind(nodeName: string): BlockKind {
  switch (nodeName) {
    case 'markdown':
    case 'image':
    case 'code':
    case 'callout':
    case 'math':
    case 'pdf':
    case 'jupyter':
    case 'nn-viz':
    case 'agent-flow':
      return nodeName;
    // editor-shell uses 'componentCode' as the affordance key; the
    // mdx-bridge JSX component is `Code`. Treat as code.
    case 'componentCode':
      return 'code';
    default:
      return 'markdown';
  }
}
