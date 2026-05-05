import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { GridContainer } from '../grid-container';

afterEach(() => {
  cleanup();
});

function getGridRoot(container: HTMLElement): HTMLElement {
  const root = container.firstElementChild;
  if (!(root instanceof HTMLElement)) {
    throw new Error('GridContainer root was not rendered');
  }
  return root;
}

describe('GridContainer renders', () => {
  it('mounts and wraps a single child in the skb-grid container', () => {
    const { getByTestId } = render(
      <GridContainer>
        <span data-testid="child">child</span>
      </GridContainer>,
    );

    const child = getByTestId('child');
    expect(child.parentElement).not.toBeNull();
    expect(child.parentElement?.className).toContain('skb-grid');
  });
});

describe('GridContainer className prop', () => {
  it('concatenates className after skb-grid with a space separator', () => {
    const { container } = render(<GridContainer className="custom-x">content</GridContainer>);

    expect(getGridRoot(container).className).toBe('skb-grid custom-x');
  });

  it('emits exactly skb-grid when className is omitted', () => {
    const { container } = render(<GridContainer>content</GridContainer>);

    expect(getGridRoot(container).className).toBe('skb-grid');
  });
});

describe('GridContainer style prop', () => {
  it('forwards CSS variable overrides', () => {
    const style = { '--row-h': '60px' } as CSSProperties;
    const { container } = render(<GridContainer style={style}>content</GridContainer>);

    expect(getGridRoot(container).style.getPropertyValue('--row-h')).toBe('60px');
  });
});

describe('GridContainer children', () => {
  it('renders multiple children in DOM order', () => {
    const { getByTestId } = render(
      <GridContainer>
        <span data-testid="a">A</span>
        <span data-testid="b">B</span>
      </GridContainer>,
    );

    const wrapper = getByTestId('a').parentElement;
    expect(getByTestId('b').parentElement).toBe(wrapper);
    expect(wrapper?.children).toHaveLength(2);
    expect(wrapper?.children[0]?.textContent).toBe('A');
    expect(wrapper?.children[1]?.textContent).toBe('B');
  });
});

function TiptapGridSmoke(props: { onEditor: (editor: Editor) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>hello</p>',
  });

  useEffect(() => {
    if (!editor) return undefined;
    props.onEditor(editor);
    return () => editor.destroy();
  }, [editor, props]);

  return (
    <GridContainer>
      <EditorContent editor={editor} />
    </GridContainer>
  );
}

describe('GridContainer composes with Tiptap', () => {
  it('wraps an EditorContent ProseMirror instance', async () => {
    let editor: Editor | null = null;
    const { container, unmount } = render(
      <TiptapGridSmoke onEditor={(createdEditor) => { editor = createdEditor; }} />,
    );

    await waitFor(() => expect(editor).not.toBeNull());
    const wrapper = container.querySelector('.skb-grid');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('.ProseMirror')).not.toBeNull();
    unmount();
  });
});
