import type { ChainedCommands, Editor } from '@tiptap/core';

interface ProseChainedCommands {
  focus: () => ProseChainedCommands;
  run: () => boolean;
  toggleBold: () => ProseChainedCommands;
  toggleItalic: () => ProseChainedCommands;
  toggleStrike: () => ProseChainedCommands;
  toggleCode: () => ProseChainedCommands;
  toggleHeading: (attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 }) => ProseChainedCommands;
  toggleBulletList: () => ProseChainedCommands;
  toggleOrderedList: () => ProseChainedCommands;
}

export function runDefaultCommand(
  name: string,
  chain: ChainedCommands,
): boolean {
  const focused = (chain as unknown as ProseChainedCommands).focus();
  switch (name) {
    case 'toggleBold':
      return focused.toggleBold().run();
    case 'toggleItalic':
      return focused.toggleItalic().run();
    case 'toggleStrike':
      return focused.toggleStrike().run();
    case 'toggleCode':
      return focused.toggleCode().run();
    case 'toggleHeading1':
      return focused.toggleHeading({ level: 1 }).run();
    case 'toggleHeading2':
      return focused.toggleHeading({ level: 2 }).run();
    case 'toggleHeading3':
      return focused.toggleHeading({ level: 3 }).run();
    case 'toggleBulletList':
      return focused.toggleBulletList().run();
    case 'toggleOrderedList':
      return focused.toggleOrderedList().run();
    default:
      return false;
  }
}

export function isDefaultCommandActive(
  editor: Editor,
  command: string,
): boolean {
  switch (command) {
    case 'toggleBold':
      return editor.isActive('bold');
    case 'toggleItalic':
      return editor.isActive('italic');
    case 'toggleStrike':
      return editor.isActive('strike');
    case 'toggleCode':
      return editor.isActive('code');
    case 'toggleHeading1':
      return editor.isActive('heading', { level: 1 });
    case 'toggleHeading2':
      return editor.isActive('heading', { level: 2 });
    case 'toggleHeading3':
      return editor.isActive('heading', { level: 3 });
    case 'toggleBulletList':
      return editor.isActive('bulletList');
    case 'toggleOrderedList':
      return editor.isActive('orderedList');
    default:
      return false;
  }
}
