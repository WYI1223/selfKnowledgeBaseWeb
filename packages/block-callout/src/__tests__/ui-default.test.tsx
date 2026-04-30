import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BlockRegistry, type BlockUIDefinition } from '@skb/block-foundation';
import { calloutCore } from '../core/core-definition';
import {
  calloutUIDefault,
  CalloutEditorView,
  CalloutRenderView,
  VARIANT_TOKENS,
} from '../ui-default';
import type { Variant } from '../ui-default';

const VARIANTS: readonly Variant[] = ['note', 'tip', 'warning', 'danger'];

describe('calloutUIDefault registration', () => {
  it('exposes the BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(calloutUIDefault.coreName).toBe('callout');
    expect(calloutUIDefault.uiId).toBe('default');
    expect(calloutUIDefault.EditorView).toBe(CalloutEditorView);
    expect(calloutUIDefault.RenderView).toBe(CalloutRenderView);
  });

  it('round-trips through BlockRegistry (registerCore + registerUI)', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    reg.registerUI(calloutUIDefault as unknown as BlockUIDefinition);
    expect(reg.getUI('callout')).toBe(calloutUIDefault);
    expect(reg.getUI('callout', 'default')).toBe(calloutUIDefault);
  });
});

describe('CalloutEditorView', () => {
  it('renders all 4 variants with distinct data-callout-variant + role/aria-label', () => {
    for (const variant of VARIANTS) {
      const { container, unmount } = render(
        <CalloutEditorView props={{ variant }} content="body" />,
      );
      const aside = container.querySelector('aside');
      expect(aside).not.toBeNull();
      expect(aside?.getAttribute('data-callout-variant')).toBe(variant);
      expect(aside?.getAttribute('role')).toBe('note');
      expect(aside?.getAttribute('aria-label')).toBe(
        `${VARIANT_TOKENS[variant].label} callout`,
      );
      // a11y: focusable for keyboard nav
      expect(aside?.getAttribute('tabindex')).toBe('0');
      unmount();
    }
  });

  it('falls back to capitalized variant name when title is absent', () => {
    const { getByText, unmount } = render(
      <CalloutEditorView props={{ variant: 'tip' }} content="hello" />,
    );
    expect(getByText('Tip')).not.toBeNull();
    unmount();
  });

  it('renders explicit title when provided', () => {
    const { getByText, unmount } = render(
      <CalloutEditorView
        props={{ variant: 'warning', title: 'Heads up!' }}
        content="careful"
      />,
    );
    expect(getByText('Heads up!')).not.toBeNull();
    unmount();
  });

  it('shows empty placeholder when content is missing', () => {
    const { getByText, unmount } = render(
      <CalloutEditorView props={{ variant: 'note' }} />,
    );
    expect(getByText('No content')).not.toBeNull();
    unmount();
  });

  it('emits a unique data-callout-variant per variant + a single icon glyph', () => {
    const seenVariants = new Set<string>();
    for (const variant of VARIANTS) {
      const { container, unmount } = render(
        <CalloutEditorView props={{ variant }} content="x" />,
      );
      const aside = container.querySelector('aside');
      seenVariants.add(aside?.getAttribute('data-callout-variant') ?? '');
      const svgs = aside?.querySelectorAll('svg') ?? [];
      expect(svgs.length).toBe(1);
      unmount();
    }
    expect(seenVariants.size).toBe(VARIANTS.length);
  });
});

describe('CalloutRenderView', () => {
  it('renders DOM structure matching EditorView for the same props (byte-equivalent class shape)', () => {
    const props = { variant: 'danger', title: 'Stop' } as const;
    const editor = render(<CalloutEditorView props={props} content="body" />);
    const rendered = render(<CalloutRenderView props={props} content="body" />);
    const editorAside = editor.container.querySelector('aside');
    const renderAside = rendered.container.querySelector('aside');
    expect(editorAside?.getAttribute('data-callout-variant')).toBe(
      renderAside?.getAttribute('data-callout-variant'),
    );
    expect(editorAside?.getAttribute('role')).toBe(
      renderAside?.getAttribute('role'),
    );
    expect(editorAside?.getAttribute('aria-label')).toBe(
      renderAside?.getAttribute('aria-label'),
    );
    // shared body subtree shape: same icon SVG count + same title content
    expect(editorAside?.querySelectorAll('svg').length).toBe(
      renderAside?.querySelectorAll('svg').length,
    );
    expect(
      editorAside?.querySelector('.skb-callout-title')?.textContent,
    ).toBe(renderAside?.querySelector('.skb-callout-title')?.textContent);
    editor.unmount();
    rendered.unmount();
  });

  it('omits the empty-placeholder span when content is undefined (passive SSR mode)', () => {
    const { queryByText, unmount } = render(
      <CalloutRenderView props={{ variant: 'note' }} />,
    );
    expect(queryByText('No content')).toBeNull();
    unmount();
  });
});
