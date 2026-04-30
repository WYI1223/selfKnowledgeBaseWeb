import { describe, it, expect, vi } from 'vitest';
import type { ChainedCommands, Editor } from '@tiptap/core';
import { runDefaultCommand, isDefaultCommandActive } from '../ui-default/dispatch';
import { defaultToolbarConfig } from '../core/toolbar-config';

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

describe('runDefaultCommand', () => {
  it('routes toggleBold → chain.focus().toggleBold().run()', () => {
    const { chain, log } = makeMockChain();
    const result = runDefaultCommand('toggleBold', chain);
    expect(result).toBe(true);
    expect(log.calls).toEqual(['focus', 'toggleBold']);
    expect(log.args[1]).toEqual([]);
  });

  it('routes toggleHeading1 → chain.focus().toggleHeading({level:1}).run() (NOT toggleHeading1)', () => {
    const { chain, log } = makeMockChain();
    runDefaultCommand('toggleHeading1', chain);
    expect(log.calls).toEqual(['focus', 'toggleHeading']);
    expect(log.args[1]).toEqual([{ level: 1 }]);
  });

  it('routes toggleHeading2 / toggleHeading3 with correct level args', () => {
    const r2 = makeMockChain();
    runDefaultCommand('toggleHeading2', r2.chain);
    expect(r2.log.calls).toEqual(['focus', 'toggleHeading']);
    expect(r2.log.args[1]).toEqual([{ level: 2 }]);

    const r3 = makeMockChain();
    runDefaultCommand('toggleHeading3', r3.chain);
    expect(r3.log.calls).toEqual(['focus', 'toggleHeading']);
    expect(r3.log.args[1]).toEqual([{ level: 3 }]);
  });

  it('routes toggleBulletList / toggleOrderedList correctly', () => {
    const r1 = makeMockChain();
    runDefaultCommand('toggleBulletList', r1.chain);
    expect(r1.log.calls).toEqual(['focus', 'toggleBulletList']);

    const r2 = makeMockChain();
    runDefaultCommand('toggleOrderedList', r2.chain);
    expect(r2.log.calls).toEqual(['focus', 'toggleOrderedList']);
  });

  it('routes toggleItalic / toggleStrike / toggleCode correctly', () => {
    for (const cmd of ['toggleItalic', 'toggleStrike', 'toggleCode']) {
      const { chain, log } = makeMockChain();
      runDefaultCommand(cmd, chain);
      expect(log.calls).toEqual(['focus', cmd]);
    }
  });

  it('returns false for unknown commands without invoking the chain', () => {
    const { chain, log } = makeMockChain();
    const result = runDefaultCommand('toggleUnderline', chain);
    expect(result).toBe(false);
    expect(log.calls).toEqual(['focus']);

    const r2 = makeMockChain();
    expect(runDefaultCommand('setLink', r2.chain)).toBe(false);
    expect(runDefaultCommand('nonsense', r2.chain)).toBe(false);
  });

  it('every defaultToolbarConfig button id is dispatch-routable', () => {
    for (const button of defaultToolbarConfig.buttons) {
      const { chain, log } = makeMockChain();
      const result = runDefaultCommand(button.command, chain);
      expect(result, `button ${button.id} (command ${button.command}) must dispatch`).toBe(true);
      expect(log.calls.length, `button ${button.id} must invoke chain`).toBeGreaterThan(1);
    }
  });
});

describe('isDefaultCommandActive', () => {
  it('queries editor.isActive with the matching node/mark name + heading level', () => {
    const isActive = vi.fn().mockReturnValue(true);
    const editor = { isActive } as unknown as Editor;

    expect(isDefaultCommandActive(editor, 'toggleBold')).toBe(true);
    expect(isActive).toHaveBeenLastCalledWith('bold');

    isDefaultCommandActive(editor, 'toggleHeading2');
    expect(isActive).toHaveBeenLastCalledWith('heading', { level: 2 });

    isDefaultCommandActive(editor, 'toggleBulletList');
    expect(isActive).toHaveBeenLastCalledWith('bulletList');
  });

  it('returns false for unknown commands without querying editor', () => {
    const isActive = vi.fn().mockReturnValue(true);
    const editor = { isActive } as unknown as Editor;

    expect(isDefaultCommandActive(editor, 'toggleUnderline')).toBe(false);
    expect(isDefaultCommandActive(editor, 'setLink')).toBe(false);
    expect(isActive).not.toHaveBeenCalled();
  });
});
