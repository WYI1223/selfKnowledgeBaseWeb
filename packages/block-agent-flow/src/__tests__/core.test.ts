import { describe, it, expect } from 'vitest';
import { agentFlowCore } from '../core/core-definition';
import { serializeAgentFlow, parseAgentFlow } from '../core';

describe('agentFlowCore.propsSchema', () => {
  it('accepts valid props with all fields', () => {
    expect(
      agentFlowCore.propsSchema.parse({
        nodes: [
          { id: 'a', label: 'A', type: 'agent', position: { x: 0, y: 0 } },
        ],
        edges: [{ id: 'e1', source: 'a', target: 'a', label: 'self' }],
        interactive: false,
      }),
    ).toEqual({
      nodes: [
        { id: 'a', label: 'A', type: 'agent', position: { x: 0, y: 0 } },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'a', label: 'self' }],
      interactive: false,
    });
  });

  it('applies defaults when optional fields are missing', () => {
    expect(agentFlowCore.propsSchema.parse({})).toEqual({
      nodes: [],
      edges: [],
      interactive: true,
    });
  });

  it('accepts edges without optional label', () => {
    expect(
      agentFlowCore.propsSchema.parse({
        nodes: [
          { id: 'a', label: 'A', type: 'agent', position: { x: 0, y: 0 } },
          { id: 'b', label: 'B', type: 'tool', position: { x: 1, y: 1 } },
        ],
        edges: [{ id: 'e1', source: 'a', target: 'b' }],
      }),
    ).toMatchObject({ edges: [{ id: 'e1', source: 'a', target: 'b' }] });
  });

  it('rejects unknown keys at the root level (.strict)', () => {
    expect(() =>
      agentFlowCore.propsSchema.parse({ nodes: [], edges: [], extra: 'x' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('rejects unknown keys at the nodes[i] level (.strict propagation trip-hazard)', () => {
    expect(() =>
      agentFlowCore.propsSchema.parse({
        nodes: [
          {
            id: 'a',
            label: 'A',
            type: 'agent',
            position: { x: 0, y: 0 },
            extra: 'nope',
          },
        ],
      }),
    ).toThrow(/unrecognized_keys/);
  });

  it('rejects unknown keys at the edges[i] level', () => {
    expect(() =>
      agentFlowCore.propsSchema.parse({
        edges: [
          { id: 'e', source: 'a', target: 'b', extra: 'nope' },
        ],
      }),
    ).toThrow(/unrecognized_keys/);
  });

  it('rejects unknown keys at the position level', () => {
    expect(() =>
      agentFlowCore.propsSchema.parse({
        nodes: [
          {
            id: 'a',
            label: 'A',
            type: 'agent',
            position: { x: 0, y: 0, z: 1 },
          },
        ],
      }),
    ).toThrow(/unrecognized_keys/);
  });

  it('rejects invalid node type enum value', () => {
    expect(() =>
      agentFlowCore.propsSchema.parse({
        nodes: [
          { id: 'a', label: 'A', type: 'invalid', position: { x: 0, y: 0 } },
        ],
      }),
    ).toThrow(/invalid_enum_value|Invalid enum/);
  });

  it('rejects non-numeric position values', () => {
    expect(() =>
      agentFlowCore.propsSchema.parse({
        nodes: [
          { id: 'a', label: 'A', type: 'agent', position: { x: '0', y: 0 } },
        ],
      }),
    ).toThrow(/invalid_type|Expected number/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(agentFlowCore.name).toBe('agent-flow');
    expect(agentFlowCore.kind).toBe('viz');
    expect(agentFlowCore.mdxComponent).toBe('AgentFlow');
  });
});

describe('serializeAgentFlow', () => {
  it('emits stable string-form for boolean attr + JSON-encoded nodes/edges', () => {
    const out = serializeAgentFlow({
      type: 'agent-flow',
      attrs: {
        nodes: [
          { id: 'a', label: 'A', type: 'agent', position: { x: 0, y: 0 } },
        ],
        edges: [{ id: 'e1', source: 'a', target: 'a' }],
        interactive: false,
      },
    });
    expect(out.type).toBe('mdxJsxFlowElement');
    expect(out.name).toBe('AgentFlow');
    const attrMap = Object.fromEntries(
      out.attributes.map((a) => [a.name, a.value]),
    );
    expect(attrMap['interactive']).toBe('false');
    expect(JSON.parse(attrMap['nodes'] as string)).toHaveLength(1);
    expect(JSON.parse(attrMap['edges'] as string)).toHaveLength(1);
  });

  it('rejects invalid attrs via propsSchema.parse before emitting', () => {
    expect(() =>
      serializeAgentFlow({
        type: 'agent-flow',
        attrs: {
          nodes: [
            {
              id: 'a',
              label: 'A',
              type: 'invalid' as 'agent',
              position: { x: 0, y: 0 },
            },
          ],
          edges: [],
          interactive: true,
        },
      }),
    ).toThrow();
  });
});

describe('parseAgentFlow', () => {
  it('handles boolean shorthand for interactive', () => {
    const out = parseAgentFlow({
      type: 'mdxJsxFlowElement',
      name: 'AgentFlow',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'nodes', value: '[]' },
        { type: 'mdxJsxAttribute', name: 'edges', value: '[]' },
        { type: 'mdxJsxAttribute', name: 'interactive', value: null },
      ],
      children: [],
    });
    expect(out.attrs.interactive).toBe(true);
  });

  it('throws on string-typed interactive value other than "true"/"false"', () => {
    expect(() =>
      parseAgentFlow({
        type: 'mdxJsxFlowElement',
        name: 'AgentFlow',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'nodes', value: '[]' },
          { type: 'mdxJsxAttribute', name: 'edges', value: '[]' },
          { type: 'mdxJsxAttribute', name: 'interactive', value: 'maybe' },
        ],
        children: [],
      }),
    ).toThrow(/invalid interactive attribute/);
  });

  it('throws when nodes attribute is not valid JSON', () => {
    expect(() =>
      parseAgentFlow({
        type: 'mdxJsxFlowElement',
        name: 'AgentFlow',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'nodes', value: 'not-json' },
          { type: 'mdxJsxAttribute', name: 'edges', value: '[]' },
        ],
        children: [],
      }),
    ).toThrow(/nodes attribute is not valid JSON/);
  });

  it('throws when nodes JSON is not an array', () => {
    expect(() =>
      parseAgentFlow({
        type: 'mdxJsxFlowElement',
        name: 'AgentFlow',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'nodes', value: '{"a":1}' },
          { type: 'mdxJsxAttribute', name: 'edges', value: '[]' },
        ],
        children: [],
      }),
    ).toThrow(/nodes must decode to array/);
  });

  it('rejects mismatched mdxComponent name', () => {
    expect(() =>
      parseAgentFlow({
        type: 'mdxJsxFlowElement',
        name: 'NotAgentFlow',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'nodes', value: '[]' },
          { type: 'mdxJsxAttribute', name: 'edges', value: '[]' },
        ],
        children: [],
      }),
    ).toThrow(/expected mdxComponent="AgentFlow"/);
  });

  it('round-trips serialize → parse identity for canonical attrs', () => {
    const node = {
      type: 'agent-flow' as const,
      attrs: {
        nodes: [
          { id: 'a', label: 'A', type: 'agent' as const, position: { x: 0, y: 0 } },
          { id: 'b', label: 'B', type: 'tool' as const, position: { x: 200, y: 0 } },
        ],
        edges: [{ id: 'e1', source: 'a', target: 'b' }],
        interactive: true,
      },
    };
    const back = parseAgentFlow(serializeAgentFlow(node));
    expect(back.attrs.nodes).toEqual(node.attrs.nodes);
    expect(back.attrs.edges).toEqual(node.attrs.edges);
    expect(back.attrs.interactive).toBe(true);
  });
});
