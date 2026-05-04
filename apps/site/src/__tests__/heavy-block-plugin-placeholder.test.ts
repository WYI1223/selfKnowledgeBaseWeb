import { createElement, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AgentFlowIsland from '../islands/AgentFlowIsland';
import JupyterIsland from '../islands/JupyterIsland';
import NnVizIsland from '../islands/NnVizIsland';

function renderIsland(element: ReactElement): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToString(element);
  const outer = host.querySelector<HTMLElement>('[role="status"]');
  if (!outer) {
    throw new Error('Expected placeholder status element');
  }
  return outer;
}

function expectPlaceholder(
  element: ReactElement,
  expected: {
    readonly kind: string;
    readonly label: string;
    readonly width: string;
    readonly minHeight: string;
  },
): void {
  const outer = renderIsland(element);

  expect(outer.dataset.block).toBe(expected.kind);
  expect(outer.getAttribute('aria-busy')).toBe('false');
  expect(outer.dataset.loaded).toBe('true');
  expect(outer.textContent).toContain('🔌');
  expect(outer.textContent).toContain(expected.label);
  expect(outer.style.width).toBe(expected.width);
  expect(outer.style.minHeight).toBe(expected.minHeight);
}

describe('heavy block plugin placeholders', () => {
  it('TC1 - JupyterIsland renders the plugin placeholder contract', () => {
    expectPlaceholder(createElement(JupyterIsland), {
      kind: 'jupyter',
      label: 'Jupyter · plugin runtime (Phase 2+)',
      width: '600px',
      minHeight: '400px',
    });
  });

  it('TC2 - NnVizIsland renders the plugin placeholder contract', () => {
    expectPlaceholder(createElement(NnVizIsland), {
      kind: 'nn-viz',
      label: 'NnViz · plugin runtime (Phase 2+)',
      width: '500px',
      minHeight: '400px',
    });
  });

  it('TC3 - AgentFlowIsland renders the plugin placeholder contract', () => {
    expectPlaceholder(createElement(AgentFlowIsland), {
      kind: 'agent-flow',
      label: 'AgentFlow · plugin runtime (Phase 2+)',
      width: '600px',
      minHeight: '400px',
    });
  });
});
