import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BlockRegistry, type BlockUIDefinition } from '@skb/block-foundation';
import { imageCore } from '../core/core-definition';
import {
  imageUiDefault,
  ImageEditorView,
  ImageRenderView,
} from '../ui-default';

const baseProps = {
  src: 'https://example.test/hero.jpg',
  alt: 'hero image',
};

describe('imageUiDefault registration', () => {
  it('exposes the BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(imageUiDefault.coreName).toBe('image');
    expect(imageUiDefault.uiId).toBe('default');
    expect(imageUiDefault.EditorView).toBe(ImageEditorView);
    expect(imageUiDefault.RenderView).toBe(ImageRenderView);
  });

  it('round-trips through BlockRegistry (registerCore + registerUI)', () => {
    const reg = new BlockRegistry();
    reg.registerCore(imageCore);
    reg.registerUI(imageUiDefault as unknown as BlockUIDefinition);
    expect(reg.getUI('image')).toBe(imageUiDefault);
    expect(reg.getUI('image', 'default')).toBe(imageUiDefault);
  });
});

describe('ImageEditorView', () => {
  it('renders required src + alt into the native img and figcaption', () => {
    const { container, unmount } = render(<ImageEditorView props={baseProps} />);
    const figure = container.querySelector('figure');
    const image = container.querySelector('img');
    const caption = container.querySelector('figcaption');

    expect(figure).not.toBeNull();
    expect(image).not.toBeNull();
    expect(image?.getAttribute('src')).toBe(baseProps.src);
    expect(image?.getAttribute('alt')).toBe(baseProps.alt);
    expect(caption?.textContent).toBe(baseProps.alt);
    unmount();
  });

  it('marks the figure with loading-state attr for future loading variants', () => {
    const { container, unmount } = render(<ImageEditorView props={baseProps} />);
    const figure = container.querySelector('figure');
    expect(figure?.getAttribute('data-image-loading')).toBe('lazy');
    unmount();
  });

  it('always sets img loading="lazy"', () => {
    const { container, unmount } = render(<ImageEditorView props={baseProps} />);
    const image = container.querySelector('img');
    expect(image?.getAttribute('loading')).toBe('lazy');
    unmount();
  });

  it('passes width when provided', () => {
    const { container, unmount } = render(
      <ImageEditorView props={{ ...baseProps, width: 640 }} />,
    );
    const image = container.querySelector('img');
    expect(image?.getAttribute('width')).toBe('640');
    unmount();
  });

  it('passes height when provided', () => {
    const { container, unmount } = render(
      <ImageEditorView props={{ ...baseProps, height: 360 }} />,
    );
    const image = container.querySelector('img');
    expect(image?.getAttribute('height')).toBe('360');
    unmount();
  });

  it('keeps image responsive when width/height are omitted', () => {
    const { container, unmount } = render(<ImageEditorView props={baseProps} />);
    const image = container.querySelector('img');
    expect(image?.hasAttribute('width')).toBe(false);
    expect(image?.hasAttribute('height')).toBe(false);
    unmount();
  });
});

describe('ImageRenderView', () => {
  it('renders semantic figure/image/figcaption matching EditorView for same props', () => {
    const props = {
      ...baseProps,
      width: 320,
      height: 240,
    };
    const editor = render(<ImageEditorView props={props} />);
    const rendered = render(<ImageRenderView props={props} />);

    const editorFigure = editor.container.querySelector('figure');
    const renderFigure = rendered.container.querySelector('figure');
    const editorImage = editorFigure?.querySelector('img');
    const renderImage = renderFigure?.querySelector('img');

    expect(editorFigure?.getAttribute('data-image-loading')).toBe(
      renderFigure?.getAttribute('data-image-loading'),
    );
    expect(editorImage?.outerHTML).toBe(renderImage?.outerHTML);
    expect(editorFigure?.querySelector('figcaption')?.textContent).toBe(
      renderFigure?.querySelector('figcaption')?.textContent,
    );

    editor.unmount();
    rendered.unmount();
  });
});
