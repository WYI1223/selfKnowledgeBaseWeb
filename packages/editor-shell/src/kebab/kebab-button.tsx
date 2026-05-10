/**
 * @skb/editor-shell <KebabButton> — per-block kebab affordance.
 *
 * Wave 6 cf-20e (2026-05-09) — emits a single `<button>` inside the
 * cf-19 gutter shell + manages local React state for the menu's
 * open/closed lifecycle. When open, renders `<KebabMenu>` inside a
 * `position: relative` wrapper so the menu's `position: absolute`
 * anchors below the button per cf-20e D2 (no React Portal).
 *
 * Lifecycle:
 *   - Click button: toggle menu open. If KebabContext is null
 *     (degraded mode), button still renders but menu won't get
 *     useful callbacks (action handlers no-op).
 *   - Click anywhere outside the wrapper: close menu (cf-20e D8
 *     document-level mousedown listener).
 *   - Press Esc: close menu (cf-20e D8 document-level keydown
 *     listener).
 *   - Click any menu item: action fires + menu closes (handled
 *     inside `<KebabMenu>` via the `onClose` prop).
 *
 * Pointer-events override: cf-19 gutter has `pointer-events: none`.
 * The kebab button + its menu opt back in via `pointer-events: auto`
 * (cf-20c-2 drag-handle precedent).
 */
import {
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import { KebabContext } from './kebab-context';
import { KebabMenu } from './kebab-menu';
// Wave 6 cf-22 — focus snap-and-restore (WCAG 2.4.3); on menu close
// focus returns to the kebab button per cf-22 D5 / D8.
import { useFocusReturn } from '../a11y/use-focus-return';

export interface KebabButtonProps {
  /** Stable block identifier (mirrors cf-20c-2 drag-handle pattern). */
  readonly blockId: string;
  /** Optional label override; defaults to "Block actions". */
  readonly label?: string;
}

export function KebabButton(props: KebabButtonProps): ReactElement {
  const { blockId, label = 'Block actions' } = props;
  const ctx = useContext(KebabContext);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // cf-22 — ref to the kebab <button> so menu close can return
  // focus per cf-22 D5 / D8 / WCAG 2.4.3.
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // cf-22 — focus return on close. The hook snapshots
  // document.activeElement when `open` transitions false→true and
  // restores when true→false. We pass `restoreEl = buttonRef.current`
  // explicitly so focus always lands on the kebab button (not on
  // whatever was focused BEFORE the menu opened — which might be
  // the editor surface for a Tab+Enter keyboard user).
  useFocusReturn({ active: open, restoreEl: buttonRef.current });

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const handleButtonClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      // Stop the click from bubbling to the document mousedown
      // listener (which would close the menu in the same tick).
      event.stopPropagation();
      setOpen((prev) => !prev);
    },
    [],
  );

  // Document-level click-outside listener (cf-20e D8). Closes the
  // menu when user clicks anywhere outside the kebab wrapper.
  // Attached only when menu is open so steady-state has zero
  // listener overhead per-block.
  useEffect(() => {
    if (!open) return;

    function handleDocMouseDown(event: MouseEvent): void {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (wrapperRef.current && wrapperRef.current.contains(target)) return;
      closeMenu();
    }

    document.addEventListener('mousedown', handleDocMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocMouseDown);
    };
  }, [open, closeMenu]);

  // Document-level Esc keydown listener (cf-20e D8). Closes the
  // menu without firing any action.
  useEffect(() => {
    if (!open) return;

    function handleDocKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    }

    document.addEventListener('keydown', handleDocKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDocKeyDown);
    };
  }, [open, closeMenu]);

  // Degraded-mode no-ops when context absent (test mounts without
  // pipeline). Menu still renders so the structural assertions pass
  // but action callbacks are silent.
  const noopDelete = useCallback(() => undefined, []);
  const noopDuplicate = useCallback(() => undefined, []);
  const noopChangeKind = useCallback(() => undefined, []);

  return createElement(
    'div',
    {
      ref: wrapperRef,
      className: 'skb-block-nodeview__kebab-wrapper',
    },
    createElement(
      'button',
      {
        ref: buttonRef,
        type: 'button',
        className: 'skb-block-nodeview__kebab',
        'aria-label': label,
        'aria-haspopup': 'menu',
        'aria-expanded': open ? 'true' : 'false',
        'data-skb-kebab-block-id': blockId,
        onClick: handleButtonClick,
      },
      // v2-style glyph: '⋮' (vertical ellipsis) as the kebab icon.
      // cf-22 may swap to an SVG; cf-20e ships text-based for
      // dependency-light + accessible-by-default.
      '⋮',
    ),
    open &&
      createElement(KebabMenu, {
        blockId,
        kinds: ctx?.kinds ?? [],
        onDelete: ctx?.onDelete ?? noopDelete,
        onDuplicate: ctx?.onDuplicate ?? noopDuplicate,
        onChangeKind: ctx?.onChangeKind ?? noopChangeKind,
        onClose: closeMenu,
      }),
  );
}
