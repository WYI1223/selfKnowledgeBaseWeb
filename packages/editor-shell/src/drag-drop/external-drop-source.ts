/**
 * @skb/editor-shell external-drop-source — MIME contract +
 * marshalling helpers for the cf-24 PaletteSidebar drag-to-insert
 * path per ADR-0017 v0.4 D14.
 *
 * Wave 6 cf-24 (2026-05-10) — the persistent left-rail palette
 * exposes 8 draggable cards. Each card writes the v2-reference
 * MIME `application/x-block-kind` on dragstart; the pipeline reads
 * the same MIME on drop to detect external-source insertion vs
 * the existing per-block move path. The two paths share the
 * pipeline state machine but diverge at commit:
 * - per-block (sourceBlockId = real UUID): commitDropAtMatch +
 *   apply-drop-mode swap algebra (cf-20c-2 D6 source-lift safe)
 * - external (sourceBlockId = EXTERNAL_DROP_SENTINEL): bypass
 *   commitDropAtMatch entirely; `appendBlockKind` (cf-24 R0 F1
 *   fix) appends the new node at deterministic doc-end, then
 *   setNodeMarkup writes grid attrs at the drop slot (cf-20e
 *   duplicate precedent)
 *
 * Defense in depth: readBlockKindFromDataTransfer validates the
 * MIME value against BLOCK_KIND_OPTIONS whitelist. Browser
 * extensions or page injections can write arbitrary MIME values;
 * blindly trusting them would let an attacker write
 * `application/x-block-kind` = `eval('...')` and trigger a
 * dispatch on an unknown kind (which would fall through to the
 * default attrs registry lookup → undefined → crash). The
 * whitelist returns null on unknown / missing — never throws.
 */
import {
  BLOCK_KIND_OPTIONS,
  type BlockAffordanceKind,
} from '../registry-wire';

/**
 * MIME type written + read on the dragstart / dragover / drop
 * DataTransfer per v2-reference protocol (`v2-app.jsx` line 135).
 *
 * Stable string literal — renaming requires bumping ADR-0017
 * v0.4 D14 + every cf-24 consumer in the same PR.
 */
export const EXTERNAL_DROP_MIME = 'application/x-block-kind' as const;

/**
 * Sentinel string written into the pipeline's `sourceBlockId` slot
 * when the drag originated from an external source (PaletteSidebar
 * card). Differentiates from per-block drag where `sourceBlockId`
 * is the Tiptap node's real UUID.
 *
 * Per cf-24 D5 + D7: per-block code path checks
 * `sourceBlockId !== EXTERNAL_DROP_SENTINEL` before reaching
 * `commitDropAtMatch`; external path branches into
 * `appendBlockKind + setNodeMarkup` instead (cf-24 R0 F1 fix —
 * deterministic doc-end append, NOT selection-based insert). The
 * sentinel is a string that cannot collide with any UUID Tiptap
 * might emit (UUIDs use hex + hyphen; this sentinel uses
 * underscores).
 */
export const EXTERNAL_DROP_SENTINEL = '__external_palette__' as const;

const ALLOWED_KINDS: ReadonlySet<string> = new Set(
  BLOCK_KIND_OPTIONS.map((opt) => opt.kind),
);

/**
 * Marshal a block-kind onto the DataTransfer for an external-source
 * drag. Sets the MIME + dropEffect copy + a 1×1 transparent drag
 * image (so the cursor doesn't render the default drag preview;
 * the parent component can render its own drag ghost via
 * useDragDropPipeline's `cursor` state if desired).
 *
 * Per v2-reference (v2-app.jsx:131-141) the transparent drag image
 * is required because most browsers default to a screenshot of
 * the source element which is large + ugly.
 */
export function writeBlockKindToDataTransfer(
  dt: DataTransfer,
  kind: BlockAffordanceKind,
): void {
  dt.effectAllowed = 'copy';
  dt.setData(EXTERNAL_DROP_MIME, kind);

  // Transparent 1×1 GIF drag image so the cursor is unencumbered.
  // setDragImage may throw in jsdom (no Image constructor); guard
  // so unit tests don't crash.
  try {
    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.src =
        'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
      dt.setDragImage(img, 0, 0);
    }
  } catch {
    // jsdom / Safari quirks — fall through; default cursor is
    // acceptable degraded UX.
  }
}

/**
 * Read the block-kind from a DataTransfer payload, validating
 * against BLOCK_KIND_OPTIONS. Returns null on:
 * - missing MIME (drag came from a non-palette source)
 * - empty / whitespace-only value
 * - unknown kind (extension / page injection writing rogue value)
 *
 * Never throws — graceful degradation is the contract per cf-24
 * Q4 absorbtion.
 */
export function readBlockKindFromDataTransfer(
  dt: DataTransfer,
): BlockAffordanceKind | null {
  const raw = dt.getData(EXTERNAL_DROP_MIME);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (!ALLOWED_KINDS.has(trimmed)) return null;
  return trimmed as BlockAffordanceKind;
}

/**
 * Predicate — test whether a `sourceBlockId` value indicates an
 * external-source drag (PaletteSidebar) vs a per-block drag (real
 * Tiptap node UUID). Pipeline branching point per cf-24 D7.
 */
export function isExternalDragSource(
  sourceBlockId: string | null,
): sourceBlockId is typeof EXTERNAL_DROP_SENTINEL {
  return sourceBlockId === EXTERNAL_DROP_SENTINEL;
}
