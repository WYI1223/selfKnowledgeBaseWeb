import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  GridContainer,
  KebabProvider,
  LocalStorageAdapter,
  type NoteState,
  OutlineOverlay,
  PaletteModal,
  PaletteSidebar,
  ResizeProvider,
  SaveIndicator,
  SlashMenu,
  Toolbar,
  loadFromMdx,
  registerBlocks,
  saveToMdx,
  type BlockAffordanceKind,
  type EditorShellProps,
  type SaveIndicatorStatus,
  useAnnounce,
  EditorLayoutContext,
  ThemeBaseplate,
  useDragDropPipeline,
  useEditorLayout,
  useEscCancel,
  useResizePipeline,
  useResponsiveCols,
  useTheme,
  wireRegistry,
} from '@skb/editor-shell';
import { ThemeSwitcher } from '@skb/grid-themes';
import { DropPulseAtRect, ResizeOverlays } from './EditorShellOverlays';
import {
  makeKebabChangeKind,
  makeKebabDelete,
  makeKebabDuplicate,
} from './EditorShellKebabActions';
import { useEditorShellAnnounceCallbacks } from './EditorShellAnnounceCallbacks';

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
 * Wave 6 cf-22 R1 F1 — consumer of `useAnnounce()` from the
 * `<LiveAnnouncer>` provider mounted by the outer EditorShellMount.
 * cf-24: announce-callback wiring extracted to
 * `useEditorShellAnnounceCallbacks`; cf-24 also adds PaletteSidebar
 * portal mount (BaseLayout #palette-rail slot) for the v2 left-rail
 * component library per ADR-0018 v0.8 D10.
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
  // cf-24 PaletteSidebar portal target; cf-24 D11 graceful degradation.
  const [paletteSlot, setPaletteSlot] = useState<HTMLElement | null>(null);

  const announce = useAnnounce();

  // cf-22 R1 F1 + cf-24 — 8 WCAG 4.1.3 announce callbacks.
  const {
    onAnnounceDragMove,
    onAnnounceDragCommit,
    onAnnounceDragCancel,
    onAnnounceExternalDragMove,
    onAnnounceExternalDragCommit,
    onAnnounceResizeChange,
    onAnnounceResizeCancel,
    onAnnounceKebab,
    onAnnouncePaletteInsert,
  } = useEditorShellAnnounceCallbacks(announce);

  // cf-24 palette-rail aside slot resolved at hydration.
  useEffect(() => {
    setPaletteSlot(document.getElementById('palette-rail'));
  }, []);

  // cf-22 R2 F3 reason-marker indirection for useEscCancel (refs
  // invert the pipeline-vs-handle dependency).
  const dragEscHandleRef = useRef<{
    markDeactivationReason: (
      reason: 'esc-cancel' | 'commit' | 'pointer-up' | 'tab-commit' | 'tab-cancel',
    ) => void;
  } | null>(null);
  const markDragEscDeactivationReason = useCallback(
    (reason: 'tab-commit' | 'tab-cancel') => {
      dragEscHandleRef.current?.markDeactivationReason(reason);
    },
    [],
  );

  const viewportCols = useResponsiveCols();
  // Wave 7 Phase 2C/2E — theme cssVars + absolute-positioning snapshot.
  const { themeKey, theme, setTheme } = useTheme();
  const layoutSnapshot = useEditorLayout(editor);
  const pipeline = useDragDropPipeline({
    editor,
    totalCols: viewportCols,
    onAnnounceMove: onAnnounceDragMove,
    onAnnounceCommit: onAnnounceDragCommit,
    onAnnounceCancel: onAnnounceDragCancel,
    markEscDeactivationReason: markDragEscDeactivationReason,
    // cf-24 — external-source (PaletteSidebar) WCAG 4.1.3 wiring.
    onAnnounceExternalMove: onAnnounceExternalDragMove,
    onAnnounceExternalCommit: onAnnounceExternalDragCommit,
  });

  // cf-24 — PaletteSidebar drag start: viewport-center origin (best-
  // effort; first dragover overrides before the user notices).
  const onPaletteDragKindStart = useCallback(
    (kind: BlockAffordanceKind) => {
      pipeline.onDragStartExternal(kind, {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    },
    [pipeline],
  );
  const onPaletteDragKindEnd = useCallback(() => {
    // dragend cleanup — pipeline.onDragEnd handles both pointer +
    // keyboard cancellation paths. Safe to call when external
    // drag is in flight (sourceBlockId === EXTERNAL_DROP_SENTINEL).
    pipeline.onDragEnd({ x: 0, y: 0 });
  }, [pipeline]);
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
  // Esc cancel — covers both pointer + keyboard active modes. R2 F3:
  // capture handle so Tab paths can mark `tab-commit`/`tab-cancel`
  // reason; hook then SKIPS focus restoration on those flips so the
  // browser's Tab focus-advance is preserved.
  const dragEscHandle = useEscCancel({
    dragActive: pipeline.state.active || pipeline.state.keyboardActive,
    onCancel: () => {
      pipeline.onDragEnd({ x: 0, y: 0 });
    },
  });
  dragEscHandleRef.current = dragEscHandle;

  // cf-22 R2 F3 — same reason-marker indirection as drag pipeline.
  const resizeEscHandleRef = useRef<{
    markDeactivationReason: (
      reason: 'esc-cancel' | 'commit' | 'pointer-up' | 'tab-commit' | 'tab-cancel',
    ) => void;
  } | null>(null);
  const markResizeEscDeactivationReason = useCallback(
    (reason: 'tab-commit' | 'tab-cancel') => {
      resizeEscHandleRef.current?.markDeactivationReason(reason);
    },
    [],
  );

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
    markEscDeactivationReason: markResizeEscDeactivationReason,
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
  const resizeEscHandle = useEscCancel({
    dragActive: resize.state.active || resize.state.keyboardActive,
    onCancel: () => {
      resize.onResizeEnd({ x: 0, y: 0 });
    },
  });
  resizeEscHandleRef.current = resizeEscHandle;

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
            <EditorLayoutContext.Provider value={layoutSnapshot}>
              <GridContainer
                viewportCols={viewportCols}
                style={theme.cssVars}
                data-skb-theme={themeKey}
              >
                <ThemeBaseplate
                  theme={theme}
                  dragInProgress={pipeline.state.active || pipeline.state.keyboardActive}
                  totalRows={Math.max(layoutSnapshot.totalRows, 12)}
                />
                <Toolbar editor={editor} />
                <EditorShell
                  extensions={wire.extensions}
                  onCreate={handleCreate}
                  onChange={handleChange}
                />
                <PaletteModal editor={editor} kinds={wire.blockKinds} />
                <SlashMenu editor={editor} kinds={wire.blockKinds} />
              </GridContainer>
            </EditorLayoutContext.Provider>
          </KebabProvider>
        </ResizeProvider>
      </DragDropProvider>
      <SaveIndicator savedAt={savedAt} status={saveStatus} />

      {(pipeline.state.active || pipeline.state.keyboardActive) && (
        <>
          <OutlineOverlay activeIntent={pipeline.state.activeIntent} />
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

      {/* Wave 7 Phase 2C — theme switcher (production fold rule in component). */}
      <ThemeSwitcher current={themeKey} onChange={setTheme} />


      {/* cf-24 — PaletteSidebar portal mount. Rendered into the
          BaseLayout `#palette-rail` slot iff the slot exists at
          hydration (palette={true} was passed to BaseLayout) AND
          the editor is created. Per cf-24 D11 graceful degradation:
          slot absent → no-op; editor null → no-op. */}
      {paletteSlot && editor &&
        createPortal(
          <PaletteSidebar
            editor={editor}
            onDragKindStart={onPaletteDragKindStart}
            onDragKindEnd={onPaletteDragKindEnd}
            onInsert={onAnnouncePaletteInsert}
          />,
          paletteSlot,
        )}
    </>
  );
}
