import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { BlockRegistry } from '@skb/block-foundation';
import { saveToMdx, loadFromMdx } from '../saveLoad';

function makeEditor(content?: object | string): Editor {
  return new Editor({
    extensions: [StarterKit],
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
