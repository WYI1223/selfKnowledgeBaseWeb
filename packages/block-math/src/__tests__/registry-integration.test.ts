import { describe, expect, it } from 'vitest';
import { BlockRegistry, type BlockUIDefinition } from '@skb/block-foundation';
import { mathCore } from '../core/core-definition';
import { mathUiDefault } from '../ui-default/math.ui';

/**
 * mathUiDefault 类型为 BlockUIDefinition<typeof mathCore.propsSchema>
 * (defineUI 从 EditorView/RenderView 的 BlockViewProps<TSchema> 推 generic)。
 * BlockRegistry.registerUI 形参为 BlockUIDefinition<ZodTypeAny>，因 ComponentType
 * 在 props 上 contravariant + exactOptionalPropertyTypes，narrow → wide 的赋值
 * 不通过；registerUI 运行期仅按 coreName/uiId 查表，不再触碰 EditorView 的具体
 * props 形状。这里 cast 到 wide 类型是 type-system 工件，行为安全。
 *
 * 关键：cast 不是 disable type-checking — 仍校验到 BlockUIDefinition；
 * 仅 widening generic param 一处。Wave 3 类型 narrow 到 ZodObject 时（block-foundation
 * CONTRACT § Schema strictness 提到的 deferred 工作）此 cast 会自然消失。
 */
const wideMathUI = mathUiDefault as unknown as BlockUIDefinition;

describe('block-math registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(mathCore);
    expect(reg.getCore('math')).toBe(mathCore);
  });

  it('registerUI + getUI round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(mathCore);
    reg.registerUI(wideMathUI);
    expect(reg.getUI('math')).toBe(mathUiDefault);
    expect(reg.getUI('math', 'default')).toBe(mathUiDefault);
  });

  it('default UI lookup returns first-registered (mathUiDefault uiId="default")', () => {
    const reg = new BlockRegistry();
    reg.registerCore(mathCore);
    reg.registerUI(wideMathUI);
    expect(mathUiDefault.uiId).toBe('default');
    expect(reg.getUI('math')).toBe(mathUiDefault);
  });

  it('registerUI before registerCore throws Unknown core', () => {
    const reg = new BlockRegistry();
    expect(() => reg.registerUI(wideMathUI)).toThrow(
      /Unknown core for UI registration: math/,
    );
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('not-math')).toBeUndefined();
  });
});
