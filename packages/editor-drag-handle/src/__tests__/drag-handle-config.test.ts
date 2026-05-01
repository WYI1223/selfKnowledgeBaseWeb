import { describe, it, expect } from 'vitest';
import {
  dragHandleActionSchema,
  dragHandleConfigSchema,
  defaultDragHandleConfig,
  defaultCommandBindings,
  findAction,
  listCommands,
  buildMoveBlockInput,
} from '../core';

describe('dragHandleConfigSchema', () => {
  it('accepts a valid config and rejects unknown keys (.strict)', () => {
    const ok = dragHandleConfigSchema.safeParse({
      actions: [{ id: 'duplicate', command: 'duplicate', label: 'Duplicate', destructive: true }],
    });
    expect(ok.success).toBe(true);

    const bad = dragHandleConfigSchema.safeParse({
      actions: [{ id: 'duplicate', command: 'duplicate', label: 'Duplicate' }],
      extra: 'x',
    });
    expect(bad.success).toBe(false);
  });

  it('rejects empty actions array (min(1))', () => {
    const r = dragHandleConfigSchema.safeParse({ actions: [] });
    expect(r.success).toBe(false);
  });

  it('adds the 5 drag actions', () => {
    const ids = defaultDragHandleConfig.actions.map((action) => action.id);
    const [, deleteAction] = defaultDragHandleConfig.actions;
    expect(ids).toEqual(['duplicate', 'delete', 'moveUp', 'moveDown', 'selectBlock']);
    expect(deleteAction?.destructive).toBe(true);
  });

  it('findAction + listCommands + defaultCommandBindings agree', () => {
    expect(findAction(defaultDragHandleConfig, 'duplicate')?.command).toBe('duplicate');
    expect(findAction(defaultDragHandleConfig, 'nonsense')).toBeUndefined();
    expect(listCommands(defaultDragHandleConfig)).toContain('delete');
    expect(defaultCommandBindings.duplicate).toBe('duplicate');
  });

  it('buildMoveBlockInput enforces move_block command shape', () => {
    const ok = buildMoveBlockInput('foo', 'b1', 3);
    expect(ok).toEqual({ type: 'move_block', pageSlug: 'foo', blockId: 'b1', newPosition: 3 });

    const bad = dragHandleActionSchema.safeParse({
      id: 'bad',
      command: 'move-up',
      label: 'Move Up',
      destructive: 'x',
    });
    expect(bad.success).toBe(false);
  });

  it('buildMoveBlockInput rejects invalid command payload shape', () => {
    expect(() => buildMoveBlockInput('foo', 'b1', -1)).toThrow();
  });
});
