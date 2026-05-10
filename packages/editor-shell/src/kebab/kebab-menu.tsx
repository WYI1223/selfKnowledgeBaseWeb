/**
 * @skb/editor-shell <KebabMenu> — floating menu rendered when the
 * per-block kebab button is open.
 *
 * Wave 6 cf-20e (2026-05-09) — 3 menu items per the cf-20e contract:
 * Delete / Duplicate / Change kind… (sub-menu). Click on each item
 * fires the corresponding KebabContext callback then closes the
 * menu via the `onClose` prop.
 *
 * Wave 6 cf-22 (2026-05-09) — keyboard navigation per WCAG 2.1.1 +
 * 2.4.3 + 2.4.7 + cf-22 D8 (auto-focus first item on open). Per
 * cf-22 D5: focus return to kebab button is handled by the
 * KebabButton wrapper post-close. The menu owns:
 *   - Auto-focus first item on mount.
 *   - ArrowDown/ArrowUp: cycle focus through items.
 *   - ArrowRight on "Change kind…": expand sub-menu + focus first
 *     sub-item.
 *   - ArrowLeft from sub-item: collapse sub-menu + return focus to
 *     "Change kind…".
 *   - Enter activates focused item (default browser behavior on
 *     <button>; we just rely on it).
 *   - Esc closes (handled by KebabButton wrapper).
 *
 * Visual layout per cf-20e D2 (no React Portal; `position: absolute`
 * relative to the kebab button wrapper).
 */
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
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
  readonly onKeyDown?: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  readonly danger?: boolean;
  readonly ariaLabel?: string;
  readonly dataAttr?: string;
}

const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem(props, ref): ReactElement {
    const { label, onClick, onKeyDown, danger, ariaLabel, dataAttr } = props;
    return createElement(
      'button',
      {
        ref,
        type: 'button',
        role: 'menuitem',
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
        onKeyDown,
      },
      label,
    );
  },
);

export function KebabMenu(props: KebabMenuProps): ReactElement {
  const { blockId, kinds, onDelete, onDuplicate, onChangeKind, onClose } =
    props;
  const [changeKindOpen, setChangeKindOpen] = useState(false);
  // cf-22 — refs for programmatic focus management.
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const subItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const changeKindIndex = 2; // Index of "Change kind…" in the top-level menu.

  // cf-22 D8: auto-focus first item on mount. Defer via setTimeout(0)
  // to wait for React commit + browser paint (otherwise the focus
  // may race the menu's own mount cycle).
  useEffect(() => {
    const timer = setTimeout(() => {
      itemRefs.current[0]?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // cf-22 — when sub-menu opens, auto-focus its first item.
  useEffect(() => {
    if (!changeKindOpen) return;
    const timer = setTimeout(() => {
      subItemRefs.current[0]?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [changeKindOpen]);

  const handleDelete = useCallback(() => {
    onDelete(blockId);
    onClose();
  }, [blockId, onDelete, onClose]);

  const handleDuplicate = useCallback(() => {
    onDuplicate(blockId);
    onClose();
  }, [blockId, onDuplicate, onClose]);

  const handleChangeKindClick = useCallback(() => {
    setChangeKindOpen((prev) => !prev);
  }, []);

  const handleChangeKindPick = useCallback(
    (newKind: BlockAffordanceKind) => {
      onChangeKind(blockId, newKind);
      onClose();
    },
    [blockId, onChangeKind, onClose],
  );

  // cf-22 — top-level menu keyboard nav (ArrowDown/Up cycle; ArrowRight
  // expands sub-menu when on "Change kind…").
  const handleTopLevelKeyDown = useCallback(
    (currentIndex: number) =>
      (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const next = (currentIndex + 1) % itemRefs.current.length;
          itemRefs.current[next]?.focus();
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prev =
            (currentIndex - 1 + itemRefs.current.length) %
            itemRefs.current.length;
          itemRefs.current[prev]?.focus();
          return;
        }
        if (
          event.key === 'ArrowRight' &&
          currentIndex === changeKindIndex
        ) {
          // Expand the change-kind sub-menu (auto-focus first sub-
          // item via the dedicated useEffect above).
          event.preventDefault();
          if (!changeKindOpen) setChangeKindOpen(true);
          else subItemRefs.current[0]?.focus();
          return;
        }
      },
    [changeKindOpen],
  );

  // cf-22 — sub-menu keyboard nav (ArrowDown/Up cycle within sub;
  // ArrowLeft collapses + returns focus to parent "Change kind…").
  const handleSubMenuKeyDown = useCallback(
    (subIndex: number) =>
      (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const next = (subIndex + 1) % subItemRefs.current.length;
          subItemRefs.current[next]?.focus();
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prev =
            (subIndex - 1 + subItemRefs.current.length) %
            subItemRefs.current.length;
          subItemRefs.current[prev]?.focus();
          return;
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setChangeKindOpen(false);
          // Return focus to the "Change kind…" parent.
          itemRefs.current[changeKindIndex]?.focus();
          return;
        }
      },
    [],
  );

  return (
    <div
      className="skb-kebab-menu"
      role="menu"
      aria-label="Block actions menu"
      data-skb-kebab-menu={blockId}
      onMouseDown={stopPropagation}
    >
      <MenuItem
        ref={(el) => {
          itemRefs.current[0] = el;
        }}
        label="Delete"
        onClick={handleDelete}
        onKeyDown={handleTopLevelKeyDown(0)}
        danger
        dataAttr="delete"
      />
      <MenuItem
        ref={(el) => {
          itemRefs.current[1] = el;
        }}
        label="Duplicate"
        onClick={handleDuplicate}
        onKeyDown={handleTopLevelKeyDown(1)}
        dataAttr="duplicate"
      />
      <MenuItem
        ref={(el) => {
          itemRefs.current[2] = el;
        }}
        label="Change kind…"
        onClick={handleChangeKindClick}
        onKeyDown={handleTopLevelKeyDown(2)}
        dataAttr="change-kind-toggle"
      />
      {changeKindOpen && (
        <div
          className="skb-kebab-menu__submenu"
          role="menu"
          data-skb-kebab-submenu="change-kind"
        >
          {kinds.map((option, idx) => (
            <MenuItem
              key={option.kind}
              ref={(el) => {
                subItemRefs.current[idx] = el;
              }}
              label={option.label}
              onClick={() => handleChangeKindPick(option.kind)}
              onKeyDown={handleSubMenuKeyDown(idx)}
              dataAttr={`change-kind-${option.kind}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
