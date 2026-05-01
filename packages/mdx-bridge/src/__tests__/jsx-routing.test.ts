import { describe, expect, it } from 'vitest';
import type { PhrasingContent } from 'mdast';
import { BlockRegistry, type BlockCoreDefinition } from '@skb/block-foundation';
import {
  getJsxDispatch,
  mdxToTiptap,
  registerJsxDispatch,
  tiptapToMdx,
  type JsxDispatchEntry,
  type TiptapNode,
} from '../index';

const calloutCore: BlockCoreDefinition = {
  name: 'callout',
  kind: 'component',
  propsSchema: {} as BlockCoreDefinition['propsSchema'],
  mdxComponent: 'Callout',
};

const calloutDispatch: JsxDispatchEntry = {
  mdxComponent: 'Callout',
  blockType: 'callout',
  parse: parseCallout,
  serialize: serializeCallout,
};

function registryWithCallout(): BlockRegistry {
  const registry = new BlockRegistry();
  registry.registerCore(calloutCore);
  return registry;
}

function ensureCalloutDispatch(): void {
  if (getJsxDispatch('Callout') === undefined) {
    registerJsxDispatch(calloutDispatch);
  }
}

function parseCallout(node: Parameters<JsxDispatchEntry['parse']>[0]): TiptapNode {
  return {
    type: 'callout',
    attrs: { type: getStringAttribute(node, 'type') },
    content: node.children.flatMap(parseCalloutChild),
    _mdast: node,
  };
}

function parseCalloutChild(node: Parameters<JsxDispatchEntry['parse']>[0]['children'][number]) {
  if (node.type === 'mdxJsxFlowElement' && node.name === 'Callout') {
    return [parseCallout(node)];
  }
  if (node.type === 'paragraph') {
    return [
      {
        type: 'paragraph',
        content: node.children.map((child) => {
          if (child.type !== 'text') {
            throw new Error(`test fixture only supports text, received ${child.type}`);
          }
          return { type: 'text', text: child.value };
        }),
        _mdast: node,
      },
    ];
  }
  throw new Error(`test fixture only supports Callout children, received ${node.type}`);
}

function getStringAttribute(
  node: Parameters<JsxDispatchEntry['parse']>[0],
  name: string,
): string | null {
  const attr = node.attributes.find((candidate) => {
    return candidate.type === 'mdxJsxAttribute' && candidate.name === name;
  });
  if (!attr || attr.type !== 'mdxJsxAttribute') return null;
  return typeof attr.value === 'string' ? attr.value : null;
}

function serializeCallout(node: TiptapNode): ReturnType<JsxDispatchEntry['serialize']> {
  if (node._mdast?.type === 'mdxJsxFlowElement') return node._mdast;
  return {
    type: 'mdxJsxFlowElement',
    name: 'Callout',
    attributes:
      typeof node.attrs?.['type'] === 'string'
        ? [{ type: 'mdxJsxAttribute', name: 'type', value: node.attrs['type'] }]
        : [],
    children: node.content?.map(serializeCalloutChild) ?? [],
  };
}

function serializeCalloutChild(
  node: TiptapNode,
): ReturnType<JsxDispatchEntry['serialize']>['children'][number] {
  if (node.type === 'callout') return serializeCallout(node);
  if (node.type === 'paragraph') {
    return {
      type: 'paragraph',
      children: (node.content ?? []).map((child): PhrasingContent => {
        if (child.type !== 'text') {
          throw new Error(`test fixture only supports text, received ${child.type}`);
        }
        return { type: 'text', value: child.text ?? '' };
      }),
    };
  }
  throw new Error(`test fixture only supports Callout children, received ${node.type}`);
}

describe('mdxJsxFlowElement routing', () => {
  it('TC1 round-trips a registered Callout', () => {
    ensureCalloutDispatch();
    const source = '<Callout type="info">\n  hello\n</Callout>';
    const blockRegistry = registryWithCallout();

    const restored = tiptapToMdx(mdxToTiptap(source, { blockRegistry }), { blockRegistry });

    expect(restored.trim()).toBe(source);
  });

  it('TC2 throws on unknown JSX when a registry is present', () => {
    ensureCalloutDispatch();
    const blockRegistry = registryWithCallout();

    expect(() => mdxToTiptap('<UnknownBlock attr="x" />', { blockRegistry })).toThrowError(
      /^mdx-bridge: unsupported block type "UnknownBlock"\./,
    );
  });

  it('TC3 preserves the missing-registry fail-loud branch', () => {
    expect(() => mdxToTiptap('<Callout>\n  x\n</Callout>')).toThrowError(
      /^mdx-bridge: unsupported block type "mdxJsxFlowElement"\./,
    );
    expect(() =>
      tiptapToMdx({ type: 'doc', content: [{ type: 'callout', content: [] }] }),
    ).toThrowError(/^mdx-bridge: unsupported block type "callout"\./);
  });

  it('TC4 throws on unknown component-shaped Tiptap nodes when a registry is present', () => {
    ensureCalloutDispatch();
    const blockRegistry = registryWithCallout();

    expect(() =>
      tiptapToMdx({ type: 'doc', content: [{ type: 'unknownBlock' }] }, { blockRegistry }),
    ).toThrowError(/^mdx-bridge: unsupported block type "unknownBlock"\./);
  });

  it('TC5 round-trips nested Callout blocks', () => {
    ensureCalloutDispatch();
    const source = '<Callout>\n  <Callout type="warn">\n    inner\n  </Callout>\n</Callout>';
    const blockRegistry = registryWithCallout();

    const restored = tiptapToMdx(mdxToTiptap(source, { blockRegistry }), { blockRegistry });

    expect(restored.trim()).toBe(source);
  });

  it('TC6 uses only the registry supplied to the current call', () => {
    ensureCalloutDispatch();
    const regA = registryWithCallout();
    const regB = registryWithCallout();
    const emptyRegistry = new BlockRegistry();

    const docA = mdxToTiptap('<Callout type="info">\n  A\n</Callout>', { blockRegistry: regA });
    const docB = mdxToTiptap('<Callout type="warn">\n  B\n</Callout>', { blockRegistry: regB });

    expect(docA.content[0]?.type).toBe('callout');
    expect(docB.content[0]?.attrs?.['type']).toBe('warn');
    expect(() =>
      mdxToTiptap('<Callout>\n  C\n</Callout>', { blockRegistry: emptyRegistry }),
    ).toThrowError(/^mdx-bridge: unsupported block type "Callout"\./);
  });
});
