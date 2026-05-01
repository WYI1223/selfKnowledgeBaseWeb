import type { Editor } from '@tiptap/core';
import type { BlockRegistry } from '@skb/block-foundation';
import { mdxToTiptap, tiptapToMdx, type TiptapDoc } from '@skb/mdx-bridge';

export interface SaveLoadOptions {
  /** Forward-compat per-call BlockRegistry injection. Wave 3 Stage A:
   *  accepted-but-unused at this layer (mdx-bridge does not yet accept
   *  a `{ blockRegistry }` option; B1 adds it). Wave 3 Stage B (B1+):
   *  threaded through to mdxToTiptap / tiptapToMdx so component blocks
   *  can parse + serialize via their registered cores. */
  blockRegistry?: BlockRegistry;
}

/** Serialize the editor's current document to MDX source. Prose-only in
 *  Stage A; component blocks throw via mdx-bridge's existing fail-loud
 *  rule until B1 extends the walker. */
export function saveToMdx(editor: Editor, options?: SaveLoadOptions): string {
  const doc = editor.getJSON() as TiptapDoc;
  return tiptapToMdx(doc, options);
}

/** Replace the editor's document by parsing MDX source. Prose-only in
 *  Stage A; component-block JSX throws via mdx-bridge's existing
 *  fail-loud rule until B1. */
export function loadFromMdx(editor: Editor, source: string, options?: SaveLoadOptions): void {
  const doc = mdxToTiptap(source, options);
  editor.commands.setContent(doc);
}
