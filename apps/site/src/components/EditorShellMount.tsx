import { LiveAnnouncer } from '@skb/editor-shell';
import {
  EditorShellMountInner,
  type EditorShellMountInnerProps,
} from './EditorShellMountInner';

export type EditorShellMountProps = EditorShellMountInnerProps;

/**
 * Wave 6 cf-22 R1 F1 — `EditorShellMount` outer wrapper that mounts
 * `<LiveAnnouncer>` ONCE so the inner component can call
 * `useAnnounce()` from inside the provider scope.
 *
 * Pre-R1 the announcer was mounted inside the same component that
 * built the kebab/drag/resize callbacks — but `useAnnounce()` was
 * never called from anywhere in the tree, so the live region
 * existed but no one spoke into it (silent WCAG 4.1.3 gap caught
 * by codex-pr-reviewer-55 R1 F1). The split into outer (provider)
 * + inner (consumer) is the canonical React-context pattern that
 * makes `useAnnounce()` callable from the kebab/drag/resize wiring
 * code in `EditorShellMountInner.tsx`.
 *
 * The outer wrapper also keeps `EditorShellMount.tsx` minimal so
 * the size-check budget for `EditorShellMountInner.tsx` (which
 * holds the bulk of the lifecycle wiring) is not constrained by
 * import + announcer-mounting boilerplate.
 *
 * Operational rule landed (cf-22 R1 reflection):
 *   Scaffolding (helpers / hooks / components) MUST have a
 *   verified consumer in the same PR. Exporting + unit-testing
 *   the helper is NOT enough; the consumer wiring is the contract.
 */
export function EditorShellMount(props: EditorShellMountProps) {
  return (
    <LiveAnnouncer>
      <EditorShellMountInner {...props} />
    </LiveAnnouncer>
  );
}
