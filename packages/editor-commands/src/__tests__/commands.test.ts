import { describe, it, expect } from 'vitest';
import { commandSchemas, parseCommand, slugSchema } from '../commands';

describe('editor-commands schemas', () => {
  it('insert_block accepts a valid command', () => {
    const r = parseCommand({
      type: 'insert_block',
      pageSlug: 'foo',
      position: 0,
      blockType: 'callout',
      props: { type: 'info' },
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown command type', () => {
    const r = parseCommand({ type: 'nonsense', foo: 1 });
    expect(r.success).toBe(false);
  });

  it('exposes 7 commands', () => {
    expect(Object.keys(commandSchemas).sort()).toEqual([
      'create_page',
      'delete_block',
      'delete_page',
      'edit_block',
      'insert_block',
      'move_block',
      'update_frontmatter',
    ]);
  });

  it('strict mode rejects unknown keys', () => {
    const r = parseCommand({
      type: 'delete_page',
      pageSlug: 'foo',
      unknown: 'extra',
    });
    expect(r.success).toBe(false);
  });

  it('slugSchema rejects invalid slugs (path traversal, uppercase, spaces)', () => {
    expect(slugSchema.safeParse('Foo').success).toBe(false);
    expect(slugSchema.safeParse('../etc/passwd').success).toBe(false);
    expect(slugSchema.safeParse('foo bar').success).toBe(false);
    expect(slugSchema.safeParse('foo/bar').success).toBe(false);
    expect(slugSchema.safeParse('foo-bar-123').success).toBe(true);
  });

  it('create_page requires frontmatter (title + date)', () => {
    const missing = parseCommand({
      type: 'create_page',
      pageSlug: 'note-1',
      frontmatter: { title: 'Hello' },
    });
    expect(missing.success).toBe(false);

    const ok = parseCommand({
      type: 'create_page',
      pageSlug: 'note-1',
      frontmatter: { title: 'Hello', date: '2026-04-29' },
    });
    expect(ok.success).toBe(true);
  });

  it('edit_block rejects no-op (neither props nor content)', () => {
    const noop = parseCommand({
      type: 'edit_block',
      pageSlug: 'foo',
      blockId: 'b1',
    });
    expect(noop.success).toBe(false);

    const ok = parseCommand({
      type: 'edit_block',
      pageSlug: 'foo',
      blockId: 'b1',
      content: 'updated',
    });
    expect(ok.success).toBe(true);
  });

  it('update_frontmatter accepts typed partial patch', () => {
    const r = parseCommand({
      type: 'update_frontmatter',
      pageSlug: 'foo',
      patch: { tags: ['note'] },
    });
    expect(r.success).toBe(true);
  });

  it('create_page rejects unknown nested frontmatter field', () => {
    const r = parseCommand({
      type: 'create_page',
      pageSlug: 'foo',
      frontmatter: { title: 'Hi', date: '2026-04-29', evil: 'payload' },
    });
    expect(r.success).toBe(false);
  });

  it('update_frontmatter rejects unknown nested patch field', () => {
    const r = parseCommand({
      type: 'update_frontmatter',
      pageSlug: 'foo',
      patch: { tite: 'agent typo', tag: ['note'] },
    });
    expect(r.success).toBe(false);
  });
});
