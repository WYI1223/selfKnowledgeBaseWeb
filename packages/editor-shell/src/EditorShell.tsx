import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Editor, Extensions } from '@tiptap/core';

export interface EditorShellProps {
  /** Optional initial editor content (Tiptap doc JSON or HTML string).
   *  Defaults to an empty paragraph. */
  initialContent?: object | string;
  /** Optional change callback fired on each Tiptap update event. */
  onChange?: (editor: Editor) => void;
  /** Optional className applied to the EditorContent root for
   *  consumer-controlled styling. */
  className?: string;
  /** Optional creation hook: invoked once with the constructed editor
   *  instance after mount. Used by tests + future A3 wrappers needing
   *  imperative editor access. */
  onCreate?: (editor: Editor) => void;
  /** Optional consumer extensions layered after StarterKit. */
  extensions?: Extensions;
}

export function EditorShell(props: EditorShellProps) {
  const { initialContent, onChange, className, onCreate, extensions = [] } = props;
  const editor = useEditor({
    extensions: [StarterKit.configure({ code: false }), ...extensions],
    ...(initialContent !== undefined && { content: initialContent }),
    ...(onChange && { onUpdate: ({ editor }) => onChange(editor) }),
    ...(onCreate && { onCreate: ({ editor }) => onCreate(editor) }),
  });

  return <EditorContent editor={editor} className={className} />;
}
