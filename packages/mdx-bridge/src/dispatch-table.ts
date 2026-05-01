import type { RootContent } from 'mdast';
import type {} from 'remark-mdx';
import type { TiptapNode } from './parse';

export type MdastJsxElement = Extract<RootContent, { type: 'mdxJsxFlowElement' }>;

export interface JsxDispatchEntry {
  mdxComponent: string;
  blockType: string;
  parse: (node: MdastJsxElement) => TiptapNode;
  serialize: (node: TiptapNode) => MdastJsxElement;
}

const jsxDispatch = new Map<string, JsxDispatchEntry>();

export function registerJsxDispatch(entry: JsxDispatchEntry): void {
  if (jsxDispatch.has(entry.mdxComponent)) {
    throw new Error(`Duplicate JSX dispatch registration: ${entry.mdxComponent}`);
  }
  jsxDispatch.set(entry.mdxComponent, entry);
}

export function getJsxDispatch(mdxComponent: string): JsxDispatchEntry | undefined {
  return jsxDispatch.get(mdxComponent);
}
