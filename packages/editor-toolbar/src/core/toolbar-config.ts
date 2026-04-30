import { z } from 'zod';

export const toolbarButtonSchema = z
  .object({
    id: z.string().min(1),
    command: z.string().min(1),
    icon: z.string().min(1),
    label: z.string().min(1),
    shortcut: z.string().optional(),
  })
  .strict();

export const toolbarConfigSchema = z
  .object({
    buttons: z.array(toolbarButtonSchema).min(1),
  })
  .strict();

export type ToolbarButton = z.infer<typeof toolbarButtonSchema>;
export type ToolbarConfig = z.infer<typeof toolbarConfigSchema>;

export const defaultToolbarConfig: ToolbarConfig = toolbarConfigSchema.parse({
  buttons: [
    { id: 'bold', command: 'toggleBold', icon: 'bold', label: 'Bold', shortcut: 'Mod-b' },
    { id: 'italic', command: 'toggleItalic', icon: 'italic', label: 'Italic', shortcut: 'Mod-i' },
    { id: 'strike', command: 'toggleStrike', icon: 'strike', label: 'Strikethrough' },
    { id: 'h1', command: 'toggleHeading1', icon: 'h1', label: 'Heading 1' },
    { id: 'h2', command: 'toggleHeading2', icon: 'h2', label: 'Heading 2' },
    { id: 'h3', command: 'toggleHeading3', icon: 'h3', label: 'Heading 3' },
    { id: 'bulletList', command: 'toggleBulletList', icon: 'bullet-list', label: 'Bulleted list' },
    { id: 'orderedList', command: 'toggleOrderedList', icon: 'ordered-list', label: 'Numbered list' },
    { id: 'code', command: 'toggleCode', icon: 'code', label: 'Inline code' },
  ],
});
