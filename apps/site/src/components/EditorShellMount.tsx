import { useEffect, useRef, useState } from 'react';
import { BlockRegistry } from '@skb/block-foundation';
import {
  DragHandle,
  EditModeBanner,
  EditorShell,
  GridContainer,
  LocalStorageAdapter,
  Palette,
  SaveIndicator,
  SlashMenu,
  Toolbar,
  loadFromMdx,
  registerBlocks,
  saveToMdx,
  type EditorShellProps,
  type SaveIndicatorStatus,
  wireRegistry,
} from '@skb/editor-shell';

export interface EditorShellMountProps {
  slug: string;
  initialMdx?: string;
  editMode?: boolean;
}

type EditorInstance = Parameters<NonNullable<EditorShellProps['onCreate']>>[0];

export function EditorShellMount({
  slug,
  initialMdx = '',
  editMode = false,
}: EditorShellMountProps) {
  const adapterRef = useRef<LocalStorageAdapter | null>(null);
  const registryRef = useRef<BlockRegistry | null>(null);
  const wireRef = useRef<ReturnType<typeof wireRegistry> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef(1);
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveIndicatorStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  if (adapterRef.current === null || adapterRef.current.slug !== slug) {
    adapterRef.current = new LocalStorageAdapter(slug);
  }

  if (registryRef.current === null) {
    const registry = new BlockRegistry();
    registerBlocks(registry);
    registryRef.current = registry;
    wireRef.current = wireRegistry({ blockRegistry: registry });
  }

  const adapter = adapterRef.current;
  const wire = wireRef.current ?? wireRegistry({});

  useEffect(() => {
    let cancelled = false;

    void adapter.load()
      .catch(() => null)
      .then(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
      if (saveSettleTimerRef.current !== null) clearTimeout(saveSettleTimerRef.current);
    };
  }, [adapter]);

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
    void adapter
      .load()
      .then((state) => {
        const mdxSource = state?.mdxSource ?? initialMdx;
        if (mdxSource) {
          try {
            loadFromMdx(editor, mdxSource, { blockRegistry: registryRef.current ?? undefined });
          } catch {
            return;
          }
        }
        versionRef.current = state?.version ?? 1;
        if (state?.lastModified) {
          setSavedAt(new Date(state.lastModified));
          setSaveStatus('saved');
        }
      })
      .catch(() => undefined);
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
        void adapter
          .save({ mdxSource, version: versionRef.current, lastModified })
          .then((result) => {
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
      <GridContainer>
        <DragHandle />
        <Toolbar editor={editor} />
        <EditorShell
          extensions={wire.extensions}
          onCreate={handleCreate}
          onChange={handleChange}
        />
        <Palette editor={editor} kinds={wire.blockKinds} />
        <SlashMenu editor={editor} kinds={wire.blockKinds} />
      </GridContainer>
      <SaveIndicator savedAt={savedAt} status={saveStatus} />
    </>
  );
}
