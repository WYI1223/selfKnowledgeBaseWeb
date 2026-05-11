/**
 * @skb/editor-shell commit-drop — drag-drop commit helper.
 *
 * Wave 7 Phase 2B.2 (ADR-0020 D2) — the cf-20c-1 4-mode
 * `applyDropMode` path has been removed. Commit is now driven by the
 * cursor's (col, row) grid coord; `commitDropAtCursor` delegates to
 * the grid-engine adapter (`commitMoveAtCursor`), which runs
 * `transformBlock` with gravity per ADR-0020 D3 Option A. The host
 * block is never shrunk.
 */
import type { Editor } from '@tiptap/core';
import {
  commitMoveAtCursor,
  type CommitResult,
} from './grid-engine-adapter';
import { type SerializedBlock } from './pipeline-snapshot';

/**
 * Commit a drag-drop move at the cursor's grid coord. The source block
 * moves to the inferred hole-fill anchor (preserving its size); gravity
 * collapses; mutated blocks are written back via setNodeMarkup.
 *
 * Returns `{didMutate: false, mutation: null}` when:
 *  - Cursor coord falls in a rejected region (no hole-fill possible).
 *  - Source block missing from snapshot.
 *  - Engine rejects the op (would overlap, out of bounds, etc.).
 */
export function commitDropAtCursor(
  editor: Editor,
  snapshot: readonly SerializedBlock[],
  sourceBlockId: string,
  cursorCol: number,
  cursorRow: number,
): CommitResult {
  return commitMoveAtCursor(editor, snapshot, sourceBlockId, cursorCol, cursorRow);
}
