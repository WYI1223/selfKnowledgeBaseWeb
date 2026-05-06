import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useEscCancel } from '../../drag-drop/esc-cancel';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

function EscHarness(props: {
  dragActive: boolean;
  dispatch: (action: { type: 'drag-end-cancel' }) => void;
}) {
  useEscCancel(props.dispatch, props.dragActive);
  return null;
}

function dispatchKey(key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

describe('useEscCancel', () => {
  it('prevents Esc and dispatches drag-end-cancel while drag is active', () => {
    const dispatch = vi.fn();
    render(<EscHarness dragActive={true} dispatch={dispatch} />);

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'drag-end-cancel' });
  });

  it('lets native Esc behavior pass through when drag is inactive', () => {
    const dispatch = vi.fn();
    render(<EscHarness dragActive={false} dispatch={dispatch} />);

    const event = dispatchKey('Escape');

    expect(event.defaultPrevented).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('restores the active element captured at drag start on drag end', () => {
    const dispatch = vi.fn();
    const textarea = document.createElement('textarea');
    const button = document.createElement('button');
    document.body.append(textarea, button);
    textarea.focus();

    const { rerender } = render(<EscHarness dragActive={true} dispatch={dispatch} />);
    button.focus();
    expect(document.activeElement).toBe(button);

    rerender(<EscHarness dragActive={false} dispatch={dispatch} />);

    expect(document.activeElement).toBe(textarea);
  });

  it('passes through non-Escape keys even while drag is active', () => {
    const dispatch = vi.fn();
    render(<EscHarness dragActive={true} dispatch={dispatch} />);

    const event = dispatchKey('Enter');

    expect(event.defaultPrevented).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
