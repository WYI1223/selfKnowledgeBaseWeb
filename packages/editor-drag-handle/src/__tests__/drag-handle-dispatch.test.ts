import { describe, it, expect } from 'vitest';
import type { ChainedCommands } from '@tiptap/core';
import { runDefaultDragHandleCommand } from '../ui-default/dispatch';
import { defaultDragHandleConfig } from '../core/drag-handle-config';

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

describe('runDefaultDragHandleCommand', () => {
  it('routes duplicate command', () => {
    const { chain, log } = makeMockChain();
    const result = runDefaultDragHandleCommand('duplicate', chain);
    expect(result).toBe(true);
    expect(log.calls).toEqual(['focus', 'duplicateBlock']);
    expect(log.args[1]).toEqual([]);
  });

  it('routes delete / select-block command to the expected chain methods', () => {
    const { chain, log } = makeMockChain();
    runDefaultDragHandleCommand('delete', chain);
    expect(log.calls).toEqual(['focus', 'deleteBlock']);

    const select = makeMockChain();
    runDefaultDragHandleCommand('select-block', select.chain);
    expect(select.log.calls).toEqual(['focus', 'selectCurrentBlock']);
  });

  it('routes move-up / move-down to chain methods with no args', () => {
    const moveUp = makeMockChain();
    runDefaultDragHandleCommand('move-up', moveUp.chain);
    expect(moveUp.log.calls).toEqual(['focus', 'moveBlockUp']);

    const moveDown = makeMockChain();
    runDefaultDragHandleCommand('move-down', moveDown.chain);
    expect(moveDown.log.calls).toEqual(['focus', 'moveBlockDown']);
  });

  it('returns false for unknown commands without invoking extra chain methods', () => {
    const { chain, log } = makeMockChain();
    expect(runDefaultDragHandleCommand('toggleBold', chain)).toBe(false);
    expect(log.calls).toEqual(['focus']);
  });

  it('every defaultDragHandleConfig action command is dispatch-routable', () => {
    for (const action of defaultDragHandleConfig.actions) {
      const { chain, log } = makeMockChain();
      const result = runDefaultDragHandleCommand(action.command, chain);
      expect(result, `action ${action.id} (command ${action.command}) must dispatch`).toBe(true);
      expect(log.calls.length, `action ${action.id} must invoke chain`).toBeGreaterThan(1);
    }
  });

  it('passes empty args for each action command', () => {
    for (const action of defaultDragHandleConfig.actions) {
      const { chain, log } = makeMockChain();
      runDefaultDragHandleCommand(action.command, chain);
      expect(log.args[1]).toEqual([]);
    }
  });
});
