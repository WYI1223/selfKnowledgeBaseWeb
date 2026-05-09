/**
 * @skb/editor-shell change-kind-attrs — pure helper for cf-20e
 * change-kind action attr translation.
 *
 * Wave 6 cf-20e (2026-05-09) — per cf-20e D3 decision
 * (drop-and-default + preserve grid attrs only):
 *
 * The change-kind action mutates a block from one kind (e.g.
 * `callout`) to another (e.g. `componentCode`). Cross-kind attr
 * translation is meaningful only for SOME pairs (callout↔code share
 * title-like fields; pdf↔image share spatial fields but not
 * semantic ones; most pairs share NOTHING). A general N×N
 * translation table is high-effort to maintain correctly and
 * introduces silent data corruption when block kinds are added
 * later but translation entries are forgotten.
 *
 * cf-20e D3 picks the simpler model: drop-and-default + preserve
 * the universal grid attrs. The new node gets the target kind's
 * defaults for all kind-specific fields, with the source's
 * `{col, row?, colSpan, rowSpan}` overriding the target defaults
 * (so the user's spatial intent — block placement on the grid —
 * survives the kind change).
 *
 * Side effect (intentional): if user picks "Change kind… → same
 * kind" (e.g. callout → callout), the result is the target kind's
 * defaults + preserved grid — a "reset to defaults" path. cf-20e
 * documents this as an intended affordance (the user CAN use it to
 * reset block content without changing kind).
 *
 * No React, no DOM — fully unit-testable from vitest.
 */

/**
 * Universal grid attrs preserved across all block kinds. The
 * source's values for these 4 fields override the target defaults.
 * Per ADR-0016 D2 grid-position invariant.
 */
const GRID_ATTR_KEYS = ['col', 'row', 'colSpan', 'rowSpan'] as const;

/**
 * Build the new-kind attrs from the source node's attrs by
 * preserving only the universal grid fields per cf-20e D3
 * drop-and-default.
 *
 * @param sourceAttrs    The source block's attrs (raw record from
 *                       Tiptap `node.attrs`).
 * @param targetKind     The new kind name (informational; unused at
 *                       runtime but kept in the signature for
 *                       future-proofing — a future cf-20e+ PR may
 *                       add per-kind translation rules keyed off
 *                       this parameter).
 * @param targetDefaults The new kind's `defaultAttrs` object (the
 *                       caller resolves this from
 *                       `defaultBlockAttrs[targetKind]` in
 *                       registry-wire; the helper takes it as an
 *                       arg so the pure-helper module stays free of
 *                       the registry-wire dependency graph).
 * @returns              The new attrs object suitable for
 *                       `tr.setNodeMarkup(pos, newNodeType,
 *                       newAttrs)`.
 */
export function buildChangeKindAttrs(
  sourceAttrs: Record<string, unknown>,
  // The `targetKind` arg is informational + future-proofing for a
  // future per-kind translation table (cf-20e+ may amend D3 to add
  // pair-specific rules; see PR.md D3 prose). Underscore-prefixed
  // to opt out of the no-unused-vars rule per the eslint config.
  _targetKind: string,
  targetDefaults: Record<string, unknown>,
): Record<string, unknown> {
  // Start with a shallow copy of the target defaults (the new
  // kind's complete attr set with kind-specific fields).
  const result: Record<string, unknown> = { ...targetDefaults };

  // Override with the source's grid attrs (only when defined on
  // source). The `row` field is optional per ADR-0016 D2 (not all
  // blocks have an explicit row); preserve it only if present on
  // the source.
  for (const key of GRID_ATTR_KEYS) {
    const sourceValue = sourceAttrs[key];
    if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}
