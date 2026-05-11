/**
 * @skb/editor-shell commit-drop — pure helper that runs the
 * drag-drop commit cycle (snapshot → applyDropMode → setNodeMarkup).
 *
 * Wave 6 cf-22 (2026-05-09) — extracted from
 * `use-drag-drop-pipeline.ts` so cf-22's keyboard-Enter commit path
 * can reuse the SAME mutation logic as the pointer-drop path. Pre-
 * cf-22 the commit logic was inlined in the `handleDrop` closure
 * inside the useEffect; the extraction also frees ~70 LOC from the
 * main pipeline file which was at 502 LOC (over the size-check 500
 * limit; cf-22 keyboard mode adds ~75 LOC and would push further
 * over without this extraction).
 *
 * The helper is NOT pure (it mutates the Tiptap editor + reads the
 * doc) but it has no React + no DOM interactions, so it can be
 * unit-tested via a Tiptap mock editor.
 *
 * Wave 7 Phase 2B.1 (ADR-0020 D2) — `commitDropAtCursor` added as the
 * grid-engine-backed replacement for `commitDropAtMatch`. Phase 2B.2
 * will cut over consumers + delete the 4-mode `applyDropMode` path.
 * Until then both functions are exported so the pipeline keeps
 * working byte-for-byte while the new path is type-checked + tested.
 */
import type { Editor } from '@tiptap/core';
import { applyDropMode, type GridSnapshotIdentified } from './apply-drop-mode';
import type { EdgeMatch } from './tiebreak';
import {
  liveBlockPositions,
  type SerializedBlock,
} from './pipeline-snapshot';
import {
  commitMoveAtCursor,
  type CommitResult as EngineCommitResult,
} from './grid-engine-adapter';

export interface CommitDropResult {
  /** True if at least one node was mutated (a setNodeMarkup ran). */
  readonly didMutate: boolean;
  /** The mutation snapshot from applyDropMode (returned for reducer dispatch). */
  readonly mutation: GridSnapshotIdentified | null;
}

/**
 * Commit a drag-drop. Walks `snapshot` blocks, runs `applyDropMode`
 * for the active edge match, dispatches Tiptap setNodeMarkup for
 * each mutated block. Returns `{didMutate, mutation}` so the caller
 * can decide whether to dispatch the reducer + fire the drop pulse.
 *
 * Returns `{didMutate: false, mutation: null}` when:
 *  - applyDropMode throws (algebra precondition failed; caller
 *    should treat as drag-end-mode-none).
 *  - No live PM positions exist (doc was mutated externally).
 */
export function commitDropAtMatch(
  editor: Editor,
  activeMatch: EdgeMatch,
  sourceBlockId: string,
  snapshot: readonly SerializedBlock[],
): CommitDropResult {
  // Build the baseline snapshot for applyDropMode.
  const baselineSnap: GridSnapshotIdentified = {
    blocks: snapshot.map((b) => ({
      id: b.id,
      col: b.col,
      ...(b.row !== undefined && { row: b.row }),
      colSpan: b.colSpan,
      rowSpan: b.rowSpan,
    })),
  };

  let mutation: GridSnapshotIdentified;
  try {
    mutation = applyDropMode({
      baseline: baselineSnap,
      mode: activeMatch.mode,
      sourceBlockId,
      hostBlockId: activeMatch.blockId,
    });
  } catch {
    // Algebra precondition failed — caller dispatches mode-none.
    return { didMutate: false, mutation: null };
  }

  // Translate snapshot mutation → Tiptap attr updates.
  const livePositions = liveBlockPositions(editor, snapshot);
  const chain = editor.chain();
  let didMutate = false;
  for (const mutated of mutation.blocks) {
    const original = baselineSnap.blocks.find((b) => b.id === mutated.id);
    if (!original) continue;
    const sameCol = original.col === mutated.col;
    const sameRow = (original.row ?? null) === (mutated.row ?? null);
    const sameColSpan = original.colSpan === mutated.colSpan;
    const sameRowSpan = original.rowSpan === mutated.rowSpan;
    if (sameCol && sameRow && sameColSpan && sameRowSpan) continue;
    const live = livePositions.get(mutated.id);
    if (!live) continue;
    chain.command(({ tr }) => {
      const node = tr.doc.nodeAt(live.pos);
      if (!node) return false;
      const nextAttrs = {
        ...node.attrs,
        col: mutated.col,
        colSpan: mutated.colSpan,
        rowSpan: mutated.rowSpan,
        ...(mutated.row !== undefined && { row: mutated.row }),
      };
      tr.setNodeMarkup(live.pos, undefined, nextAttrs);
      return true;
    });
    didMutate = true;
  }
  if (didMutate) chain.run();

  return { didMutate, mutation };
}

/**
 * Wave 7 Phase 2B.1 — grid-engine-backed drop commit.
 *
 * Commits a drag-drop move using `@skb/grid-engine` ops (hole-fill
 * intent inference + per-block AABB upward gravity per ADR-0020 D2/D3).
 * The host block is NEVER shrunk (vs cf-20c-1 split-with-shrink).
 *
 * Returns `{didMutate, mutation: post-op engine GridState | null}`.
 * `mutation: null` on reject (cursor in occupied region, source missing,
 * engine validation failed).
 *
 * Phase 2B.2 (next PR) wires the pipeline + tests + deletes the
 * legacy `commitDropAtMatch` 4-mode path once consumers cut over.
 */
export function commitDropAtCursor(
  editor: Editor,
  snapshot: readonly SerializedBlock[],
  sourceBlockId: string,
  cursorCol: number,
  cursorRow: number,
): EngineCommitResult {
  return commitMoveAtCursor(editor, snapshot, sourceBlockId, cursorCol, cursorRow);
}
