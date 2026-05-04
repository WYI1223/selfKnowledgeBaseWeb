import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { heavyBoundaryDimensions as jupyterDims } from '@skb/block-jupyter/ui-default/heavy-boundary-dimensions';
import { heavyBoundaryDimensions as nnVizDims } from '@skb/block-nn-viz/ui-default/heavy-boundary-dimensions';
import { heavyBoundaryDimensions as agentFlowDims } from '@skb/block-agent-flow/ui-default/heavy-boundary-dimensions';

const componentsPath = resolve('src/components.ts');
const islandPaths = [
  resolve('src/islands/JupyterIsland.tsx'),
  resolve('src/islands/NnVizIsland.tsx'),
  resolve('src/islands/AgentFlowIsland.tsx'),
];

describe('AC#15 - apps/site dims sourced from heavy block packages (not inline)', () => {
  it('jupyter dims imported from @skb/block-jupyter/ui-default/heavy-boundary-dimensions', () => {
    expect(jupyterDims).toBeDefined();
    expect(typeof jupyterDims.width).toBe('number');
    expect(typeof jupyterDims.height).toBe('number');
    expect(jupyterDims.width).toBe(600);
    expect(jupyterDims.height).toBe(400);
  });

  it('nn-viz dims imported from @skb/block-nn-viz/ui-default/heavy-boundary-dimensions', () => {
    expect(nnVizDims).toBeDefined();
    expect(nnVizDims.width).toBe(500);
    expect(nnVizDims.height).toBe(400);
  });

  it('agent-flow dims imported from @skb/block-agent-flow/ui-default/heavy-boundary-dimensions', () => {
    expect(agentFlowDims).toBeDefined();
    expect(agentFlowDims.width).toBe(600);
    expect(agentFlowDims.height).toBe(400);
  });

  it('apps/site heavy island sources have no inline dims literals (regex check)', () => {
    const source = islandPaths.map((path) => readFileSync(path, 'utf-8')).join('\n');
    // Must NOT contain inline dims object literal patterns like `dims: { width: 600 ... }`
    // The HeavyBlockBoundary calls MUST reference the imported aliases (jupyterDims etc.)
    expect(source).toMatch(/dims=\{jupyterDims\}/);
    expect(source).toMatch(/dims=\{nnVizDims\}/);
    expect(source).toMatch(/dims=\{agentFlowDims\}/);
    // Defense-in-depth: no inline width:NUMBER inside dims object
    expect(source).not.toMatch(/dims:\s*\{\s*width:\s*\d+/);

    const componentsSource = readFileSync(componentsPath, 'utf-8');
    expect(componentsSource).not.toMatch(/HeavyBlockBoundary/);
  });
});
