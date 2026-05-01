import { describe, expect, it } from 'vitest';
import {
  AgentFlowEditorView,
  AgentFlowRenderView,
} from '@skb/block-agent-flow/ui-default';
import { CalloutEditorView } from '@skb/block-callout/ui-default';
import { CodeEditorView } from '@skb/block-code/ui-default';
import { ImageEditorView } from '@skb/block-image/ui-default';
import { JupyterEditorView, JupyterRenderView } from '@skb/block-jupyter/ui-default';
import { MathEditorView, MathRenderView } from '@skb/block-math/ui-default';
import { NnVizEditorView, NnVizRenderView } from '@skb/block-nn-viz/ui-default';
import { PdfEditorView, PdfRenderView } from '@skb/block-pdf/ui-default';
import { componentsMap } from '../components';

describe('componentsMap', () => {
  // C3 R-during-EXECUTE update: componentsMap values are now MDX-prop
  // adapter wrappers (5 light blocks) or heavy-block placeholders (3
  // viz blocks), NOT the raw RenderView identities. The C1 referential-
  // identity assertion (`componentsMap.Callout === CalloutRenderView`)
  // no longer applies because the adapter wraps the RenderView for
  // BlockViewProps shape translation. Reference RenderView imports
  // remain in this test file to document the wrapping relationship +
  // catch import-time regressions if a block-* package renames its
  // RenderView export.
  it('exposes a wrapper component (function) for every MDX block key', () => {
    for (const key of Object.keys(componentsMap)) {
      expect(typeof (componentsMap as Record<string, unknown>)[key]).toBe('function');
    }
  });

  it('does not expose distinct EditorView components to static MDX rendering', () => {
    // The 5 light-block adapters wrap RenderView (NOT EditorView) per
    // C3 components.ts implementation. EditorView identities are NOT
    // referenced anywhere in components.ts (verified by absence of any
    // `*EditorView` import in the source).
    expect(componentsMap.Callout).not.toBe(CalloutEditorView);
    expect(componentsMap.Code).not.toBe(CodeEditorView);
    expect(componentsMap.Image).not.toBe(ImageEditorView);
  });

  it('documents block packages where EditorView and RenderView are aliases', () => {
    expect(MathEditorView).toBe(MathRenderView);
    expect(PdfEditorView).toBe(PdfRenderView);
    expect(JupyterEditorView).toBe(JupyterRenderView);
    expect(NnVizEditorView).toBe(NnVizRenderView);
    expect(AgentFlowEditorView).toBe(AgentFlowRenderView);
  });

  it('contains exactly the 8 canonical PascalCase component names', () => {
    expect(Object.keys(componentsMap).sort()).toEqual([
      'AgentFlow',
      'Callout',
      'Code',
      'Image',
      'Jupyter',
      'Math',
      'NnViz',
      'Pdf',
    ]);
  });
});
