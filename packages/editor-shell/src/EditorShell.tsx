import { useEditor, EditorContent } from '@tiptap/react';
import Link from '@tiptap/extension-link';
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
  /** Optional consumer extensions appended after the built-in
   *  StarterKit + Link stack (carry-forward #15a). Wave 5 C.4 wires
   *  the 8 block-kind extensions from `wireRegistry` through this
   *  prop. */
  extensions?: Extensions;
}

export function EditorShell(props: EditorShellProps) {
  const { initialContent, onChange, className, onCreate, extensions = [] } = props;
  const editor = useEditor({
    // Wave 6 carry-forward #15b 2026-05-08 — StarterKit's inline
    // `code` mark is now enabled. The block-Code Tiptap node was
    // renamed from `code` to `componentCode` so the ProseMirror
    // schema collision ("RangeError: code can not be both a node and
    // a mark") is gone. `EDITOR_UNSUPPORTED_MARKS` in `saveLoad.ts`
    // is correspondingly empty — no marks are stripped at load time.
    //
    // `@tiptap/extension-link` is registered (carry-forward #15a):
    // markdown links survive into the editor as anchors. The Link
    // instance below extends the default schema with a `title`
    // attribute so titled markdown links `[text](url "title")`
    // round-trip without losing the title (mdx-bridge emits `title`
    // at parse and consumes it at serialize); the openOnClick=false
    // setting keeps anchor clicks from navigating away from the
    // edit surface (users can still ctrl-click to open externally).
    extensions: [
      StarterKit,
      Link.extend({
        addAttributes() {
          const parentAttrs = (this.parent?.() ?? {}) as Record<string, unknown>;
          return {
            ...parentAttrs,
            title: {
              default: null,
              parseHTML: (el: HTMLElement) => el.getAttribute('title'),
              renderHTML: (attributes: Record<string, unknown>) => {
                const value = attributes['title'];
                return typeof value === 'string' ? { title: value } : {};
              },
            },
          };
        },
      }).configure({ openOnClick: false }),
      ...extensions,
    ],
    ...(initialContent !== undefined && { content: initialContent }),
    ...(onChange && { onUpdate: ({ editor }) => onChange(editor) }),
    ...(onCreate && { onCreate: ({ editor }) => onCreate(editor) }),
  });

  return <EditorContent editor={editor} className={className} />;
}
