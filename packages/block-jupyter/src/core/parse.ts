import { jupyterCore } from './core-definition';
import type { JupyterMdastJsxElement, JupyterTiptapNode } from './serialize';

/**
 * MDX 解析 stub。Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Jupyter'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Boolean attrs (`runOnLoad` / `showLineNumbers`) 三种 MDX 形式
 * (mdast-util-mdx-jsx convention)：
 *   - `<Jupyter runOnLoad>` (boolean shorthand)   → attr.value === null  → true
 *   - `<Jupyter runOnLoad="true">`                → "true"  → true
 *   - `<Jupyter runOnLoad="false">`               → "false" → false
 * 任何其他形式 throw — 不静默 false。
 *
 * `libraries` 在 Wave 2 stub 中按 string-encoded JSON array 解析（serialize
 * emits JSON.stringify）。Wave 3 mdx-bridge 接 expression-attr 后改为直接
 * 接受 array literal 表达式；这层 stub 仅保证 round-trip 形状对齐。
 *
 * `code` 一律期望 string；null shorthand 仅 boolean attrs 适用。
 */
export function parseJupyter(node: JupyterMdastJsxElement): JupyterTiptapNode {
  if (node.name !== jupyterCore.mdxComponent) {
    throw new Error(
      `parseJupyter: expected mdxComponent="${jupyterCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | boolean | string[]> = {};
  for (const attr of node.attributes) {
    if (attr.name === 'runOnLoad' || attr.name === 'showLineNumbers') {
      if (attr.value === null) {
        rawProps[attr.name] = true;
      } else if (attr.value === 'true' || attr.value === 'false') {
        rawProps[attr.name] = attr.value === 'true';
      } else {
        throw new Error(
          `parseJupyter: invalid ${attr.name} attribute value: ${JSON.stringify(attr.value)}`,
        );
      }
    } else if (attr.name === 'libraries') {
      if (attr.value === null) {
        throw new Error(
          'parseJupyter: attribute "libraries" must have a string value (got null shorthand; only boolean attrs support shorthand)',
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(attr.value);
      } catch {
        throw new Error(
          `parseJupyter: libraries attribute is not valid JSON: ${JSON.stringify(attr.value)}`,
        );
      }
      if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
        throw new Error(
          `parseJupyter: libraries must decode to string[]; got ${JSON.stringify(parsed)}`,
        );
      }
      rawProps[attr.name] = parsed;
    } else {
      if (attr.value === null) {
        throw new Error(
          `parseJupyter: attribute "${attr.name}" must have a string value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      rawProps[attr.name] = attr.value;
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
