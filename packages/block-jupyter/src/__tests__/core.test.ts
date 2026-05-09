import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { jupyterCore } from '../core/core-definition';
import { serializeJupyter, parseJupyter } from '../core';
import type { JupyterMdastJsxElement } from '../core/serialize';

function parseMdxFlow(source: string): JupyterMdastJsxElement {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(source) as {
    children: ReadonlyArray<{ type: string }>;
  };
  const flow = tree.children.find((n) => n.type === 'mdxJsxFlowElement');
  if (!flow) throw new Error('parseMdxFlow: fixture did not produce an mdxJsxFlowElement');
  return flow as unknown as JupyterMdastJsxElement;
}

describe('jupyterCore.propsSchema', () => {
  it('accepts valid props with all fields', () => {
    expect(
      jupyterCore.propsSchema.parse({
        code: 'print("hi")',
        runOnLoad: true,
        showLineNumbers: false,
        libraries: ['sympy'],
      }),
    ).toEqual({
      code: 'print("hi")',
      runOnLoad: true,
      showLineNumbers: false,
      libraries: ['sympy'],
    });
  });

  it('applies defaults when optional fields are missing', () => {
    expect(jupyterCore.propsSchema.parse({ code: 'x = 1' })).toEqual({
      code: 'x = 1',
      runOnLoad: false,
      showLineNumbers: true,
      libraries: [],
    });
  });

  it('accepts empty code (different from block-math which requires min(1))', () => {
    // Empty Jupyter cell is a legal authoring state — user typed nothing yet.
    expect(jupyterCore.propsSchema.parse({ code: '' })).toMatchObject({ code: '' });
  });

  it('rejects non-string code', () => {
    expect(() => jupyterCore.propsSchema.parse({ code: 42 })).toThrow(
      /invalid_type|Expected string/,
    );
  });

  it('rejects non-array libraries', () => {
    expect(() =>
      jupyterCore.propsSchema.parse({ code: 'x', libraries: 'sympy' }),
    ).toThrow(/invalid_type|Expected array/);
  });

  it('rejects non-string elements within libraries', () => {
    expect(() =>
      jupyterCore.propsSchema.parse({ code: 'x', libraries: ['sympy', 42] }),
    ).toThrow(/invalid_type|Expected string/);
  });

  it('rejects unknown keys (.strict)', () => {
    expect(() =>
      jupyterCore.propsSchema.parse({ code: 'x', extra: 'nope' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(jupyterCore.name).toBe('jupyter');
    expect(jupyterCore.kind).toBe('viz');
    expect(jupyterCore.mdxComponent).toBe('Jupyter');
  });
});

describe('serializeJupyter', () => {
  it('emits stable string-form for boolean attrs + JSON-encoded libraries', () => {
    const out = serializeJupyter({
      type: 'jupyter',
      attrs: { code: 'x', runOnLoad: true, showLineNumbers: false, libraries: ['sympy'] },
    });
    expect(out.type).toBe('mdxJsxFlowElement');
    expect(out.name).toBe('Jupyter');
    const attrMap = Object.fromEntries(
      out.attributes.map((a) => [a.name, a.value]),
    );
    expect(attrMap['code']).toBe('x');
    expect(attrMap['runOnLoad']).toBe('true');
    expect(attrMap['showLineNumbers']).toBe('false');
    expect(attrMap['libraries']).toBe('["sympy"]');
  });

  it('rejects invalid attrs via propsSchema.parse before emitting', () => {
    expect(() =>
      serializeJupyter({
        type: 'jupyter',
        attrs: {
          code: 'x',
          runOnLoad: false,
          showLineNumbers: true,
          libraries: [42] as unknown as string[],
        },
      }),
    ).toThrow();
  });
});

describe('parseJupyter', () => {
  it('handles boolean shorthand for runOnLoad', () => {
    const out = parseJupyter({
      type: 'mdxJsxFlowElement',
      name: 'Jupyter',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'code', value: 'x = 1' },
        { type: 'mdxJsxAttribute', name: 'runOnLoad', value: null },
        { type: 'mdxJsxAttribute', name: 'showLineNumbers', value: 'true' },
        { type: 'mdxJsxAttribute', name: 'libraries', value: '[]' },
      ],
      children: [],
    });
    expect(out.attrs.runOnLoad).toBe(true);
    expect(out.attrs.showLineNumbers).toBe(true);
  });

  it('throws on string-typed runOnLoad value other than "true"/"false"', () => {
    expect(() =>
      parseJupyter({
        type: 'mdxJsxFlowElement',
        name: 'Jupyter',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'code', value: 'x' },
          { type: 'mdxJsxAttribute', name: 'runOnLoad', value: 'maybe' },
          { type: 'mdxJsxAttribute', name: 'libraries', value: '[]' },
        ],
        children: [],
      }),
    ).toThrow(/invalid runOnLoad attribute/);
  });

  it('throws on libraries with non-string element', () => {
    expect(() =>
      parseJupyter({
        type: 'mdxJsxFlowElement',
        name: 'Jupyter',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'code', value: 'x' },
          { type: 'mdxJsxAttribute', name: 'libraries', value: '[1, 2]' },
        ],
        children: [],
      }),
    ).toThrow(/libraries must decode to string/);
  });

  it('rejects mismatched mdxComponent name', () => {
    expect(() =>
      parseJupyter({
        type: 'mdxJsxFlowElement',
        name: 'NotJupyter',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'code', value: 'x' },
          { type: 'mdxJsxAttribute', name: 'libraries', value: '[]' },
        ],
        children: [],
      }),
    ).toThrow(/expected mdxComponent="Jupyter"/);
  });

  it('round-trips serialize → parse identity for canonical attrs', () => {
    const node = {
      type: 'jupyter' as const,
      attrs: {
        code: 'print(1)',
        runOnLoad: false,
        showLineNumbers: true,
        libraries: ['sympy', 'requests'] as readonly string[],
      },
    };
    const back = parseJupyter(serializeJupyter(node));
    expect(back).toEqual(node);
  });
});

describe('parseJupyter — JSX expression form (Wave 6 carry-forward #16)', () => {
  it('accepts the production sample-blocks fixture (template-literal code + array libraries + bool shorthand)', () => {
    const source = [
      '<Jupyter',
      '  code={`import numpy as np\\nprint("hi")\\n`}',
      '  runOnLoad',
      '  showLineNumbers',
      '  libraries={["numpy"]}',
      '/>',
    ].join('\n');
    const node = parseJupyter(parseMdxFlow(source));
    expect(node.attrs.code).toBe('import numpy as np\nprint("hi")\n');
    expect(node.attrs.runOnLoad).toBe(true);
    expect(node.attrs.showLineNumbers).toBe(true);
    expect(node.attrs.libraries).toEqual(['numpy']);
  });

  it('accepts boolean expression form runOnLoad={true} / showLineNumbers={false}', () => {
    const node = parseJupyter(
      parseMdxFlow(
        '<Jupyter code="print(1)" runOnLoad={true} showLineNumbers={false} libraries={[]} />',
      ),
    );
    expect(node.attrs.runOnLoad).toBe(true);
    expect(node.attrs.showLineNumbers).toBe(false);
    expect(node.attrs.libraries).toEqual([]);
  });

  it('rejects libraries with a non-string entry from a JS literal', () => {
    expect(() =>
      parseJupyter(parseMdxFlow('<Jupyter code="x" libraries={["ok", 1]} />')),
    ).toThrow(/string\[\]/);
  });
});
