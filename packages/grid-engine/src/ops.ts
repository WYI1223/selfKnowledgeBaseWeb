/**
 * @skb/grid-engine — state-mutating operations.
 *
 * Per docs/design/grid-redesign-2026-05-11.md §3 + §9 (Option A).
 *
 * Every op:
 * 1. Validates the operation against the current state (in bounds + no
 *    overlap + valid id).
 * 2. Returns OpResult — either { ok: true, state: new } or { ok: false,
 *    error: human-readable }.
 * 3. Applies upward gravity (Option A) so the resulting state is always
 *    gravity-stable — no floating blocks left over for a future delete to
 *    surprise-leap.
 *
 * deleteBlock returns GridState directly (no failure mode — deleting a
 * non-existent id is a silent no-op + still applies gravity).
 */
import { findCollidingBlocks, isRegionInBounds } from './collision';
import { applyGravity } from './gravity';
import type { Block, GridState, OpResult } from './types';

export function insertBlock(state: GridState, block: Block): OpResult {
  if (!isRegionInBounds(state, block)) {
    return { ok: false, error: `out of bounds: ${describe(block)}` };
  }
  if (state.blocks.some((b) => b.id === block.id)) {
    return { ok: false, error: `duplicate id: ${block.id}` };
  }
  const colliders = findCollidingBlocks(state, block);
  if (colliders.length > 0) {
    return {
      ok: false,
      error: `overlap with ${colliders.map((b) => b.id).join(', ')}`,
    };
  }
  // Option A: insert always runs gravity → state stays gravity-stable.
  const seeded: GridState = { ...state, blocks: [...state.blocks, block] };
  return { ok: true, state: applyGravity(seeded).state };
}

export function moveBlock(
  state: GridState,
  id: string,
  newCol: number,
  newRow: number,
): OpResult {
  const block = state.blocks.find((b) => b.id === id);
  if (!block) return { ok: false, error: `no such block: ${id}` };
  const moved: Block = { ...block, col: newCol, row: newRow };
  if (!isRegionInBounds(state, moved)) {
    return { ok: false, error: `out of bounds: ${describe(moved)}` };
  }
  const colliders = findCollidingBlocks(state, moved, id);
  if (colliders.length > 0) {
    return {
      ok: false,
      error: `overlap with ${colliders.map((b) => b.id).join(', ')}`,
    };
  }
  const newBlocks = state.blocks.map((b) => (b.id === id ? moved : b));
  return { ok: true, state: applyGravity({ ...state, blocks: newBlocks }).state };
}

export function resizeBlock(
  state: GridState,
  id: string,
  newColSpan: number,
  newRowSpan: number,
): OpResult {
  const block = state.blocks.find((b) => b.id === id);
  if (!block) return { ok: false, error: `no such block: ${id}` };
  const resized: Block = { ...block, colSpan: newColSpan, rowSpan: newRowSpan };
  if (!isRegionInBounds(state, resized)) {
    return { ok: false, error: `out of bounds: ${describe(resized)}` };
  }
  const colliders = findCollidingBlocks(state, resized, id);
  if (colliders.length > 0) {
    return {
      ok: false,
      error: `overlap with ${colliders.map((b) => b.id).join(', ')}`,
    };
  }
  const newBlocks = state.blocks.map((b) => (b.id === id ? resized : b));
  return { ok: true, state: applyGravity({ ...state, blocks: newBlocks }).state };
}

/**
 * Delete a block. Silent no-op if id doesn't exist. Always runs gravity.
 * Never fails — return type is GridState directly.
 */
export function deleteBlock(state: GridState, id: string): GridState {
  const newBlocks = state.blocks.filter((b) => b.id !== id);
  return applyGravity({ ...state, blocks: newBlocks }).state;
}

function describe(b: {
  id?: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}): string {
  return `${b.id ?? '?'} (col=${b.col} row=${b.row} w=${b.colSpan} h=${b.rowSpan})`;
}
