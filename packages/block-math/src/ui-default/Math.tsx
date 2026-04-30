import type { BlockViewProps } from '@skb/block-foundation';
import { mathCore } from '../core/core-definition';
import { renderMath } from './render-math';

/**
 * MathView 接受 inferred props ({ expression, display }) — 与
 * `mathCore.propsSchema` 的 ZodInfer 等价。函数式组件而非
 * `ComponentType<BlockViewProps<typeof ...>>` 显式标注，避免 generic 变 invariant
 * 在 BlockRegistry.registerUI 处与 ZodTypeAny widening 冲突（exactOptionalPropertyTypes 触发）。
 *
 * KaTeX 渲染走 `./render-math.ts` 单一权威，与 Math.astro SSR path 同源
 * （ADR-0006 item #5 algorithm replication）。错误态由 KaTeX 渲染为
 * `.katex-error` 红色块（math.css 绑 `--color-error` token）。
 */
export function MathView({
  props,
}: BlockViewProps<typeof mathCore.propsSchema>): JSX.Element {
  const html = renderMath(props.expression, props.display);
  const Tag = props.display ? 'div' : 'span';
  return (
    <Tag
      data-block="math"
      data-display={props.display ? 'true' : 'false'}
      // KaTeX 输出受信（npm 包内部生成），无 user HTML 注入路径
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const MathEditorView = MathView;
export const MathRenderView = MathView;
