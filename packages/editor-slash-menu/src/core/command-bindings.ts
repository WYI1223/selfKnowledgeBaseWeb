import { editBlockInputSchema } from '@skb/editor-commands';
import {
  defaultSlashMenuConfig,
  type SlashMenuConfig,
  type SlashMenuItem,
} from './slash-menu-config';

export function findItem(
  config: SlashMenuConfig,
  itemId: string,
): SlashMenuItem | undefined {
  return config.items.find((item) => item.id === itemId);
}

export function listCommands(config: SlashMenuConfig): readonly string[] {
  return config.items.map((item) => item.command);
}

export function buildEditBlockInput(
  pageSlug: string,
  blockId: string,
  draft: { props?: Record<string, unknown>; content?: string },
): ReturnType<typeof editBlockInputSchema.parse> {
  return editBlockInputSchema.parse({ pageSlug, blockId, ...draft });
}

export const defaultCommandBindings: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(defaultSlashMenuConfig.items.map((item) => [item.id, item.command])),
  );
