/**
 * Wave 6 cf-22 + cf-24 — extracted announce-callback factories for
 * `EditorShellMountInner`. Encapsulates the WCAG 4.1.3 message-format
 * → LiveAnnouncer wiring per the cf-22 R1 F1 silent-scaffolding fix
 * + the cf-24 external-source (PaletteSidebar) extension.
 *
 * Extracted to a sibling module so EditorShellMountInner stays under
 * the size-check 500 LOC hard cap. The factories are pure useCallback
 * wrappers that capture an `announce` function from `useAnnounce()`;
 * no other state is needed, so they live OUTSIDE the React tree as
 * a plain hook helper.
 */
import { useCallback } from 'react';
import {
  formatDragCancel,
  formatDragCommit,
  formatDragMove,
  formatExternalDragCommit,
  formatExternalDragMove,
  formatKebabAction,
  formatPaletteInsert,
  formatResizeCancel,
  formatResizeChange,
} from '@skb/editor-shell';
import type { KebabAnnounceFn } from './EditorShellKebabActions';

export interface EditorShellAnnounceCallbacks {
  // cf-22 per-block drag
  readonly onAnnounceDragMove: (
    blockKind: string,
    col: number,
    totalCols: number,
  ) => void;
  readonly onAnnounceDragCommit: (blockKind: string, col: number) => void;
  readonly onAnnounceDragCancel: () => void;
  // cf-24 external-source (PaletteSidebar) drag
  readonly onAnnounceExternalDragMove: (
    blockKind: string,
    col: number,
    totalCols: number,
  ) => void;
  readonly onAnnounceExternalDragCommit: (
    blockKind: string,
    col: number,
  ) => void;
  // cf-22 resize
  readonly onAnnounceResizeChange: (
    axis: 'right' | 'bottom' | 'corner',
    colSpan: number,
    rowSpan: number,
    fraction: string,
  ) => void;
  readonly onAnnounceResizeCancel: () => void;
  // cf-22 kebab
  readonly onAnnounceKebab: KebabAnnounceFn;
  // cf-24 R0 F2 fix — PaletteSidebar click/Enter insertion (NOT
  // drag). Wired through the EditorShellMountInner portal mount;
  // fires on every click + every Enter on a focused palette item.
  readonly onAnnouncePaletteInsert: (blockKind: string) => void;
}

/**
 * Build all 8 announce callbacks bound to a single `announce`
 * function (from `useAnnounce()`). Caller owns the LiveAnnouncer
 * provider mount; this helper is just the message-format wiring.
 */
export function useEditorShellAnnounceCallbacks(
  announce: (message: string) => void,
): EditorShellAnnounceCallbacks {
  const onAnnounceDragMove = useCallback(
    (blockKind: string, col: number, totalCols: number) => {
      announce(formatDragMove(blockKind, col, totalCols));
    },
    [announce],
  );
  const onAnnounceDragCommit = useCallback(
    (blockKind: string, col: number) => {
      announce(formatDragCommit(blockKind, col));
    },
    [announce],
  );
  const onAnnounceDragCancel = useCallback(() => {
    announce(formatDragCancel());
  }, [announce]);

  const onAnnounceExternalDragMove = useCallback(
    (blockKind: string, col: number, totalCols: number) => {
      announce(formatExternalDragMove(blockKind, col, totalCols));
    },
    [announce],
  );
  const onAnnounceExternalDragCommit = useCallback(
    (blockKind: string, col: number) => {
      announce(formatExternalDragCommit(blockKind, col));
    },
    [announce],
  );

  const onAnnounceResizeChange = useCallback(
    (
      axis: 'right' | 'bottom' | 'corner',
      colSpan: number,
      rowSpan: number,
      fraction: string,
    ) => {
      announce(formatResizeChange(axis, colSpan, rowSpan, fraction));
    },
    [announce],
  );
  const onAnnounceResizeCancel = useCallback(() => {
    announce(formatResizeCancel());
  }, [announce]);

  const onAnnounceKebab = useCallback<KebabAnnounceFn>(
    (action, blockKind, newKind) => {
      announce(formatKebabAction(action, blockKind, newKind));
    },
    [announce],
  );

  const onAnnouncePaletteInsert = useCallback(
    (blockKind: string) => {
      announce(formatPaletteInsert(blockKind));
    },
    [announce],
  );

  return {
    onAnnounceDragMove,
    onAnnounceDragCommit,
    onAnnounceDragCancel,
    onAnnounceExternalDragMove,
    onAnnounceExternalDragCommit,
    onAnnounceResizeChange,
    onAnnounceResizeCancel,
    onAnnounceKebab,
    onAnnouncePaletteInsert,
  };
}
