import {
  type BlockAffordanceKind,
  buildChangeKindAttrs,
  defaultBlockAttrsFor,
  type EditorShellProps,
} from '@skb/editor-shell';

/**
 * Tiptap Editor instance type — derived from EditorShellProps so we
 * don't import @tiptap/core directly from apps/site (which is a
 * transitive dep via editor-shell). Mirrors the pattern in
 * EditorShellMount.tsx (`EditorInstance = Parameters<NonNullable<
 * EditorShellProps['onCreate']>>[0]`).
 */
type Editor = Parameters<NonNullable<EditorShellProps['onCreate']>>[0];

/**
 * Structural type for the Tiptap command callback's `{tr}` arg.
 * Tiptap's Transaction shape comes from the prosemirror-state /
 * prosemirror-model packages (transitive via @tiptap/core); we
 * type only the methods we use so this file doesn't need a direct
 * @tiptap/core import. The full ProseMirror Node type has 40+
 * fields; for the insert path we accept `unknown` (the caller
 * casts a real `node.copy()` result through the structural type
 * gap — TypeScript's structural subtyping makes any cast acceptable
 * since Tiptap's runtime checks the actual instance).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TiptapCommandArg = { tr: any };

/**
 * @apps/site EditorShellKebabActions — imperative kebab-menu action
 * factories extracted from EditorShellMount.tsx.
 *
 * Wave 6 cf-20e (2026-05-09) — extraction motivated by the cf-20e
 * size-check landing EditorShellMount.tsx at 540 lines (over the
 * 500-line hard limit). The 3 callbacks (delete / duplicate /
 * change-kind) are pure factories given the live editor + the
 * cf-20c-2 dropEpoch external setter; pulling them into a sibling
 * file keeps the mount file focused on lifecycle/state wiring.
 *
 * Per cf-20e D5: the consumer (EditorShellMount) is the single
 * owner of editor mutations across all 3 contexts (drag, resize,
 * kebab); the per-block components stay purely presentational.
 *
 * Per cf-20e D6: duplicate fires the success-pulse via the cf-20c-2
 * R3 dropEpoch infrastructure (canonical "rapid-action animation
 * isolation"). Delete + change-kind do NOT fire pulses (delete
 * removes; change-kind keeps the block in place — no positional
 * change).
 */

/** Helper: parse a kebab `blockId` string back to a numeric PM position. */
function posFromBlockId(blockId: string): number | null {
  const pos = Number(blockId);
  if (!Number.isFinite(pos)) return null;
  return pos;
}

/**
 * cf-22 R1 F1 — kebab announce callback signature. Receives the
 * action enum + source kind + (for change-kind) the new kind.
 * Optional (degraded mode for tests / pre-LiveAnnouncer mounts).
 */
export type KebabAnnounceFn = (
  action: 'delete' | 'duplicate' | 'change kind',
  blockKind: string,
  newKind?: string,
) => void;

/**
 * Imperative delete: remove the node at the given pos. cf-22 R1 F1
 * fires `announce(formatKebabAction('delete', kind))` post-mutation
 * for WCAG 4.1.3.
 */
export function makeKebabDelete(
  editor: Editor | null,
  announce?: KebabAnnounceFn,
) {
  return (blockId: string): void => {
    if (!editor) return;
    const pos = posFromBlockId(blockId);
    if (pos === null) return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    const blockKind = node.type.name;
    editor
      .chain()
      .command(({ tr }: TiptapCommandArg) => {
        tr.delete(pos, pos + node.nodeSize);
        return true;
      })
      .run();
    announce?.('delete', blockKind);
  };
}

/**
 * Imperative duplicate: insert a copy of the node at `pos +
 * nodeSize`. After 2 rAFs (React commit + browser layout) the
 * inserted block's bounding rect is re-measured + handed to the
 * cf-20c-2 dropEpoch infrastructure for the success-pulse.
 *
 * Per cf-20e D7: uses ProseMirror `tr.insert(insertPos, node.copy())`
 * primitive (NOT Tiptap insertContentAt which silently no-ops on
 * schema-mismatch — empirically observed at R0). `node.copy()` shares
 * source's attrs + marks but with a fresh content Fragment. cf-20e
 * doesn't have stable UUID attrs (cf-20c-2 D2 path A uses pos-as-id),
 * so no UUID clearing needed; future schema-mod PR will need to
 * clear UUIDs on duplicate.
 */
export function makeKebabDuplicate(
  editor: Editor | null,
  setLastDroppedFromExternal: (
    blockId: string,
    rect: DOMRectReadOnly,
  ) => void,
  announce?: KebabAnnounceFn,
) {
  return (blockId: string): void => {
    if (!editor) return;
    const pos = posFromBlockId(blockId);
    if (pos === null) return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    const insertPos = pos + node.nodeSize;
    const blockKind = node.type.name;
    // Use ProseMirror's tr.insert(pos, node.copy()) per cf-20e D7.
    editor
      .chain()
      .command(({ tr }: TiptapCommandArg) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tr.insert(insertPos, (node as any).copy());
        return true;
      })
      .run();
    announce?.('duplicate', blockKind);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const dom = editor.view.nodeDOM(insertPos);
        if (dom instanceof HTMLElement) {
          setLastDroppedFromExternal(
            String(insertPos),
            dom.getBoundingClientRect(),
          );
        }
      });
    });
  };
}

/**
 * Imperative change-kind: mutate the node at the given pos to a new
 * kind. Per cf-20e D3 drop-and-default: preserve grid attrs from
 * source, drop all other source attrs, supply target-kind defaults
 * via `buildChangeKindAttrs`. Per cf-20e D5: the helper takes
 * defaults via parameter (NOT imported in change-kind-attrs.ts) so
 * the pure-helper module stays free of the registry-wire dependency
 * graph.
 */
export function makeKebabChangeKind(
  editor: Editor | null,
  announce?: KebabAnnounceFn,
) {
  return (blockId: string, newKind: BlockAffordanceKind): void => {
    if (!editor) return;
    const pos = posFromBlockId(blockId);
    if (pos === null) return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    const newNodeType = editor.schema.nodes[newKind];
    if (!newNodeType) return;
    const sourceKind = node.type.name;
    const newAttrs = buildChangeKindAttrs(
      node.attrs,
      newKind,
      defaultBlockAttrsFor(newKind),
    );
    editor
      .chain()
      .command(({ tr }: TiptapCommandArg) => {
        tr.setNodeMarkup(pos, newNodeType, newAttrs);
        return true;
      })
      .run();
    announce?.('change kind', sourceKind, newKind);
  };
}
