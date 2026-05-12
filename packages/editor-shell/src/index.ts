/**
 * @skb/editor-shell public surface (post Wave 8 W8-1 demolition).
 *
 * The pre-W8 Tiptap-NodeView grid stack (BlockNodeView, EditorShell,
 * drag-drop pipeline, resize pipeline, kebab pipeline, palette
 * surfaces, slash menu, toolbar, registry-wire, registerBlocks) has
 * been deleted. The new architecture per Wave 8 plan inverts the
 * SoT: React state holds GridState directly; renderer is downstream;
 * per-block Tiptap mini-editors handle markdown text only (W8-2).
 *
 * What remains here is orthogonal to layout/drag/resize:
 *  - save adapters (file system / API)
 *  - read-route grid placement helpers (apps/site consumers)
 *  - theme hook + baseplate mount (W7 Phase 2C/2D)
 *  - LiveAnnouncer + a11y keyboard helpers (orthogonal)
 *  - GridContainer passive wrapper
 *  - viewport responsive helpers
 */
export type { NoteSaveAdapter, NoteState, ReadonlyJSONValue } from './save-adapter';
export { ApiAdapter, LocalStorageAdapter } from './save-adapter';
export { registerKernels } from './registerKernels';
export { saveToMdx, loadFromMdx } from './saveLoad';
export type { SaveLoadOptions } from './saveLoad';
export { SaveIndicator } from './save-indicator';
export type { SaveIndicatorProps, SaveIndicatorStatus } from './save-indicator';
export { EditModeBanner } from './edit-mode-banner';
export type { EditModeBannerProps } from './edit-mode-banner';
export { GridContainer } from './grid-container';
export type { GridContainerProps } from './grid-container';
export { proseExtensions } from '@skb/block-foundation';
// Read-route grid placement helpers (apps/site/src/components.ts +
// 3 heavy block .astro wrappers consume these). The edit-route path
// is being rebuilt in W8-2 with an absolute-positioning helper from
// @skb/grid-themes/built-in/shared.ts, so the helpers below stay
// scoped to the SSR read route + non-themed paths.
export {
  extractGridPosition,
  gridPlacementStyle,
  gridPlacementStyleAttr,
} from './grid-style';
export type { GridPlacementInput } from './grid-style';
export { useResponsiveCols, RESPONSIVE_BREAKPOINTS } from './responsive-cols';
export type { UseResponsiveColsOptions, ViewportCols } from './responsive-cols';
// Wave 7 Phase 2C — grid-themes hook (kept; will be consumed by W8-2 GridEditor).
export { useTheme, DEFAULT_THEME } from './use-theme';
export type { UseThemeOptions, UseThemeReturn, ThemeKey, GridTheme } from './use-theme';
// Wave 7 Phase 2D — theme baseplate mount (kept; will be consumed by W8-2 GridEditor).
export { ThemeBaseplate } from './theme-baseplate';
export type { ThemeBaseplateProps } from './theme-baseplate';
// a11y / LiveAnnouncer (orthogonal — kept for W8-2 wiring).
export { LiveAnnouncer, useAnnounce } from './a11y/live-announcer';
export type {
  LiveAnnouncerContextValue,
  LiveAnnouncerProps,
} from './a11y/live-announcer';
export { useFocusReturn } from './a11y/use-focus-return';
export type { UseFocusReturnOptions } from './a11y/use-focus-return';
export {
  keyboardGridRowStep,
  keyboardGridStep,
  keyboardRowStep,
  keyboardSnapStep,
} from './a11y/keyboard-step';
export {
  formatDragCancel,
  formatDragCommit,
  formatDragMove,
  formatExternalDragCommit,
  formatExternalDragMove,
  formatKebabAction,
  formatPaletteInsert,
  formatResizeCancel,
  formatResizeChange,
} from './a11y/announce-format';
