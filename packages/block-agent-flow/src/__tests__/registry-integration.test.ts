import { describe, expect, it } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { agentFlowCore } from '../core/core-definition';
import { agentFlowUiDefault } from '../ui-default/agent-flow.ui';

/**
 * Sister-doc with block-jupyter/registry-integration.test.ts (ADR-0006 #6).
 * AgentFlowView signature inference is similar to JupyterView's — defineUI
 * infers a wide-enough generic that registerUI accepts the value directly,
 * no widening cast needed.
 */

describe('block-agent-flow registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(agentFlowCore);
    expect(reg.getCore('agent-flow')).toBe(agentFlowCore);
  });

  it('registerUI + getUI round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(agentFlowCore);
    reg.registerUI(agentFlowUiDefault);
    expect(reg.getUI('agent-flow')).toBe(agentFlowUiDefault);
    expect(reg.getUI('agent-flow', 'default')).toBe(agentFlowUiDefault);
  });

  it('default UI lookup returns first-registered (agentFlowUiDefault uiId="default")', () => {
    const reg = new BlockRegistry();
    reg.registerCore(agentFlowCore);
    reg.registerUI(agentFlowUiDefault);
    expect(agentFlowUiDefault.uiId).toBe('default');
    expect(reg.getUI('agent-flow')).toBe(agentFlowUiDefault);
  });

  it('registerUI before registerCore throws Unknown core', () => {
    const reg = new BlockRegistry();
    expect(() => reg.registerUI(agentFlowUiDefault)).toThrow(
      /Unknown core for UI registration: agent-flow/,
    );
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('not-agent-flow')).toBeUndefined();
  });

  it('agent-flow core kind is "viz" (ADR-0009 BlockKind expansion)', () => {
    expect(agentFlowCore.kind).toBe('viz');
  });
});
