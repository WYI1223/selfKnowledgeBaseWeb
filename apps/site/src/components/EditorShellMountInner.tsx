import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BlockRegistry,
  effectiveColSnaps,
  type EffectiveViewportCols,
} from '@skb/block-foundation';
import {
  ApiAdapter,
  BLOCK_KIND_OPTIONS,
  DragDropProvider,
  DragGhost,
  EditModeBanner,
  EditorShell,
  formatDragCancel,
  formatDragCommit,
  formatDragMove,
  formatKebabAction,
  formatResizeCancel,
  formatResizeChange,
  GridContainer,
  KebabProvider,
  LocalStorageAdapter,
  type NoteState,
  OutlineOverlay,
  Palette,
  ResizeProvider,
  SaveIndicator,
  SlashMenu,
  Toolbar,
  loadFromMdx,
  registerBlocks,
  saveToMdx,
  type EditorShellProps,
  type SaveIndicatorStatus,
  useAnnounce,
  useDragDropPipeline,
  useEscCancel,
  useResizePipeline,
  useResponsiveCols,
  wireRegistry,
} from '@skb/editor-shell';
import { DropPulseAtRect, ResizeOverlays } from './EditorShellOverlays';
import {
  makeKebabChangeKind,
  makeKebabDelete,
  makeKebabDuplicate,
  type KebabAnnounceFn,
} from './EditorShellKebabActions';

export interface EditorShellMountInnerProps {
  slug: string;
  initialMdx?: string;
  editMode?: boolean;
}

type EditorInstance = Parameters<NonNullable<EditorShellProps['onCreate']>>[0];

async function loadWithFallback(
  primary: ApiAdapter,
  fallback: LocalStorageAdapter,
): Promise<NoteState | null> {
  try {
    const apiState = await primary.load();
    if (apiState !== null) return apiState;
  } catch {
    // network / 5xx — fall through to LocalStorageAdapter
  }
  try {
    return await fallback.load();
  } catch {
    return null;
  }
}

async function saveWithBackup(
  primary: ApiAdapter,
  fallback: LocalStorageAdapter,
  state: NoteState,
): Promise<{ ok: boolean; error?: string }> {
  const apiResult = await primary.save(state);
  if (apiResult.ok) return apiResult;
  void fallback.save(state).catch(() => undefined);
  return apiResult;
}

/**
 * Wave 6 cf-22 R1 F1 — `EditorShellMountInner` consumes
 * `useAnnounce()` from the `<LiveAnnouncer>` provider mounted by the
 * outer `EditorShellMount`. The split is required because
 * `useAnnounce()` returns the no-op fallback when called outside the
 * provider (cf-22 R0 mounted `<LiveAnnouncer>` but no consumer ever
 * called the hook — F1 was the resulting silent-scaffolding gap).
 *
 * R1 F1 announce wiring:
 *   - drag pipeline: onAnnounceMove / onAnnounceCommit / onAnnounceCancel
 *     wired to `formatDragMove` / `formatDragCommit` / `formatDragCancel`.
 *     Fires for both pointer + keyboard paths via the pipeline's
 *     internal announce hooks.
 *   - resize pipeline: onAnnounceChange / onAnnounceCancel wired to
 *     `formatResizeChange` / `formatResizeCancel`. Fires for both
 *     pointer + keyboard paths.
 *   - kebab callbacks: each `make*` factory accepts an optional
 *     `KebabAnnounceFn` arg; we pass an adapter that calls
 *     `formatKebabAction(action, sourceKind, newKind?)`.
 */
export function EditorShellMountInner({
  slug,
  initialMdx = '',
  editMode = false,
}: EditorShellMountInnerProps) {
  const apiAdapterRef = useRef<ApiAdapter | null>(null);
  const localAdapterRef = useRef<LocalStorageAdapter | null>(null);
  const registryRef = useRef<BlockRegistry | null>(null);
  const wireRef = useRef<ReturnType<typeof wireRegistry> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef(1);
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveIndicatorStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // cf-22 R1 F1 — announce hook (no-op outside <LiveAnnouncer>; in
  // production the outer EditorShellMount mounts the provider).
  const announce = useAnnounce();

  // cf-22 R1 F1 — drag pipeline announce callbacks.
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

  const viewportCols = useResponsiveCols();
  const pipeline = useDragDropPipeline({
    editor,
    totalCols: viewportCols,
    onAnnounceMove: onAnnounceDragMove,
    onAnnounceCommit: onAnnounceDragCommit,
    onAnnounceCancel: onAnnounceDragCancel,
  });
  const dragContextValue = useMemo(
    () => ({
      onDragStart: pipeline.onDragStart,
      onDragEnd: pipeline.onDragEnd,
      onDragStartKeyboard: pipeline.onDragStartKeyboard,
      sourceBlockId: pipeline.state.sourceBlockId,
    }),
    [
      pipeline.onDragStart,
      pipeline.onDragEnd,
      pipeline.onDragStartKeyboard,
      pipeline.state.sourceBlockId,
    ],
  );
  // Esc cancel — covers both pointer + keyboard active modes.
  useEscCancel({
    dragActive: pipeline.state.active || pipeline.state.keyboardActive,
    onCancel: () => {
      pipeline.onDragEnd({ x: 0, y: 0 });
    },
  });

  // cf-22 R1 F1 — resize pipeline announce callbacks.
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

  const resizeColSnaps = useMemo(
    () => effectiveColSnaps(viewportCols satisfies EffectiveViewportCols),
    [viewportCols],
  );
  const onResizeCommitSuccess = useCallback(
    (blockId: string, rect: DOMRectReadOnly) => {
      pipeline.setLastDroppedFromExternal(blockId, rect);
    },
    [pipeline],
  );
  const resize = useResizePipeline({
    editor,
    totalCols: viewportCols,
    activeColSnaps: resizeColSnaps,
    onCommitSuccess: onResizeCommitSuccess,
    onAnnounceChange: onAnnounceResizeChange,
    onAnnounceCancel: onAnnounceResizeCancel,
  });
  const resizeContextValue = useMemo(
    () => ({
      onResizeStart: resize.onResizeStart,
      onResizeEnd: resize.onResizeEnd,
      onResizeStartKeyboard: resize.onResizeStartKeyboard,
      resizingBlockId: resize.state.sourceBlockId,
      resizingAxis: resize.state.axis,
    }),
    [
      resize.onResizeStart,
      resize.onResizeEnd,
      resize.onResizeStartKeyboard,
      resize.state.sourceBlockId,
      resize.state.axis,
    ],
  );
  useEscCancel({
    dragActive: resize.state.active || resize.state.keyboardActive,
    onCancel: () => {
      resize.onResizeEnd({ x: 0, y: 0 });
    },
  });

  // cf-22 R1 F1 — kebab announce adapter (translates the action enum
  // + source/new kinds into the formatKebabAction message).
  const onAnnounceKebab = useCallback<KebabAnnounceFn>(
    (action, blockKind, newKind) => {
      announce(formatKebabAction(action, blockKind, newKind));
    },
    [announce],
  );

  const onKebabDelete = useMemo(
    () => makeKebabDelete(editor, onAnnounceKebab),
    [editor, onAnnounceKebab],
  );
  const onKebabDuplicate = useMemo(
    () =>
      makeKebabDuplicate(
        editor,
        pipeline.setLastDroppedFromExternal,
        onAnnounceKebab,
      ),
    [editor, pipeline.setLastDroppedFromExternal, onAnnounceKebab],
  );
  const onKebabChangeKind = useMemo(
    () => makeKebabChangeKind(editor, onAnnounceKebab),
    [editor, onAnnounceKebab],
  );
  const kebabContextValue = useMemo(
    () => ({
      onDelete: onKebabDelete,
      onDuplicate: onKebabDuplicate,
      onChangeKind: onKebabChangeKind,
      kinds: BLOCK_KIND_OPTIONS,
    }),
    [onKebabDelete, onKebabDuplicate, onKebabChangeKind],
  );

  if (apiAdapterRef.current === null || apiAdapterRef.current.slug !== slug) {
    apiAdapterRef.current = new ApiAdapter(slug);
  }
  if (localAdapterRef.current === null || localAdapterRef.current.slug !== slug) {
    localAdapterRef.current = new LocalStorageAdapter(slug);
  }

  if (registryRef.current === null) {
    const registry = new BlockRegistry();
    registerBlocks(registry);
    registryRef.current = registry;
    wireRef.current = wireRegistry({ blockRegistry: registry });
  }

  const apiAdapter = apiAdapterRef.current;
  const localAdapter = localAdapterRef.current;
  const wire = wireRef.current ?? wireRegistry({});

  useEffect(() => {
    let cancelled = false;
    void loadWithFallback(apiAdapter, localAdapter).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
      if (saveSettleTimerRef.current !== null) clearTimeout(saveSettleTimerRef.current);
    };
  }, [apiAdapter, localAdapter]);

  if (!ready) {
    return (
      <>
        <EditModeBanner editMode={editMode} />
        <div>Loading...</div>
      </>
    );
  }

  const handleCreate = (editor: EditorInstance) => {
    setEditor(editor);
    void loadWithFallback(apiAdapter, localAdapter).then((state) => {
      const mdxSource = state?.mdxSource ?? initialMdx;
      if (mdxSource) {
        try {
          loadFromMdx(editor, mdxSource, { blockRegistry: registryRef.current ?? undefined });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown';
          console.error('[EditorShellMount] loadFromMdx failed for', slug, error);
          setLoadError(message);
          setSaveStatus('error');
          return;
        }
      }
      versionRef.current = state?.version ?? 1;
      if (state?.lastModified) {
        setSavedAt(new Date(state.lastModified));
        setSaveStatus('saved');
      }
    });
  };

  const handleChange = (editor: EditorInstance) => {
    if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    if (saveSettleTimerRef.current !== null) clearTimeout(saveSettleTimerRef.current);
    setSaveStatus('unsaved');
    saveTimerRef.current = setTimeout(() => {
      try {
        setSaveStatus('saving');
        const mdxSource = saveToMdx(editor, { blockRegistry: registryRef.current ?? undefined });
        versionRef.current += 1;
        const lastModified = Date.now();
        void saveWithBackup(apiAdapter, localAdapter, {
          lastModified,
          mdxSource,
          version: versionRef.current,
        }).then((result) => {
          saveSettleTimerRef.current = setTimeout(() => {
            if (result.ok) {
              setSavedAt(new Date(lastModified));
              setSaveStatus('saved');
            } else {
              setSaveStatus('error');
            }
          }, 250);
        });
      } catch {
        setSaveStatus('error');
        return;
      }
    }, 800);
  };

  return (
    <>
      <EditModeBanner editMode={editMode} />
      {loadError !== null && (
        <div
          data-skb-load-error
          role="alert"
          style={{
            background: 'var(--surface, #fff5f5)',
            border: '1px solid var(--accent-danger, #c53030)',
            borderRadius: 'var(--radius, 8px)',
            color: 'var(--accent-danger, #c53030)',
            fontSize: '14px',
            margin: '12px 0',
            padding: '12px 16px',
          }}
        >
          <strong>Failed to load this note: </strong>
          {loadError}
          <br />
          <span style={{ color: 'inherit', fontSize: '12px', opacity: 0.8 }}>
            Reload the page to retry, or check the source file at
            <code> content/notes/{slug}/index.mdx </code>
            for an unsupported MDX construct.
          </span>
        </div>
      )}
      <DragDropProvider value={dragContextValue}>
        <ResizeProvider value={resizeContextValue}>
          <KebabProvider value={kebabContextValue}>
            <GridContainer viewportCols={viewportCols}>
              <Toolbar editor={editor} />
              <EditorShell
                extensions={wire.extensions}
                onCreate={handleCreate}
                onChange={handleChange}
              />
              <Palette editor={editor} kinds={wire.blockKinds} />
              <SlashMenu editor={editor} kinds={wire.blockKinds} />
            </GridContainer>
          </KebabProvider>
        </ResizeProvider>
      </DragDropProvider>
      <SaveIndicator savedAt={savedAt} status={saveStatus} />

      {(pipeline.state.active || pipeline.state.keyboardActive) && (
        <>
          <OutlineOverlay
            activeMatch={pipeline.state.activeMatch}
            blockRects={pipeline.state.blockRects}
          />
          {pipeline.state.cursor && (
            <DragGhost
              cursorX={pipeline.state.cursor.x}
              cursorY={pipeline.state.cursor.y}
              kind="markdown"
              mode="move"
            />
          )}
        </>
      )}

      {(resize.state.active || resize.state.keyboardActive) && (
        <ResizeOverlays
          axis={resize.state.axis}
          cursor={resize.state.cursor}
          snapColSpan={resize.state.snapColSpan}
          snapRowSpan={resize.state.snapRowSpan}
          sourceRect={resize.state.sourceRect}
          totalCols={viewportCols}
          activeColSnaps={resizeColSnaps}
        />
      )}

      {pipeline.state.lastDroppedBlockId !== null &&
        pipeline.state.lastDroppedRect !== null && (
          <DropPulseAtRect
            key={pipeline.state.dropEpoch}
            rect={pipeline.state.lastDroppedRect}
            onAnimationEnd={pipeline.clearLastDropped}
          />
        )}
    </>
  );
}
