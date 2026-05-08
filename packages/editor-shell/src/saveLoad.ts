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
 * As of carry-forward #15b 2026-05-08 the set is **empty**:
 *   - `code` was previously stripped because the block-Code Tiptap
 *     node was named `code` and ProseMirror forbids the same name
 *     on both a node and a mark. The block-Code node was renamed
 *     to `componentCode` so the collision is gone and StarterKit's
 *     inline `code` mark is now enabled in `EditorShell.tsx`.
 *   - `link` was previously stripped because the editor did not
 *     register `@tiptap/extension-link`. Carry-forward #15a
 *     2026-05-08 added the Link extension with a `title` attr
 *     override; link marks now survive setContent.
 *
 * The empty set is preserved as a forward-compat hook — if a future
 * mdx-bridge mark surfaces ahead of its editor schema registration,
 * add the mark name here and remove once the editor catches up.
 */
const EDITOR_UNSUPPORTED_MARKS: ReadonlySet<string> = new Set();

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
 *  rather than throwing the entire load. As of carry-forward #15b
 *  2026-05-08 `EDITOR_UNSUPPORTED_MARKS` is empty (see comment
 *  above) — `link` was unblocked by carry-forward #15a registering
 *  `@tiptap/extension-link`, and `code` was unblocked by #15b
 *  renaming the block-Code Tiptap node out of the schema collision.
 *  `stripUnsupportedMarks` is left in the load chain as a forward-
 *  compat hook for any future mdx-bridge mark surface that lands
 *  ahead of its editor schema registration. */
export function loadFromMdx(editor: Editor, source: string, options?: SaveLoadOptions): void {
  const doc = mdxToTiptap(source, { ...options, softParse: true });
  editor.commands.setContent(stripUnsupportedMarks(doc));
}
