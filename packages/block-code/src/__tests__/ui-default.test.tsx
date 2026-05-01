import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BlockRegistry, type BlockUIDefinition } from '@skb/block-foundation';
import { codeCore } from '../core/core-definition';
import {
  codeUIDefault,
  CodeBody,
  CodeEditorView,
  CodeRenderView,
} from '../ui-default';

const LANGUAGES = ['typescript', 'python', 'bash'] as const;

describe('codeUIDefault registration', () => {
  it('exposes the BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(codeUIDefault.coreName).toBe('code');
    expect(codeUIDefault.uiId).toBe('default');
    expect(codeUIDefault.EditorView).toBeDefined();
    expect(codeUIDefault.RenderView).toBeDefined();
  });

  it('round-trips through BlockRegistry (registerCore + registerUI)', () => {
    const reg = new BlockRegistry();
    reg.registerCore(codeCore);
    reg.registerUI(codeUIDefault as unknown as BlockUIDefinition);
    expect(reg.getUI('code')).toBe(codeUIDefault);
    expect(reg.getUI('code', 'default')).toBe(codeUIDefault);
  });
});

describe('CodeBody', () => {
  it('renders all 3 language values with data-code-language and role/aria-label', () => {
    for (const language of LANGUAGES) {
      const { container, unmount } = render(
        <CodeBody props={{ language, code: 'x', showLineNumbers: true }} />,
      );
      const root = container.querySelector('[data-code-language]');
      expect(root).not.toBeNull();
      expect(root?.getAttribute('data-code-language')).toBe(language);
      expect(root?.getAttribute('role')).toBe('region');
      expect(root?.getAttribute('aria-label')).toBe(`Code block: ${language}`);
      unmount();
    }
  });

  it('renders language label in a visible header', () => {
    const { getByText, unmount } = render(
      <CodeBody props={{ language: 'python', code: 'print("x")', showLineNumbers: true }} />,
    );
    expect(getByText('python')).not.toBeNull();
    unmount();
  });

  it('adds .skb-code-line-numbers and .skb-code-lineno per-line when enabled', () => {
    const { container, unmount } = render(
      <CodeBody
        props={{
          language: 'typescript',
          code: 'const x = 1;\nconst y = 2;',
          showLineNumbers: true,
        }}
      />,
    );
    expect(container.querySelector('.skb-code-pre')?.className).toContain(
      'skb-code-line-numbers',
    );
    expect(container.querySelectorAll('.skb-code-lineno')).toHaveLength(2);
    unmount();
  });

  it('omits line-number gutter when showLineNumbers=false', () => {
    const { container, unmount } = render(
      <CodeBody
        props={{
          language: 'bash',
          code: 'echo hi',
          showLineNumbers: false,
        }}
      />,
    );
    expect(container.querySelector('.skb-code-pre')?.className).not.toContain(
      'skb-code-line-numbers',
    );
    expect(container.querySelectorAll('.skb-code-lineno')).toHaveLength(0);
    unmount();
  });
});

describe('CodeEditorView', () => {
  it('emits data-language on <code> for renderer-driven language binding', () => {
    const { container, unmount } = render(
      <CodeEditorView props={{ language: 'python', code: 'x', showLineNumbers: true }} />,
    );
    expect(container.querySelector('code')?.getAttribute('data-language')).toBe('python');
    unmount();
  });
});

describe('CodeRenderView', () => {
  it('renders DOM structure matching EditorView for the same props', () => {
    const props = {
      language: 'typescript',
      code: 'const ok = true;',
      showLineNumbers: true,
    } as const;
    const editor = render(<CodeEditorView props={props} />);
    const renderForCode = render(<CodeRenderView props={props} />);
    const editorRoot = editor.container.querySelector('[data-code-language]');
    const renderRoot = renderForCode.container.querySelector('[data-code-language]');
    expect(editorRoot?.getAttribute('data-code-language')).toBe(
      renderRoot?.getAttribute('data-code-language'),
    );
    expect(editorRoot?.querySelector('.skb-code-pre')?.getAttribute('class')).toBe(
      renderRoot?.querySelector('.skb-code-pre')?.getAttribute('class'),
    );
    expect(editorRoot?.querySelector('.skb-code-lineno')?.textContent).toBe(
      renderRoot?.querySelector('.skb-code-lineno')?.textContent,
    );
    editor.unmount();
    renderForCode.unmount();
  });

  it('renders empty code without placeholder or fallback text', () => {
    const { container, unmount } = render(
      <CodeRenderView props={{ language: 'python', code: '', showLineNumbers: false }} />,
    );
    expect(container.querySelector('.skb-code-empty')).toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('');
    unmount();
  });
});
