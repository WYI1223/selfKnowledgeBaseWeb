import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { agentFlowCore } from '../core/core-definition';
import {
  agentFlowUiDefault,
  AgentFlowEditorView,
  AgentFlowRenderView,
  AgentFlowView,
  AGENT_FLOW_TOKENS,
} from '../ui-default';

/**
 * UI surface contract tests + a smoke render for the React NodeView.
 * Mirrors block-jupyter's ui-default.test.tsx shape (sister-doc invariant
 * per ADR-0006 #6).
 *
 * React Flow needs `ResizeObserver` + DOMRect APIs that happy-dom may not
 * fully implement; we install minimal shims at module load so the canvas
 * mounts without throwing. Tests assert against the SKB-owned wrapper
 * (`[data-block="agent-flow"]` + status + error panel), not React Flow's
 * internal DOM.
 */

class ResizeObserverShim {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverShim }).ResizeObserver =
    ResizeObserverShim;
}

interface ShimmedProto {
  __skbShim__?: true;
}
const elementProto = Element.prototype as unknown as ShimmedProto;
if (elementProto.__skbShim__ !== true) {
  const originalGetBcr: typeof Element.prototype.getBoundingClientRect =
    Element.prototype.getBoundingClientRect.bind(Element.prototype);
  Element.prototype.getBoundingClientRect = function shimGetBoundingClientRect(
    this: Element,
  ): DOMRect {
    const rect = originalGetBcr.call(this);
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width || 800,
      height: rect.height || 360,
      top: rect.top,
      left: rect.left,
      right: rect.right || 800,
      bottom: rect.bottom || 360,
      toJSON: () => ({}),
    };
  };
  elementProto.__skbShim__ = true;
}

describe('agentFlowUiDefault registration shape', () => {
  it('exposes BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(agentFlowUiDefault.coreName).toBe(agentFlowCore.name);
    expect(agentFlowUiDefault.coreName).toBe('agent-flow');
    expect(agentFlowUiDefault.uiId).toBe('default');
  });

  it('EditorView and RenderView identity matches AgentFlow.tsx exports', () => {
    expect(agentFlowUiDefault.EditorView).toBe(AgentFlowEditorView);
    expect(agentFlowUiDefault.RenderView).toBe(AgentFlowRenderView);
  });

  it('AGENT_FLOW_TOKENS witnesses the @skb/design-tokens ColorTokenName surface', () => {
    expect(AGENT_FLOW_TOKENS.fgToken).toBe('fg');
    expect(AGENT_FLOW_TOKENS.errorToken).toBe('error');
    expect(AGENT_FLOW_TOKENS.mutedToken).toBe('muted');
    expect(AGENT_FLOW_TOKENS.accentToken).toBe('accent');
  });
});

describe('AgentFlowView render', () => {
  it('exposes data-block="agent-flow" + transitions through phases on mount', async () => {
    const { container, unmount } = render(
      <AgentFlowView
        props={{
          nodes: [
            { id: 'a', label: 'A', type: 'agent', position: { x: 0, y: 0 } },
            { id: 'b', label: 'B', type: 'tool', position: { x: 0, y: 0 } },
          ],
          edges: [{ id: 'e', source: 'a', target: 'b' }],
          interactive: true,
        }}
      />,
    );
    const root = container.querySelector('[data-block="agent-flow"]');
    expect(root).not.toBeNull();
    await waitFor(() => {
      expect(root?.getAttribute('data-phase')).toBe('laidout');
    });
    unmount();
  });

  it('renders status indicator with role="status"', () => {
    const { container, unmount } = render(
      <AgentFlowView
        props={{ nodes: [], edges: [], interactive: true }}
      />,
    );
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    unmount();
  });

  it('renders error panel with role="alert" when graph is cyclic', async () => {
    const { container, unmount } = render(
      <AgentFlowView
        props={{
          nodes: [
            { id: 'a', label: 'A', type: 'agent', position: { x: 0, y: 0 } },
            { id: 'b', label: 'B', type: 'tool', position: { x: 0, y: 0 } },
          ],
          edges: [
            { id: 'e1', source: 'a', target: 'b' },
            { id: 'e2', source: 'b', target: 'a' },
          ],
          interactive: true,
        }}
      />,
    );
    await waitFor(() => {
      const root = container.querySelector('[data-block="agent-flow"]');
      expect(root?.getAttribute('data-phase')).toBe('errored');
    });
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toMatch(/cycle/);
    unmount();
  });

  it('reflects interactive=false via data-interactive attribute on canvas', async () => {
    const { container, unmount } = render(
      <AgentFlowView
        props={{
          nodes: [
            { id: 'a', label: 'A', type: 'agent', position: { x: 50, y: 0 } },
          ],
          edges: [],
          interactive: false,
        }}
      />,
    );
    await waitFor(() => {
      const root = container.querySelector('[data-block="agent-flow"]');
      expect(root?.getAttribute('data-phase')).toBe('laidout');
    });
    const canvas = container.querySelector('.skb-agent-flow-canvas');
    expect(canvas?.getAttribute('data-interactive')).toBe('false');
    unmount();
  });

  it('cleans up bridge on unmount (smoke — does not crash, no console errors)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(
      <AgentFlowView
        props={{
          nodes: [
            { id: 'a', label: 'A', type: 'agent', position: { x: 50, y: 50 } },
          ],
          edges: [],
          interactive: true,
        }}
      />,
    );
    unmount();
    // microtask flush — signal abort + bridge dispose are synchronous, but
    // any leaked async work would surface here
    await Promise.resolve();
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
