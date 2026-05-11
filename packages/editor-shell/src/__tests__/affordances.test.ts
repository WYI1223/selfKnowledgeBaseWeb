import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Editor } from '@tiptap/core';
import { PaletteModal } from '../palette-modal';
import { SlashMenu } from '../slash-menu';
import { DragHandle } from '../drag-handle';
import { Toolbar } from '../toolbar';
import { EditModeBanner } from '../edit-mode-banner';
import { SaveIndicator } from '../save-indicator';
import { BLOCK_KIND_OPTIONS, wireRegistry } from '../registry-wire';

afterEach(() => {
  cleanup();
});

function fakeToolbarEditor() {
  const toggleBold = vi.fn();
  const toggleItalic = vi.fn();
  const chain = {
    focus: () => chain,
    toggleBold: () => {
      toggleBold();
      return chain;
    },
    toggleItalic: () => {
      toggleItalic();
      return chain;
    },
    run: () => true,
  };

  return {
    editor: {
      state: { selection: { from: 1, to: 4, empty: false } },
      isActive: (mark: string) => mark === 'bold',
      chain: () => chain,
      on: () => undefined,
      off: () => undefined,
    } as unknown as Editor,
    toggleBold,
    toggleItalic,
  };
}

describe('C.4-3 user affordances', () => {
  it('palette modal opens with Ctrl+K and lists the 8 block kinds', () => {
    const onInsert = vi.fn();
    render(createElement(PaletteModal, { editor: null, onInsert }));

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(screen.getByRole('dialog', { name: 'Block palette' })).toBeTruthy();
    for (const option of BLOCK_KIND_OPTIONS) {
      expect(screen.getByRole('button', { name: option.label })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole('button', { name: 'Code' }));
    expect(onInsert).toHaveBeenCalledWith('componentCode');
  });

  it('slash menu opens from a line-start slash and inserts the selected kind', () => {
    const dom = document.createElement('div');
    const onInsert = vi.fn();
    const editor = {
      view: { dom },
      state: { selection: { $from: { parentOffset: 0, parent: { textContent: '' } } } },
    } as unknown as Editor;
    render(createElement(SlashMenu, { editor, onInsert }));

    fireEvent.keyDown(dom, { key: '/' });
    expect(screen.getByRole('menu', { name: 'Slash block menu' })).toBeTruthy();

    fireEvent.keyDown(dom, { key: 'ArrowDown' });
    fireEvent.keyDown(dom, { key: 'Enter' });
    expect(onInsert).toHaveBeenCalledWith('componentCode');
  });

  it('drag handle exposes a per-block handle and drop preview pulse', () => {
    render(createElement(DragHandle, { label: 'Block drag handle' }));
    const handle = screen.getByLabelText('Block drag handle');

    expect(handle.getAttribute('draggable')).toBe('true');
    fireEvent.dragStart(handle);
    fireEvent.dragEnd(handle);

    expect(screen.getByTestId('skb-drop-preview')).toBeTruthy();
  });

  it('toolbar bold and italic buttons toggle Tiptap marks', () => {
    const { editor, toggleBold, toggleItalic } = fakeToolbarEditor();
    render(createElement(Toolbar, { editor }));

    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    expect(bold.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(bold);
    fireEvent.click(italic);
    expect(toggleBold).toHaveBeenCalledOnce();
    expect(toggleItalic).toHaveBeenCalledOnce();
  });

  it('edit mode banner renders only for edit routes', () => {
    const { rerender } = render(createElement(EditModeBanner, { editMode: false }));
    expect(screen.queryByText(/Edit Mode/)).toBeNull();

    rerender(createElement(EditModeBanner, { editMode: true }));
    expect(screen.getByText(/Edit Mode/)).toBeTruthy();
  });

  it('save indicator renders unsaved, saving, and saved states', () => {
    const { rerender } = render(createElement(SaveIndicator, { status: 'unsaved' }));
    expect(screen.getByText('Unsaved changes')).toBeTruthy();

    rerender(createElement(SaveIndicator, { status: 'saving' }));
    expect(screen.getByText('Saving...')).toBeTruthy();

    rerender(createElement(SaveIndicator, { status: 'saved', savedAt: new Date(0) }));
    expect(screen.getByText(/Saved at/)).toBeTruthy();
  });

  it('registry wire exposes block insertion extensions for all 8 kinds', () => {
    const wired = wireRegistry({});
    expect(wired.blockKinds.map((kind) => kind.kind)).toEqual(
      BLOCK_KIND_OPTIONS.map((kind) => kind.kind),
    );
    expect(wired.extensions).toHaveLength(8);
  });
});
