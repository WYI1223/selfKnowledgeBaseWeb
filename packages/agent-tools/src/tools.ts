import { z } from 'zod';
import {
  commandSchemas,
  editBlockInputSchema,
  slugSchema,
} from '@skb/editor-commands';

/**
 * Agent tool schemas (Phase 1: 仅类型定义；Phase 2b 在 apps/api 实现).
 * Spec §2.6 Phase 1 必建项 #2.
 */

export const toolSchemas = {
  list_pages: {
    description:
      'List all pages with their frontmatter (id, title, tags, date).',
    input: z.object({}).strict(),
  },
  read_page: {
    description: 'Read the full MDX content of a page.',
    input: z.object({ pageSlug: slugSchema }).strict(),
  },
  search: {
    description: 'Full-text search across pages (title, body, frontmatter).',
    input: z
      .object({
        query: z.string().min(1),
        limit: z.number().int().positive().default(10),
      })
      .strict(),
  },
  get_editor_state: {
    description:
      'Get current editor selection / unsaved changes / kernel session state.',
    input: z.object({}).strict(),
  },
  // Mutating tools wrap editor-commands one-to-one (7 commands ↔ 7 tools)
  create_page: {
    description: 'Create a new page.',
    input: commandSchemas.create_page.omit({ type: true }),
  },
  delete_page: {
    description: 'Delete a page.',
    input: commandSchemas.delete_page.omit({ type: true }),
  },
  insert_block: {
    description: 'Insert a block at position.',
    input: commandSchemas.insert_block.omit({ type: true }),
  },
  edit_block: {
    description: 'Edit a block in-place.',
    input: editBlockInputSchema,
  },
  delete_block: {
    description: 'Delete a block.',
    input: commandSchemas.delete_block.omit({ type: true }),
  },
  move_block: {
    description: 'Reorder a block.',
    input: commandSchemas.move_block.omit({ type: true }),
  },
  update_frontmatter: {
    description: 'Patch page frontmatter.',
    input: commandSchemas.update_frontmatter.omit({ type: true }),
  },
} as const;

export type ToolName = keyof typeof toolSchemas;

export type ToolInput<N extends ToolName> = z.infer<
  (typeof toolSchemas)[N]['input']
>;
