import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import type { Root } from 'mdast';

import { evalAttrExpression, type MdastJsxAttributeValue } from '../eval-attr-expression';

/**
 * Wave 6 carry-forward #16 (2026-05-08).
 *
 * The helper consumes the literal `mdxJsxAttributeValueExpression`
 * shape mdast emits — to keep the test honest we round-trip real MDX
 * through `remark-mdx` rather than constructing fake estree by hand.
 */
function parseAttr(mdxBlock: string, attrName: string): MdastJsxAttributeValue {
  const tree: Root = unified().use(remarkParse).use(remarkMdx).parse(mdxBlock);
  for (const child of tree.children) {
    if (child.type !== 'mdxJsxFlowElement') continue;
    for (const attr of child.attributes) {
      if (attr.type === 'mdxJsxAttribute' && attr.name === attrName) {
        return attr.value as MdastJsxAttributeValue;
      }
    }
  }
  throw new Error(`Test fixture did not include an attribute named ${attrName}`);
}

describe('evalAttrExpression', () => {
  describe('passes through string and null', () => {
    it('returns the string for a quoted attribute', () => {
      expect(evalAttrExpression(parseAttr('<X foo="bar" />', 'foo'))).toBe('bar');
    });

    it('returns null for a boolean shorthand attribute', () => {
      expect(evalAttrExpression(parseAttr('<X foo />', 'foo'))).toBeNull();
    });
  });

  describe('Literal expressions', () => {
    it('extracts a number literal', () => {
      expect(evalAttrExpression(parseAttr('<X foo={1} />', 'foo'))).toBe(1);
    });

    it('extracts a string literal', () => {
      expect(evalAttrExpression(parseAttr('<X foo={"bar"} />', 'foo'))).toBe('bar');
    });

    it('extracts a boolean literal (true)', () => {
      expect(evalAttrExpression(parseAttr('<X foo={true} />', 'foo'))).toBe(true);
    });

    it('extracts a boolean literal (false)', () => {
      expect(evalAttrExpression(parseAttr('<X foo={false} />', 'foo'))).toBe(false);
    });

    it('extracts null', () => {
      expect(evalAttrExpression(parseAttr('<X foo={null} />', 'foo'))).toBeNull();
    });
  });

  describe('TemplateLiteral expressions', () => {
    it('extracts a single-line template literal as a string', () => {
      expect(evalAttrExpression(parseAttr('<X foo={`hello`} />', 'foo'))).toBe('hello');
    });

    it('extracts a multi-line template literal preserving newlines', () => {
      const value = evalAttrExpression(
        parseAttr('<X foo={`line one\nline two\n`} />', 'foo'),
      );
      expect(value).toBe('line one\nline two\n');
    });

    it('throws on a template literal with interpolations', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={`hi ${name}`} />', 'foo'))).toThrow(
        /interpolations/,
      );
    });
  });

  describe('ArrayExpression', () => {
    it('extracts an array of strings (sample-blocks Jupyter `libraries`)', () => {
      expect(evalAttrExpression(parseAttr('<X foo={["numpy", "scipy"]} />', 'foo'))).toEqual([
        'numpy',
        'scipy',
      ]);
    });

    it('extracts an array of numbers', () => {
      expect(evalAttrExpression(parseAttr('<X foo={[1, 2, 3]} />', 'foo'))).toEqual([1, 2, 3]);
    });

    it('throws on a sparse array', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={[1, , 3]} />', 'foo'))).toThrow(
        /sparse/,
      );
    });

    it('throws on a spread element', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={[1, ...rest]} />', 'foo'))).toThrow(
        /spread/,
      );
    });
  });

  describe('ObjectExpression', () => {
    it('extracts an object with identifier keys (sample-blocks NnViz `layers`)', () => {
      const value = evalAttrExpression(
        parseAttr('<X foo={{ name: "input", units: 784, activation: "linear" }} />', 'foo'),
      );
      expect(value).toEqual({ name: 'input', units: 784, activation: 'linear' });
    });

    it('extracts a nested object (sample-blocks AgentFlow `position`)', () => {
      const value = evalAttrExpression(
        parseAttr(
          '<X foo={{ id: "n1", label: "Planner", position: { x: 0, y: 0 } }} />',
          'foo',
        ),
      );
      expect(value).toEqual({ id: 'n1', label: 'Planner', position: { x: 0, y: 0 } });
    });

    it('extracts a string-key object', () => {
      expect(
        evalAttrExpression(parseAttr('<X foo={{ "kebab-key": 1 }} />', 'foo')),
      ).toEqual({ 'kebab-key': 1 });
    });

    it('throws on a computed key', () => {
      expect(() =>
        evalAttrExpression(parseAttr('<X foo={{ [k]: 1 }} />', 'foo')),
      ).toThrow(/computed/);
    });
  });

  describe('arrays of objects (production fixtures)', () => {
    it('handles the sample-blocks NnViz `layers` shape', () => {
      const source = `<NnViz layers={[
        { name: "input", units: 784, activation: "linear" },
        { name: "hidden-1", units: 128, activation: "relu" },
      ]} />`;
      const value = evalAttrExpression(parseAttr(source, 'layers'));
      expect(value).toEqual([
        { name: 'input', units: 784, activation: 'linear' },
        { name: 'hidden-1', units: 128, activation: 'relu' },
      ]);
    });

    it('handles the sample-blocks AgentFlow `nodes` shape (nested objects)', () => {
      const source = `<AgentFlow nodes={[
        { id: "n1", label: "Planner", type: "agent", position: { x: 0, y: 0 } },
        { id: "n2", label: "Search", type: "tool", position: { x: 200, y: 0 } },
      ]} />`;
      const value = evalAttrExpression(parseAttr(source, 'nodes'));
      expect(value).toEqual([
        { id: 'n1', label: 'Planner', type: 'agent', position: { x: 0, y: 0 } },
        { id: 'n2', label: 'Search', type: 'tool', position: { x: 200, y: 0 } },
      ]);
    });
  });

  describe('UnaryExpression', () => {
    it('extracts a negative number', () => {
      expect(evalAttrExpression(parseAttr('<X foo={-5} />', 'foo'))).toBe(-5);
    });

    it('extracts a unary plus on a number', () => {
      expect(evalAttrExpression(parseAttr('<X foo={+7} />', 'foo'))).toBe(7);
    });

    it('throws on logical not (only +/- are supported)', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={!true} />', 'foo'))).toThrow(
        /unsupported unary operator !/,
      );
    });

    it('throws on unary plus on a non-numeric literal', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={+"7"} />', 'foo'))).toThrow(
        /numeric operand/,
      );
    });
  });

  describe('rejects non-primitive Literal forms', () => {
    it('throws on a BigInt literal', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={1n} />', 'foo'))).toThrow(/BigInt/);
    });

    it('throws on a RegExp literal', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={/abc/i} />', 'foo'))).toThrow(/RegExp/);
    });
  });

  describe('Identifier (statics only)', () => {
    it('extracts undefined', () => {
      expect(evalAttrExpression(parseAttr('<X foo={undefined} />', 'foo'))).toBeUndefined();
    });

    it('extracts NaN', () => {
      expect(evalAttrExpression(parseAttr('<X foo={NaN} />', 'foo'))).toBeNaN();
    });

    it('extracts Infinity', () => {
      expect(evalAttrExpression(parseAttr('<X foo={Infinity} />', 'foo'))).toBe(Infinity);
    });

    it('throws on a dynamic identifier', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={someVar} />', 'foo'))).toThrow(
        /someVar/,
      );
    });
  });

  describe('rejects dynamic expressions', () => {
    it('throws on a function call', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={fn()} />', 'foo'))).toThrow(
        /CallExpression|cannot be statically evaluated|fn/,
      );
    });

    it('throws on a binary expression', () => {
      expect(() => evalAttrExpression(parseAttr('<X foo={1 + 2} />', 'foo'))).toThrow(
        /BinaryExpression/,
      );
    });
  });
});
