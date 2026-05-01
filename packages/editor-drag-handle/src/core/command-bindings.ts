import { commandSchemas, editBlockInputSchema } from '@skb/editor-commands';
import {
  defaultDragHandleConfig,
  type DragHandleAction,
  type DragHandleConfig,
} from './drag-handle-config';

export function findAction(
  config: DragHandleConfig,
  actionId: string,
): DragHandleAction | undefined {
  return config.actions.find((action) => action.id === actionId);
}

export function listCommands(config: DragHandleConfig): readonly string[] {
  return config.actions.map((action) => action.command);
}

export function buildMoveBlockInput(
  pageSlug: string,
  blockId: string,
  newPosition: number,
): ReturnType<typeof commandSchemas.move_block.parse> {
  return commandSchemas.move_block.parse({
    type: 'move_block',
    pageSlug,
    blockId,
    newPosition,
  });
}

export function buildEditBlockInput(
  pageSlug: string,
  blockId: string,
  draft: { props?: Record<string, unknown>; content?: string },
): ReturnType<typeof editBlockInputSchema.parse> {
  return editBlockInputSchema.parse({ pageSlug, blockId, ...draft });
}

export const defaultCommandBindings: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(defaultDragHandleConfig.actions.map((action) => [action.id, action.command])),
);
