/**
 * Wave 7 Phase 2B.1 — grid-engine adapter contract tests.
 *
 * Covers the snapshot ↔ GridState bridge + intent helpers in isolation
 * (no Tiptap editor). The Tiptap-coupled commit functions
 * (commitMoveAtCursor / commitInsertAtCursor) are covered indirectly
 * by the EditorShell + cf-25 markdown-block playwright specs at Phase
 * 2B.2 (full cutover); their write-back path is the existing
 * setNodeMarkup pattern.
 */
import { describe, expect, test } from 'vitest';
import { TOTAL_COLS } from '@skb/grid-engine';
import type { SerializedBlock } from '../../drag-drop/pipeline-snapshot';
import {
  cursorToEngineCoord,
  engineBlockToEditorAttrs,
  intentForInsert,
  intentForMove,
  toEngineState,
} from '../../drag-drop/grid-engine-adapter';

function block(
  partial: Partial<SerializedBlock> & Pick<SerializedBlock, 'id' | 'nodeName'>,
): SerializedBlock {
  return {
    pmPos: 0,
    nodeName: partial.nodeName,
    id: partial.id,
    col: partial.col ?? 1,
    colSpan: partial.colSpan ?? 12,
    rowSpan: partial.rowSpan ?? 1,
    ...(partial.row !== undefined && { row: partial.row }),
  };
}

describe('toEngineState — 1-based editor ↔ 0-based engine coords', () => {
  test('explicit row maps editor 1-based → engine 0-based', () => {
    const { state, resolvedRows } = toEngineState([
      block({ id: 'a', nodeName: 'callout', col: 1, row: 1, colSpan: 6, rowSpan: 2 }),
      block({ id: 'b', nodeName: 'image', col: 7, row: 1, colSpan: 6, rowSpan: 2 }),
    ]);
    expect(state.blocks).toEqual([
      { id: 'a', col: 0, row: 0, colSpan: 6, rowSpan: 2, kind: 'callout' },
      { id: 'b', col: 6, row: 0, colSpan: 6, rowSpan: 2, kind: 'image' },
    ]);
    expect(state.totalCols).toBe(TOTAL_COLS);
    expect(resolvedRows.size).toBe(0);
  });

  test('implicit row (undefined) gets packed by grid-auto-flow analog', () => {
    // Block 1: full row at top. Block 2 (no row): would land at row 2 (1-based).
    const { state, resolvedRows } = toEngineState([
      block({ id: 'a', nodeName: 'image', col: 1, row: 1, colSpan: 12, rowSpan: 2 }),
      block({ id: 'b', nodeName: 'callout', col: 1, colSpan: 6, rowSpan: 1 }),
    ]);
    expect(state.blocks[1]).toMatchObject({
      id: 'b',
      col: 0,
      row: 2, // engine 0-based: cols 1-12 row 1-2 occupied → next free = row 2
      colSpan: 6,
      rowSpan: 1,
      kind: 'callout',
    });
    expect(resolvedRows.get('b')).toBe(3); // 1-based editor row
  });

  test('node-name → BlockKind mapping (markdown / image / componentCode → code)', () => {
    const { state } = toEngineState([
      block({ id: 'a', nodeName: 'markdown' }),
      block({ id: 'b', nodeName: 'componentCode' }),
      block({ id: 'c', nodeName: 'nn-viz' }),
      block({ id: 'd', nodeName: 'agent-flow' }),
    ]);
    expect(state.blocks.map((b) => b.kind)).toEqual([
      'markdown',
      'code',
      'nn-viz',
      'agent-flow',
    ]);
  });

  test('unknown node-name falls through to markdown (prose default)', () => {
    const { state } = toEngineState([
      block({ id: 'a', nodeName: 'unknown-future-kind' }),
    ]);
    expect(state.blocks[0]?.kind).toBe('markdown');
  });
});

describe('engineBlockToEditorAttrs', () => {
  test('reverses col/row from 0-based engine to 1-based editor', () => {
    expect(
      engineBlockToEditorAttrs({
        id: 'x',
        col: 3,
        row: 4,
        colSpan: 6,
        rowSpan: 2,
        kind: 'callout',
      }),
    ).toEqual({ col: 4, row: 5, colSpan: 6, rowSpan: 2 });
  });
});

describe('cursorToEngineCoord — pixel → grid coord clamped to bounds', () => {
  const containerRect = { left: 100, top: 200 };
  const oneFrPx = 80;
  const rowPx = 62;

  test('cursor at container top-left maps to (0, 0)', () => {
    expect(cursorToEngineCoord(100, 200, containerRect, oneFrPx, rowPx)).toEqual({
      col: 0,
      row: 0,
    });
  });

  test('cursor 1 fr right + 2 rows down maps to (1, 2)', () => {
    expect(
      cursorToEngineCoord(100 + 80, 200 + 124, containerRect, oneFrPx, rowPx),
    ).toEqual({ col: 1, row: 2 });
  });

  test('cursor past col 12 clamps to col 11 (max col index)', () => {
    expect(
      cursorToEngineCoord(100 + 80 * 20, 200, containerRect, oneFrPx, rowPx),
    ).toEqual({ col: TOTAL_COLS - 1, row: 0 });
  });

  test('cursor above container clamps to row 0', () => {
    expect(cursorToEngineCoord(100, 100, containerRect, oneFrPx, rowPx)).toEqual({
      col: 0,
      row: 0,
    });
  });

  test('cursor far below grows row unbounded', () => {
    const result = cursorToEngineCoord(100, 200 + 62 * 50, containerRect, oneFrPx, rowPx);
    expect(result.row).toBe(50);
  });
});

describe('intentForMove — source-removed baseline + size preservation', () => {
  test('moves block-a into the hole left by removing block-a (own area available)', () => {
    const { state } = toEngineState([
      block({ id: 'a', nodeName: 'callout', col: 1, row: 1, colSpan: 6, rowSpan: 2 }),
    ]);
    const intent = intentForMove(state, 'a', 0, 0);
    expect(intent?.intent).toBe('place');
    expect(intent?.col).toBe(0);
    expect(intent?.row).toBe(0);
    expect(intent?.colSpan).toBe(6); // source size preserved
    expect(intent?.rowSpan).toBe(2);
  });

  test('returns null when source id missing from state', () => {
    const { state } = toEngineState([
      block({ id: 'a', nodeName: 'callout', col: 1, row: 1, colSpan: 6, rowSpan: 2 }),
    ]);
    expect(intentForMove(state, 'ghost', 0, 0)).toBeNull();
  });

  test('cursor on another block returns intent.intent="reject"', () => {
    const { state } = toEngineState([
      block({ id: 'a', nodeName: 'callout', col: 1, row: 1, colSpan: 6, rowSpan: 2 }),
      block({ id: 'b', nodeName: 'image', col: 7, row: 1, colSpan: 6, rowSpan: 2 }),
    ]);
    const intent = intentForMove(state, 'a', 8, 0); // cursor on block b
    expect(intent?.intent).toBe('reject');
  });
});

describe('intentForInsert — palette drag goes through engine inferDropIntent', () => {
  test('insert on empty cell returns place with default size', () => {
    const { state } = toEngineState([]);
    const intent = intentForInsert(state, 'image', 3, 3);
    expect(intent.intent).toBe('place');
    expect(intent.colSpan).toBeGreaterThanOrEqual(1);
    expect(intent.rowSpan).toBeGreaterThanOrEqual(1);
  });

  test('insert on occupied cell returns reject', () => {
    const { state } = toEngineState([
      block({ id: 'a', nodeName: 'callout', col: 1, row: 1, colSpan: 12, rowSpan: 2 }),
    ]);
    const intent = intentForInsert(state, 'image', 5, 0); // cursor on block a
    expect(intent.intent).toBe('reject');
  });
});
