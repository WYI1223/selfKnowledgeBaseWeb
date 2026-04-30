import { z } from 'zod';

/**
 * Wave 2 中每种 component block 会向此文件追加自己的 props schema。
 * Wave 1 仅放 callout schema 作 smoke test，证明 Track B → Track C 类型链路通。
 */

export const calloutPropsSchema = z.object({
  type: z.enum(['info', 'warn', 'note']).default('info'),
  title: z.string().optional(),
});

export type CalloutProps = z.infer<typeof calloutPropsSchema>;
