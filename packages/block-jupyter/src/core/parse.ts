import { evalAttrExpression } from '@skb/block-foundation';
import { jupyterCore } from './core-definition';
import type { JupyterMdastJsxElement, JupyterTiptapNode } from './serialize';

/**
 * MDX 解析。mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Jupyter'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Attribute value extraction goes through `evalAttrExpression` (post Wave 6
 * carry-forward #16 2026-05-08), so each attr resolves to one of:
 *   - string | null (quoted/shorthand forms)
 *   - the static JS literal (JSX expression form — TemplateLiteral for
 *     multiline `code={`...`}`, ArrayExpression for `libraries={[...]}`,
 *     boolean Literal for `runOnLoad={true}`).
 *
 * Boolean attrs (`runOnLoad` / `showLineNumbers`) accept: null shorthand
 * → true; "true"/"false" string → boolean; or expression `{true}`/`{false}`.
 *
 * `libraries` accepts: a string[] (JS literal `["x","y"]` via expression) OR
 * a JSON-encoded string `'["x","y"]'` (legacy round-trip path that
 * `serializeJupyter` still emits).
 *
 * `code` accepts a string (template literal cooked value or quoted string).
 */
export function parseJupyter(node: JupyterMdastJsxElement): JupyterTiptapNode {
  if (node.name !== jupyterCore.mdxComponent) {
    throw new Error(
      `parseJupyter: expected mdxComponent="${jupyterCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | boolean | string[]> = {};
  for (const attr of node.attributes) {
    const v = evalAttrExpression(attr.value);
    if (attr.name === 'runOnLoad' || attr.name === 'showLineNumbers') {
      if (v === null) {
        rawProps[attr.name] = true;
      } else if (typeof v === 'boolean') {
        rawProps[attr.name] = v;
      } else if (v === 'true' || v === 'false') {
        rawProps[attr.name] = v === 'true';
      } else {
        throw new Error(
          `parseJupyter: invalid ${attr.name} attribute value: ${JSON.stringify(v)}`,
        );
      }
    } else if (attr.name === 'libraries') {
      if (v === null) {
        throw new Error(
          'parseJupyter: attribute "libraries" must have a value (got null shorthand; only boolean attrs support shorthand)',
        );
      }
      let parsed: unknown;
      if (Array.isArray(v)) {
        parsed = v;
      } else if (typeof v === 'string') {
        try {
          parsed = JSON.parse(v);
        } catch {
          throw new Error(
            `parseJupyter: libraries attribute is not valid JSON: ${JSON.stringify(v)}`,
          );
        }
      } else {
        throw new Error(
          `parseJupyter: libraries must be an array or JSON string; got ${typeof v}`,
        );
      }
      if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
        throw new Error(
          `parseJupyter: libraries must decode to string[]; got ${JSON.stringify(parsed)}`,
        );
      }
      rawProps[attr.name] = parsed;
    } else {
      if (v === null) {
        throw new Error(
          `parseJupyter: attribute "${attr.name}" must have a string value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      if (typeof v !== 'string') {
        throw new Error(
          `parseJupyter: attribute "${attr.name}" must be a string, got ${typeof v}`,
        );
      }
      rawProps[attr.name] = v;
    }
  }
  const validated = jupyterCore.propsSchema.parse(rawProps);
  return {
    type: 'jupyter',
    attrs: {
      code: validated.code,
      runOnLoad: validated.runOnLoad,
      showLineNumbers: validated.showLineNumbers,
      libraries: validated.libraries,
    },
  };
}
