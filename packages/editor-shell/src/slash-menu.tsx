import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Editor } from '@tiptap/core';
import {
  BLOCK_KIND_OPTIONS,
  insertBlockKind,
  type BlockAffordanceKind,
  type BlockKindOption,
} from './registry-wire';

export interface SlashMenuProps {
  editor: Editor | null;
  kinds?: readonly BlockKindOption[];
  onInsert?: (kind: BlockAffordanceKind) => void;
}

const menuStyle: CSSProperties = {
  position: 'absolute',
  left: 'var(--space-8)',
  top: 'var(--space-8)',
  zIndex: 20,
  minWidth: '220px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'var(--space-1)',
  fontFamily: 'var(--sans)',
};

const itemStyle = (active: boolean): CSSProperties => ({
  width: '100%',
  border: 0,
  borderRadius: 'var(--radius)',
  background: active ? 'var(--accent-soft)' : 'transparent',
  color: active ? 'var(--accent)' : 'var(--text)',
  padding: 'var(--space-2) var(--space-3)',
  textAlign: 'left',
  font: 'inherit',
  cursor: 'pointer',
});

function atLineStart(editor: Editor): boolean {
  const selection = editor.state.selection;
  return selection.$from.parentOffset === 0 || selection.$from.parent.textContent === '';
}

export function SlashMenu(props: SlashMenuProps) {
  const { editor, kinds = BLOCK_KIND_OPTIONS, onInsert } = props;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const dom = editor?.view.dom;
    if (!editor || !dom) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!open && event.key === '/' && atLineStart(editor)) {
        event.preventDefault();
        setOpen(true);
        setActive(0);
        return;
      }
      if (!open) return;
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((current) => (current + 1) % kinds.length);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((current) => (current - 1 + kinds.length) % kinds.length);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const option = kinds[active] ?? kinds[0];
        if (option) insert(option.kind);
      }
    };

    dom.addEventListener('keydown', onKeyDown);
    return () => dom.removeEventListener('keydown', onKeyDown);
  }, [active, editor, kinds, open]);

  const insert = (kind: BlockAffordanceKind) => {
    onInsert?.(kind);
    insertBlockKind(editor, kind);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div aria-label="Slash block menu" role="menu" style={menuStyle}>
      {kinds.map((option, index) => (
        <button
          key={option.kind}
          onClick={() => insert(option.kind)}
          role="menuitem"
          style={itemStyle(index === active)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
