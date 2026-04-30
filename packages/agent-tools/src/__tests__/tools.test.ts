import { describe, it, expect } from 'vitest';
import { toolSchemas } from '../tools';

describe('agent tool schemas', () => {
  it('exposes 11 tools (4 read-only + 7 mutating)', () => {
    expect(Object.keys(toolSchemas).length).toBe(11);
  });

  it('1:1 mutating tools mirror editor-commands', () => {
    const mutating = [
      'create_page',
      'delete_page',
      'insert_block',
      'edit_block',
      'delete_block',
      'move_block',
      'update_frontmatter',
    ];
    for (const name of mutating) {
      expect(toolSchemas).toHaveProperty(name);
    }
  });

  it('list_pages takes no input', () => {
    expect(toolSchemas.list_pages.input.safeParse({}).success).toBe(true);
  });

  it('strict mode rejects unknown keys in read-only tool input', () => {
    expect(
      toolSchemas.list_pages.input.safeParse({ extra: 1 }).success,
    ).toBe(false);
  });

  it('insert_block input validates against editor-commands shape', () => {
    const ok = toolSchemas.insert_block.input.safeParse({
      pageSlug: 'foo',
      position: 0,
      blockType: 'callout',
      props: {},
      content: '',
    });
    expect(ok.success).toBe(true);
  });

  it('search rejects empty query', () => {
    expect(toolSchemas.search.input.safeParse({ query: '' }).success).toBe(
      false,
    );
  });

  it('read_page rejects invalid slug (Major 2 fix)', () => {
    expect(
      toolSchemas.read_page.input.safeParse({ pageSlug: '' }).success,
    ).toBe(false);
    expect(
      toolSchemas.read_page.input.safeParse({ pageSlug: '../etc' }).success,
    ).toBe(false);
    expect(
      toolSchemas.read_page.input.safeParse({ pageSlug: 'note-1' }).success,
    ).toBe(true);
  });

  it('create_page input rejects unknown nested frontmatter field', () => {
    const r = toolSchemas.create_page.input.safeParse({
      pageSlug: 'foo',
      frontmatter: { title: 'Hi', date: '2026-04-29', evil: 'payload' },
    });
    expect(r.success).toBe(false);
  });

  it('update_frontmatter input rejects unknown nested patch field', () => {
    const r = toolSchemas.update_frontmatter.input.safeParse({
      pageSlug: 'foo',
      patch: { tite: 'agent typo', tag: ['note'] },
    });
    expect(r.success).toBe(false);
  });
});
