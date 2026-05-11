/**
 * @skb/editor-shell PaletteSidebar unit tests (Wave 6 cf-24).
 *
 * Covers cf-24 D4 (BLOCK_KIND_OPTIONS parity invariant) +
 * structural / a11y assertions parallel to the affordances suite.
 * Pure React Testing Library; the drag protocol pieces
 * (writeBlockKindToDataTransfer + readBlockKindFromDataTransfer)
 * have their own dedicated unit at
 * `__tests__/drag-drop/external-drop-source.test.ts`.
 */
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { PaletteSidebar, PALETTE_SIDEBAR_ITEMS } from '../palette-sidebar';
import { BLOCK_KIND_OPTIONS, wireRegistry } from '../registry-wire';

function makeEditor(): Editor {
  const wire = wireRegistry({});
  return new Editor({ extensions: [StarterKit, ...wire.extensions] });
}

afterEach(() => {
  cleanup();
});

describe('PALETTE_SIDEBAR_ITEMS parity invariant (cf-24 D4)', () => {
  it('matches BLOCK_KIND_OPTIONS length', () => {
    expect(PALETTE_SIDEBAR_ITEMS).toHaveLength(BLOCK_KIND_OPTIONS.length);
  });

  it('every BLOCK_KIND_OPTIONS member has a corresponding sidebar item', () => {
    const itemKinds = new Set(PALETTE_SIDEBAR_ITEMS.map((i) => i.kind));
    for (const opt of BLOCK_KIND_OPTIONS) {
      expect(itemKinds.has(opt.kind)).toBe(true);
    }
  });

  it('every sidebar item has a non-empty glyph + description', () => {
    for (const item of PALETTE_SIDEBAR_ITEMS) {
      expect(item.glyph).toBeTruthy();
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('preserves BlockKindOption identity (kind + label + mdxComponent)', () => {
    for (const item of PALETTE_SIDEBAR_ITEMS) {
      const source = BLOCK_KIND_OPTIONS.find((o) => o.kind === item.kind);
      expect(source).toBeDefined();
      expect(item.label).toBe(source!.label);
      expect(item.mdxComponent).toBe(source!.mdxComponent);
    }
  });
});

describe('PaletteSidebar render', () => {
  it('renders a nav landmark with aria-label "Component library"', () => {
    render(createElement(PaletteSidebar, { editor: null }));
    expect(screen.getByRole('navigation', { name: 'Component library' })).toBeTruthy();
  });

  it('renders 8 palette item buttons (one per BLOCK_KIND_OPTIONS member)', () => {
    render(createElement(PaletteSidebar, { editor: null }));
    const buttons = screen.getAllByRole('button');
    // Filter to palette items via aria-label prefix (ws-pill is a div).
    const paletteButtons = buttons.filter((b) =>
      (b.getAttribute('aria-label') ?? '').startsWith('Insert '),
    );
    expect(paletteButtons).toHaveLength(BLOCK_KIND_OPTIONS.length);
  });

  it('emits per-kind className `pal-item k-${kind}` for hue-tint hookup', () => {
    render(createElement(PaletteSidebar, { editor: null }));
    for (const opt of BLOCK_KIND_OPTIONS) {
      const item = document.querySelector(
        `[data-skb-palette-item][data-skb-palette-kind="${opt.kind}"]`,
      );
      expect(item).toBeTruthy();
      expect(item!.className).toContain('pal-item');
      expect(item!.className).toContain(`k-${opt.kind}`);
    }
  });

  it('items render as real <button type="button"> for cf-22 keyboard parity', () => {
    render(createElement(PaletteSidebar, { editor: null }));
    const items = document.querySelectorAll('[data-skb-palette-item]');
    expect(items.length).toBe(BLOCK_KIND_OPTIONS.length);
    for (const item of items) {
      expect(item.tagName.toLowerCase()).toBe('button');
      expect(item.getAttribute('type')).toBe('button');
      expect(item.getAttribute('draggable')).toBe('true');
    }
  });

  it('glyph spans are aria-hidden so AT reads only the label', () => {
    render(createElement(PaletteSidebar, { editor: null }));
    const glyphs = document.querySelectorAll('[data-skb-palette-item] .glyph');
    expect(glyphs.length).toBe(BLOCK_KIND_OPTIONS.length);
    for (const glyph of glyphs) {
      expect(glyph.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('PaletteSidebar click-to-insert (cf-24 D5 + cf-22 keyboard parity + R1 F5 fix)', () => {
  it('clicking an item with a real editor fires onInsert with the kind AFTER successful append', () => {
    // cf-24 R1 F5 fix — handleClick now calls `appendBlockKind`
    // FIRST + only fires `onInsert` (the announce hook) on
    // success. Pre-R1-F5 the order was reversed (announce, then
    // insert) and `onInsert` fired even when the underlying
    // insert returned false. Post-fix, with `editor: null` the
    // append fails + onInsert is NOT called (= truthful announce
    // contract: don't announce phantom insertions).
    const editor = makeEditor();
    const onInsert = vi.fn();
    render(createElement(PaletteSidebar, { editor, onInsert }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert Callout block' }),
    );
    expect(onInsert).toHaveBeenCalledWith('callout');
    editor.destroy();
  });

  it('clicking with editor=null does NOT fire onInsert (R1 F5 truthful-announce contract)', () => {
    // R1 F5 anti-regression: the pre-fix order called `onInsert`
    // unconditionally before attempting the insert; the LiveAnnouncer
    // would speak "Added X block" even when no block was added (e.g.
    // editor not yet hydrated). Post-fix `onInsert` only fires when
    // `appendBlockKind` returned a non-null insert position.
    const onInsert = vi.fn();
    render(createElement(PaletteSidebar, { editor: null, onInsert }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert Callout block' }),
    );
    expect(onInsert).not.toHaveBeenCalled();
  });

  it('clicking appends the block at END of doc (R1 F5 deterministic-end), regardless of selection', () => {
    // R1 F5 anti-regression at the unit level: even with a
    // mid-doc selection, the new block lands at end. This is the
    // unit-test analog of AC3-7 in the Playwright suite.
    const editor = makeEditor();
    // Seed two blocks via the same code path so the test exercises
    // a real doc with multiple children.
    editor.chain().insertContentAt(editor.state.doc.content.size, {
      type: 'image',
      attrs: { col: 1, colSpan: 12, rowSpan: 1 },
    }).run();
    editor.chain().insertContentAt(editor.state.doc.content.size, {
      type: 'math',
      attrs: { col: 1, colSpan: 12, rowSpan: 1 },
    }).run();
    expect(editor.state.doc.lastChild?.type.name).toBe('math');

    // Move selection to doc start.
    editor.commands.setTextSelection(0);

    // Click the Callout palette item.
    render(createElement(PaletteSidebar, { editor }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert Callout block' }),
    );

    // F5 critical: callout lands at END (last-child), NOT at
    // selection (which was doc-start).
    expect(editor.state.doc.lastChild?.type.name).toBe('callout');
    editor.destroy();
  });
});
