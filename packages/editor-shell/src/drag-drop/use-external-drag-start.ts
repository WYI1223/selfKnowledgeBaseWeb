/**
 * @skb/editor-shell useExternalDragStart — extracted onDragStartExternal
 * callback hook for the cf-24 PaletteSidebar drag entry.
 *
 * Wave 6 cf-24 (2026-05-10) — separated from `use-drag-drop-pipeline.ts`
 * to keep the pipeline file under the size-check 500 LOC hard cap.
 * Snapshots blocks (NO source-lift; the new block isn't in the doc
 * yet) + sets sourceBlockId = EXTERNAL_DROP_SENTINEL + flips
 * active=true. The grid dragover/drop listener (still in the pipeline
 * file) routes external-source drops through commitExternalDrop per
 * cf-24 D7.
 */
import { useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { computeEdgeRects, type BlockLayout, type EdgeRect } from './edge-rects';
import {
  measureBlockRects,
  snapshotBlocks,
  type SerializedBlock,
} from './pipeline-snapshot';
import type { LayoutAction } from './layout-reducer';
import { EXTERNAL_DROP_SENTINEL } from './external-drop-source';
import type { BlockAffordanceKind } from '../registry-wire';

export interface UseExternalDragStartOptions {
  readonly editor: Editor | null;
  readonly snapshotRef: React.MutableRefObject<readonly SerializedBlock[]>;
  readonly blockRectsRef: React.MutableRefObject<Map<string, DOMRectReadOnly>>;
  readonly edgeRectsRef: React.MutableRefObject<readonly EdgeRect[]>;
  readonly lastCursorRef: React.MutableRefObject<{ x: number; y: number; t: number } | null>;
  readonly externalDragKindRef: React.MutableRefObject<BlockAffordanceKind | null>;
  readonly dispatchLayout: (action: LayoutAction) => void;
  readonly setSourceBlockId: (id: string | null) => void;
  readonly setCursor: (cursor: { x: number; y: number } | null) => void;
  readonly setActive: (active: boolean) => void;
  readonly setActiveMatch: (match: null) => void;
}

export function useExternalDragStart(options: UseExternalDragStartOptions) {
  const {
    editor,
    snapshotRef,
    blockRectsRef,
    edgeRectsRef,
    lastCursorRef,
    externalDragKindRef,
    dispatchLayout,
    setSourceBlockId,
    setCursor,
    setActive,
    setActiveMatch,
  } = options;
  return useCallback(
    (kind: BlockAffordanceKind, origin: { x: number; y: number }) => {
      if (!editor) return;
      const blocks = snapshotBlocks(editor);
      const rects = measureBlockRects(editor, blocks);
      // Edge rects from FULL block list (no source-lift; the new
      // block isn't in the doc yet).
      const layouts: BlockLayout[] = blocks
        .map((b) => {
          const rect = rects.get(b.id);
          return rect ? { blockId: b.id, rect } : null;
        })
        .filter((x): x is BlockLayout => x !== null);
      const edges = computeEdgeRects(layouts);

      snapshotRef.current = blocks;
      blockRectsRef.current = rects;
      edgeRectsRef.current = edges;
      lastCursorRef.current = { x: origin.x, y: origin.y, t: performance.now() };
      externalDragKindRef.current = kind;

      dispatchLayout({ type: 'drag-start', sourceBlockId: EXTERNAL_DROP_SENTINEL });
      setSourceBlockId(EXTERNAL_DROP_SENTINEL);
      setCursor({ x: origin.x, y: origin.y });
      setActive(true);
      setActiveMatch(null);
    },
    [
      editor,
      snapshotRef,
      blockRectsRef,
      edgeRectsRef,
      lastCursorRef,
      externalDragKindRef,
      dispatchLayout,
      setSourceBlockId,
      setCursor,
      setActive,
      setActiveMatch,
    ],
  );
}
