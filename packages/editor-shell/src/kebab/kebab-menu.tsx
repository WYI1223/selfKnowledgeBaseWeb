/**
 * @skb/editor-shell <KebabMenu> — floating menu rendered when the
 * per-block kebab button is open.
 *
 * Wave 6 cf-20e (2026-05-09) — 3 menu items per the cf-20e contract:
 * Delete / Duplicate / Change kind… (sub-menu). Click on each item
 * fires the corresponding KebabContext callback then closes the
 * menu via the `onClose` prop.
 *
 * Visual layout per cf-20e D2 (no React Portal; `position: absolute`
 * relative to the kebab button wrapper). The menu container has
 * `position: absolute; top: calc(100% + 4px); left: 0` so it
 * anchors below the button. `z-index: 10` lifts it above adjacent
 * blocks; the `.skb-grid .ProseMirror` editor surface has no
 * `overflow: hidden` so the menu is not clipped.
 *
 * Sub-menu (change-kind): renders inline (NOT a separate floating
 * layer) — when the user clicks "Change kind…", a sub-list expands
 * BELOW the item with the 8 kind options. Click on a kind option
 * fires `onChangeKind` then closes the menu. This keeps the
 * implementation simple (no hover-delay / sub-menu positioning
 * math); cf-22 may amend with a true cascading sub-menu if needed.
 */
import {
  createElement,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import type { BlockAffordanceKind, BlockKindOption } from '../registry-wire';

export interface KebabMenuProps {
  /** Stable block identifier (mirrors cf-20c-2 drag-handle pattern). */
  readonly blockId: string;
  /** The 8 BlockKind options for the change-kind sub-menu. */
  readonly kinds: readonly BlockKindOption[];
  /** Called when user picks Delete. */
  readonly onDelete: (blockId: string) => void;
  /** Called when user picks Duplicate. */
  readonly onDuplicate: (blockId: string) => void;
  /** Called when user picks Change kind… → <newKind>. */
  readonly onChangeKind: (blockId: string, newKind: BlockAffordanceKind) => void;
  /** Closes the menu (called after each action; also on Esc / click-outside). */
  readonly onClose: () => void;
}

function stopPropagation(event: ReactMouseEvent<HTMLElement>): void {
  // Prevent the click from bubbling up to the document-level
  // click-outside handler (which would close the menu before the
  // action callback fires).
  event.stopPropagation();
}

interface MenuItemProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly danger?: boolean;
  readonly ariaLabel?: string;
  readonly dataAttr?: string;
}

function MenuItem(props: MenuItemProps): ReactElement {
  const { label, onClick, danger, ariaLabel, dataAttr } = props;
  return createElement(
    'button',
    {
      type: 'button',
      className:
        'skb-kebab-menu__item' +
        (danger ? ' skb-kebab-menu__item--danger' : ''),
      'aria-label': ariaLabel ?? label,
      'data-skb-kebab-action': dataAttr,
      onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
        // Stop the document mousedown listener from racing the
        // action; consumers expect onClick → action → onClose, not
        // close-then-no-op.
        event.stopPropagation();
        onClick();
      },
    },
    label,
  );
}

export function KebabMenu(props: KebabMenuProps): ReactElement {
  const { blockId, kinds, onDelete, onDuplicate, onChangeKind, onClose } =
    props;
  const [changeKindOpen, setChangeKindOpen] = useState(false);

  const handleDelete = () => {
    onDelete(blockId);
    onClose();
  };

  const handleDuplicate = () => {
    onDuplicate(blockId);
    onClose();
  };

  const handleChangeKindClick = () => {
    // Open inline sub-menu rather than firing a top-level action.
    setChangeKindOpen((prev) => !prev);
  };

  const handleChangeKindPick = (newKind: BlockAffordanceKind) => {
    onChangeKind(blockId, newKind);
    onClose();
  };

  return (
    <div
      className="skb-kebab-menu"
      role="menu"
      aria-label="Block actions menu"
      data-skb-kebab-menu={blockId}
      onMouseDown={stopPropagation}
    >
      <MenuItem
        label="Delete"
        onClick={handleDelete}
        danger
        dataAttr="delete"
      />
      <MenuItem
        label="Duplicate"
        onClick={handleDuplicate}
        dataAttr="duplicate"
      />
      <MenuItem
        label="Change kind…"
        onClick={handleChangeKindClick}
        dataAttr="change-kind-toggle"
      />
      {changeKindOpen && (
        <div
          className="skb-kebab-menu__submenu"
          role="menu"
          data-skb-kebab-submenu="change-kind"
        >
          {kinds.map((option) => (
            <MenuItem
              key={option.kind}
              label={option.label}
              onClick={() => handleChangeKindPick(option.kind)}
              dataAttr={`change-kind-${option.kind}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
