import { useEffect, useRef, useState } from 'react';
import { BlockRegistry } from '@skb/block-foundation';
import {
  EditorShell,
  GridContainer,
  LocalStorageAdapter,
  loadFromMdx,
  registerBlocks,
  saveToMdx,
  type EditorShellProps,
} from '@skb/editor-shell';

export interface EditorShellMountProps {
  slug: string;
  initialMdx?: string;
}

type EditorInstance = Parameters<NonNullable<EditorShellProps['onCreate']>>[0];

export function EditorShellMount({ slug, initialMdx = '' }: EditorShellMountProps) {
  const adapterRef = useRef<LocalStorageAdapter | null>(null);
  const registryRef = useRef<BlockRegistry | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef(1);
  const [ready, setReady] = useState(false);

  if (adapterRef.current === null || adapterRef.current.slug !== slug) {
    adapterRef.current = new LocalStorageAdapter(slug);
  }

  if (registryRef.current === null) {
    const registry = new BlockRegistry();
    registerBlocks(registry);
    registryRef.current = registry;
  }

  const adapter = adapterRef.current;

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
    };
  }, [adapter]);

  if (!ready) return <div>Loading...</div>;

  const handleCreate = (editor: EditorInstance) => {
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
      })
      .catch(() => undefined);
  };

  const handleChange = (editor: EditorInstance) => {
    if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const mdxSource = saveToMdx(editor, { blockRegistry: registryRef.current ?? undefined });
        versionRef.current += 1;
        void adapter.save({ mdxSource, version: versionRef.current, lastModified: Date.now() });
      } catch {
        return;
      }
    }, 800);
  };

  return (
    <GridContainer>
      <EditorShell onCreate={handleCreate} onChange={handleChange} />
    </GridContainer>
  );
}
