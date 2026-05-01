import { describe, it, expect } from 'vitest';
import { slashMenuConfigSchema, defaultSlashMenuConfig, findItem, listCommands, buildEditBlockInput, defaultCommandBindings } from '../core';

describe('slashMenuConfigSchema', () => {
  it('accepts a valid config and rejects unknown keys (.strict)', () => {
    const ok = slashMenuConfigSchema.safeParse({
      items: [{ id: 'h1', trigger: 'h1', label: 'Heading 1', category: 'heading', command: 'toggleHeading1' }],
    });
    expect(ok.success).toBe(true);

    const bad = slashMenuConfigSchema.safeParse({
      items: [{ id: 'h1', trigger: 'h1', label: 'Heading 1', category: 'heading', command: 'toggleHeading1' }],
      extra: 'x',
    });
    expect(bad.success).toBe(false);
  });

  it('rejects empty items array (min(1))', () => {
    const r = slashMenuConfigSchema.safeParse({ items: [] });
    expect(r.success).toBe(false);
  });

  it('defaultSlashMenuConfig.items aligns with the wave 2 slash-menu defaults (10 items)', () => {
    expect(defaultSlashMenuConfig.items.map((item) => item.id)).toEqual([
      'h1',
      'h2',
      'h3',
      'bulletList',
      'orderedList',
      'taskList',
      'callout',
      'code',
      'math',
      'image',
    ]);
    expect(defaultSlashMenuConfig.items.map((item) => item.category)).toEqual([
      'heading',
      'heading',
      'heading',
      'list',
      'list',
      'list',
      'block',
      'block',
      'block',
      'media',
    ]);
    expect(defaultSlashMenuConfig.items.map((item) => item.trigger)).toEqual([
      'h1',
      'h2',
      'h3',
      'bullet',
      'ordered',
      'task',
      'callout',
      'code',
      'math',
      'image',
    ]);
    expect(defaultSlashMenuConfig.items).toHaveLength(10);
  });

  it('findItem + listCommands + defaultCommandBindings agree', () => {
    expect(findItem(defaultSlashMenuConfig, 'h1')?.command).toBe('toggleHeading1');
    expect(findItem(defaultSlashMenuConfig, 'nonsense')).toBeUndefined();
    expect(listCommands(defaultSlashMenuConfig)).toContain('insertImage');
    expect(defaultCommandBindings.image).toBe('insertImage');
    expect(findItem(defaultSlashMenuConfig, 'orderedList')?.command).toBe('toggleOrderedList');
    expect(defaultCommandBindings.taskList).toBe('toggleTaskList');
  });

  it('buildEditBlockInput delegates to editBlockInputSchema (cross-package authority)', () => {
    const ok = buildEditBlockInput('foo', 'b1', { content: 'updated' });
    expect(ok).toEqual({ pageSlug: 'foo', blockId: 'b1', content: 'updated' });

    expect(() => buildEditBlockInput('foo', 'b1', {})).toThrow(
      /at least one of props or content/,
    );

    expect(() => buildEditBlockInput('Foo', 'b1', { content: 'x' })).toThrow();
  });
});
