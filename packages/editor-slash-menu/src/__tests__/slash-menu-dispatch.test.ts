import { describe, it, expect, vi } from 'vitest';
import type { ChainedCommands, Editor } from '@tiptap/core';
import { runDefaultSlashCommand, isDefaultCommandActive } from '../ui-default/dispatch';
import { defaultSlashMenuConfig } from '../core/slash-menu-config';

interface ChainCallLog {
  readonly calls: string[];
  readonly args: unknown[][];
}

function makeMockChain(): { chain: ChainedCommands; log: ChainCallLog } {
  const log: ChainCallLog = { calls: [], args: [] };
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'run') return () => true;
      const method = String(prop);
      return (...args: unknown[]) => {
        log.calls.push(method);
        log.args.push(args);
        return new Proxy({}, handler);
      };
    },
  };
  const chain = new Proxy({}, handler) as unknown as ChainedCommands;
  return { chain, log };
}

describe('runDefaultSlashCommand', () => {
  it('routes heading commands to toggleHeading({level})', () => {
    const c1 = makeMockChain();
    runDefaultSlashCommand('toggleHeading1', c1.chain);
    expect(c1.log.calls).toEqual(['focus', 'toggleHeading']);
    expect(c1.log.args[1]).toEqual([{ level: 1 }]);

    const c2 = makeMockChain();
    runDefaultSlashCommand('toggleHeading2', c2.chain);
    expect(c2.log.calls).toEqual(['focus', 'toggleHeading']);
    expect(c2.log.args[1]).toEqual([{ level: 2 }]);

    const c3 = makeMockChain();
    runDefaultSlashCommand('toggleHeading3', c3.chain);
    expect(c3.log.calls).toEqual(['focus', 'toggleHeading']);
    expect(c3.log.args[1]).toEqual([{ level: 3 }]);
  });

  it('routes list commands to their list chain methods', () => {
    const b = makeMockChain();
    runDefaultSlashCommand('toggleBulletList', b.chain);
    expect(b.log.calls).toEqual(['focus', 'toggleBulletList']);

    const o = makeMockChain();
    runDefaultSlashCommand('toggleOrderedList', o.chain);
    expect(o.log.calls).toEqual(['focus', 'toggleOrderedList']);

    const t = makeMockChain();
    runDefaultSlashCommand('toggleTaskList', t.chain);
    expect(t.log.calls).toEqual(['focus', 'toggleTaskList']);
  });

  it('routes block/ media commands via insertion methods', () => {
    const callout = makeMockChain();
    runDefaultSlashCommand('insertCallout', callout.chain);
    expect(callout.log.calls).toEqual(['focus', 'insertContent']);
    expect(callout.log.args[1]).toEqual([{ type: 'callout', content: [] }]);

    const code = makeMockChain();
    runDefaultSlashCommand('insertCodeBlock', code.chain);
    expect(code.log.calls).toEqual(['focus', 'setCodeBlock']);

    const math = makeMockChain();
    runDefaultSlashCommand('insertMathBlock', math.chain);
    expect(math.log.calls).toEqual(['focus', 'insertContent']);
    expect(math.log.args[1]).toEqual([{ type: 'math', content: [] }]);

    const image = makeMockChain();
    runDefaultSlashCommand('insertImage', image.chain);
    expect(image.log.calls).toEqual(['focus', 'insertContent']);
    expect(image.log.args[1]).toEqual([{ type: 'image', attrs: { src: '' } }]);
  });

  it('returns false for unknown commands without invoking any non-focus command', () => {
    const { chain, log } = makeMockChain();
    const result = runDefaultSlashCommand('toggleUnderline', chain);
    expect(result).toBe(false);
    expect(log.calls).toEqual(['focus']);

    const r2 = makeMockChain();
    expect(runDefaultSlashCommand('setLink', r2.chain)).toBe(false);
    expect(runDefaultSlashCommand('nonsense', r2.chain)).toBe(false);
  });

  it('every defaultSlashMenuConfig item command dispatches', () => {
    for (const item of defaultSlashMenuConfig.items) {
      const { chain, log } = makeMockChain();
      const result = runDefaultSlashCommand(item.command, chain);
      expect(result, `item ${item.id} (${item.command}) must dispatch`).toBe(true);
      expect(log.calls[0]).toBe('focus');
      expect(log.calls.length).toBeGreaterThan(1);
    }
  });
});

describe('isDefaultCommandActive', () => {
  it('queries editor.isActive with matching state keys', () => {
    const isActive = vi.fn().mockReturnValue(true);
    const editor = { isActive } as unknown as Editor;

    expect(isDefaultCommandActive(editor, 'toggleHeading2')).toBe(true);
    expect(isActive).toHaveBeenLastCalledWith('heading', { level: 2 });

    isDefaultCommandActive(editor, 'toggleTaskList');
    expect(isActive).toHaveBeenLastCalledWith('taskList');

    isDefaultCommandActive(editor, 'insertImage');
    expect(isActive).toHaveBeenLastCalledWith('image');
  });

  it('returns false for unknown commands without querying editor', () => {
    const isActive = vi.fn().mockReturnValue(true);
    const editor = { isActive } as unknown as Editor;

    expect(isDefaultCommandActive(editor, 'toggleUnderline')).toBe(false);
    expect(isDefaultCommandActive(editor, 'setLink')).toBe(false);
    expect(isActive).not.toHaveBeenCalled();
  });
});
