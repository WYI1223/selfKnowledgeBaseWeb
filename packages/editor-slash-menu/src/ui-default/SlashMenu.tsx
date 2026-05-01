import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { FloatingMenu } from '@tiptap/react';
import {
  defaultSlashMenuConfig,
  type SlashMenuConfig,
  type SlashMenuItem,
} from '../core/slash-menu-config';
import { SLASH_MENU_ICONS } from './icons';
import { runDefaultSlashCommand, isDefaultCommandActive } from './dispatch';
import './slash-menu.css';

type SlashQuery = {
  readonly text: string;
  readonly from: number;
  readonly to: number;
} | null;

export interface EditorSlashMenuProps {
  readonly editor: Editor | null;
  readonly config?: SlashMenuConfig;
}

function resolveSlashQuery(editor: Editor): SlashQuery {
  const { selection } = editor.state;
  if (!selection.empty) return null;

  const $from = selection.$from;
  const before = $from.parent.textBetween(0, $from.parentOffset, '\n', '\n');
  const match = /(?:^|\s)\/(?<query>[^\s]*)$/.exec(before);
  if (!match) return null;

  const query = match.groups?.query ?? '';

  const slashIndex = before.lastIndexOf('/');
  if (slashIndex < 0) return null;

  const from = $from.start() + slashIndex;
  const to = $from.start() + $from.parentOffset;
  return { text: query.toLowerCase(), from, to };
}

export function EditorSlashMenu({
  editor,
  config = defaultSlashMenuConfig,
}: EditorSlashMenuProps): JSX.Element | null {
  const [slashQuery, setSlashQuery] = useState<SlashQuery>(null);
  const [selected, setSelected] = useState(0);

  const filteredItems = useMemo(() => {
    if (!slashQuery) return [];
    return config.items.filter((item) =>
      item.trigger.toLowerCase().startsWith(slashQuery.text.toLowerCase()),
    );
  }, [config.items, slashQuery]);

  const execute = useCallback(
    (item: SlashMenuItem): void => {
      if (!editor || !slashQuery) return;
      const chain = editor.chain().focus();
      chain.deleteRange({ from: slashQuery.from, to: slashQuery.to });
      runDefaultSlashCommand(item.command, chain);
      setSlashQuery(null);
    },
    [editor, slashQuery],
  );

  const onItemActivate = useCallback(
    (index: number, item: SlashMenuItem): void => {
      setSelected(index);
      execute(item);
    },
    [execute],
  );

  const updateSlashQuery = useCallback(() => {
    if (!editor) {
      setSlashQuery(null);
      return;
    }
    setSlashQuery(resolveSlashQuery(editor));
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    updateSlashQuery();

    const onDocumentChange = () => updateSlashQuery();
    const view = editor.view.dom;

    editor.on('selectionUpdate', onDocumentChange);
    editor.on('update', onDocumentChange);

    const onKeyDown = (event: KeyboardEvent): void => {
      if (!slashQuery || filteredItems.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelected((i) => (i + 1) % filteredItems.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected(
          (i) => (i - 1 + filteredItems.length) % filteredItems.length,
        );
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedItem = filteredItems[selected];
        if (!selectedItem) return;
        execute(selectedItem);
        return;
      }
      if (event.key === 'Escape') {
        setSlashQuery(null);
      }
    };

    view.addEventListener('keydown', onKeyDown);

    return () => {
      editor.off('selectionUpdate', onDocumentChange);
      editor.off('update', onDocumentChange);
      view.removeEventListener('keydown', onKeyDown);
    };
  }, [editor, filteredItems, slashQuery, selected, updateSlashQuery, execute]);

  useEffect(() => {
    setSelected(0);
  }, [filteredItems]);

  if (!editor || !slashQuery || filteredItems.length === 0) {
    return null;
  }

  return (
    <FloatingMenu
      editor={editor}
      className='skb-editor-slash-menu'
      shouldShow={() => Boolean(slashQuery)}
    >
      <ul className='skb-editor-slash-menu__list' role='menu' aria-label='Slash menu'>
        {filteredItems.map((item, index) => {
          const isActive = isDefaultCommandActive(editor, item.command);
          const isSelected = index === selected;
              const Icon = item.icon ? SLASH_MENU_ICONS[item.icon] : undefined;

              return (
                <li key={item.id} role='none'>
              <button
                role='menuitem'
                type='button'
                className={`skb-editor-slash-menu__button ${isSelected ? 'is-selected' : ''}`}
                aria-label={item.label}
                data-active={isActive ? 'true' : 'false'}
                onMouseEnter={() => setSelected(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onItemActivate(index, item);
                }}
              >
                {Icon ? <Icon /> : <span>{item.label[0]}</span>}
                <span className='skb-editor-slash-menu__label'>{item.label}</span>
                <span className='skb-editor-slash-menu__trigger'>{item.trigger}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </FloatingMenu>
  );
}
