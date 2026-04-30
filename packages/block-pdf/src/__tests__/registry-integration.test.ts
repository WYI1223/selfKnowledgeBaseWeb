import { describe, expect, it } from 'vitest';
import { BlockRegistry, type BlockUIDefinition } from '@skb/block-foundation';
import { pdfCore } from '../core/core-definition';
import { pdfUiDefault } from '../ui-default/pdf.ui';

/**
 * pdfUiDefault 类型为 BlockUIDefinition<typeof pdfCore.propsSchema>
 * (defineUI 从 EditorView/RenderView 的 BlockViewProps<TSchema> 推 generic)。
 * BlockRegistry.registerUI 形参为 BlockUIDefinition<ZodTypeAny>，因 ComponentType
 * 在 props 上 contravariant + exactOptionalPropertyTypes，narrow → wide 的赋值
 * 不通过；registerUI 运行期仅按 coreName/uiId 查表，不再触碰 EditorView 的具体
 * props 形状。这里 cast 到 wide 类型是 type-system 工件，行为安全。
 *
 * Mirrors block-math/__tests__/registry-integration.test.ts pattern.
 */
const widePdfUI = pdfUiDefault as unknown as BlockUIDefinition;

describe('block-pdf registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(pdfCore);
    expect(reg.getCore('pdf')).toBe(pdfCore);
  });

  it('registerUI + getUI round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(pdfCore);
    reg.registerUI(widePdfUI);
    expect(reg.getUI('pdf')).toBe(pdfUiDefault);
    expect(reg.getUI('pdf', 'default')).toBe(pdfUiDefault);
  });

  it('default UI lookup returns first-registered (pdfUiDefault uiId="default")', () => {
    const reg = new BlockRegistry();
    reg.registerCore(pdfCore);
    reg.registerUI(widePdfUI);
    expect(pdfUiDefault.uiId).toBe('default');
    expect(reg.getUI('pdf')).toBe(pdfUiDefault);
  });

  it('registerUI before registerCore throws Unknown core', () => {
    const reg = new BlockRegistry();
    expect(() => reg.registerUI(widePdfUI)).toThrow(
      /Unknown core for UI registration: pdf/,
    );
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('not-pdf')).toBeUndefined();
  });
});
