/**
 * @skb/editor-shell commit-external-drop — external-source drop
 * commit helper for the cf-24 PaletteSidebar drag-to-insert path.
 *
 * Wave 7 Phase 2B.2 (ADR-0020 D2) — cuts over from the cf-20c-1
 * `applyDropMode` 4-mode algebra to `@skb/grid-engine` ops via the
 * grid-engine adapter. Drop intent is now inferred from the cursor's
 * (col, row) grid coord (hole-fill); the host block is NEVER shrunk.
 *
 * Per ADR-0017 v0.4 D14 (cf-24 path):
 * 1. `appendBlockKind` appends the new block at end-of-doc with
 *    default attrs (cf-24 R0 F1 deterministic doc-end append).
 * 2. Snapshot the doc (now with the new block at end).
 * 3. Identify the new block's id (the only post-snap id not in
 *    pre-snap).
 * 4. Build engine GridState from snapshot; run `transformBlock(newId,
 *    {col, row, colSpan, rowSpan})` to position the new block at the
 *    inferred drop intent. Gravity collapses (ADR-0020 D3 Option A).
 * 5. Translate the mutation → setNodeMarkup chain.
 *
 * The helper is NOT pure (mutates the editor) but has no React + no
 * DOM event interactions, so it can be unit-tested via Tiptap mock.
 */
import type { Editor } from '@tiptap/core';
import { inferDropIntent, transformBlock } from '@skb/grid-engine';
import type { LayoutAction } from './layout-reducer';
import {
  engineBlockToEditorAttrs,
  toEngineState,
} from './grid-engine-adapter';
import {
  liveBlockPositions,
  snapshotBlocks,
  type SerializedBlock,
} from './pipeline-snapshot';
import {
  appendBlockKind,
  type BlockAffordanceKind,
} from '../registry-wire';

export interface CommitExternalDropInput {
  /** The Tiptap editor instance. */
  readonly editor: Editor;
  /** The block kind to insert (from PaletteSidebar drag). */
  readonly kind: BlockAffordanceKind;
  /** Cursor (col, row) in engine 0-based coords (caller already mapped
   *  from pixel via `cursorToEngineCoord`). */
  readonly cursorCol: number;
  readonly cursorRow: number;
  /** Pre-drop snapshot of all blocks (taken at dragstart, before the
   *  insert ran). */
  readonly preInsertSnapshot: readonly SerializedBlock[];
}

export interface CommitExternalDropResult {
  /** True when an insert + position commit succeeded (pulse fires). */
  readonly didMutate: boolean;
  /** The id of the freshly-inserted block, or null on failure. */
  readonly insertedBlockId: string | null;
  /** The final col (1-based editor coord) the block landed at; for
   *  the WCAG 4.1.3 commit announcement. */
  readonly landedCol: number | null;
}

/**
 * Commit an external-source drop. Inserts a new block of `kind` at
 * end-of-doc, runs grid-engine `transformBlock` to move it to the
 * cursor's hole-fill intent.
 *
 * Returns `{ didMutate: false, ... }` when:
 *  - `appendBlockKind` returns null (editor invalid / unknown kind).
 *  - The newly-inserted block can't be found in the post-insert doc walk.
 *  - The engine rejects the cursor coord (no hole-fill possible —
 *    e.g. cursor on an existing block; degraded UX: block stays at
 *    end-of-doc with defaults).
 */
export function commitExternalDrop(
  input: CommitExternalDropInput,
): CommitExternalDropResult {
  const { editor, kind, cursorCol, cursorRow, preInsertSnapshot } = input;

  // Step 1: append the new block at DETERMINISTIC doc-end position
  // (cf-24 R0 F1 — see `appendBlockKind` JSDoc). insertBlockKind
  // inserts at user selection (correct for slash-menu); for drag we
  // MUST land at end so post-insert diff identifies exactly one new id.
  const insertPos = appendBlockKind(editor, kind);
  if (insertPos === null) {
    return { didMutate: false, insertedBlockId: null, landedCol: null };
  }

  // Step 2: post-insert snapshot — new block at the end of the doc.
  const postInsertSnap = snapshotBlocks(editor);
  const preIds = new Set(preInsertSnapshot.map((b) => b.id));
  const newBlock = postInsertSnap.find((b) => !preIds.has(b.id));
  if (!newBlock) {
    return { didMutate: false, insertedBlockId: null, landedCol: null };
  }

  // Step 3: build engine state from the PRE-insert snapshot (not
  // post-insert — we want hole-fill against the doc state the user
  // sees during dragover) + infer intent at the cursor coord.
  const { state: preInsertState } = toEngineState(preInsertSnapshot);
  const intent = inferDropIntent(
    preInsertState,
    cursorCol,
    cursorRow,
    nodeNameToKindLocal(newBlock.nodeName),
  );

  if (intent.intent !== 'place') {
    // Degraded UX: insert succeeded but cursor can't anchor. Block
    // remains at end-of-doc with defaults. Caller still counts as a
    // mutation (the user sees a new block).
    return {
      didMutate: true,
      insertedBlockId: newBlock.id,
      landedCol: newBlock.col,
    };
  }

  // Step 4: build the POST-insert engine state + transform the new
  // block to the intent's anchor + size. Gravity runs after
  // (ADR-0020 D3 Option A).
  const { state: postInsertState } = toEngineState(postInsertSnap);
  const transformResult = transformBlock(postInsertState, newBlock.id, {
    col: intent.col,
    row: intent.row,
    colSpan: intent.colSpan,
    rowSpan: intent.rowSpan,
  });
  if (!transformResult.ok) {
    return {
      didMutate: true,
      insertedBlockId: newBlock.id,
      landedCol: newBlock.col,
    };
  }

  // Step 5: write back mutations via setNodeMarkup. Walk post-op state
  // + diff against post-insert (pre-op) state; emit setNodeMarkup for
  // every changed block.
  const livePositions = liveBlockPositions(editor, postInsertSnap);
  const chain = editor.chain();
  let didMutate = false;
  let landedCol = newBlock.col;
  for (const next of transformResult.state.blocks) {
    const prev = postInsertState.blocks.find((b) => b.id === next.id);
    if (!prev) continue;
    const sameCol = prev.col === next.col;
    const sameRow = prev.row === next.row;
    const sameColSpan = prev.colSpan === next.colSpan;
    const sameRowSpan = prev.rowSpan === next.rowSpan;
    if (next.id === newBlock.id) {
      landedCol = next.col + 1; // engine 0-based → editor 1-based
    }
    if (sameCol && sameRow && sameColSpan && sameRowSpan) continue;
    const live = livePositions.get(next.id);
    if (!live) continue;
    const editorAttrs = engineBlockToEditorAttrs(next);
    chain.command(({ tr }) => {
      const node = tr.doc.nodeAt(live.pos);
      if (!node) return false;
      tr.setNodeMarkup(live.pos, undefined, {
        ...node.attrs,
        col: editorAttrs.col,
        row: editorAttrs.row,
        colSpan: editorAttrs.colSpan,
        rowSpan: editorAttrs.rowSpan,
      });
      return true;
    });
    didMutate = true;
  }
  if (didMutate) chain.run();

  return {
    didMutate: true, // insertion itself counts as a mutation
    insertedBlockId: newBlock.id,
    landedCol,
  };
}

/** Local mirror of grid-engine-adapter's nodeNameToKind (kept private
 *  to avoid exposing the helper publicly while keeping coupling tight). */
function nodeNameToKindLocal(nodeName: string): import('@skb/grid-engine').BlockKind {
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
    case 'componentCode':
      return 'code';
    default:
      return 'markdown';
  }
}

export interface RunExternalDropDispatchInput {
  readonly editor: Editor;
  readonly kind: BlockAffordanceKind;
  readonly cursorCol: number;
  readonly cursorRow: number;
  readonly preInsertSnapshot: readonly SerializedBlock[];
  readonly dispatchLayout: (action: LayoutAction) => void;
  readonly setLastDroppedBlockId: (id: string | null) => void;
  readonly setLastDroppedRect: (rect: DOMRectReadOnly | null) => void;
  readonly setDropEpoch: (updater: (prev: number) => number) => void;
  readonly onAnnounceExternalCommit?:
    | ((kind: string, col: number) => void)
    | undefined;
}

/**
 * Pipeline-side dispatch wrapper around `commitExternalDrop`.
 * Encapsulates the layout reducer dispatch + announce + 2-rAF
 * drop-pulse measurement.
 *
 * Returns true on successful commit (caller resets active state);
 * false on degraded UX (insert ran but positioning failed; from the
 * user's POV the block is in the doc).
 */
export function runExternalDropDispatch(
  input: RunExternalDropDispatchInput,
): boolean {
  const {
    editor,
    kind,
    cursorCol,
    cursorRow,
    preInsertSnapshot,
    dispatchLayout,
    setLastDroppedBlockId,
    setLastDroppedRect,
    setDropEpoch,
    onAnnounceExternalCommit,
  } = input;
  const extResult = commitExternalDrop({
    editor,
    kind,
    cursorCol,
    cursorRow,
    preInsertSnapshot,
  });
  if (!extResult.didMutate || !extResult.insertedBlockId) {
    dispatchLayout({ type: 'drag-end-mode-none' });
    return false;
  }
  // Re-snapshot post-insert + dispatch reducer success per ADR-0016 D12.
  const postSnap = snapshotBlocks(editor);
  dispatchLayout({
    type: 'drag-end-success',
    mutation: {
      blocks: postSnap.map((b) => ({
        col: b.col,
        ...(b.row !== undefined && { row: b.row }),
        colSpan: b.colSpan,
        rowSpan: b.rowSpan,
      })),
    },
  });
  if (extResult.landedCol !== null) {
    onAnnounceExternalCommit?.(kind, extResult.landedCol);
  }
  // Drop pulse on the freshly-inserted block (2-rAF anchor measurement).
  setLastDroppedBlockId(null);
  setLastDroppedRect(null);
  const insertedId = extResult.insertedBlockId;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const newLive = liveBlockPositions(editor, postSnap);
      const liveSource = newLive.get(insertedId);
      if (!liveSource) return;
      const dom = editor.view.nodeDOM(liveSource.pos);
      if (dom instanceof HTMLElement) {
        setLastDroppedBlockId(insertedId);
        setLastDroppedRect(dom.getBoundingClientRect());
        setDropEpoch((prev) => prev + 1);
      }
    });
  });
  return true;
}
