import { describe, expect, it } from 'vitest';

import { mdxToTiptap } from '../parse';

/**
 * Wave 6 hotfix regression — pre-hotfix `mdxToTiptap` threw
 * `mdx-bridge: unsupported block type "mdxFlowExpression"` on any MDX
 * source containing a block-level `{...}` expression. The canonical real
 * trigger was `content/notes/sample-blocks/index.mdx`, which uses 11
 * `{/* fixture-N: ... *\/}` author comments to label the per-block
 * fixtures. The throw propagated up through `loadFromMdx` and was
 * silently swallowed by `EditorShellMount`'s `handleCreate` catch,
 * leaving the editor visibly empty on the live edit route — matching
 * the user-reported "edit page和non-edit不同步" against /notes/sample-blocks.
 *
 * Hotfix strategy: drop block-level `mdxFlowExpression` nodes at the
 * `mdxToTiptap` input gate. Lossy round-trip (hand-authored block-level
 * `{...}` comments are stripped on edit-route open and not re-emitted on
 * save) — documented in the Stage B handoff pack §"What is NOT closed".
 * Inline `mdxTextExpression` is unaffected (already handled via the
 * inline phrasing path).
 */
describe('mdxToTiptap mdxFlowExpression handling under softParse (Wave 6 hotfix)', () => {
  it('does not throw on a minimal block-level `{...}` expression under softParse', () => {
    const source = '# heading\n\n{/* author comment */}\n\nbody paragraph.\n';
    expect(() => mdxToTiptap(source, { softParse: true })).not.toThrow();
  });

  it('strips block-level mdxFlowExpression nodes under softParse (lossy by design)', () => {
    const source = '# heading\n\n{/* drop me */}\n\nbody.\n';
    const doc = mdxToTiptap(source, { softParse: true });
    expect(doc.content.map((n) => n.type)).toEqual(['heading', 'paragraph']);
    // The expression text must NOT survive into any rendered Tiptap node.
    const flat = JSON.stringify(doc);
    expect(flat).not.toContain('drop me');
    expect(flat).not.toContain('mdxFlowExpression');
  });

  it('parses multiple stray block expressions interleaved with prose without losing prose', () => {
    const source = [
      '{/* fixture-A */}',
      '',
      '# heading-1',
      '',
      '{/* fixture-B */}',
      '',
      'body alpha.',
      '',
      '{/* fixture-C */}',
      '',
      '## heading-2',
      '',
      'body beta.',
      '',
    ].join('\n');
    const doc = mdxToTiptap(source, { softParse: true });
    const types = doc.content.map((n) => n.type);
    expect(types).toEqual(['heading', 'paragraph', 'heading', 'paragraph']);
  });

  it('default (softParse=false) preserves the historical fail-loud behavior', () => {
    const source = '# heading\n\n{/* author comment */}\n\nbody.\n';
    expect(() => mdxToTiptap(source)).toThrow(/mdxFlowExpression/);
  });
});

/**
 * Wave 6 hotfix — per-block fault tolerance. Pre-hotfix any single
 * block-level throw (an unsupported tag, a Zod schema mismatch on a
 * component-block attr, etc.) propagated up through `mdxToTiptap` and
 * killed the entire editor mount. The hotfix wraps each block in a
 * try/catch + emits a placeholder paragraph carrying the failure
 * reason; the surrounding prose stays intact.
 */
describe('mdxToTiptap per-block fault tolerance under softParse (Wave 6 hotfix)', () => {
  it('softParse replaces an unsupported JSX block with a placeholder paragraph and keeps surrounding prose', () => {
    // No `blockRegistry` → `<Foo />` runs through `mdastJsxFlowElementToTiptap`
    // which throws the canonical "unsupported block type" error. Default
    // mode propagates the throw; softParse swaps it for a placeholder
    // paragraph carrying the reason text. Surrounding prose survives.
    const source = '# heading\n\n<Foo bar="baz" />\n\nfollow-up paragraph.\n';
    const doc = mdxToTiptap(source, { softParse: true });
    const types = doc.content.map((n) => n.type);
    expect(types).toEqual(['heading', 'paragraph', 'paragraph']);
    const placeholderParagraph = doc.content[1];
    expect(placeholderParagraph?.attrs?.['__skb_parse_error']).toContain('Foo');
    const placeholderText = (placeholderParagraph?.content ?? [])
      .map((c) => c.text ?? '')
      .join('');
    expect(placeholderText).toContain('unsupported block <Foo>');
    const tailText = (doc.content[2]?.content ?? []).map((c) => c.text ?? '').join('');
    expect(tailText).toContain('follow-up paragraph');
  });

  it('default (softParse=false) re-throws on the same input (no opt-in, no leniency)', () => {
    const source = '# heading\n\n<Foo bar="baz" />\n\nfollow-up paragraph.\n';
    expect(() => mdxToTiptap(source)).toThrow(/unsupported block type "mdxJsxFlowElement"/);
  });
});

