import { useEffect, useMemo, useRef, useState } from 'react';
import { BlockRegistry } from '@skb/block-foundation';
import {
  ApiAdapter,
  DragDropProvider,
  DragGhost,
  EditModeBanner,
  EditorShell,
  GridContainer,
  LocalStorageAdapter,
  type NoteState,
  OutlineOverlay,
  Palette,
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
  wireRegistry,
} from '@skb/editor-shell';

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
  const pipeline = useDragDropPipeline({ editor });
  const dragContextValue = useMemo(
    () => ({ onDragStart: pipeline.onDragStart, onDragEnd: pipeline.onDragEnd }),
    [pipeline.onDragStart, pipeline.onDragEnd],
  );
  // Esc cancel during active drag (per ADR-0017 D8).
  useEscCancel({
    dragActive: pipeline.state.active,
    onCancel: () => {
      // The pipeline already dispatches drag-end-cancel through its
      // own dragend handler when the user releases over chrome; the
      // Esc cancel path is purely keyboard. Trigger a fake dragend so
      // the pipeline cleans up its own state.
      pipeline.onDragEnd({ x: 0, y: 0 });
    },
  });

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
      <DragDropProvider value={dragContextValue}>
        <GridContainer>
          <Toolbar editor={editor} />
          <EditorShell
            extensions={wire.extensions}
            onCreate={handleCreate}
            onChange={handleChange}
          />
          <Palette editor={editor} kinds={wire.blockKinds} />
          <SlashMenu editor={editor} kinds={wire.blockKinds} />
        </GridContainer>
      </DragDropProvider>
      <SaveIndicator savedAt={savedAt} status={saveStatus} />

      {/*
        Wave 6 cf-20c-2 — drag overlay surface.
        OutlineOverlay renders the active-edge dashed accent during drag.
        DragGhost follows the cursor with per-kind coloring.
        Both are pointer-events: none so they never intercept the
        underlying drop event.
      */}
      {pipeline.state.active && (
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
    </>
  );
}
