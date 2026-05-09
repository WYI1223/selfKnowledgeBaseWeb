import { Node, mergeAttributes, type Editor, type Extensions } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { BlockRegistry } from '@skb/block-foundation';
import { getJsxDispatch, registerJsxDispatch } from '@skb/mdx-bridge';
import { makeBlockNodeView } from './BlockNodeView';
import { parseCallout, serializeCallout } from '@skb/block-callout/core';
import { parseCode, serializeCode } from '@skb/block-code/core';
import { parseImage, serializeImage } from '@skb/block-image/core';
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
export type BlockAffordanceKind =
  | 'callout'
  | 'componentCode'
  | 'image'
  | 'math'
  | 'pdf'
  | 'jupyter'
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
  ['Math', 'math', parseMath, serializeMath],
  ['Pdf', 'pdf', parsePdf, serializePdf],
  ['Jupyter', 'jupyter', parseJupyter, serializeJupyter],
  ['NnViz', 'nn-viz', parseNnViz, serializeNnViz],
  ['AgentFlow', 'agent-flow', parseAgentFlow, serializeAgentFlow],
] as const;

const gridAttrs = { col: 1, colSpan: 12, rowSpan: 1 };

const defaultBlockAttrs: Record<BlockAffordanceKind, Record<string, unknown>> = {
  callout: { ...gridAttrs, variant: 'note', title: 'New callout' },
  componentCode: { ...gridAttrs, language: 'ts', code: '// New code block', showLineNumbers: true },
  image: { ...gridAttrs, src: '/sample-assets/diagram-small.png', alt: 'Inserted image' },
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
  return Node.create({
    name: option.kind,
    group: 'block',
    atom: true,
    selectable: true,

    addAttributes() {
      const attrs = defaultAttrs(option.kind);
      return Object.fromEntries(
        Object.entries(attrs).map(([name, defaultValue]) => [name, { default: defaultValue }]),
      );
    },

    renderHTML({ HTMLAttributes }) {
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

export function insertBlockKind(editor: Editor | null, kind: BlockAffordanceKind): boolean {
  if (!editor) return false;
  if (typeof editor.chain !== 'function') return false;
  const option = BLOCK_KIND_OPTIONS.find((candidate) => candidate.kind === kind);
  if (!option) return false;
  return editor
    .chain()
    .focus()
    .insertContent({ type: option.kind, attrs: defaultAttrs(option.kind) })
    .run();
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
