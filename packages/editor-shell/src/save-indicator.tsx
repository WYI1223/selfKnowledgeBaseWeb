import type { CSSProperties } from 'react';

export type SaveIndicatorStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export interface SaveIndicatorProps {
  status: SaveIndicatorStatus;
  savedAt?: Date | null;
  error?: string;
}

const indicatorStyle: CSSProperties = {
  position: 'fixed',
  right: 'var(--space-4)',
  bottom: 'var(--space-4)',
  zIndex: 20,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text-2)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'var(--space-2) var(--space-3)',
  fontFamily: 'var(--sans)',
  fontSize: '12px',
};

function label(props: SaveIndicatorProps): string {
  if (props.status === 'unsaved') return 'Unsaved changes';
  if (props.status === 'saving') return 'Saving...';
  if (props.status === 'error') return props.error ? `Save failed: ${props.error}` : 'Save failed';
  if (props.status === 'saved' && props.savedAt) {
    return `Saved at ${props.savedAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return 'Saved';
}

export function SaveIndicator(props: SaveIndicatorProps) {
  return (
    <div aria-live="polite" data-skb-save-indicator style={indicatorStyle}>
      {label(props)}
    </div>
  );
}
