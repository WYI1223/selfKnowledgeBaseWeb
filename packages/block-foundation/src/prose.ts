import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';

/**
 * Tiptap extensions providing all prose-level markdown behavior:
 * paragraph / heading / list / quote / code / link / 强调样式 / typography /
 * task-list / markdown input rules / markdown serialization.
 *
 * Spec §1.5: prose blocks are zero-self-written; this list is the contract.
 */
export const proseExtensions = [
  StarterKit,
  TaskList,
  TaskItem.configure({ nested: true }),
  Typography,
  Markdown,
] as const;
