import { editBlockInputSchema } from '@skb/editor-commands';
import { defaultToolbarConfig, type ToolbarButton, type ToolbarConfig } from './toolbar-config';

export function findButton(
  config: ToolbarConfig,
  buttonId: string,
): ToolbarButton | undefined {
  return config.buttons.find((b) => b.id === buttonId);
}

export function listCommands(config: ToolbarConfig): readonly string[] {
  return config.buttons.map((b) => b.command);
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
    Object.fromEntries(defaultToolbarConfig.buttons.map((b) => [b.id, b.command])),
  );
