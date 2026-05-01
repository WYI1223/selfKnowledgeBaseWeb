import type { ChainedCommands, Editor } from '@tiptap/core';

interface DragHandleChainedCommands {
  focus: () => DragHandleChainedCommands;
  run: () => boolean;
  duplicateBlock: () => DragHandleChainedCommands;
  deleteBlock: () => DragHandleChainedCommands;
  moveBlockUp: () => DragHandleChainedCommands;
  moveBlockDown: () => DragHandleChainedCommands;
  selectCurrentBlock: () => DragHandleChainedCommands;
}

export function runDefaultDragHandleCommand(
  name: string,
  chain: ChainedCommands,
): boolean {
  const focused = (chain as unknown as DragHandleChainedCommands).focus();
  switch (name) {
    case 'duplicate':
      return focused.duplicateBlock().run();
    case 'delete':
      return focused.deleteBlock().run();
    case 'move-up':
      return focused.moveBlockUp().run();
    case 'move-down':
      return focused.moveBlockDown().run();
    case 'select-block':
      return focused.selectCurrentBlock().run();
    default:
      return false;
  }
}

export function isDefaultCommandActive(editor: Editor, name: string): boolean {
  switch (name) {
    case 'duplicate':
    case 'delete':
    case 'move-up':
    case 'move-down':
    case 'select-block':
      return false;
    default:
      return false;
  }
}
