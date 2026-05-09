/**
 * @skb/editor-shell KebabContext — React context bridging the
 * presentational `<KebabButton>` (per-block, inside NodeView gutter)
 * to the lifecycle owner (`EditorShellMount.tsx` closures over the
 * Tiptap editor).
 *
 * Wave 6 cf-20e (2026-05-09) — context plumbs the 3 imperative
 * actions (delete / duplicate / change-kind) across the React tree
 * without prop-drilling. Mirrors the cf-20c-2 `DragDropContext` /
 * cf-20d `ResizeContext` shape (per cf-20e D5 decision).
 *
 * Per cf-20e D5 decision: the consumer (EditorShellMount) is the
 * single owner of editor mutations across all 3 contexts (drag,
 * resize, kebab); the per-block components stay purely
 * presentational (testable without spinning up a Tiptap editor).
 *
 * The `kinds` field exposes the 8 BlockKind options (sourced from
 * `BLOCK_KIND_OPTIONS` in registry-wire) so the change-kind
 * sub-menu can render the user-facing labels without re-importing
 * registry-wire from the per-block components.
 */
import { createContext, type ReactNode } from 'react';
import type { BlockAffordanceKind, BlockKindOption } from '../registry-wire';

export interface KebabContextValue {
  /** Called from the kebab menu's "Delete" item. */
  readonly onDelete: (blockId: string) => void;
  /** Called from the kebab menu's "Duplicate" item. */
  readonly onDuplicate: (blockId: string) => void;
  /**
   * Called from the kebab menu's "Change kind… → <newKind>" sub-menu
   * item. The consumer is responsible for resolving the new node
   * type from the editor schema + building the new attrs via
   * `buildChangeKindAttrs` per cf-20e D3.
   */
  readonly onChangeKind: (blockId: string, newKind: BlockAffordanceKind) => void;
  /**
   * The list of available kinds for the change-kind sub-menu. Sourced
   * from `BLOCK_KIND_OPTIONS` at the consumer; passed through context
   * so per-block components don't import registry-wire directly.
   */
  readonly kinds: readonly BlockKindOption[];
}

/**
 * Default `null` value (Provider absence). Consumers should treat
 * null as "no kebab pipeline mounted" — buttons render but onClick
 * is a no-op (degraded mode for tests / stand-alone NodeView mounts).
 */
export const KebabContext = createContext<KebabContextValue | null>(null);

export interface KebabProviderProps {
  readonly value: KebabContextValue;
  readonly children?: ReactNode;
}

export function KebabProvider(props: KebabProviderProps) {
  const { value, children } = props;
  return <KebabContext.Provider value={value}>{children}</KebabContext.Provider>;
}
