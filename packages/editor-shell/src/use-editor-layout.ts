/**
 * @skb/editor-shell — useEditorLayout hook.
 *
 * Wave 7 Phase 2E (ADR-0020 D1+D2) — computes the packed engine
 * GridState from the live editor doc (assigning implicit rows via
 * grid-auto-flow analog) and exposes a per-block lookup map.
 * BlockNodeView consumes this to render absolute-positioned chrome
 * via theme.renderBlock per ADR-0020 D7.
 *
 * Cached on editor.state.doc reference: a single pack pass per
 * transaction; n=30 blocks → ~30 μs walk.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/core';
import type { Block, GridState } from '@skb/grid-engine';
import { toEngineState } from './drag-drop/grid-engine-adapter';
import { snapshotBlocks } from './drag-drop/pipeline-snapshot';

export interface EditorLayoutSnapshot {
  /** Engine state (0-indexed col/row) with implicit rows packed. */
  readonly state: GridState;
  /** O(1) lookup by block id (id = ProseMirror doc position as string). */
  readonly byId: ReadonlyMap<string, Block>;
  /** Total row count (max row + rowSpan across all blocks) for baseplate sizing. */
  readonly totalRows: number;
}

const EMPTY_SNAPSHOT: EditorLayoutSnapshot = {
  state: { blocks: [], totalCols: 12 },
  byId: new Map(),
  totalRows: 0,
};

export function useEditorLayout(editor: Editor | null): EditorLayoutSnapshot {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;
    // Wave 7 Phase 2E — only recompute on doc updates that change
    // structure. `selectionUpdate` (every cursor move) is too noisy
    // and would cause 30 BlockNodeViews to re-render on every keypress.
    // Block attr changes (col/row/colSpan/rowSpan via setNodeMarkup)
    // also fire 'update' so this covers structural mutations.
    const listener = (): void => setVersion((v) => v + 1);
    editor.on('update', listener);
    return () => {
      editor.off('update', listener);
    };
  }, [editor]);

  return useMemo(() => {
    if (!editor) return EMPTY_SNAPSHOT;
    const blocks = snapshotBlocks(editor);
    const { state } = toEngineState(blocks);
    const byId = new Map<string, Block>();
    let maxRow = 0;
    for (const b of state.blocks) {
      byId.set(b.id, b);
      const end = b.row + b.rowSpan;
      if (end > maxRow) maxRow = end;
    }
    return { state, byId, totalRows: maxRow };
    // version drives re-compute when the editor's doc updates.
  }, [editor, version]);
}

/**
 * EditorLayoutContext lets BlockNodeView read the snapshot computed
 * by an ancestor (EditorShellMount). Each NodeView avoids re-walking
 * the doc itself; one pack pass per transaction.
 */
export const EditorLayoutContext = createContext<EditorLayoutSnapshot>(EMPTY_SNAPSHOT);

/** Hook for BlockNodeView et al. to read the layout snapshot. */
export function useEditorLayoutContext(): EditorLayoutSnapshot {
  return useContext(EditorLayoutContext);
}
