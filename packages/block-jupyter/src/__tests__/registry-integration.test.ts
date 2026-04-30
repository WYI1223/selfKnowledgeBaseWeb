import { describe, expect, it } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { jupyterCore } from '../core/core-definition';
import { jupyterUiDefault } from '../ui-default/jupyter.ui';

/**
 * Note (sister-doc with block-math/registry-integration.test.ts ADR-0006 #6):
 * block-math required a `as unknown as BlockUIDefinition` widening cast because
 * MathView annotates `BlockViewProps<typeof mathCore.propsSchema>` directly,
 * narrowing the generic so registerUI's wide `BlockUIDefinition<ZodTypeAny>`
 * formal rejects the narrow value (ComponentType contravariance + exactOptionalPropertyTypes).
 * JupyterView's signature widens via the optional `adapter?: KernelAdapter`
 * extension, so defineUI infers a wide-enough generic that registerUI accepts
 * the value directly — no widening cast required here.
 */

describe('block-jupyter registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(jupyterCore);
    expect(reg.getCore('jupyter')).toBe(jupyterCore);
  });

  it('registerUI + getUI round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(jupyterCore);
    reg.registerUI(jupyterUiDefault);
    expect(reg.getUI('jupyter')).toBe(jupyterUiDefault);
    expect(reg.getUI('jupyter', 'default')).toBe(jupyterUiDefault);
  });

  it('default UI lookup returns first-registered (jupyterUiDefault uiId="default")', () => {
    const reg = new BlockRegistry();
    reg.registerCore(jupyterCore);
    reg.registerUI(jupyterUiDefault);
    expect(jupyterUiDefault.uiId).toBe('default');
    expect(reg.getUI('jupyter')).toBe(jupyterUiDefault);
  });

  it('registerUI before registerCore throws Unknown core', () => {
    const reg = new BlockRegistry();
    expect(() => reg.registerUI(jupyterUiDefault)).toThrow(
      /Unknown core for UI registration: jupyter/,
    );
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('not-jupyter')).toBeUndefined();
  });

  it('jupyter core kind is "viz" (ADR-0009 BlockKind expansion)', () => {
    expect(jupyterCore.kind).toBe('viz');
  });
});
