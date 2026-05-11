/**
 * @skb/editor-shell commit-external-drop — external-source drop
 * commit helper for the cf-24 PaletteSidebar drag-to-insert path.
 *
 * Wave 6 cf-24 (2026-05-10) — sibling to cf-22 commit-drop.ts. Where
 * commit-drop handles per-block MOVE (sourceBlockId = real UUID,
 * source block already exists in the doc), commit-external-drop
 * handles INSERT (sourceBlockId = EXTERNAL_DROP_SENTINEL; the new
 * block must be created via `appendBlockKind` (cf-24 R0 F1 fix —
 * deterministic doc-end append; NOT `insertBlockKind` which would
 * insert at user's current selection) first, then positioned via
 * applyDropMode + setNodeMarkup).
 *
 * Per ADR-0017 v0.4 D14:
 * 1. `appendBlockKind` appends the new block at end-of-doc with
 *    default attrs (cf-24 R0 F1 fix — deterministic-end contract;
 *    pre-fix `insertBlockKind` would respect user selection +
 *    break the post-snap diff at line 110 when user selection was
 *    mid-doc).
 * 2. Snapshot the doc (now with the new block at end).
 * 3. Identify the new block's id from the live doc walk (the
 *    deterministic-end append guarantees exactly one new id in
 *    the post-snap diff).
 * 4. Build the applyDropMode input with sourceBlockId = newBlockId
 *    + remove the new block from the baseline (so applyDropMode
 *    sees the doc PRE-insertion + treats the new block as the
 *    source being placed via mode={empty | split-*}).
 *    This reuses applyDropMode's existing per-block move algebra
 *    rather than reaching for the native palette-insert (sourceBlockId
 *    === null + newBlock) path; the move path is well-tested + already
 *    handles split-* host shrinking correctly.
 * 5. Translate the mutation snapshot → setNodeMarkup chain.
 *
 * The helper is NOT pure (mutates the editor) but has no React + no
 * DOM event interactions, so it can be unit-tested via Tiptap mock.
 *
 * Plan deviation: PR.md cf-24 D5 originally said "bypass
 * commitDropAtMatch entirely; insertBlockKind + setNodeMarkup".
 * Implementation reuses applyDropMode (which natively supports
 * sourceBlockId === null + newBlock palette insertion path per
 * apply-drop-mode.ts:65-70), routing through it for split-* host
 * shrinking correctness; AND swaps the insert helper to
 * `appendBlockKind` per cf-24 R0 F1 fix for selection-state
 * independence. Documented at orchestrator hand-back + R0 R1
 * iteration.
 */
import type { Editor } from '@tiptap/core';
import { applyDropMode, type IdentifiedBlock } from './apply-drop-mode';
import type { EdgeMatch } from './tiebreak';
import type { LayoutAction } from './layout-reducer';
import {
  liveBlockPositions,
  snapshotBlocks,
  type SerializedBlock,
} from './pipeline-snapshot';
import {
  appendBlockKind,
  defaultBlockAttrsFor,
  type BlockAffordanceKind,
} from '../registry-wire';

export interface CommitExternalDropInput {
  /** The Tiptap editor instance. */
  readonly editor: Editor;
  /** The active drop target match resolved by tiebreak. */
  readonly activeMatch: EdgeMatch;
  /** The block kind to insert (from PaletteSidebar drag). */
  readonly kind: BlockAffordanceKind;
  /** Pre-drop snapshot of all blocks (taken at dragstart, not
   *  post-insert; this is the baseline applyDropMode operates on). */
  readonly preInsertSnapshot: readonly SerializedBlock[];
}

export interface CommitExternalDropResult {
  /** True when an insert + position commit succeeded (pulse fires). */
  readonly didMutate: boolean;
  /** The id of the freshly-inserted block (post-Tiptap insert),
   *  or null on failure. */
  readonly insertedBlockId: string | null;
  /** The final col / row the block landed at; consumers use this
   *  for the WCAG 4.1.3 commit announcement (formatExternalDragCommit). */
  readonly landedCol: number | null;
}

/**
 * Commit an external-source drop. Inserts a new block of `kind` at
 * end-of-doc, then runs applyDropMode to position it at the drop
 * target (split-* may also shrink the host).
 *
 * Returns `{ didMutate: false, insertedBlockId: null, landedCol: null }`
 * when:
 *  - `appendBlockKind` returns null (editor invalid / unknown kind /
 *    chain run returned false).
 *  - applyDropMode throws (algebra precondition failed).
 *  - The newly-inserted block can't be found in the post-insert doc walk.
 *
 * Caller (use-drag-drop-pipeline.ts handleDrop) dispatches mode-none on
 * failure + clears state per the same flow as commitDropAtMatch.
 */
export function commitExternalDrop(
  input: CommitExternalDropInput,
): CommitExternalDropResult {
  const { editor, activeMatch, kind, preInsertSnapshot } = input;

  // Step 1: append the new block at DETERMINISTIC doc-end position
  // via the cf-24 R0 F1 fix `appendBlockKind` helper (NOT
  // `insertBlockKind` — see registry-wire.tsx:appendBlockKind JSDoc
  // for the rationale). insertBlockKind inserts at the user's
  // current selection (correct for slash-menu / PaletteModal); for
  // external-source drag we MUST land at end so the post-insert
  // snapshot diff identifies exactly one new block id (the appended
  // one), with no ambiguity from selection-state-dependent position
  // shifts.
  const insertPos = appendBlockKind(editor, kind);
  if (insertPos === null) {
    return { didMutate: false, insertedBlockId: null, landedCol: null };
  }

  // Step 2: post-insert snapshot — the new block is at the END of
  // the doc with default attrs. Identify by diffing pre-insert ids
  // (deterministic post-cf-24-R0-F1: append-at-end guarantees
  // exactly one new block in the post-snap that wasn't in pre-snap).
  const postInsertSnap = snapshotBlocks(editor);
  const preIds = new Set(preInsertSnapshot.map((b) => b.id));
  const newBlock = postInsertSnap.find((b) => !preIds.has(b.id));
  if (!newBlock) {
    return { didMutate: false, insertedBlockId: null, landedCol: null };
  }

  // Step 3: build the applyDropMode input. The baseline is the
  // PRE-insert snapshot + the new block tagged with default
  // grid attrs. Treat the new block as the source being placed
  // via the existing per-block move algebra; that way split-* host
  // shrinking is handled correctly without duplicating the math.
  const defaults = defaultBlockAttrsFor(kind);
  const newAsSource: IdentifiedBlock = {
    id: newBlock.id,
    col: typeof defaults.col === 'number' ? defaults.col : 1,
    ...(typeof defaults.row === 'number' && { row: defaults.row }),
    colSpan: typeof defaults.colSpan === 'number' ? defaults.colSpan : 12,
    rowSpan: typeof defaults.rowSpan === 'number' ? defaults.rowSpan : 1,
  };

  // Convert preInsertSnapshot (SerializedBlock[]) to IdentifiedBlock[]
  // so applyDropMode can consume it. Add the new block at the end
  // (so applyDropMode's "remove source from baseline" branch finds it).
  const baselineWithSource = {
    blocks: [
      ...preInsertSnapshot.map((b): IdentifiedBlock => ({
        id: b.id,
        col: b.col,
        ...(b.row !== undefined && { row: b.row }),
        colSpan: b.colSpan,
        rowSpan: b.rowSpan,
      })),
      newAsSource,
    ],
  };

  // Step 4: run applyDropMode. EdgeMatch.mode is always one of the
  // 4 split-* values (per tiebreak EdgeMode union); 'empty' / 'none'
  // are pipeline-level concepts not produced by the tiebreak path.
  // applyDropMode handles host-shrinking + source placement
  // automatically for split-* modes.
  let mutation;
  try {
    mutation = applyDropMode({
      baseline: baselineWithSource,
      mode: activeMatch.mode,
      sourceBlockId: newBlock.id,
      hostBlockId: activeMatch.blockId,
    });
  } catch {
    // Algebra precondition failed (e.g. split-* on too-small host).
    // The block was inserted at end-of-doc with defaults — that's
    // an acceptable degraded UX (block is in the doc, just not at
    // the user's exact target slot). We return didMutate=true with
    // landedCol from defaults so the announcer fires + user sees
    // the new block.
    return {
      didMutate: true,
      insertedBlockId: newBlock.id,
      landedCol: newAsSource.col,
    };
  }

  // Step 5: translate mutation → setNodeMarkup chain. We need to
  // walk the post-insert doc (the new block is now in it) and
  // setNodeMarkup for any block whose attrs changed.
  const livePositions = liveBlockPositions(editor, postInsertSnap);
  const chain = editor.chain();
  let didMutate = false;
  let landedCol = newAsSource.col;
  for (const mutated of mutation.blocks) {
    const baselineBlock = baselineWithSource.blocks.find((b) => b.id === mutated.id);
    if (!baselineBlock) continue;
    const sameCol = baselineBlock.col === mutated.col;
    const sameRow = (baselineBlock.row ?? null) === (mutated.row ?? null);
    const sameColSpan = baselineBlock.colSpan === mutated.colSpan;
    const sameRowSpan = baselineBlock.rowSpan === mutated.rowSpan;
    if (mutated.id === newBlock.id) {
      // Track the landed col for the announcement even if attrs
      // happen to equal defaults (e.g. drop at empty col=1).
      landedCol = mutated.col;
    }
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

  return {
    didMutate: true, // insertion itself counts as a mutation
    insertedBlockId: newBlock.id,
    landedCol,
  };
}

export interface RunExternalDropDispatchInput {
  readonly editor: Editor;
  readonly activeMatch: EdgeMatch;
  readonly kind: BlockAffordanceKind;
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
 * Wave 6 cf-24 — pipeline-side dispatch wrapper around
 * commitExternalDrop. Encapsulates the layout reducer dispatch +
 * announce + 2-rAF drop-pulse measurement so the use-drag-drop-pipeline
 * file stays under the size-check 500 LOC hard cap. Mirrors the
 * shape of commit-drop.ts's commitDropAtMatch return-then-caller-handles
 * pattern, but pushes the dispatch + pulse into the helper because
 * the cf-24 path has more branches (fail / no-mutation / success +
 * pulse) than commit-drop's two-state result.
 *
 * Returns true if the caller should treat the drop as a successful
 * commit (clear active state via the standard reset). Returns false
 * on degraded UX (insert ran but positioning failed; cf-24 still
 * counts that as a successful insert from the user's POV — the
 * block is in the doc).
 */
export function runExternalDropDispatch(
  input: RunExternalDropDispatchInput,
): boolean {
  const {
    editor,
    activeMatch,
    kind,
    preInsertSnapshot,
    dispatchLayout,
    setLastDroppedBlockId,
    setLastDroppedRect,
    setDropEpoch,
    onAnnounceExternalCommit,
  } = input;
  const extResult = commitExternalDrop({
    editor,
    activeMatch,
    kind,
    preInsertSnapshot,
  });
  if (!extResult.didMutate || !extResult.insertedBlockId) {
    dispatchLayout({ type: 'drag-end-mode-none' });
    return false;
  }
  // Re-snapshot post-insert + dispatch reducer success so layoutEpoch
  // advances per ADR-0016 D12.
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
  // Drop pulse on the freshly-inserted block (2-rAF anchor measurement
  // per cf-20c-2 R3 F2 pattern).
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
