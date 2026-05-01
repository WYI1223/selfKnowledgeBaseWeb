import type { ChainedCommands, Editor } from '@tiptap/core';

interface ProseChainedCommands extends ChainedCommands {
  focus: () => ProseChainedCommands;
  run: () => boolean;
  toggleTaskList: () => ProseChainedCommands;
  toggleBulletList: () => ProseChainedCommands;
  toggleOrderedList: () => ProseChainedCommands;
  toggleHeading: (attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 }) => ProseChainedCommands;
  setCodeBlock: () => ProseChainedCommands;
  insertContent: (value: unknown) => ProseChainedCommands;
  deleteRange: (range: { from: number; to: number }) => ProseChainedCommands;
}

function safeInvoke<T extends readonly unknown[]>(
  method: ((...args: T) => ProseChainedCommands) | undefined,
  ...args: T
): boolean {
  if (typeof method !== 'function') return false;
  const next = method(...args);
  if (!next || typeof next.run !== 'function') return false;
  return next.run();
}

export function runDefaultSlashCommand(
  name: string,
  chain: ChainedCommands,
): boolean {
  const focused = (chain as ProseChainedCommands).focus();
  switch (name) {
    case 'toggleHeading1':
      return safeInvoke(focused.toggleHeading, { level: 1 });
    case 'toggleHeading2':
      return safeInvoke(focused.toggleHeading, { level: 2 });
    case 'toggleHeading3':
      return safeInvoke(focused.toggleHeading, { level: 3 });
    case 'toggleBulletList':
      return safeInvoke(focused.toggleBulletList);
    case 'toggleOrderedList':
      return safeInvoke(focused.toggleOrderedList);
    case 'toggleTaskList':
      return safeInvoke(focused.toggleTaskList);
    case 'insertCodeBlock':
      return safeInvoke(focused.setCodeBlock);
    case 'insertCallout':
      return safeInvoke(focused.insertContent, {
        type: 'callout',
        content: [],
      });
    case 'insertMathBlock':
      return safeInvoke(focused.insertContent, {
        type: 'math',
        content: [],
      });
    case 'insertImage':
      return safeInvoke(focused.insertContent, {
        type: 'image',
        attrs: { src: '' },
      });
    default:
      return false;
  }
}

export function isDefaultCommandActive(
  editor: Editor,
  command: string,
): boolean {
  switch (command) {
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
    case 'toggleTaskList':
      return editor.isActive('taskList');
    case 'insertCodeBlock':
      return editor.isActive('codeBlock');
    case 'insertCallout':
      return editor.isActive('callout');
    case 'insertMathBlock':
      return editor.isActive('math');
    case 'insertImage':
      return editor.isActive('image');
    default:
      return false;
  }
}
