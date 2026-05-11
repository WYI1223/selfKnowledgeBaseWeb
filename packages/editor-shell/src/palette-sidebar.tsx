/**
 * @skb/editor-shell PaletteSidebar — persistent left-rail block
 * library palette per v2 reference (`/mnt/d/download/web/v2-app.jsx`
 * lines 108-159 + `v2-styles.css` lines 38-100).
 *
 * Wave 6 cf-24 (2026-05-10) — sibling to the existing PaletteModal
 * Cmd+K command bar. Both palette surfaces coexist permanently per
 * ADR-0018 v0.8 D10.e:
 * - PaletteSidebar = mouse-first discoverability + always-visible
 *   categorization. Renders 8 draggable cards (one per
 *   BLOCK_KIND_OPTIONS member). Drag-to-insert via HTML5 DnD with
 *   `application/x-block-kind` MIME (cf-24 D5 / ADR-0017 v0.4 D14
 *   external-source drag protocol). Click-to-insert is the
 *   keyboard-accessible fallback (cf-22 WCAG 2.1.1 keyboard
 *   operability — div-only draggable items would violate that).
 * - PaletteModal = power-user keyboard-first (Cmd+K) at-cursor
 *   insertion. Load-bearing for mobile UX (sidebar hidden < 768px
 *   per cf-24 D8 + global.css media query).
 *
 * Visual contract per v2 reference:
 * - 230px fixed-width parent rail (the parent .palette-rail in
 *   apps/site/src/styles/global.css consumes --palette-w from
 *   @skb/design-tokens; this component renders INTO that rail via
 *   React portal from EditorShellMountInner per cf-24 D11)
 * - Workspace pill (fixed text "Component library" + accent K
 *   tile glyph; v2 reference's per-doc breadcrumb is omitted —
 *   SKB has its own header/nav per cf-24 D10)
 * - "Drag to insert" h4 caption
 * - 8 .pal-item buttons (one per BlockKindOption); each shows
 *   glyph tile + label + description
 * - Tips hint card pinned `margin-top: auto` at the bottom
 *
 * Glyph + description mapping per cf-24 D4 + ADR-0018 v0.8 D10.b:
 * | kind          | glyph | desc                                   |
 * | ------------- | ----- | -------------------------------------- |
 * | callout       | !     | Note · tip · warning · danger          |
 * | componentCode | </>   | TS · JS · Python · syntax-highlighted  |
 * | image         | ◨     | Photo · figure · diagram               |
 * | math          | ∑     | KaTeX inline + display                 |
 * | pdf           | ¶     | Embedded PDF + page select             |
 * | jupyter       | ▶     | Live notebook cell                     |
 * | nn-viz        | ◇     | Neural network diagram                 |
 * | agent-flow    | ⤳     | Agent step graph                       |
 *
 * Hue assignment via per-kind `.k-${kind}` classNames consuming the
 * existing v0.5 D3 token family (--accent-canvas / --accent-runnable
 * / --accent-image / --accent-math / --accent-pdf / --accent-jupyter
 * / --accent-nn-viz / --accent-agent-flow). NO new hue tokens.
 */
import { useCallback } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import type { Editor } from '@tiptap/core';
import {
  appendBlockKind,
  BLOCK_KIND_OPTIONS,
  type BlockAffordanceKind,
} from './registry-wire';
import { writeBlockKindToDataTransfer } from './drag-drop/external-drop-source';

export interface PaletteSidebarItem {
  readonly kind: BlockAffordanceKind;
  readonly label: string;
  readonly mdxComponent: string;
  readonly glyph: string;
  readonly description: string;
}

/**
 * Enriched palette items per cf-24 D4. Built from the canonical
 * BLOCK_KIND_OPTIONS array + per-kind glyph + description; the
 * `kind` + `label` + `mdxComponent` fields stay identity-equal to
 * the BlockKindOption source. If BLOCK_KIND_OPTIONS gains a new
 * kind, this array MUST be updated in the SAME PR (vitest test
 * `palette-sidebar.test.tsx` enforces parity via the
 * BLOCK_KIND_OPTIONS.length === PALETTE_SIDEBAR_ITEMS.length
 * invariant).
 */
export const PALETTE_SIDEBAR_ITEMS: readonly PaletteSidebarItem[] =
  BLOCK_KIND_OPTIONS.map((opt): PaletteSidebarItem => {
    switch (opt.kind) {
      case 'callout':
        return { ...opt, glyph: '!', description: 'Note · tip · warning · danger' };
      case 'componentCode':
        return { ...opt, glyph: '</>', description: 'TS · JS · Python · syntax-highlighted' };
      case 'image':
        return { ...opt, glyph: '◨', description: 'Photo · figure · diagram' };
      // Wave 6 cf-25 — 9th kind. Glyph 'T' (typographic mark) is
      // intentionally neutral; per ADR-0018 v0.9 D11.b prose IS the
      // document substrate, NOT an accent block.
      case 'markdown':
        return { ...opt, glyph: 'T', description: 'Heading · paragraph · list · quote' };
      case 'math':
        return { ...opt, glyph: '∑', description: 'KaTeX inline + display' };
      case 'pdf':
        return { ...opt, glyph: '¶', description: 'Embedded PDF + page select' };
      case 'jupyter':
        return { ...opt, glyph: '▶', description: 'Live notebook cell' };
      case 'nn-viz':
        return { ...opt, glyph: '◇', description: 'Neural network diagram' };
      case 'agent-flow':
        return { ...opt, glyph: '⤳', description: 'Agent step graph' };
      default: {
        // Unreachable at type level (BlockAffordanceKind is exhaustive);
        // runtime fallback returns a generic glyph so an unknown kind
        // doesn't crash the rail. Test enforces no-unknown-kind via
        // BLOCK_KIND_OPTIONS.length parity.
        const exhaustiveCheck: never = opt.kind;
        return { ...opt, glyph: '?', description: String(exhaustiveCheck) };
      }
    }
  });

export interface PaletteSidebarProps {
  /** Tiptap editor instance; null until onCreate fires. */
  editor: Editor | null;
  /** Override the default 8-item list (testing). Defaults to
   *  PALETTE_SIDEBAR_ITEMS. */
  items?: readonly PaletteSidebarItem[];
  /** Called when a drag from the palette starts; lets the parent
   *  pipeline mark external-source mode. */
  onDragKindStart?: (kind: BlockAffordanceKind) => void;
  /** Called when the drag ends (success OR cancel); lets the
   *  parent pipeline clear external-source mode. */
  onDragKindEnd?: () => void;
  /** Called when the user clicks a palette item (synonymous with
   *  Enter on focused button per cf-22 keyboard parity); appends at
   *  end-of-doc via `appendBlockKind` (cf-24 R1 F5 fix; pre-fix used
   *  `insertBlockKind` which inserted at user selection + lied in
   *  the "at end of document" announce). */
  onInsert?: (kind: BlockAffordanceKind) => void;
}

const railStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '13.5px',
  fontFamily: 'var(--sans)',
  padding: '14px 12px',
  height: '100%',
  overflow: 'auto',
};

const wsPillStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 9px',
  borderRadius: '6px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text-2)',
  marginBottom: '6px',
};

const wsPillTileStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 5,
  background: 'var(--accent)',
  display: 'grid',
  placeItems: 'center',
  color: 'white',
  fontWeight: 700,
  fontSize: 12,
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-3)',
  margin: '12px 4px 4px',
  fontWeight: 600,
};

const palItemStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'flex-start',
  padding: '9px 10px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  cursor: 'grab',
  userSelect: 'none',
  textAlign: 'left',
  font: 'inherit',
  color: 'var(--text)',
  width: '100%',
};

const glyphStyle: CSSProperties = {
  width: 28,
  height: 28,
  flex: '0 0 28px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 5,
  background: 'oklch(96% 0.01 80)',
  border: '1px solid var(--border)',
  fontSize: 13,
  color: 'var(--text-2)',
  fontFamily: 'var(--mono)',
};

const lblStyle: CSSProperties = {
  fontWeight: 600,
  color: 'var(--text)',
  fontSize: '13.5px',
};

const descStyle: CSSProperties = {
  color: 'var(--text-3)',
  fontSize: '11.5px',
  lineHeight: 1.4,
  marginTop: 2,
};

const hintStyle: CSSProperties = {
  marginTop: 'auto',
  padding: '10px 11px',
  fontSize: '11.5px',
  lineHeight: 1.5,
  color: 'var(--text-3)',
  background: 'oklch(97% 0.005 80)',
  border: '1px dashed var(--border-strong)',
  borderRadius: '6px',
};

export function PaletteSidebar(props: PaletteSidebarProps) {
  const {
    editor,
    items = PALETTE_SIDEBAR_ITEMS,
    onDragKindStart,
    onDragKindEnd,
    onInsert,
  } = props;

  const handleDragStart = useCallback(
    (kind: BlockAffordanceKind) => (event: DragEvent<HTMLButtonElement>) => {
      // External-source drag protocol per ADR-0017 v0.4 D14:
      // write MIME + transparent drag image so the pipeline can
      // detect external-source via dataTransfer at drop time.
      writeBlockKindToDataTransfer(event.dataTransfer, kind);
      onDragKindStart?.(kind);
    },
    [onDragKindStart],
  );

  const handleDragEnd = useCallback(() => {
    onDragKindEnd?.();
  }, [onDragKindEnd]);

  const handleClick = useCallback(
    (kind: BlockAffordanceKind) => () => {
      // cf-22 keyboard parity (WCAG 2.1.1) — click is synonymous
      // with Enter on focused button. Append at deterministic
      // doc-end via `appendBlockKind` (NOT `insertBlockKind` which
      // inserts at user's current selection). Pre-cf-24-R1-F5 the
      // click/Enter path used `insertBlockKind` while the
      // `formatPaletteInsert` announce said "Added X block at end
      // of document" — when the user's selection was mid-doc the
      // announce LIED to AT users (insertion landed at cursor, not
      // at end). The pipeline grid-position mutation only happens
      // on the drag path (external drag → applyDropMode); click
      // takes the block's default attrs.
      //
      // Order: append FIRST, only fire `onInsert` (the announce
      // hook) on success. Don't announce a phantom insertion if
      // appendBlockKind returned null (editor invalid / unknown
      // kind / chain failure).
      const insertPos = appendBlockKind(editor, kind);
      if (insertPos !== null) {
        onInsert?.(kind);
      }
    },
    [editor, onInsert],
  );

  return (
    <nav
      aria-label="Component library"
      data-skb-palette-sidebar=""
      style={railStyle}
    >
      <div className="ws-pill-hoverable" style={wsPillStyle} title="Component library">
        <div style={wsPillTileStyle}>K</div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-3)',
              lineHeight: 1.2,
            }}
          >
            SelfKnowledgeBase
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Component library
          </div>
        </div>
      </div>

      <h4 style={sectionHeadingStyle}>Drag to insert</h4>
      {items.map((item) => (
        <button
          key={item.kind}
          aria-label={`Insert ${item.label} block`}
          className={`pal-item k-${item.kind}`}
          data-skb-palette-item=""
          data-skb-palette-kind={item.kind}
          draggable
          onClick={handleClick(item.kind)}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart(item.kind)}
          style={palItemStyle}
          type="button"
        >
          <span aria-hidden="true" className="glyph" style={glyphStyle}>
            {item.glyph}
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="lbl" style={lblStyle}>
              {item.label}
            </div>
            <div className="desc" style={descStyle}>
              {item.description}
            </div>
          </div>
        </button>
      ))}

      <div style={hintStyle}>
        <strong style={{ color: 'var(--text-2)' }}>Tip</strong>
        <br />
        Drag any block onto the editor canvas, or click to insert at
        the end. Press <kbd style={{ fontFamily: 'var(--mono)', fontSize: '10.5px' }}>Cmd+K</kbd>
        {' '}for the command-bar palette.
      </div>
    </nav>
  );
}
