import { z } from 'zod';

export const slashMenuItemSchema = z
  .object({
    id: z.string(),
    trigger: z.string(),
    label: z.string(),
    category: z.enum(['heading', 'list', 'block', 'media']),
    command: z.string(),
    icon: z.string().optional(),
  })
  .strict();

export const slashMenuConfigSchema = z
  .object({
    items: z.array(slashMenuItemSchema).min(1),
  })
  .strict();

export type SlashMenuItem = z.infer<typeof slashMenuItemSchema>;
export type SlashMenuConfig = z.infer<typeof slashMenuConfigSchema>;

export const defaultSlashMenuConfig: SlashMenuConfig = slashMenuConfigSchema.parse({
  items: [
    { id: 'h1', trigger: 'h1', label: 'Heading 1', category: 'heading', command: 'toggleHeading1', icon: 'h1' },
    { id: 'h2', trigger: 'h2', label: 'Heading 2', category: 'heading', command: 'toggleHeading2', icon: 'h2' },
    { id: 'h3', trigger: 'h3', label: 'Heading 3', category: 'heading', command: 'toggleHeading3', icon: 'h3' },
    { id: 'bulletList', trigger: 'bullet', label: 'Bulleted list', category: 'list', command: 'toggleBulletList', icon: 'bulletList' },
    { id: 'orderedList', trigger: 'ordered', label: 'Numbered list', category: 'list', command: 'toggleOrderedList', icon: 'orderedList' },
    { id: 'taskList', trigger: 'task', label: 'Task list', category: 'list', command: 'toggleTaskList', icon: 'taskList' },
    { id: 'callout', trigger: 'callout', label: 'Callout', category: 'block', command: 'insertCallout', icon: 'callout' },
    { id: 'code', trigger: 'code', label: 'Code block', category: 'block', command: 'insertCodeBlock', icon: 'code' },
    { id: 'math', trigger: 'math', label: 'Math block', category: 'block', command: 'insertMathBlock', icon: 'math' },
    { id: 'image', trigger: 'image', label: 'Image', category: 'media', command: 'insertImage', icon: 'image' },
  ],
});
