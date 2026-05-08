import { codeCore } from './core-definition';

/**
 * MDX 序列化。Wave 3 mdx-bridge routing table 把 TiptapNode 按
 * `node.type === codeCore.name` 路由到本函数（per `BlockCoreDefinition.name`).
 *
 * Wave 6 carry-forward #15b 2026-05-08 — `codeCore.name` renamed
 * `'code'` → `'componentCode'` to escape the StarterKit inline-code
 * MARK collision; `CodeTiptapNode.type` literal mirrors that change.
 */
export interface CodeTiptapNode {
  readonly type: 'componentCode';
  readonly attrs: {
    readonly language: string;
    readonly code: string;
    readonly showLineNumbers: boolean;
  };
  readonly content?: readonly unknown[];
}

export interface CodeMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: string;
  }>;
  readonly children: readonly unknown[];
}

export function serializeCode(node: CodeTiptapNode): CodeMdastJsxElement {
  const validated = codeCore.propsSchema.parse(node.attrs);
  const attributes: CodeMdastJsxElement['attributes'] = [
    { type: 'mdxJsxAttribute', name: 'language', value: validated.language },
    { type: 'mdxJsxAttribute', name: 'code', value: validated.code },
    ...(validated.showLineNumbers === false
      ? [
          {
            type: 'mdxJsxAttribute' as const,
            name: 'showLineNumbers',
            value: 'false',
          },
        ]
      : []),
  ];
  return {
    type: 'mdxJsxFlowElement',
    name: codeCore.mdxComponent,
    attributes,
    children: node.content ?? [],
  };
}
