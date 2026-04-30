import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react';
import {
  defaultToolbarConfig,
  type ToolbarButton,
  type ToolbarConfig,
} from '../core/toolbar-config';
import { TOOLBAR_ICONS } from './icons';
import { runDefaultCommand, isDefaultCommandActive } from './dispatch';
import './toolbar.css';

export interface EditorToolbarProps {
  readonly editor: Editor | null;
  readonly config?: ToolbarConfig;
}

export function EditorToolbar({
  editor,
  config = defaultToolbarConfig,
}: EditorToolbarProps): ReactNode {
  if (!editor) return null;

  return (
    <BubbleMenu editor={editor} className="skb-editor-toolbar">
      <div role="toolbar" aria-label="Text formatting" className="skb-editor-toolbar__row">
        {config.buttons.map((b) => (
          <ToolbarButtonView key={b.id} button={b} editor={editor} />
        ))}
      </div>
    </BubbleMenu>
  );
}

interface ToolbarButtonViewProps {
  readonly button: ToolbarButton;
  readonly editor: Editor;
}

function ToolbarButtonView({ button, editor }: ToolbarButtonViewProps): ReactNode {
  const Icon = TOOLBAR_ICONS[button.icon];
  const isActive = isDefaultCommandActive(editor, button.command);
  const ariaLabel = button.shortcut
    ? `${button.label} (${button.shortcut})`
    : button.label;

  return (
    <button
      type="button"
      onClick={() => runDefaultCommand(button.command, editor.chain())}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      data-command={button.command}
      className="skb-editor-toolbar__button"
      data-active={isActive ? 'true' : 'false'}
    >
      {Icon ? <Icon /> : <span>{button.label[0]}</span>}
    </button>
  );
}
