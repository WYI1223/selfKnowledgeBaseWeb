import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { Editor } from '@tiptap/core';
import { EditorShell } from '../EditorShell';

describe('@skb/editor-shell EditorShell', () => {
  it('mounts and round-trips typed content through ProseMirror', async () => {
    let capturedEditor: Editor | null = null;
    render(<EditorShell onCreate={(e) => { capturedEditor = e; }} />);
    await vi.waitFor(() => expect(capturedEditor).not.toBeNull());
    capturedEditor!.commands.insertContent('hello');
    expect(capturedEditor!.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
    });
  });

  it('mounts with the StarterKit empty-doc default', async () => {
    let capturedEditor: Editor | null = null;
    render(<EditorShell onCreate={(e) => { capturedEditor = e; }} />);
    await vi.waitFor(() => expect(capturedEditor).not.toBeNull());
    expect(capturedEditor!.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
  });
});
