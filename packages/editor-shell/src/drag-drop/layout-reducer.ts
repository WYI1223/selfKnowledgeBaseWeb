/**
 * @skb/editor-shell layoutReducer — single-source mutation reducer for grid layout actions.
 *
 * Per ADR-0017 D12 + ADR-0016 D12 Q12 absorbtion table (load-bearing epoch rules):
 *  - drag-start: epoch unchanged; save S0 snapshot
 *  - drag-over: epoch unchanged; preview not committed
 *  - drag-end-success: epoch += 1 (one-shot N → N+1); new S1 baseline
 *  - drag-end-cancel: epoch unchanged; rollback to S0
 *  - drag-end-mode-none: epoch unchanged; rollback to S0 (degenerate cancel)
 *  - responsive-transition-start/end: epoch unchanged; only flips the
 *    responsiveTransition field for ADR-0016 D5 transition arbitration
 *
 * Conflict arbitration: drag (user-initiated) > auto-measure (markdown rowSpan='auto'); responsive transition rejects drag (per ADR-0016 D5 + D12). Single-user single-session assumption (CRDT/OT Phase 2+).
 */
import type { BlockGridPosition } from '@skb/block-foundation';

export interface GridSnapshot {
  readonly blocks: readonly BlockGridPosition[];
}

export interface LayoutState {
  readonly epoch: number;
  readonly snapshot: GridSnapshot | null;
  readonly baseline: GridSnapshot;
  readonly responsiveTransition?: 'idle' | 'in-progress';
}

export type LayoutAction =
  | { type: 'drag-start'; sourceBlockId: string }
  | { type: 'drag-over' }
  | { type: 'drag-end-success'; mutation: GridSnapshot }
  | { type: 'drag-end-cancel' }
  | { type: 'drag-end-mode-none' }
  | { type: 'responsive-transition-start' }
  | { type: 'responsive-transition-end' };

function rollbackToSnapshot(state: LayoutState): LayoutState {
  return {
    ...state,
    baseline: state.snapshot ?? state.baseline,
    snapshot: null,
  };
}

export function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case 'drag-start':
      if (state.responsiveTransition === 'in-progress') return state;

      return {
        ...state,
        snapshot: state.baseline,
      };
    case 'drag-over':
      return state;
    case 'drag-end-success':
      return {
        ...state,
        epoch: state.epoch + 1,
        baseline: action.mutation,
        snapshot: null,
      };
    case 'drag-end-cancel':
      return rollbackToSnapshot(state);
    case 'drag-end-mode-none':
      return rollbackToSnapshot(state);
    case 'responsive-transition-start':
      if (state.responsiveTransition === 'in-progress') return state;

      return {
        ...state,
        responsiveTransition: 'in-progress',
      };
    case 'responsive-transition-end':
      if (state.responsiveTransition === 'idle') return state;

      return {
        ...state,
        responsiveTransition: 'idle',
      };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
