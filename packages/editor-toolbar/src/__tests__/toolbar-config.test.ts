import { describe, it, expect } from 'vitest';
import {
  toolbarConfigSchema,
  defaultToolbarConfig,
  findButton,
  listCommands,
  buildEditBlockInput,
  defaultCommandBindings,
} from '../core';

describe('toolbarConfigSchema', () => {
  it('accepts a valid config and rejects unknown keys (.strict)', () => {
    const ok = toolbarConfigSchema.safeParse({
      buttons: [{ id: 'bold', command: 'toggleBold', icon: 'bold', label: 'Bold' }],
    });
    expect(ok.success).toBe(true);

    const bad = toolbarConfigSchema.safeParse({
      buttons: [{ id: 'bold', command: 'toggleBold', icon: 'bold', label: 'Bold' }],
      extra: 'x',
    });
    expect(bad.success).toBe(false);
  });

  it('rejects empty buttons array (min(1))', () => {
    const r = toolbarConfigSchema.safeParse({ buttons: [] });
    expect(r.success).toBe(false);
  });

  it('defaultToolbarConfig.buttons aligns with block-foundation prose extensions (9 buttons, no underline/link)', () => {
    const ids = defaultToolbarConfig.buttons.map((b) => b.id);
    expect(ids).toEqual([
      'bold',
      'italic',
      'strike',
      'h1',
      'h2',
      'h3',
      'bulletList',
      'orderedList',
      'code',
    ]);
    expect(ids).not.toContain('underline');
    expect(ids).not.toContain('link');
  });

  it('findButton + listCommands + defaultCommandBindings agree', () => {
    expect(findButton(defaultToolbarConfig, 'bold')?.command).toBe('toggleBold');
    expect(findButton(defaultToolbarConfig, 'nonsense')).toBeUndefined();
    expect(listCommands(defaultToolbarConfig)).toContain('toggleBold');
    expect(defaultCommandBindings.bold).toBe('toggleBold');
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
