/**
 * @skb/editor-shell registry-wire helpers — vitest unit tests
 * (Wave 6 cf-24 R0 F1 fix; 2026-05-10).
 *
 * Locks the helper-pair distinction documented in CONTRACT.md:
 * - `insertBlockKind` inserts at the user's CURRENT SELECTION
 *   (used by slash-menu + PaletteModal Cmd+K command bar).
 * - `appendBlockKind` appends at DETERMINISTIC doc-end position
 *   and returns the insert pos (used by cf-24 PaletteSidebar
 *   external-source drag → commitExternalDrop).
 *
 * The cf-24 R0 F1 bug: pre-fix `commitExternalDrop` called
 * `insertBlockKind` which inserts at selection. If the user's
 * selection was mid-doc, the post-snap diff identified the
 * wrong block. Tests below cover both helpers + the failure mode
 * the F1 fix prevents.
 */
import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {
  appendBlockKind,
  insertBlockKind,
  wireRegistry,
} from '../registry-wire';

function makeEditor(content?: object | string): Editor {
  const wire = wireRegistry({});
  return new Editor({
    extensions: [StarterKit, ...wire.extensions],
    ...(content !== undefined && { content }),
  });
}

describe('appendBlockKind (cf-24 R0 F1 fix)', () => {
  it('returns null on null editor', () => {
    expect(appendBlockKind(null, 'callout')).toBeNull();
  });

  it('returns null on unknown kind', () => {
    const editor = makeEditor();
    expect(
      // @ts-expect-error — exercising runtime guard for invalid kind.
      appendBlockKind(editor, 'evil-kind'),
    ).toBeNull();
    editor.destroy();
  });

  it('appends at end-of-doc + returns the deterministic insert position', () => {
    const editor = makeEditor();
    const sizeBeforeInsert = editor.state.doc.content.size;
    const pos = appendBlockKind(editor, 'callout');
    expect(pos).toBe(sizeBeforeInsert);
    // The doc grew by at least 1 (the inserted block node).
    expect(editor.state.doc.content.size).toBeGreaterThan(sizeBeforeInsert);
    // Walk the doc; the LAST block child is the freshly-appended
    // callout (cf-24 R0 F1 deterministic-end contract).
    const lastChild = editor.state.doc.lastChild;
    expect(lastChild?.type.name).toBe('callout');
    editor.destroy();
  });

  it('appends at end EVEN WHEN selection is at doc start (cf-24 R0 F1 anti-regression)', () => {
    // The pre-cf-24-R0 bug: insertBlockKind uses `chain().focus()
    // .insertContent(...)` which inserts at the user's selection.
    // If selection is at doc start, insertContent puts the new
    // block at the BEGINNING of the doc, not the end. The
    // post-snap diff in commit-external-drop walks the post-insert
    // doc + diffs ids; the new block ends up at index 0 (or
    // somewhere mid-doc), and split-* algebra applies the drop
    // attrs to the WRONG block.
    //
    // appendBlockKind's contract: regardless of selection, the new
    // block lands at end-of-doc. This test sets selection to doc
    // start (pos 0) explicitly, then appends, and verifies the new
    // block is the LAST block.
    const editor = makeEditor();
    // Insert two seed blocks so we have something to put a "wrong
    // place" between.
    appendBlockKind(editor, 'image');
    appendBlockKind(editor, 'math');
    expect(editor.state.doc.lastChild?.type.name).toBe('math');

    // Move selection to doc start.
    editor.commands.setTextSelection(0);

    // Now append a callout. With the F1 fix, callout MUST land at
    // end (after math). The pre-fix bug would have put it at start
    // (before image).
    const callOutPos = appendBlockKind(editor, 'callout');
    expect(callOutPos).not.toBeNull();
    expect(editor.state.doc.lastChild?.type.name).toBe('callout');

    editor.destroy();
  });

  it('insertBlockKind (cursor-at-selection contrast) inserts NOT-at-end when selection is mid-doc', () => {
    // Negative-control: confirm `insertBlockKind` has the SELECTION
    // semantic, so the F1 fix's choice of `appendBlockKind` is
    // load-bearing. If `insertBlockKind` ever changed to also
    // append-at-end, this test would fail and we'd revisit the
    // helper-pair distinction documented in CONTRACT.md.
    const editor = makeEditor();
    appendBlockKind(editor, 'image');
    appendBlockKind(editor, 'math');
    // Move selection to doc start (before the image block).
    editor.commands.setTextSelection(0);
    insertBlockKind(editor, 'callout');
    // Expectation: callout is NOT the last child (because
    // insertBlockKind respects selection). The lastChild is still
    // 'math' from the seed.
    expect(editor.state.doc.lastChild?.type.name).toBe('math');
    editor.destroy();
  });
});
