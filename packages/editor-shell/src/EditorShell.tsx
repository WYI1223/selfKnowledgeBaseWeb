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
    // StarterKit inline `code` mark stays disabled here: the block-Code
    // package registers a Tiptap NODE named `code`, and ProseMirror
    // forbids the same name on both a node and a mark
    // ("RangeError: code can not be both a node and a mark"). The Wave 6
    // hotfix sanitizer in `saveLoad.ts:loadFromMdx` strips `code` (and
    // `link`) marks from mdx-bridge output before `setContent` so the
    // editor accepts the doc; backtick formatting therefore appears as
    // plain text in the edit surface. The proper fix renames the
    // block-Code node out of the `code` namespace and registers
    // `@tiptap/extension-link` (Stage B carry-forward).
    extensions: [StarterKit.configure({ code: false }), ...extensions],
    ...(initialContent !== undefined && { content: initialContent }),
    ...(onChange && { onUpdate: ({ editor }) => onChange(editor) }),
    ...(onCreate && { onCreate: ({ editor }) => onCreate(editor) }),
  });

  return <EditorContent editor={editor} className={className} />;
}
