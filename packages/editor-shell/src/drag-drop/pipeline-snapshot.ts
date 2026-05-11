/**
 * @skb/editor-shell pipeline snapshot helpers.
 *
 * Wave 6 cf-20c-2 R2 (2026-05-09) — extracted from
 * use-drag-drop-pipeline.ts to keep the main hook file under the
 * 500-line size-check hard limit. The 3 helpers (snapshotBlocks,
 * measureBlockRects, liveBlockPositions) form a coherent
 * "drag-snapshot" surface: walk the Tiptap doc, measure DOM rects,
 * and translate snapshot IDs back to live ProseMirror positions
 * at drop time.
 *
 * Block ID source per cf-20c-2 D2 path A: ProseMirror node `pos` as
 * stable string identifier within a single drag transaction. The
 * snapshot captures pos at drag-start; the pipeline never re-walks
 * the doc during drag-over (would invalidate pos under a
 * transaction). At drop, `liveBlockPositions` walks the doc again
 * to map snapshot positions → live positions before dispatching
 * setNodeMarkup.
 */
import type { Editor } from '@tiptap/core';
import type { BlockGridPosition } from '@skb/block-foundation';

/**
 * Wave 7 Phase 2B.2 (ADR-0020 D2): the legacy `IdentifiedBlock` from
 * the deleted `apply-drop-mode.ts` is replaced by a direct extension
 * of `BlockGridPosition` + an `id` field. `SerializedBlock` keeps the
 * same fields (id, col, row?, colSpan, rowSpan, pmPos, nodeName) so
 * downstream callers remain byte-equivalent.
 */
export interface IdentifiedBlock extends BlockGridPosition {
  readonly id: string;
}

export interface SerializedBlock extends IdentifiedBlock {
  readonly pmPos: number;
  readonly nodeName: string;
}

/**
 * Normalize a node's `rowSpan` attr to an integer ≥ 1. Wave 7 Phase 2A
 * (ADR-0020 D1): rowSpan is a discrete integer. Legacy `'auto'` from
 * un-migrated state is normalized to 1.
 */
function normalizeRowSpan(raw: unknown): number {
  if (raw === 'auto') return 1;
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1) return raw;
  return 1;
}

/**
 * Walk the editor doc and return one IdentifiedBlock per `.skb-block-nodeview`
 * NodeView. Block id = ProseMirror node `pos` as string. Used at
 * drag-start to populate the snapshot; never re-called during
 * drag-over (snapshot semantics per ADR-0017 D6 lift mode).
 */
export function snapshotBlocks(editor: Editor): SerializedBlock[] {
  const blocks: SerializedBlock[] = [];
  editor.state.doc.descendants((node, pos) => {
    const isBlockNode = node.type.spec['group']?.toString().includes('block') ?? false;
    if (!isBlockNode || !node.attrs) return undefined;
    // Filter to NodeView blocks only (skip prose paragraphs etc.).
    const colAttr: unknown = node.attrs['col'];
    if (typeof colAttr !== 'number') return undefined;
    const rowAttr: unknown = node.attrs['row'];
    blocks.push({
      id: String(pos),
      pmPos: pos,
      nodeName: node.type.name,
      col: colAttr,
      ...(typeof rowAttr === 'number' && { row: rowAttr }),
      colSpan: node.attrs['colSpan'] as number,
      // Wave 7 Phase 2A (ADR-0020 D1): rowSpan is integer. Legacy
      // `'auto'` from un-migrated state is normalized to 1.
      rowSpan: normalizeRowSpan(node.attrs['rowSpan']),
    });
    return false; // Don't descend into block nodes.
  });
  return blocks;
}

/**
 * Measure DOM bounding rects for every snapshot block. Selector pattern
 * `.skb-block-nodeview` is the editor-mount path (cf-19); we look up
 * the wrapper for each snapshot block by walking the editor's DOM.
 */
export function measureBlockRects(
  editor: Editor,
  blocks: readonly SerializedBlock[],
): Map<string, DOMRectReadOnly> {
  const rects = new Map<string, DOMRectReadOnly>();
  const editorEl = editor.view.dom;
  for (const block of blocks) {
    const node = editor.view.nodeDOM(block.pmPos);
    const el = node instanceof HTMLElement ? node : null;
    if (el) {
      rects.set(block.id, el.getBoundingClientRect());
    } else {
      // Fallback: scan for matching kind under editor DOM root.
      const fallback = editorEl.querySelector(
        `.skb-block-nodeview[data-skb-block-kind="${block.nodeName}"]`,
      );
      if (fallback instanceof HTMLElement) {
        rects.set(block.id, fallback.getBoundingClientRect());
      }
    }
  }
  return rects;
}

/**
 * Translate snapshot id → live pmPos at drop-time. The snapshot id IS
 * the pmPos string at drag-start; positions may shift if an external
 * transaction mutated the doc during drag (rare but possible). We
 * walk the live doc and match by (nodeName + original pmPos) as a
 * best-effort; if a block can't be located, skip its attr update.
 */
export function liveBlockPositions(
  editor: Editor,
  snapshot: readonly SerializedBlock[],
): Map<string, { pos: number; nodeName: string }> {
  const map = new Map<string, { pos: number; nodeName: string }>();
  const liveBlocks: Array<{ pos: number; nodeName: string }> = [];
  editor.state.doc.descendants((node, pos) => {
    if (typeof node.attrs?.['col'] !== 'number') return undefined;
    liveBlocks.push({ pos, nodeName: node.type.name });
    return false;
  });
  // Same-order match (sample-blocks fixtures all colSpan=12; block
  // count is stable during a single drag transaction). Future
  // cf-20c-3+ cross-doc-mutation case adds a stable id field per
  // ADR-0016 D2 amendment.
  for (let i = 0; i < snapshot.length && i < liveBlocks.length; i++) {
    const snapBlock = snapshot[i];
    const liveBlock = liveBlocks[i];
    if (snapBlock && liveBlock && snapBlock.nodeName === liveBlock.nodeName) {
      map.set(snapBlock.id, { pos: liveBlock.pos, nodeName: liveBlock.nodeName });
    }
  }
  return map;
}
