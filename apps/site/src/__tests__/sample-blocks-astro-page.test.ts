import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PAGE_PATH = resolve(process.cwd(), 'src/pages/sample-blocks-astro.astro');

function readPage(): string {
  if (!existsSync(PAGE_PATH)) {
    return '';
  }
  return readFileSync(PAGE_PATH, 'utf-8');
}

describe('A7 sample-blocks-astro page', () => {
  it('imports Math.astro from @skb/block-math', () => {
    expect(readPage()).toContain("from '@skb/block-math/ui-default/Math.astro'");
  });

  it('imports Pdf.astro from @skb/block-pdf', () => {
    expect(readPage()).toContain("from '@skb/block-pdf/ui-default/Pdf.astro'");
  });

  it('imports Jupyter.astro from @skb/block-jupyter', () => {
    expect(readPage()).toContain("from '@skb/block-jupyter/ui-default/Jupyter.astro'");
  });

  it('imports NnViz.astro from @skb/block-nn-viz', () => {
    expect(readPage()).toContain(
      "await import('@skb/block-nn-viz/ui-default/NnViz.astro')",
    );
  });

  it('imports AgentFlow.astro from @skb/block-agent-flow', () => {
    expect(readPage()).toContain(
      "from '@skb/block-agent-flow/ui-default/AgentFlow.astro'",
    );
  });

  it('uses BaseLayout for site chrome', () => {
    const src = readPage();

    expect(src).toContain("from '@layouts/BaseLayout.astro'");
    expect(src).toContain('<BaseLayout title="Sample Blocks (Astro variants)">');
  });

  it('invokes inline Math with expression prop', () => {
    const src = readPage();

    expect(src).toContain('<Math expression="e^{i\\pi} + 1 = 0" />');
  });

  it('invokes display Math with String.raw LaTeX expression', () => {
    const src = readPage();

    expect(src).toContain(
      'expression={String.raw`\\int_{-\\infty}^{\\infty} e^{-x^{2}} \\, dx = \\sqrt{\\pi}`}',
    );
    expect(src).toContain('display={true}');
  });

  it('invokes Pdf with src and page props', () => {
    const src = readPage();

    expect(src).toMatch(/<Pdf\s+src="\/sample-assets\/whitepaper\.pdf"\s+page=\{1\}\s+\/>/);
  });

  it('invokes Jupyter with code and showLineNumbers props', () => {
    const src = readPage();

    expect(src).toContain('code={`import numpy as np');
    expect(src).toContain("print('hello')`}");
    expect(src).toContain('showLineNumbers={true}');
  });

  it('invokes NnViz with layers prop', () => {
    const src = readPage();

    expect(src).toContain('<NnViz layers={nnVizLayers} />');
  });

  it('invokes AgentFlow with nodes and edges props', () => {
    const src = readPage();

    expect(src).toContain(
      '<AgentFlow nodes={sampleAgentFlow.nodes} edges={sampleAgentFlow.edges} />',
    );
  });
});
