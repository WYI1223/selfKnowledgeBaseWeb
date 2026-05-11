import { Node, mergeAttributes, type Editor, type Extensions } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { BlockRegistry } from '@skb/block-foundation';
import { getJsxDispatch, registerJsxDispatch } from '@skb/mdx-bridge';
import { makeBlockNodeView } from './BlockNodeView';
import { parseCallout, serializeCallout } from '@skb/block-callout/core';
import { parseCode, serializeCode } from '@skb/block-code/core';
import { parseImage, serializeImage } from '@skb/block-image/core';
import { parseMarkdown, serializeMarkdown } from '@skb/block-markdown/core';
import { parseMath, serializeMath } from '@skb/block-math/core';
import { parsePdf, serializePdf } from '@skb/block-pdf/core';
import { parseJupyter, serializeJupyter } from '@skb/block-jupyter/core';
import { parseNnViz, serializeNnViz } from '@skb/block-nn-viz/core';
import { parseAgentFlow, serializeAgentFlow } from '@skb/block-agent-flow/core';

type JsxDispatchEntry = Parameters<typeof registerJsxDispatch>[0];

// Wave 6 carry-forward #15b 2026-05-08 — 'code' renamed to
// 'componentCode' so the Tiptap node name no longer collides with
// StarterKit's inline `code` MARK (ProseMirror forbids same name on
// both a node and a mark). User-facing slash-menu label stays
// 'Code'; MDX tag stays `<Code>`; only the internal kind identifier
// changed. See packages/block-code/src/core/core-definition.ts.
// Wave 6 cf-25 — `markdown` is the 9th BlockAffordanceKind. Per
// PR.md D1 (Path B), it carries inner ProseMirror prose (paragraph /
// heading / list / blockquote / etc.) as content, NOT as a string
// prop. The Tiptap node has `atom: false` + `content: 'block+'` (vs
// the 8 component blocks' `atom: true`); the editor mount
// short-circuits to `<NodeViewContent>` in BlockNodeView per cf-25 D7.
export type BlockAffordanceKind =
  | 'callout'
  | 'componentCode'
  | 'image'
  | 'jupyter'
  | 'markdown'
  | 'math'
  | 'pdf'
  | 'nn-viz'
  | 'agent-flow';

export interface BlockKindOption {
  kind: BlockAffordanceKind;
  label: string;
  mdxComponent: string;
}

export const BLOCK_KIND_OPTIONS: readonly BlockKindOption[] = [
  { kind: 'callout', label: 'Callout', mdxComponent: 'Callout' },
  { kind: 'componentCode', label: 'Code', mdxComponent: 'Code' },
  { kind: 'image', label: 'Image', mdxComponent: 'Image' },
  // cf-25 — 9th kind. Content lives as ProseMirror children, not props.
  { kind: 'markdown', label: 'Markdown', mdxComponent: 'Markdown' },
  { kind: 'math', label: 'Math', mdxComponent: 'Math' },
  { kind: 'pdf', label: 'Pdf', mdxComponent: 'Pdf' },
  { kind: 'jupyter', label: 'Jupyter', mdxComponent: 'Jupyter' },
  { kind: 'nn-viz', label: 'NN Viz', mdxComponent: 'NnViz' },
  { kind: 'agent-flow', label: 'Agent Flow', mdxComponent: 'AgentFlow' },
];

const jsxDispatches = [
  ['Callout', 'callout', parseCallout, serializeCallout],
  ['Code', 'componentCode', parseCode, serializeCode],
  ['Image', 'image', parseImage, serializeImage],
  ['Markdown', 'markdown', parseMarkdown, serializeMarkdown],
  ['Math', 'math', parseMath, serializeMath],
  ['Pdf', 'pdf', parsePdf, serializePdf],
  ['Jupyter', 'jupyter', parseJupyter, serializeJupyter],
  ['NnViz', 'nn-viz', parseNnViz, serializeNnViz],
  ['AgentFlow', 'agent-flow', parseAgentFlow, serializeAgentFlow],
] as const;

const gridAttrs = { col: 1, colSpan: 12, rowSpan: 1 };
// Wave 6 cf-25 — markdown blocks default to rowSpan='auto' per
// ADR-0016 D3 (isProse) + cf-25 D4. The 'auto' rowSpan tells
// useAutoRowSpan to derive height from rendered content height.
const proseGridAttrs = { col: 1, colSpan: 12, rowSpan: 'auto' as const };

const defaultBlockAttrs: Record<BlockAffordanceKind, Record<string, unknown>> = {
  callout: { ...gridAttrs, variant: 'note', title: 'New callout' },
  componentCode: { ...gridAttrs, language: 'ts', code: '// New code block', showLineNumbers: true },
  image: { ...gridAttrs, src: '/sample-assets/diagram-small.png', alt: 'Inserted image' },
  // cf-25 — markdown defaults: NO content-prop fields (content
  // lives as ProseMirror children, NOT attrs). Grid attrs only.
  markdown: { ...proseGridAttrs },
  math: { ...gridAttrs, expression: 'x^2', display: true },
  pdf: { ...gridAttrs, src: '/sample-assets/whitepaper.pdf', page: 1, searchable: false },
  jupyter: {
    ...gridAttrs,
    code: 'print("hello")',
    runOnLoad: false,
    showLineNumbers: true,
    libraries: [],
  },
  'nn-viz': {
    ...gridAttrs,
    modelUrl: '/sample-assets/models/mlp-mnist.json',
    layers: [],
    showWeights: false,
  },
  'agent-flow': { ...gridAttrs, nodes: [], edges: [], interactive: true },
};

function defaultAttrs(kind: BlockAffordanceKind): Record<string, unknown> {
  return { ...defaultBlockAttrs[kind] };
}

/**
 * Wave 6 cf-20e (2026-05-09) — public re-export of `defaultAttrs` so
 * cf-20e change-kind action consumers (EditorShellMount.tsx) can
 * source the new kind's defaults for `buildChangeKindAttrs`. Returns
 * a fresh shallow copy each call (caller may freely mutate the
 * result without affecting the canonical defaults).
 */
export function defaultBlockAttrsFor(
  kind: BlockAffordanceKind,
): Record<string, unknown> {
  return defaultAttrs(kind);
}

function createBlockExtension(option: BlockKindOption, registry?: BlockRegistry) {
  // Wave 6 carry-forward #18 2026-05-08 — when a registry is injected, the
  // node mounts the block's real `EditorView` via `ReactNodeViewRenderer`.
  // Without a registry, `addNodeView` is omitted entirely so Tiptap falls
  // back to `renderHTML` (the placeholder div), preserving the legacy
  // no-registry behavior used by existing smoke tests.
  const nodeViewExtension = registry
    ? {
        addNodeView() {
          return ReactNodeViewRenderer(makeBlockNodeView({ registry }));
        },
      }
    : {};

  // Wave 6 cf-25 D7 — markdown is the ONLY non-atom block kind:
  // it carries inner ProseMirror prose (paragraph / heading / list /
  // blockquote / etc.) as content, so atom: false + content: 'block+'
  // (one or more block nodes). All 8 component blocks remain atomic
  // (atom: true, no content). Defining: true makes the wrapper a
  // ProseMirror "defining" boundary so backspace at start unwraps
  // gracefully rather than merging into the previous block.
  const isMarkdown = option.kind === 'markdown';
  const schemaExtras: Record<string, unknown> = isMarkdown
    ? { atom: false, content: 'block+', defining: true }
    : { atom: true };

  return Node.create({
    name: option.kind,
    group: 'block',
    selectable: true,
    ...schemaExtras,

    addAttributes() {
      const attrs = defaultAttrs(option.kind);
      return Object.fromEntries(
        Object.entries(attrs).map(([name, defaultValue]) => [name, { default: defaultValue }]),
      );
    },

    renderHTML({ HTMLAttributes }) {
      // cf-25 — markdown's renderHTML must allow content insertion
      // (Tiptap requires the content hole as element index 0 in the
      // tuple). Component blocks render the placeholder text directly
      // since they're atom-blocks with no inner content.
      if (isMarkdown) {
        return [
          'div',
          mergeAttributes(HTMLAttributes, {
            'data-skb-block-kind': option.kind,
            class: 'skb-inserted-block',
          }),
          0, // 0 marks the content hole
        ];
      }
      return [
        'div',
        mergeAttributes(HTMLAttributes, {
          'data-skb-block-kind': option.kind,
          class: 'skb-inserted-block',
          contenteditable: 'false',
        }),
        `${option.label} block`,
      ];
    },
    ...nodeViewExtension,
  });
}

/**
 * Wave 6 cf-25 — markdown blocks need at least one inner block
 * node to satisfy the `content: 'block+'` schema constraint.
 * Seed an empty paragraph so insertion is valid. Component blocks
 * (atom: true) have no inner content; their insert payload omits
 * `content`.
 */
function buildInsertPayload(kind: BlockAffordanceKind): Record<string, unknown> {
  const attrs = defaultAttrs(kind);
  if (kind === 'markdown') {
    return { type: kind, attrs, content: [{ type: 'paragraph' }] };
  }
  return { type: kind, attrs };
}

export function insertBlockKind(editor: Editor | null, kind: BlockAffordanceKind): boolean {
  if (!editor) return false;
  if (typeof editor.chain !== 'function') return false;
  const option = BLOCK_KIND_OPTIONS.find((candidate) => candidate.kind === kind);
  if (!option) return false;
  return editor
    .chain()
    .focus()
    .insertContent(buildInsertPayload(option.kind))
    .run();
}

/**
 * Wave 6 cf-24 R0 F1 fix (HIGH bug — 2026-05-10) — explicit-end
 * append for external-source PaletteSidebar drag inserts.
 *
 * # Why a separate helper
 *
 * `insertBlockKind` uses `chain().focus().insertContent(...)` which
 * inserts at the CURRENT SELECTION (Tiptap default behavior). This
 * is correct for slash-menu (`/` typed at cursor → insert at cursor)
 * and PaletteModal (Cmd+K → insert at cursor). But for cf-24
 * PaletteSidebar drag-to-insert, the new block MUST land at a
 * deterministic doc-end position so `commitExternalDrop` can:
 *   1. Capture the insert position BEFORE the insert (returned by
 *      this helper).
 *   2. Position the freshly-inserted block via `setNodeMarkup` at
 *      that position (the post-insert post-snap diff would identify
 *      the wrong block if the user's selection is mid-doc).
 *
 * The pre-fix `commitExternalDrop` walked the post-insert snapshot +
 * diffed pre/post block ids to find the new block. That works ONLY
 * when the new block is appended at end (so the diff yields exactly
 * one new id). With selection-based insert at mid-doc, ProseMirror
 * may shift positions of OTHER blocks (split/merge effects), and
 * the diff identifies the wrong block (or fails entirely after the
 * insert already happened — leaving the new block in the wrong
 * place AND drop attrs applied to a different block).
 *
 * # Contract
 *
 * Returns the resolved post-insert position of the new block (the
 * pos of the inserted node, suitable for a follow-up
 * `setNodeMarkup(pos, undefined, attrs)` call) on success, or `null`
 * on any failure (editor null/invalid; unknown kind; chain run
 * returns false). Caller is responsible for the optional
 * `setNodeMarkup` follow-up to position the block in the grid.
 *
 * Append happens at `state.doc.content.size` captured BEFORE the
 * insert; this is a deterministic insert-pos contract. Tiptap's
 * post-insert position normalisation may add 1 to the captured pos
 * (the inserted node sits inside a paragraph or wrapping container);
 * the helper returns the pre-insert capture so the caller can resolve
 * via `editor.state.doc.nodeAt(pos)` if exact lookup is needed.
 *
 * # Consumer
 *
 * cf-24 `commit-external-drop.ts:commitExternalDrop` is the only
 * intended caller. Slash-menu + PaletteModal continue to use
 * `insertBlockKind` (insert-at-cursor semantics — they want that).
 *
 * @returns the inserted-block position on success, null on failure.
 */
export function appendBlockKind(
  editor: Editor | null,
  kind: BlockAffordanceKind,
): number | null {
  if (!editor) return null;
  if (typeof editor.chain !== 'function') return null;
  const option = BLOCK_KIND_OPTIONS.find((candidate) => candidate.kind === kind);
  if (!option) return null;
  // Capture the deterministic append position BEFORE the insert.
  // `state.doc.content.size` is the position AFTER the last child
  // node — Tiptap's `insertContentAt(pos, content)` inserts there.
  const insertPos = editor.state.doc.content.size;
  const ok = editor
    .chain()
    .insertContentAt(insertPos, buildInsertPayload(option.kind))
    .run();
  if (!ok) return null;
  return insertPos;
}

export interface RegistryWireOptions {
  blockRegistry?: BlockRegistry;
  kernelRegistry?: unknown;
  blockKinds?: readonly BlockKindOption[];
}

export interface RegistryWire {
  blockKinds: readonly BlockKindOption[];
  extensions: Extensions;
  insertBlock: (editor: Editor | null, kind: BlockAffordanceKind) => boolean;
}

export function wireRegistry(options: RegistryWireOptions): RegistryWire {
  for (const [mdxComponent, blockType, parse, serialize] of jsxDispatches) {
    if (getJsxDispatch(mdxComponent)) continue;
    registerJsxDispatch({
      mdxComponent,
      blockType,
      parse: parse as unknown as JsxDispatchEntry['parse'],
      serialize: serialize as unknown as JsxDispatchEntry['serialize'],
    });
  }

  const blockKinds = options.blockKinds ?? BLOCK_KIND_OPTIONS;
  return {
    blockKinds,
    extensions: blockKinds.map((option) => createBlockExtension(option, options.blockRegistry)),
    insertBlock: insertBlockKind,
  };
}
