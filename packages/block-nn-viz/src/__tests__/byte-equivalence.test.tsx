import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { LayersModel } from '@tensorflow/tfjs';
import { NnVizView } from '../ui-default/NnViz';
import { computeTopology } from '../ui-default/topology';
import type { LoadLayersModelFn } from '../ui-default/tfjs-bridge';

/**
 * Byte-equivalence regression for ADR-0006 #5 (algorithm replication single
 * source). NnViz.tsx (React/NodeView path) and NnViz.astro (SSR path) MUST
 * both call `computeTopology(...)` and emit identical SVG geometry +
 * aria-label + edge stroke-width.
 *
 * Sister-pattern: `block-pdf/__tests__/byte-equivalence.test.tsx` for the
 * `renderPdf` authority. Two-tier verification strategy (Astro `.astro` files
 * cannot be invoked inside vitest without running the Astro compiler, so we
 * mix runtime + AST checks):
 *
 * 1. **Runtime SSR** of `NnVizView` via `react-dom/server.renderToStaticMarkup`.
 *    Asserts the React path renders exactly the descriptor produced by
 *    `computeTopology` — `aria-label`, every edge's `stroke-width`, every
 *    neuron's `cx/cy/r`, every column's label `<text>` content.
 * 2. **Static analysis** of `NnViz.astro` source: must `import { computeTopology }
 *    from './topology'`, must invoke it with `{ layers, showWeights }`, must emit
 *    `<line>` with `stroke-width={e.strokeWidth}` + `aria-label={descriptor.ariaLabel}`,
 *    and must NOT inline SVG_WIDTH / Math.min / column-step / aria-label phrasing.
 *    This is the structural equivalence guarantee the codex 5.5 R2 review asked for.
 *
 * What this does NOT verify (Wave 2 documented gap, mirrors block-pdf):
 *   - The compiled Astro output is byte-equal to the React SSR output. Astro
 *     adds its own scoped-style attributes / hydration directives; that
 *     comparison would require a full Astro toolchain in vitest. Wave 3
 *     mdx-doctor PR will run an mdx-bridge round-trip fixture for `<NnViz>` that
 *     exercises this end-to-end via the apps/site build.
 */

const NN_VIZ_TSX_PATH = resolve('src/ui-default/NnViz.tsx');
const NN_VIZ_ASTRO_PATH = resolve('src/ui-default/NnViz.astro');

function makeFakeModel(): LayersModel {
  return { layers: [], dispose() {} } as unknown as LayersModel;
}

function makeMockLoad(): LoadLayersModelFn {
  return () => Promise.resolve(makeFakeModel());
}

describe('NnViz.tsx + NnViz.astro byte-equivalence (ADR-0006 #5)', () => {
  it('NnVizView SSR markup matches computeTopology descriptor verbatim', () => {
    const layers = [
      { name: 'in', units: 4, activation: 'relu' as const },
      { name: 'out', units: 2, activation: 'softmax' as const },
    ];
    const props = { modelUrl: 'm', layers, showWeights: false };
    const descriptor = computeTopology({ layers, showWeights: props.showWeights });
    const html = renderToStaticMarkup(
      <NnVizView props={props} loadLayersModel={makeMockLoad()} />,
    );

    // SVG container: width / height / aria-label come straight from descriptor.
    expect(html).toContain(`viewBox="0 0 ${String(descriptor.width)} ${String(descriptor.height)}"`);
    expect(html).toContain(`aria-label="${descriptor.ariaLabel}"`);
    // Every edge carries descriptor-level stroke-width (the showWeights wire).
    for (const edge of descriptor.edges) {
      expect(html).toContain(`stroke-width="${String(edge.strokeWidth)}"`);
    }
    // Every column's label text from descriptor appears verbatim.
    for (const col of descriptor.columns) {
      expect(html).toContain(`>${col.label}<`);
    }
    // No inline aria-label phrase fragments — must come via descriptor.
    expect(html).not.toContain('with 2 layer"'); // unpluralized = drift
  });

  it('NnVizView with showWeights=true propagates strokeWidth + aria suffix from descriptor', () => {
    const layers = [
      { name: 'a', units: 2, activation: 'relu' as const },
      { name: 'b', units: 2, activation: 'relu' as const },
    ];
    const props = { modelUrl: 'm', layers, showWeights: true };
    const descriptor = computeTopology({ layers, showWeights: true });
    const html = renderToStaticMarkup(
      <NnVizView props={props} loadLayersModel={makeMockLoad()} />,
    );

    expect(descriptor.ariaLabel).toMatch(/\(weights shown\)$/);
    expect(html).toContain(`aria-label="${descriptor.ariaLabel}"`);
    expect(html).toContain(`stroke-width="${String(descriptor.edgeStrokeWidth)}"`);
    // Heavier than default — locks the showWeights wire all the way through.
    expect(descriptor.edgeStrokeWidth).toBeGreaterThan(0.5);
  });

  it('NnViz.astro source imports computeTopology authority + uses descriptor bindings', () => {
    const astroSource = readFileSync(NN_VIZ_ASTRO_PATH, 'utf8');

    // Authority import is mandatory — no inline layout construction.
    expect(astroSource).toMatch(
      /import\s+\{\s*computeTopology\s*\}\s+from\s+['"]\.\/topology['"]/,
    );
    expect(astroSource).toMatch(/computeTopology\s*\(/);
    // Must pass showWeights through (R3-1 wire) — either positional with a
    // wrapper object, or as a named field. Lock the named-field form so future
    // edits cannot drop showWeights silently.
    expect(astroSource).toMatch(/computeTopology\s*\(\s*\{[^}]*\bshowWeights\b/);

    // SVG attributes must come from the descriptor — never inline
    expect(astroSource).toMatch(/aria-label=\{?descriptor\.ariaLabel\}?/);
    expect(astroSource).toMatch(/viewBox=\{?`0 0 \$\{descriptor\.width\}/);
    // Edge stroke-width is descriptor-driven (the R3-1 weights wire).
    expect(astroSource).toMatch(/stroke-width=\{?e\.strokeWidth\}?/);

    // Drift sentinels — must NOT inline the layout primitives that
    // `computeTopology` is meant to own.
    expect(astroSource).not.toMatch(/SVG_WIDTH\s*=\s*\d/);
    expect(astroSource).not.toMatch(/Math\.min\s*\(\s*[a-z]+\.units/i);
    expect(astroSource).not.toMatch(
      /aria-label=\{?`Neural network topology with \$/,
    );
    // Empty-topology aria-label phrasing must not be inlined either (R2 hit).
    expect(astroSource).not.toContain('Empty neural network topology');
  });

  it('NnViz.tsx source imports computeTopology authority + uses descriptor bindings (sister sentinel)', () => {
    const tsxSource = readFileSync(NN_VIZ_TSX_PATH, 'utf8');

    expect(tsxSource).toMatch(
      /import\s+\{\s*computeTopology[\s\S]*?\}\s+from\s+['"]\.\/topology['"]/,
    );
    expect(tsxSource).toMatch(/computeTopology\s*\(/);
    expect(tsxSource).toMatch(/computeTopology\s*\(\s*\{[^}]*\bshowWeights\b/);

    // descriptor.* bindings present in the canvas renderer.
    expect(tsxSource).toMatch(/descriptor\.ariaLabel/);
    expect(tsxSource).toMatch(/descriptor\.width/);
    expect(tsxSource).toMatch(/strokeWidth=\{?e\.strokeWidth\}?/);

    // Drift sentinels — must NOT inline SVG sizing or aria-label phrasing.
    expect(tsxSource).not.toMatch(/const SVG_WIDTH\s*=\s*\d/);
    expect(tsxSource).not.toMatch(/const SVG_HEIGHT\s*=\s*\d/);
    expect(tsxSource).not.toMatch(/Math\.min\s*\(\s*layer\.units/);
    expect(tsxSource).not.toMatch(
      /aria-label=\{?`Neural network topology with \$/,
    );
    expect(tsxSource).not.toContain('"Empty neural network topology"');
  });

  it('both source files match each other on the showWeights wire (paired drift sentinel)', () => {
    // If one file passes showWeights and the other doesn't, descriptor diverges
    // silently. This pair-check is the dedicated alarm bell for R3-1.
    const tsx = readFileSync(NN_VIZ_TSX_PATH, 'utf8');
    const astro = readFileSync(NN_VIZ_ASTRO_PATH, 'utf8');
    const tsxHasShowWeights = /computeTopology\s*\(\s*\{[^}]*\bshowWeights\b/.test(tsx);
    const astroHasShowWeights = /computeTopology\s*\(\s*\{[^}]*\bshowWeights\b/.test(astro);
    expect(tsxHasShowWeights).toBe(true);
    expect(astroHasShowWeights).toBe(true);
  });
});
