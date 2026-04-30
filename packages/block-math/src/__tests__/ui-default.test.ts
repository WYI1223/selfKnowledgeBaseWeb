import { describe, expect, it } from 'vitest';
import { mathCore } from '../core/core-definition';
import {
  mathUiDefault,
  MathEditorView,
  MathRenderView,
  renderMath,
} from '../ui-default';

/**
 * UI-default surface contract tests. Mirrors block-callout's ui-default.test.tsx
 * shape contract (sister-doc invariant per ADR-0006 item #6) but stays in `.ts`
 * because this package does not pull happy-dom / @testing-library/react —
 * MathView is a pure HTML-string emitter; React-DOM rendering is exercised
 * indirectly via ssr-render.test.ts (the underlying renderMath is the visual
 * authority). When apps/site or editor-shell adds DOM-assertion tests they
 * will live alongside in their own happy-dom-enabled vitest configs.
 */
describe('mathUiDefault registration shape', () => {
  it('exposes the BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(mathUiDefault.coreName).toBe(mathCore.name);
    expect(mathUiDefault.coreName).toBe('math');
    expect(mathUiDefault.uiId).toBe('default');
  });

  it('EditorView and RenderView identity matches Math.tsx exports', () => {
    expect(mathUiDefault.EditorView).toBe(MathEditorView);
    expect(mathUiDefault.RenderView).toBe(MathRenderView);
  });

  it('re-exports renderMath as the single authority callable from ./ui-default', () => {
    // structural identity check — barrel must re-export from render-math.ts so
    // consumers (Math.astro / future NodeView wrappers / sample-blocks) all
    // hit the same authority
    expect(typeof renderMath).toBe('function');
    const html = renderMath('x', false);
    expect(html).toMatch(/class="katex"/);
  });
});
