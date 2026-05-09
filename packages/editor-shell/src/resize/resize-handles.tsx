/**
 * @skb/editor-shell <ResizeHandles> — per-block resize affordance.
 *
 * Wave 6 cf-20d (2026-05-09) — emits the 3 handle DOM elements per
 * /mnt/d/download/web/v2-styles.css:256-311 for a single
 * `.skb-block-nodeview` wrapper.
 *
 *   - `.gblock-handle.right`  — always rendered (per ADR-0017 D9
 *     line 320: "右侧 colSpan 调节: 所有 block 都有").
 *   - `.gblock-handle.bottom` — rendered ONLY when
 *     `gridKind !== 'prose'` (per ADR-0017 D9: bottom + corner only
 *     on render/viz/component kinds). Prose blocks have
 *     content-driven rowSpan via `useAutoRowSpan` (ADR-0017 D7); a
 *     bottom handle would imply user-set rowSpan which contradicts
 *     the prose contract.
 *   - `.gblock-handle.corner` — same gating as bottom.
 *
 * Defensive default for `gridKind === undefined`: treat as
 * `'component'` (renders all 3 handles). The 8 sample-blocks
 * BlockUIDefinition entries don't currently set `gridKind`, but
 * they're all non-prose component/render/viz blocks. Future prose
 * blocks would render via native ProseMirror paragraph/heading
 * nodes (no `BlockNodeView` wrapper), so they never reach this
 * component. The defensive default = render-all-3 means the cf-20d
 * resize wire enables resize for all existing sample-blocks
 * fixtures.
 *
 * Mobile: handles are hidden via `.gblock-handle { display: none }`
 * inside the `@media (max-width: 768px)` block in
 * `resize-handles.css` (per ADR-0017 D9 mobile view-only contract).
 *
 * Pointer-events override: cf-19 set the gutter to
 * `pointer-events: none`. The handles are OUTSIDE the gutter
 * (negative offsets like `right: -7px` place them on the wrapper's
 * outer edges) so they're not affected by the gutter rule, but the
 * handle CSS includes `pointer-events: auto` as defense-in-depth.
 */
import {
  createElement,
  useContext,
  type PointerEvent,
  type ReactElement,
} from 'react';
import {
  ResizeContext,
  type ResizeAxis,
  type ResizeContextValue,
} from './resize-context';

export interface ResizeHandlesProps {
  /** Stable block identifier (mirrors cf-20c-2 drag-handle pattern). */
  readonly blockId: string;
  /**
   * Block's `gridKind` per ADR-0016 D10. When `'prose'`, the bottom
   * and corner handles are NOT rendered (only right). When undefined
   * or any other value, all 3 are rendered. Source: read from
   * BlockUIDefinition at the EditorShellMount registry-wire layer
   * and threaded down to this presentational component.
   *
   * Type accepts `undefined` explicitly (rather than `?:`) to keep
   * the call site clean under TypeScript `exactOptionalPropertyTypes`
   * — the BlockUIDefinition's `gridKind` is `BlockGridKind | undefined`
   * (the field itself is optional but tsconfig's strict optional
   * forbids passing `undefined` to a `?:` prop).
   */
  readonly gridKind: 'prose' | 'component' | 'render' | 'viz' | undefined;
}

function handleClassName(axis: ResizeAxis): string {
  return `gblock-handle ${axis}`;
}

function makeHandlerForAxis(
  axis: ResizeAxis,
  blockId: string,
  ctx: ResizeContextValue | null,
) {
  return function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    // Only respond to the primary mouse button / primary touch point;
    // ignore right-click contextmenu + middle-click scroll initiation.
    if (event.button !== 0) return;

    // Stop ProseMirror from interpreting this as a NodeSelection
    // gesture. Stop propagation so the drag-handle pipeline (cf-20c-2)
    // doesn't accidentally see this pointerdown bubble up.
    event.stopPropagation();
    // Prevent text-selection cursor from kicking in during the resize
    // gesture (the body is hidden via .skb-block-nodeview--resizing
    // anyway, but defense-in-depth against bubble selection).
    event.preventDefault();

    // Capture pointer so subsequent pointermove / pointerup events
    // route to this handle even if the cursor leaves the bounding box
    // (typical when resizing past the snap boundary).
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some test environments (happy-dom) don't implement pointer
      // capture; the pipeline falls back to window-level listeners
      // either way.
    }

    ctx?.onResizeStart(blockId, axis, { x: event.clientX, y: event.clientY });
  };
}

export function ResizeHandles(props: ResizeHandlesProps): ReactElement {
  const { blockId, gridKind } = props;
  const ctx = useContext(ResizeContext);

  const onRightDown = makeHandlerForAxis('right', blockId, ctx);
  const onBottomDown = makeHandlerForAxis('bottom', blockId, ctx);
  const onCornerDown = makeHandlerForAxis('corner', blockId, ctx);

  // Right handle is always rendered (per D9 line 320).
  const showBottomCorner = gridKind !== 'prose';

  // Use `<>` fragment because handles are absolutely positioned on
  // the parent `.skb-block-nodeview` (negative offsets) — they don't
  // belong inside a wrapper div which would create an extra layout
  // box.
  return createElement(
    'div',
    {
      // Wrapper is inert structurally — handles use absolute
      // positioning relative to .skb-block-nodeview (the NodeView
      // wrapper). The wrapper here is just a React-tree container
      // so this component returns a single element.
      className: 'skb-block-nodeview__resize-handles',
      'aria-hidden': true,
    },
    [
      createElement('div', {
        key: 'right',
        className: handleClassName('right'),
        'data-skb-resize-axis': 'right',
        'data-skb-resize-block-id': blockId,
        onPointerDown: onRightDown,
      }),
      showBottomCorner &&
        createElement('div', {
          key: 'bottom',
          className: handleClassName('bottom'),
          'data-skb-resize-axis': 'bottom',
          'data-skb-resize-block-id': blockId,
          onPointerDown: onBottomDown,
        }),
      showBottomCorner &&
        createElement('div', {
          key: 'corner',
          className: handleClassName('corner'),
          'data-skb-resize-axis': 'corner',
          'data-skb-resize-block-id': blockId,
          onPointerDown: onCornerDown,
        }),
    ].filter(Boolean),
  );
}
