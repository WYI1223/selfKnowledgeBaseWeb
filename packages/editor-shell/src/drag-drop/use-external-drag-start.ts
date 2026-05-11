/**
 * @skb/editor-shell useExternalDragStart — extracted onDragStartExternal
 * callback hook for the cf-24 PaletteSidebar drag entry.
 *
 * Wave 7 Phase 2B.2 (ADR-0020 D2) — dropped edge-rects compute (the
 * 4-mode classifier was deleted alongside `apply-drop-mode`). The
 * external-source drag-start now only snapshots blocks + block-rect
 * data + flips `active=true` + sets `sourceBlockId =
 * EXTERNAL_DROP_SENTINEL`. The grid dragover/drop listener uses
 * cursor → engine coord + `inferDropIntent` to position the drop.
 */
import { useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import type { DropIntent } from '@skb/grid-engine';
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
  readonly externalDragKindRef: React.MutableRefObject<BlockAffordanceKind | null>;
  readonly dispatchLayout: (action: LayoutAction) => void;
  readonly setSourceBlockId: (id: string | null) => void;
  readonly setCursor: (cursor: { x: number; y: number } | null) => void;
  readonly setActive: (active: boolean) => void;
  readonly setActiveIntent: (intent: DropIntent | null) => void;
}

export function useExternalDragStart(options: UseExternalDragStartOptions) {
  const {
    editor,
    snapshotRef,
    blockRectsRef,
    externalDragKindRef,
    dispatchLayout,
    setSourceBlockId,
    setCursor,
    setActive,
    setActiveIntent,
  } = options;
  return useCallback(
    (kind: BlockAffordanceKind, origin: { x: number; y: number }) => {
      if (!editor) return;
      const blocks = snapshotBlocks(editor);
      const rects = measureBlockRects(editor, blocks);

      snapshotRef.current = blocks;
      blockRectsRef.current = rects;
      externalDragKindRef.current = kind;

      dispatchLayout({ type: 'drag-start', sourceBlockId: EXTERNAL_DROP_SENTINEL });
      setSourceBlockId(EXTERNAL_DROP_SENTINEL);
      setCursor({ x: origin.x, y: origin.y });
      setActive(true);
      setActiveIntent(null);
    },
    [
      editor,
      snapshotRef,
      blockRectsRef,
      externalDragKindRef,
      dispatchLayout,
      setSourceBlockId,
      setCursor,
      setActive,
      setActiveIntent,
    ],
  );
}
