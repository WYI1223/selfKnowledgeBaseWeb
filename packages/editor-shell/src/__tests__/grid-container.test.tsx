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

describe('GridContainer viewportCols prop', () => {
  it('emits data-skb-viewport-cols="12" without mobile className', () => {
    const { container } = render(<GridContainer viewportCols={12}>content</GridContainer>);

    const root = getGridRoot(container);
    expect(root.getAttribute('data-skb-viewport-cols')).toBe('12');
    expect(root.className).toBe('skb-grid');
  });

  it('emits data-skb-viewport-cols="6" without mobile className', () => {
    const { container } = render(<GridContainer viewportCols={6}>content</GridContainer>);

    const root = getGridRoot(container);
    expect(root.getAttribute('data-skb-viewport-cols')).toBe('6');
    expect(root.className).toBe('skb-grid');
  });

  it('emits mobile className for viewportCols={1}', () => {
    const { container } = render(
      <GridContainer className="custom-x" viewportCols={1}>
        content
      </GridContainer>,
    );

    const root = getGridRoot(container);
    expect(root.getAttribute('data-skb-viewport-cols')).toBe('1');
    expect(root.className).toBe('skb-grid custom-x skb-grid--mobile');
  });

  it('omitted viewportCols preserves backward-compatible class and attrs', () => {
    const { container } = render(<GridContainer>content</GridContainer>);

    const root = getGridRoot(container);
    expect(root.getAttribute('data-skb-viewport-cols')).toBeNull();
    expect(root.className).toBe('skb-grid');
  });
});

describe('GridContainer Wave 7 Phase 2C theme attr', () => {
  it('emits data-skb-theme when provided', () => {
    const { container } = render(
      <GridContainer data-skb-theme="lego-studs">x</GridContainer>,
    );
    const root = getGridRoot(container);
    expect(root.getAttribute('data-skb-theme')).toBe('lego-studs');
  });

  it('omits data-skb-theme attribute when not provided', () => {
    const { container } = render(<GridContainer>x</GridContainer>);
    const root = getGridRoot(container);
    expect(root.getAttribute('data-skb-theme')).toBeNull();
  });

  it('cssVars passed via style prop reach the grid element', () => {
    const cssVars = { '--skb-baseplate-bg': 'oklch(96% 0.005 80)' } as CSSProperties;
    const { container } = render(
      <GridContainer style={cssVars} data-skb-theme="lego-studs">
        x
      </GridContainer>,
    );
    const root = getGridRoot(container);
    expect(root.style.getPropertyValue('--skb-baseplate-bg')).toBe(
      'oklch(96% 0.005 80)',
    );
  });
});
