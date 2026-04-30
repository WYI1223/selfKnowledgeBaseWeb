import { z } from 'zod';
import { frontmatterSchema } from '@skb/content-types';

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'slug must match [a-z0-9-]+');

const positionSchema = z.number().int().nonnegative();
const blockTypeSchema = z.string().min(1);
const blockIdSchema = z.string().min(1);

const editBlockBase = z
  .object({
    type: z.literal('edit_block'),
    pageSlug: slugSchema,
    blockId: blockIdSchema,
    props: z.record(z.string(), z.unknown()).optional(),
    content: z.string().optional(),
  })
  .strict();

export function editBlockHasChange(v: {
  props?: Record<string, unknown> | undefined;
  content?: string | undefined;
}): boolean {
  return v.props !== undefined || v.content !== undefined;
}

export const editBlockInputSchema = editBlockBase
  .omit({ type: true })
  .refine(editBlockHasChange, {
    message: 'edit_block requires at least one of props or content',
  });

export const commandSchemas = {
  create_page: z
    .object({
      type: z.literal('create_page'),
      pageSlug: slugSchema,
      frontmatter: frontmatterSchema.strict(),
    })
    .strict(),
  delete_page: z
    .object({
      type: z.literal('delete_page'),
      pageSlug: slugSchema,
    })
    .strict(),
  insert_block: z
    .object({
      type: z.literal('insert_block'),
      pageSlug: slugSchema,
      position: positionSchema,
      blockType: blockTypeSchema,
      props: z.record(z.string(), z.unknown()).default({}),
      content: z.string().default(''),
    })
    .strict(),
  edit_block: editBlockBase.refine(editBlockHasChange, {
    message: 'edit_block requires at least one of props or content',
  }),
  delete_block: z
    .object({
      type: z.literal('delete_block'),
      pageSlug: slugSchema,
      blockId: blockIdSchema,
    })
    .strict(),
  move_block: z
    .object({
      type: z.literal('move_block'),
      pageSlug: slugSchema,
      blockId: blockIdSchema,
      newPosition: positionSchema,
    })
    .strict(),
  update_frontmatter: z
    .object({
      type: z.literal('update_frontmatter'),
      pageSlug: slugSchema,
      patch: frontmatterSchema.strict().partial(),
    })
    .strict(),
} as const;

export type CommandType = keyof typeof commandSchemas;
export type Command = z.infer<(typeof commandSchemas)[CommandType]>;

export type ParseCommandResult =
  | { success: true; data: Command }
  | { success: false; error: z.ZodError };

export function parseCommand(input: unknown): ParseCommandResult {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('type' in input) ||
    typeof (input as Record<string, unknown>).type !== 'string'
  ) {
    return {
      success: false,
      error: new z.ZodError([
        { code: 'custom', message: 'missing type', path: [] },
      ]),
    };
  }
  const type = (input as Record<string, unknown>).type as string;
  const schema = (commandSchemas as Record<string, z.ZodType>)[type];
  if (!schema) {
    return {
      success: false,
      error: new z.ZodError([
        { code: 'custom', message: `unknown command: ${type}`, path: [] },
      ]),
    };
  }
  const r = schema.safeParse(input);
  if (r.success) return { success: true, data: r.data as Command };
  return { success: false, error: r.error };
}
