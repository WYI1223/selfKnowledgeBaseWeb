import { describe, it, expect } from 'vitest';
import { nnVizCore } from '../core/core-definition';
import { serializeNnViz, parseNnViz } from '../core';

describe('nnVizCore.propsSchema', () => {
  it('accepts valid props with all fields', () => {
    expect(
      nnVizCore.propsSchema.parse({
        modelUrl: 'https://example.com/model.json',
        layers: [{ name: 'dense_1', units: 64, activation: 'relu' }],
        showWeights: true,
      }),
    ).toEqual({
      modelUrl: 'https://example.com/model.json',
      layers: [{ name: 'dense_1', units: 64, activation: 'relu' }],
      showWeights: true,
    });
  });

  it('applies defaults when optional fields are missing', () => {
    expect(
      nnVizCore.propsSchema.parse({ modelUrl: 'file:///m.json' }),
    ).toEqual({
      modelUrl: 'file:///m.json',
      layers: [],
      showWeights: false,
    });
  });

  it('rejects empty modelUrl (min(1) constraint)', () => {
    expect(() => nnVizCore.propsSchema.parse({ modelUrl: '' })).toThrow(
      /at least|too_small/,
    );
  });

  it('rejects non-string modelUrl', () => {
    expect(() => nnVizCore.propsSchema.parse({ modelUrl: 42 })).toThrow(
      /invalid_type|Expected string/,
    );
  });

  it('rejects negative or zero units in a layer', () => {
    expect(() =>
      nnVizCore.propsSchema.parse({
        modelUrl: 'm',
        layers: [{ name: 'd', units: 0, activation: 'relu' }],
      }),
    ).toThrow();
    expect(() =>
      nnVizCore.propsSchema.parse({
        modelUrl: 'm',
        layers: [{ name: 'd', units: -1, activation: 'relu' }],
      }),
    ).toThrow();
  });

  it('rejects non-integer units', () => {
    expect(() =>
      nnVizCore.propsSchema.parse({
        modelUrl: 'm',
        layers: [{ name: 'd', units: 1.5, activation: 'relu' }],
      }),
    ).toThrow();
  });

  it('rejects unsupported activation', () => {
    expect(() =>
      nnVizCore.propsSchema.parse({
        modelUrl: 'm',
        layers: [{ name: 'd', units: 8, activation: 'gelu' }],
      }),
    ).toThrow();
  });

  it('rejects unknown keys at the OUTER level (.strict)', () => {
    expect(() =>
      nnVizCore.propsSchema.parse({ modelUrl: 'm', extra: 'nope' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('rejects unknown keys INSIDE a layer (nested .strict per ADR-0006 #3)', () => {
    // This is the load-bearing assertion: outer .strict() does NOT propagate
    // through nested z.object schemas, so the layer item validator must carry
    // its own .strict() call. If someone removes the inner .strict(), this
    // test fails — protecting against the silent-extra-key bug.
    expect(() =>
      nnVizCore.propsSchema.parse({
        modelUrl: 'm',
        layers: [{ name: 'd', units: 8, activation: 'relu', mystery: 1 }],
      }),
    ).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(nnVizCore.name).toBe('nn-viz');
    expect(nnVizCore.kind).toBe('viz');
    expect(nnVizCore.mdxComponent).toBe('NnViz');
  });
});

describe('serializeNnViz', () => {
  it('emits string-form boolean attr + JSON-encoded layers', () => {
    const out = serializeNnViz({
      type: 'nn-viz',
      attrs: {
        modelUrl: 'm',
        layers: [{ name: 'd', units: 8, activation: 'softmax' }],
        showWeights: true,
      },
    });
    expect(out.type).toBe('mdxJsxFlowElement');
    expect(out.name).toBe('NnViz');
    const attrMap = Object.fromEntries(out.attributes.map((a) => [a.name, a.value]));
    expect(attrMap['modelUrl']).toBe('m');
    expect(attrMap['layers']).toBe('[{"name":"d","units":8,"activation":"softmax"}]');
    expect(attrMap['showWeights']).toBe('true');
  });

  it('rejects invalid attrs via propsSchema.parse before emitting', () => {
    expect(() =>
      serializeNnViz({
        type: 'nn-viz',
        attrs: {
          modelUrl: '',
          layers: [],
          showWeights: false,
        },
      }),
    ).toThrow();
  });
});

describe('parseNnViz', () => {
  it('handles boolean shorthand for showWeights', () => {
    const out = parseNnViz({
      type: 'mdxJsxFlowElement',
      name: 'NnViz',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'modelUrl', value: 'm' },
        { type: 'mdxJsxAttribute', name: 'showWeights', value: null },
        { type: 'mdxJsxAttribute', name: 'layers', value: '[]' },
      ],
      children: [],
    });
    expect(out.attrs.showWeights).toBe(true);
  });

  it('throws on string-typed showWeights value other than "true"/"false"', () => {
    expect(() =>
      parseNnViz({
        type: 'mdxJsxFlowElement',
        name: 'NnViz',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'modelUrl', value: 'm' },
          { type: 'mdxJsxAttribute', name: 'showWeights', value: 'maybe' },
          { type: 'mdxJsxAttribute', name: 'layers', value: '[]' },
        ],
        children: [],
      }),
    ).toThrow(/invalid showWeights attribute/);
  });

  it('throws on layers value that is not a JSON array', () => {
    expect(() =>
      parseNnViz({
        type: 'mdxJsxFlowElement',
        name: 'NnViz',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'modelUrl', value: 'm' },
          { type: 'mdxJsxAttribute', name: 'layers', value: '{"not":"array"}' },
        ],
        children: [],
      }),
    ).toThrow(/layers must decode to an array/);
  });

  it('throws when layer has an unsupported activation (post-JSON, schema-level)', () => {
    expect(() =>
      parseNnViz({
        type: 'mdxJsxFlowElement',
        name: 'NnViz',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'modelUrl', value: 'm' },
          {
            type: 'mdxJsxAttribute',
            name: 'layers',
            value: '[{"name":"d","units":8,"activation":"gelu"}]',
          },
        ],
        children: [],
      }),
    ).toThrow();
  });

  it('rejects mismatched mdxComponent name', () => {
    expect(() =>
      parseNnViz({
        type: 'mdxJsxFlowElement',
        name: 'NotNnViz',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'modelUrl', value: 'm' },
          { type: 'mdxJsxAttribute', name: 'layers', value: '[]' },
        ],
        children: [],
      }),
    ).toThrow(/expected mdxComponent="NnViz"/);
  });

  it('round-trips serialize → parse identity for canonical attrs', () => {
    const node = {
      type: 'nn-viz' as const,
      attrs: {
        modelUrl: 'https://example.com/m.json',
        layers: [
          { name: 'in', units: 32, activation: 'relu' as const },
          { name: 'out', units: 10, activation: 'softmax' as const },
        ] as const,
        showWeights: false,
      },
    };
    const back = parseNnViz(serializeNnViz(node));
    expect(back).toEqual(node);
  });
});
