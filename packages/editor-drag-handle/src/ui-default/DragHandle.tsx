import { useCallback, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react';
import {
  defaultDragHandleConfig,
  type DragHandleAction,
  type DragHandleConfig,
} from '../core/drag-handle-config';
import { DRAG_HANDLE_ICONS } from './icons';
import { runDefaultDragHandleCommand } from './dispatch';
import './drag-handle.css';

export interface EditorDragHandleProps {
  readonly editor: Editor | null;
  readonly config?: DragHandleConfig;
  readonly visible?: boolean;
}

export function EditorDragHandle({
  editor,
  config = defaultDragHandleConfig,
  visible = true,
}: EditorDragHandleProps): ReactNode {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!editor || !visible) return null;

  const handleId = `${editor.state.selection.from}-${editor.state.selection.to}`;
  const HandleIcon = DRAG_HANDLE_ICONS['drag-handle'];

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const runAction = useCallback(
    (action: DragHandleAction): boolean => {
      const didRun = runDefaultDragHandleCommand(action.command, editor.chain());
      if (didRun) setMenuOpen(false);
      return didRun;
    },
    [editor],
  );

  const onDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, actionId: string) => {
      event.preventDefault();
      event.dataTransfer?.setData('application/x-skb-drag-handle', actionId);
      event.dataTransfer?.setData(
        'text/plain',
        `${editor.state.selection.from}-${editor.state.selection.to}`,
      );
    },
    [editor],
  );

  return (
    <BubbleMenu editor={editor} className="skb-editor-drag-handle">
      <div role="toolbar" aria-label="Block drag handle" className="skb-editor-drag-handle__shell">
        <button
          type="button"
          className="skb-editor-drag-handle__handle"
          aria-label="Block actions"
          aria-expanded={menuOpen}
          aria-controls={`skb-editor-drag-handle-menu-${handleId}`}
          draggable
          onClick={toggleMenu}
          onDragStart={(event) => onDragStart(event, config.actions[0]?.id ?? 'drag-handle')}
        >
          {HandleIcon ? <HandleIcon /> : null}
        </button>
        {menuOpen && (
          <div
            id={`skb-editor-drag-handle-menu-${handleId}`}
            role="menu"
            className="skb-editor-drag-handle__menu"
          >
            {config.actions.map((action) => (
              <DragHandleActionButton
                key={action.id}
                action={action}
                onRun={() => runAction(action)}
              />
            ))}
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}

interface DragHandleActionButtonProps {
  readonly action: DragHandleAction;
  readonly onRun: () => boolean;
}

function DragHandleActionButton({ action, onRun }: DragHandleActionButtonProps): ReactNode {
  const Icon = DRAG_HANDLE_ICONS[action.command] ?? DRAG_HANDLE_ICONS[action.id];
  const className =
    'skb-editor-drag-handle__action' +
    (action.destructive ? ' skb-editor-drag-handle__action--destructive' : '');
  const ariaLabel = action.shortcut ? `${action.label} (${action.shortcut})` : action.label;

  return (
    <button
      type="button"
      role="menuitem"
      className={className}
      aria-label={ariaLabel}
      onClick={onRun}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {Icon ? <Icon /> : <span>{action.label[0]}</span>}
      <span className="skb-editor-drag-handle__action-label">{action.label}</span>
      {action.shortcut ? (
        <span className="skb-editor-drag-handle__action-kbd">{action.shortcut}</span>
      ) : null}
    </button>
  );
}
