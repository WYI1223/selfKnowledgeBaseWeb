export { EditorShell } from './EditorShell';
export type { EditorShellProps } from './EditorShell';
// Wave 6 cf-24 (2026-05-10) — Palette command-bar renamed to
// PaletteModal to disambiguate from the new persistent left-rail
// PaletteSidebar (cf-24 D3 — both surfaces are PERMANENT first-class
// siblings per ADR-0018 v0.8 D10.e). Atomic rename, no deprecation
// alias; all import sites updated in the SAME PR.
export { PaletteModal } from './palette-modal';
export type { PaletteModalProps } from './palette-modal';
export { PaletteSidebar, PALETTE_SIDEBAR_ITEMS } from './palette-sidebar';
export type { PaletteSidebarProps, PaletteSidebarItem } from './palette-sidebar';
export {
  EXTERNAL_DROP_MIME,
  EXTERNAL_DROP_SENTINEL,
  isExternalDragSource,
  readBlockKindFromDataTransfer,
  writeBlockKindToDataTransfer,
} from './drag-drop/external-drop-source';
export { SlashMenu } from './slash-menu';
export type { SlashMenuProps } from './slash-menu';
export { DragHandle } from './drag-handle';
export type { DragHandleProps } from './drag-handle';
export { Toolbar } from './toolbar';
export type { ToolbarProps } from './toolbar';
export { EditModeBanner } from './edit-mode-banner';
export type { EditModeBannerProps } from './edit-mode-banner';
export { SaveIndicator } from './save-indicator';
export type { SaveIndicatorProps, SaveIndicatorStatus } from './save-indicator';
export {
  appendBlockKind,
  BLOCK_KIND_OPTIONS,
  defaultBlockAttrsFor,
  insertBlockKind,
  wireRegistry,
} from './registry-wire';
export type {
  BlockAffordanceKind,
  BlockKindOption,
  RegistryWire,
  RegistryWireOptions,
} from './registry-wire';
export { registerBlocks } from './registerBlocks';
export { registerKernels } from './registerKernels';
export { saveToMdx, loadFromMdx } from './saveLoad';
export type { SaveLoadOptions } from './saveLoad';
export { makeBlockNodeView } from './BlockNodeView';
export type { BlockNodeViewFactoryProps } from './BlockNodeView';
export type { NoteSaveAdapter, NoteState, ReadonlyJSONValue } from './save-adapter';
export { ApiAdapter, LocalStorageAdapter } from './save-adapter';
export { proseExtensions } from '@skb/block-foundation';
export { GridContainer } from './grid-container';
export type { GridContainerProps } from './grid-container';
export {
  extractGridPosition,
  gridPlacementStyle,
  gridPlacementStyleAttr,
} from './grid-style';
export type { GridPlacementInput } from './grid-style';
export { useResponsiveCols, RESPONSIVE_BREAKPOINTS } from './responsive-cols';
export type { UseResponsiveColsOptions, ViewportCols } from './responsive-cols';
// Wave 7 Phase 2C — grid-themes wiring per ADR-0020 D7-D9.
export { useTheme, DEFAULT_THEME } from './use-theme';
export type { UseThemeOptions, UseThemeReturn, ThemeKey, GridTheme } from './use-theme';
export { OutlineOverlay } from './drag-drop/outline-overlay';
export type { OutlineOverlayProps } from './drag-drop/outline-overlay';
export { DropPulse, dropPulseClassName } from './drag-drop/drop-pulse';
export type { DropPulseProps } from './drag-drop/drop-pulse';
export { DragGhost } from './drag-drop/drag-ghost';
export type { DragGhostProps, GhostKind } from './drag-drop/drag-ghost';
export { useEscCancel } from './drag-drop/esc-cancel';
export type { EscCancelOptions } from './drag-drop/esc-cancel';
export { layoutReducer } from './drag-drop/layout-reducer';
export type { GridSnapshot, LayoutAction, LayoutState } from './drag-drop/layout-reducer';
// Wave 7 Phase 2B.2 (ADR-0020 D2) — grid-engine adapter is now the
// sole drag-drop commit surface; the cf-20c-1 4-mode `applyDropMode`
// path + its support modules (`edge-rects`, `tiebreak`) have been
// deleted.
export {
  commitInsertAtCursor,
  commitMoveAtCursor,
  cursorToEngineCoord,
  engineBlockToEditorAttrs,
  intentForInsert,
  intentForMove,
  toEngineState,
} from './drag-drop/grid-engine-adapter';
export type { CommitResult as EngineCommitResult } from './drag-drop/grid-engine-adapter';
export { commitDropAtCursor } from './drag-drop/commit-drop';
export { DragHandleButton, DRAG_HANDLE_MIME } from './drag-drop/drag-handle-button';
export type { DragHandleButtonProps } from './drag-drop/drag-handle-button';
export { DragDropContext, DragDropProvider } from './drag-drop/drag-context';
export type {
  DragDropContextValue,
  DragDropProviderProps,
  DragHandleStartOrigin,
  DragHandleEndOrigin,
} from './drag-drop/drag-context';
export { useDragDropPipeline } from './drag-drop/use-drag-drop-pipeline';
export type {
  PipelineDragState,
  UseDragDropPipelineOptions,
  UseDragDropPipelineReturn,
} from './drag-drop/use-drag-drop-pipeline';
export { ColRuler } from './resize/col-ruler';
export type { ColRulerProps } from './resize/col-ruler';
export { SizeTooltip, colSpanToFraction } from './resize/size-tooltip';
export type { SizeTooltipProps } from './resize/size-tooltip';
export { ResizeHandles } from './resize/resize-handles';
export type { ResizeHandlesProps } from './resize/resize-handles';
export { ResizeContext, ResizeProvider } from './resize/resize-context';
export type {
  ResizeAxis,
  ResizeContextValue,
  ResizeProviderProps,
  ResizeStartOrigin,
  ResizeEndOrigin,
} from './resize/resize-context';
export { RowLadder } from './resize/row-ladder';
export type { RowLadderProps } from './resize/row-ladder';
export {
  buildResizeNextAttrs,
  normalizeOverflowPosition,
  snapToColSpan,
  snapToRowSpan,
} from './resize/resize-snap';
export { useResizePipeline } from './resize/use-resize-pipeline';
export type {
  PipelineResizeState,
  UseResizePipelineOptions,
  UseResizePipelineReturn,
} from './resize/use-resize-pipeline';
export { KebabButton } from './kebab/kebab-button';
export type { KebabButtonProps } from './kebab/kebab-button';
export { KebabMenu } from './kebab/kebab-menu';
export type { KebabMenuProps } from './kebab/kebab-menu';
export { KebabContext, KebabProvider } from './kebab/kebab-context';
export type {
  KebabContextValue,
  KebabProviderProps,
} from './kebab/kebab-context';
export { buildChangeKindAttrs } from './kebab/change-kind-attrs';
// Wave 6 cf-22 (2026-05-09) — keyboard a11y public surface (LiveAnnouncer
// + focus-return hook + keyboard-step pure helpers + announce-format
// formatters per WCAG 2.1.1 + 2.4.3 + 4.1.3).
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
