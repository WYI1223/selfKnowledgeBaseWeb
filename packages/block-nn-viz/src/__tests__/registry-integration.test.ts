import { describe, expect, it } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { nnVizCore } from '../core/core-definition';
import { nnVizUiDefault } from '../ui-default/nn-viz.ui';

/**
 * Mirrors block-jupyter/registry-integration.test.ts (sister-doc per ADR-0006 #6).
 * NnVizView's signature widens via the optional `loadLayersModel?: LoadLayersModelFn`
 * extension, so defineUI infers a wide-enough generic that registerUI accepts
 * the value directly — no widening cast required (same situation as JupyterView).
 */

describe('block-nn-viz registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(nnVizCore);
    expect(reg.getCore('nn-viz')).toBe(nnVizCore);
  });

  it('registerUI + getUI round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(nnVizCore);
    reg.registerUI(nnVizUiDefault);
    expect(reg.getUI('nn-viz')).toBe(nnVizUiDefault);
    expect(reg.getUI('nn-viz', 'default')).toBe(nnVizUiDefault);
  });

  it('default UI lookup returns first-registered (nnVizUiDefault uiId="default")', () => {
    const reg = new BlockRegistry();
    reg.registerCore(nnVizCore);
    reg.registerUI(nnVizUiDefault);
    expect(nnVizUiDefault.uiId).toBe('default');
    expect(reg.getUI('nn-viz')).toBe(nnVizUiDefault);
  });

  it('registerUI before registerCore throws Unknown core', () => {
    const reg = new BlockRegistry();
    expect(() => reg.registerUI(nnVizUiDefault)).toThrow(
      /Unknown core for UI registration: nn-viz/,
    );
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('not-nn-viz')).toBeUndefined();
  });

  it('nn-viz core kind is "viz" (ADR-0009 BlockKind expansion)', () => {
    expect(nnVizCore.kind).toBe('viz');
  });
});
