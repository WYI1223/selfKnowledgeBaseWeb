import type { CSSProperties } from 'react';

export interface EditModeBannerProps {
  editMode: boolean;
}

const bannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--accent-soft)',
  color: 'var(--text)',
  padding: 'var(--space-2) var(--space-3)',
  marginBottom: 'var(--space-4)',
  fontFamily: 'var(--sans)',
  boxShadow: 'var(--shadow-sm)',
};

export function EditModeBanner(props: EditModeBannerProps) {
  if (!props.editMode) return null;
  return <div style={bannerStyle}>✏️ Edit Mode</div>;
}
