import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Editor } from '@tiptap/core';

export interface ToolbarProps {
  editor: Editor | null;
}

const toolbarStyle: CSSProperties = {
  position: 'sticky',
  top: 'var(--space-2)',
  zIndex: 10,
  display: 'inline-flex',
  gap: 'var(--space-1)',
  alignItems: 'center',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'var(--space-1)',
  fontFamily: 'var(--sans)',
};

const buttonStyle = (active: boolean): CSSProperties => ({
  width: '32px',
  height: '28px',
  border: 0,
  borderRadius: 'var(--radius)',
  background: active ? 'var(--accent)' : 'transparent',
  color: active ? 'white' : 'var(--text)',
  fontFamily: 'var(--sans)',
  fontWeight: 700,
  cursor: 'pointer',
});

function hasSelection(editor: Editor | null): boolean {
  if (!editor) return false;
  const selection = editor.state.selection;
  return !selection.empty && selection.from !== selection.to;
}

export function Toolbar(props: ToolbarProps) {
  const { editor } = props;
  const [visible, setVisible] = useState(() => hasSelection(editor));

  useEffect(() => {
    if (!editor) return undefined;
    const sync = () => setVisible(hasSelection(editor));
    editor.on('selectionUpdate', sync);
    editor.on('transaction', sync);
    sync();
    return () => {
      editor.off('selectionUpdate', sync);
      editor.off('transaction', sync);
    };
  }, [editor]);

  if (!editor || !visible) return null;

  return (
    <div aria-label="Text formatting" role="toolbar" style={toolbarStyle}>
      <button
        aria-label="Bold"
        aria-pressed={editor.isActive('bold')}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={buttonStyle(editor.isActive('bold'))}
        type="button"
      >
        B
      </button>
      <button
        aria-label="Italic"
        aria-pressed={editor.isActive('italic')}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={buttonStyle(editor.isActive('italic'))}
        type="button"
      >
        I
      </button>
    </div>
  );
}
