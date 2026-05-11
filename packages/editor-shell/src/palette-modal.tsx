/**
 * @skb/editor-shell PaletteModal — Cmd+K command-bar style modal
 * overlay listing every registered block kind. Power-user keyboard-
 * first insertion surface.
 *
 * Wave 6 cf-24 (2026-05-10) renamed from `Palette` → `PaletteModal`
 * per ADR-0018 v0.8 D10.e to disambiguate from the new persistent
 * left-rail PaletteSidebar (cf-24 D3 — both surfaces are PERMANENT
 * first-class siblings; modal is load-bearing for mobile UX where
 * the rail is hidden < 768px). Atomic rename — no deprecation alias.
 *
 * Triggered by Ctrl+K / Cmd+K (any keystroke layer) + Escape closes.
 * Click-to-insert appends the chosen block at end-of-doc via
 * `insertBlockKind`. NOT bound to a drag pipeline — the modal is
 * a click-only insertion path.
 */
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Editor } from '@tiptap/core';
import {
  BLOCK_KIND_OPTIONS,
  insertBlockKind,
  type BlockAffordanceKind,
  type BlockKindOption,
} from './registry-wire';

export interface PaletteModalProps {
  editor: Editor | null;
  kinds?: readonly BlockKindOption[];
  onInsert?: (kind: BlockAffordanceKind) => void;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 30,
  display: 'grid',
  placeItems: 'start center',
  paddingTop: '12vh',
  background: 'oklch(0% 0 0 / 0.18)',
  fontFamily: 'var(--sans)',
};

const dialogStyle: CSSProperties = {
  width: 'min(420px, calc(100vw - 32px))',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'var(--space-2)',
};

const buttonStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  border: 0,
  borderRadius: 'var(--radius)',
  background: 'transparent',
  color: 'var(--text)',
  padding: 'var(--space-2) var(--space-3)',
  font: 'inherit',
  cursor: 'pointer',
};

export function PaletteModal(props: PaletteModalProps) {
  const { editor, kinds = BLOCK_KIND_OPTIONS, onInsert } = props;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!open) return null;

  const insert = (kind: BlockAffordanceKind) => {
    onInsert?.(kind);
    insertBlockKind(editor, kind);
    setOpen(false);
  };

  return (
    <div style={overlayStyle}>
      <div aria-label="Block palette" role="dialog" style={dialogStyle}>
        {kinds.map((option) => (
          <button
            aria-label={option.label}
            key={option.kind}
            onClick={() => insert(option.kind)}
            style={buttonStyle}
          >
            <span>{option.label}</span>
            <code style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
              {option.mdxComponent}
            </code>
          </button>
        ))}
      </div>
    </div>
  );
}
