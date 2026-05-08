import type { Editor } from '@tiptap/core';
import type { BlockRegistry } from '@skb/block-foundation';
import {
  mdxToTiptap,
  tiptapToMdx,
  type TiptapDoc,
  type TiptapMark,
  type TiptapNode,
} from '@skb/mdx-bridge';

export interface SaveLoadOptions {
  /** Forward-compat per-call BlockRegistry injection. Wave 3 Stage A:
   *  accepted-but-unused at this layer (mdx-bridge does not yet accept
   *  a `{ blockRegistry }` option; B1 adds it). Wave 3 Stage B (B1+):
   *  threaded through to mdxToTiptap / tiptapToMdx so component blocks
   *  can parse + serialize via their registered cores. */
  blockRegistry?: BlockRegistry;
}

/**
 * Wave 6 hotfix — Tiptap mark types the apps/site editor schema does NOT
 * register, listed here so `loadFromMdx` can strip them at the editor
 * boundary while mdx-bridge keeps emitting them (the marks survive in
 * `_mdast` for round-trip serialize fidelity).
 *
 *   - `code`: collides with the block-Code Tiptap NODE named `code`
 *     (ProseMirror forbids same name on both a node and a mark —
 *     "RangeError: code can not be both a node and a mark"). Pending
 *     the block-Code node-name rename (Stage B carry-forward #15b),
 *     the inline-code mark stays stripped at this boundary.
 *
 * `link` was previously in this set; carry-forward #15a registered
 * `@tiptap/extension-link` (Wave 6 hotfix follow-up 2026-05-08), so
 * link marks now survive into the editor's schema and are NOT
 * stripped. mdx-bridge round-trip fidelity for links is preserved.
 *
 * Without stripping the remaining `code` mark,
 * `editor.commands.setContent(doc)` rejects the whole document and
 * the editor surface stays visibly empty (the
 * /notes/sample-blocks/edit reproduction).
 */
const EDITOR_UNSUPPORTED_MARKS: ReadonlySet<string> = new Set(['code']);

function stripUnsupportedMarks(doc: TiptapDoc): TiptapDoc {
  const filterNode = (node: TiptapNode): TiptapNode => {
    const filtered: TiptapNode = { ...node };
    if (node.marks?.length) {
      const kept = node.marks.filter(
        (mark: TiptapMark) => !EDITOR_UNSUPPORTED_MARKS.has(mark.type),
      );
      if (kept.length > 0) filtered.marks = kept;
      else delete filtered.marks;
    }
    if (node.content?.length) {
      filtered.content = node.content.map(filterNode);
    }
    return filtered;
  };
  return { ...doc, content: doc.content.map(filterNode) };
}

/** Serialize the editor's current document to MDX source. Prose-only in
 *  Stage A; component blocks throw via mdx-bridge's existing fail-loud
 *  rule until B1 extends the walker. */
export function saveToMdx(editor: Editor, options?: SaveLoadOptions): string {
  const doc = editor.getJSON() as TiptapDoc;
  return tiptapToMdx(doc, options);
}

/** Replace the editor's document by parsing MDX source. Wave 6 hotfix —
 *  opts into mdx-bridge's `softParse` so a single malformed block
 *  (unsupported tag, JSX-attr coercion failure, hand-authored
 *  `{/* comment *\/}` author note) becomes a placeholder paragraph
 *  rather than throwing the entire load. The remaining
 *  schema-unsupported mark (`code`; see `EDITOR_UNSUPPORTED_MARKS`
 *  above) is stripped before `setContent` so the editor accepts the
 *  doc. (`link` was previously stripped here; carry-forward #15a
 *  registered `@tiptap/extension-link` and removed it from the set.) */
export function loadFromMdx(editor: Editor, source: string, options?: SaveLoadOptions): void {
  const doc = mdxToTiptap(source, { ...options, softParse: true });
  editor.commands.setContent(stripUnsupportedMarks(doc));
}
