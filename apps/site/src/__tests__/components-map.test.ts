import { describe, expect, it } from 'vitest';
import {
  AgentFlowEditorView,
  AgentFlowRenderView,
} from '@skb/block-agent-flow/ui-default';
import { CalloutEditorView, CalloutRenderView } from '@skb/block-callout/ui-default';
import { CodeEditorView, CodeRenderView } from '@skb/block-code/ui-default';
import { ImageEditorView, ImageRenderView } from '@skb/block-image/ui-default';
import { JupyterEditorView, JupyterRenderView } from '@skb/block-jupyter/ui-default';
import { MathEditorView, MathRenderView } from '@skb/block-math/ui-default';
import { NnVizEditorView, NnVizRenderView } from '@skb/block-nn-viz/ui-default';
import { PdfEditorView, PdfRenderView } from '@skb/block-pdf/ui-default';
import { componentsMap } from '../components';

describe('componentsMap', () => {
  it('maps every MDX component block key to its RenderView', () => {
    expect(componentsMap.Callout).toBe(CalloutRenderView);
    expect(componentsMap.Code).toBe(CodeRenderView);
    expect(componentsMap.Image).toBe(ImageRenderView);
    expect(componentsMap.Math).toBe(MathRenderView);
    expect(componentsMap.Pdf).toBe(PdfRenderView);
    expect(componentsMap.Jupyter).toBe(JupyterRenderView);
    expect(componentsMap.NnViz).toBe(NnVizRenderView);
    expect(componentsMap.AgentFlow).toBe(AgentFlowRenderView);
  });

  it('does not expose distinct EditorView components to static MDX rendering', () => {
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
