import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { BlockRegistry } from '@skb/block-foundation';
import { saveToMdx, loadFromMdx } from '../saveLoad';

function makeEditor(content?: object | string): Editor {
  return new Editor({
    extensions: [StarterKit],
    ...(content !== undefined && { content }),
  });
}

/**
 * Mirrors the EditorShell.tsx extension list for the live edit
 * surface so round-trip tests against `loadFromMdx` exercise the
 * same Link configuration users see (carry-forward #15a).
 */
function makeEditorWithLink(content?: object | string): Editor {
  return new Editor({
    extensions: [
      StarterKit.configure({ code: false }),
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
    ],
    ...(content !== undefined && { content }),
  });
}

describe('@skb/editor-shell saveLoad — prose-only RTT (Stage A skeleton)', () => {
  it('round-trips a heading fixture (load → save returns equivalent MDX)', () => {
    const editor = makeEditor();
    const fixture = '---\nt: x\n---\n\n# heading\n';
    loadFromMdx(editor, fixture);
    const out = saveToMdx(editor);
    expect(out).toContain('# heading');
    editor.destroy();
  });

  it('round-trips a list fixture (mdx-bridge canonicalizes to "*" bullets)', () => {
    const editor = makeEditor();
    const fixture = '---\nt: x\n---\n\n* item1\n* item2\n';
    loadFromMdx(editor, fixture);
    const out = saveToMdx(editor);
    expect(out).toContain('* item1');
    expect(out).toContain('* item2');
    editor.destroy();
  });

  it('round-trips a paragraph fixture', () => {
    const editor = makeEditor();
    const fixture = '---\nt: x\n---\n\nparagraph text\n';
    loadFromMdx(editor, fixture);
    const out = saveToMdx(editor);
    expect(out).toContain('paragraph text');
    editor.destroy();
  });

  it('saveToMdx on empty editor returns frontmatter-less empty doc', () => {
    const editor = makeEditor();
    const out = saveToMdx(editor);
    expect(out).not.toMatch(/^---/);
    editor.destroy();
  });

  it('saveToMdx + loadFromMdx accept the SaveLoadOptions blockRegistry parameter (forward-compat surface)', () => {
    const editor = makeEditor();
    const registry = new BlockRegistry();
    const fixture = '---\nt: x\n---\n\nparagraph\n';
    loadFromMdx(editor, fixture, { blockRegistry: registry });
    const out = saveToMdx(editor, { blockRegistry: registry });
    expect(out).toContain('paragraph');
    editor.destroy();
  });
});

describe('@skb/editor-shell saveLoad — Link extension round-trip (carry-forward #15a)', () => {
  it('round-trips a markdown link with href (link mark survives the editor schema)', () => {
    const editor = makeEditorWithLink();
    const fixture = '---\nt: x\n---\n\nsee [the docs](https://example.com).\n';
    loadFromMdx(editor, fixture);
    const out = saveToMdx(editor);
    expect(out).toContain('the docs');
    expect(out).toContain('https://example.com');
    editor.destroy();
  });

  it('round-trips a markdown link with title attr (extended Link schema preserves title)', () => {
    // Pre-#15a R1, the default Link extension dropped `title` on
    // setContent because it wasn't part of the registered schema, so
    // saveToMdx emitted `[text](url)` without the trailing `"title"`.
    // The Link.extend({ addAttributes: title }) override added in
    // EditorShell.tsx (mirrored above in makeEditorWithLink) closes
    // that gap.
    const editor = makeEditorWithLink();
    const fixture = '---\nt: x\n---\n\nopen [docs](https://example.com "Read the docs") here.\n';
    loadFromMdx(editor, fixture);
    const out = saveToMdx(editor);
    expect(out).toContain('docs');
    expect(out).toContain('https://example.com');
    expect(out).toContain('Read the docs');
    editor.destroy();
  });
});
