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
  GridContainer,
  KebabProvider,
  LiveAnnouncer,
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
} from './EditorShellKebabActions';

export interface EditorShellMountProps {
  slug: string;
  initialMdx?: string;
  editMode?: boolean;
}

type EditorInstance = Parameters<NonNullable<EditorShellProps['onCreate']>>[0];

/**
 * Wave 6 Stage B.4 adapter selection per ADR-0018 v0.6 D13:
 *   load: ApiAdapter primary; on throw OR null result → LocalStorageAdapter fallback
 *   save: ApiAdapter primary; on { ok: false } → LocalStorageAdapter backup write
 *
 * The primary path makes the server file at content/notes/<slug>/index.mdx
 * the source of truth (closes the user-reported "/notes/<slug> and
 * /notes/<slug>/edit don't sync" gap). LocalStorageAdapter is retained for
 * offline degraded-mode editing — load() returns null when the API is
 * unreachable; save() falls through to localStorage so unsaved edits are not
 * lost across a network blip.
 */
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
  // ApiAdapter failed → write to LocalStorageAdapter as backup so the
  // user's edit survives the next page load even when the server path is
  // degraded. The user-visible verdict still reflects the API failure.
  void fallback.save(state).catch(() => undefined);
  return apiResult;
}

export function EditorShellMount({
  slug,
  initialMdx = '',
  editMode = false,
}: EditorShellMountProps) {
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

  // Wave 6 cf-20c-2 (2026-05-09) — drag/drop pipeline lifecycle owner.
  // Snapshots blocks at drag-start, computes edge-rects + tiebreak on
  // drag-over, applies applyDropMode + dispatches Tiptap setNodeMarkup
  // on drop. The pipeline state drives <OutlineOverlay> + <DragGhost>
  // mounts below; the per-block <DragHandleButton> inside each
  // BlockNodeView gutter calls into the pipeline via DragDropProvider.
  // R1 F1: dragContextValue now also exposes `sourceBlockId` so the
  // per-block BlockNodeView can apply the .skb-block-nodeview--dragging-self
  // CSS modifier (ADR-0017 D6 source-lift visual).
  const pipeline = useDragDropPipeline({ editor });
  // Wave 6 cf-22 — wire keyboard-mode drag entry into the context.
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
  // Esc cancel during active drag (per ADR-0017 D8). cf-22: also
  // covers keyboard-active mode; useEscCancel reads the OR of
  // pointer-active + keyboardActive via the dragActive arg.
  useEscCancel({
    dragActive: pipeline.state.active || pipeline.state.keyboardActive,
    onCancel: () => {
      pipeline.onDragEnd({ x: 0, y: 0 });
    },
  });

  // Wave 6 cf-20d (2026-05-09) — resize pipeline lifecycle owner.
  // Mirrors the cf-20c-2 drag pipeline pattern: reactive state drives
  // <ColRuler> / <SizeTooltip> / <RowLadder> overlay mounts below;
  // the per-block <ResizeHandles> inside each BlockNodeView body
  // calls into the pipeline via ResizeProvider. The success-pulse on
  // commit reuses the cf-20c-2 dropEpoch infrastructure via the
  // `onCommitSuccess` callback wired to
  // `pipeline.setLastDroppedFromExternal`.
  //
  // R1 F1 fix (2026-05-09): totalCols + activeColSnaps now derive
  // from `useResponsiveCols` per ADR-0016 D5 responsive viewport
  // contract. Pre-R1 these were hardcoded `12` / `effectiveColSnaps(12)`
  // which gave tablet users (≤1024px viewport, 6-col grid) the
  // wrong snap stops `[2, 3, 4, 6, 8, 12]` instead of `[2, 3, 6]`.
  // The `useResponsiveCols` hook subscribes to `(max-width: 768px)`
  // + `(max-width: 1024px)` matchMedia (byte-equivalent to the
  // grid.css @media rules per Wave 6 cf-20d R2 F1 boundary
  // alignment fix; pre-R2 the hook used min-width which had off-by-
  // one at exact 1024 / 768 boundaries) and emits 12/6/1; we feed
  // both the GridContainer (so the `.skb-grid--mobile` class fires
  // correctly per ADR-0017 D9) AND the resize pipeline.
  const viewportCols = useResponsiveCols();
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
  // Esc cancel during active resize (per ADR-0017 D8 + cf-22 D13).
  // Covers both pointer + keyboard active modes.
  useEscCancel({
    dragActive: resize.state.active || resize.state.keyboardActive,
    onCancel: () => {
      resize.onResizeEnd({ x: 0, y: 0 });
    },
  });

  // Wave 6 cf-20e (2026-05-09) — kebab menu callbacks. The 3
  // imperative one-shot factories (delete / duplicate / change-kind)
  // are extracted to ./EditorShellKebabActions.ts to keep the mount
  // file under the 500-line size-check hard limit. Per cf-20e D5,
  // the consumer (this mount) is the single owner of editor
  // mutations across all 3 contexts (drag, resize, kebab). Per cf-20e
  // D6, duplicate fires the success-pulse via cf-20c-2 R3 dropEpoch
  // reuse (the same `setLastDroppedFromExternal` that drag-commit
  // and resize-commit use).
  const onKebabDelete = useMemo(() => makeKebabDelete(editor), [editor]);
  const onKebabDuplicate = useMemo(
    () => makeKebabDuplicate(editor, pipeline.setLastDroppedFromExternal),
    [editor, pipeline.setLastDroppedFromExternal],
  );
  const onKebabChangeKind = useMemo(
    () => makeKebabChangeKind(editor),
    [editor],
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
          // Wave 6 hotfix — pre-hotfix this catch silently returned, leaving
          // the editor empty + the indicator stuck at "saved" (the user
          // could not tell that loadFromMdx had thrown). Surface the
          // failure to both the console (operator) and the indicator/UI
          // (user), per ADR-0011 D9.7. The editor itself stays mounted so
          // the user can retry by reloading the route.
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
      <LiveAnnouncer>
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
      </LiveAnnouncer>
      <SaveIndicator savedAt={savedAt} status={saveStatus} />

      {/*
        Wave 6 cf-20c-2 — drag overlay surface.
        OutlineOverlay renders the active-edge dashed accent during drag.
        DragGhost follows the cursor with per-kind coloring.
        Both are pointer-events: none so they never intercept the
        underlying drop event.
      */}
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

      {/*
        Wave 6 cf-20d (2026-05-09) — resize overlay surface per
        ADR-0017 D9. Mounts only during active resize gesture.
        - <ColRuler>    floats above grid showing snap stops; the
                        snapColSpan from the pipeline drives the
                        active-stop highlight (right + corner axes).
        - <SizeTooltip> follows cursor with fraction text (right +
                        corner axes show colSpan fraction; bottom +
                        corner axes also show rowSpan integer).
        - <RowLadder>   floats to the right of the resizing block
                        with one rung per row; the snapRowSpan drives
                        the active-rung highlight (bottom + corner
                        axes only).
        Each overlay is `position: absolute|fixed; pointer-events: none`
        so they never intercept the underlying pointermove events the
        pipeline depends on.
      */}
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

      {/*
        Wave 6 cf-20c-2 R2 F2 fix (2026-05-09) — DropPulse mount at
        LANDED rect per ADR-0017 D11 line 344 ("源块进入新 grid 位置"
        — pulse fires AT the new position). cf-20c-2 R1 anchored the
        pulse at the SNAPSHOT rect (source's pre-drag position) which
        codex-pr-reviewer-55 R2 F2 caught as a real D11 violation. R2
        fix: pipeline re-measures the source NodeView at its NEW grid
        position via `editor.view.nodeDOM(livePos).getBoundingClientRect()`
        AFTER Tiptap setNodeMarkup commits + 2 rAFs (React commit
        cycle + browser layout pass), and exposes the result as
        `state.lastDroppedRect`. The consumer renders <DropPulseAtRect>
        only when both `lastDroppedBlockId !== null` AND
        `lastDroppedRect !== null` — the rect dependency means the
        mount appears 2 frames after the dragend (the rAF window during
        which the new rect is being measured). Pulse animates 720ms
        then onAnimationEnd fires clearLastDropped() resetting both
        BlockId + rect.

        Wave 6 cf-20c-2 R3 F2 fix (2026-05-09) — `key={dropEpoch}`
        forces React to unmount + remount the <DropPulseAtRect> (and
        therefore the underlying <DropPulse>) across rapid drops.
        Pre-R3 React's reconciliation reused the prior <DropPulse>
        instance when a new drop happened within the 720ms animation
        window; the keyframe didn't restart, producing a half-faded
        pulse on the new landed position. With key={dropEpoch}, each
        successful drop produces a fresh element and a fresh keyframe.
        See use-drag-drop-pipeline.ts PipelineDragState.dropEpoch
        JSDoc for the canonical "rapid-action animation isolation"
        pattern (cf-20d resize will adopt this for its own
        success-pulse mount).
      */}
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

// Helpers `DropPulseAtRect` + `ResizeOverlays` + `safeFraction`
// extracted to ./EditorShellOverlays.tsx at cf-20d (size-check 500-line
// hard limit). They are imported above and consumed in the JSX
// returned by EditorShellMount.
