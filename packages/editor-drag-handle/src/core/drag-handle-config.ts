import { z } from 'zod';

export const dragHandleActionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    command: z.string().min(1),
    shortcut: z.string().optional(),
    destructive: z.boolean().default(false),
  })
  .strict();

export const dragHandleConfigSchema = z
  .object({
    actions: z.array(dragHandleActionSchema).min(1),
  })
  .strict();

export type DragHandleAction = z.infer<typeof dragHandleActionSchema>;
export type DragHandleConfig = z.infer<typeof dragHandleConfigSchema>;

export const defaultDragHandleConfig: DragHandleConfig = dragHandleConfigSchema.parse({
  actions: [
    { id: 'duplicate', command: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D' },
    {
      id: 'delete',
      command: 'delete',
      label: 'Delete',
      shortcut: 'Delete',
      destructive: true,
    },
    {
      id: 'moveUp',
      command: 'move-up',
      label: 'Move up',
      shortcut: 'Ctrl+Shift+Up',
    },
    {
      id: 'moveDown',
      command: 'move-down',
      label: 'Move down',
      shortcut: 'Ctrl+Shift+Down',
    },
    {
      id: 'selectBlock',
      command: 'select-block',
      label: 'Select block',
      shortcut: 'Ctrl+A',
    },
  ],
});
