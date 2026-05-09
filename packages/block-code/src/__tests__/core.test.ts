import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { codeCore } from '../core/core-definition';
import { parseCode } from '../core';
import type { CodeMdastJsxElement } from '../core/serialize';

function parseMdxFlow(source: string): CodeMdastJsxElement {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(source) as {
    children: ReadonlyArray<{ type: string }>;
  };
  const flow = tree.children.find((n) => n.type === 'mdxJsxFlowElement');
  if (!flow) throw new Error('parseMdxFlow: fixture did not produce an mdxJsxFlowElement');
  return flow as unknown as CodeMdastJsxElement;
}

describe('codeCore.propsSchema', () => {
  it('accepts required language + code and defaults showLineNumbers=true', () => {
    expect(
      codeCore.propsSchema.parse({ language: 'python', code: 'print("hello")' }),
    ).toEqual({ language: 'python', code: 'print("hello")', showLineNumbers: true });
  });

  it('rejects empty language', () => {
    expect(() => codeCore.propsSchema.parse({ language: '', code: 'x' })).toThrow(
      /too_small|invalid_type|invalid_type_error/,
    );
  });

  it('rejects unknown keys (.strict)', () => {
    expect(() =>
      codeCore.propsSchema.parse({ language: 'python', code: 'x', extra: 'x' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(codeCore.name).toBe('componentCode');
    expect(codeCore.kind).toBe('component');
    expect(codeCore.mdxComponent).toBe('Code');
  });
});

describe('parseCode — JSX expression form (Wave 6 carry-forward #16)', () => {
  it('accepts the production sample-blocks fixture (template literal code)', () => {
    const source = [
      '<Code',
      '  language="python"',
      '  code={`def fibonacci(n: int) -> int:\\n    return n\\n`}',
      '/>',
    ].join('\n');
    const node = parseCode(parseMdxFlow(source));
    expect(node.attrs.language).toBe('python');
    expect(node.attrs.code).toBe('def fibonacci(n: int) -> int:\n    return n\n');
    expect(node.attrs.showLineNumbers).toBe(true);
  });

  it('accepts showLineNumbers={false} expression form', () => {
    const node = parseCode(
      parseMdxFlow('<Code language="ts" code="x" showLineNumbers={false} />'),
    );
    expect(node.attrs.showLineNumbers).toBe(false);
  });
});
