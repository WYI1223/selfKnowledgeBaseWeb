import { useState } from 'react';
import type { CSSProperties } from 'react';
import { DropPulse } from './drag-drop/drop-pulse';

export interface DragHandleProps {
  label?: string;
  onDropPreview?: () => void;
}

const wrapStyle: CSSProperties = {
  position: 'relative',
  minHeight: '32px',
};

const handleStyle: CSSProperties = {
  position: 'absolute',
  left: '-28px',
  top: '4px',
  width: '24px',
  height: '28px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text-3)',
  boxShadow: 'var(--shadow-sm)',
  cursor: 'grab',
  fontFamily: 'var(--mono)',
};

const previewStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  borderRadius: 'var(--radius)',
};

export function DragHandle(props: DragHandleProps) {
  const { label = 'Drag block', onDropPreview } = props;
  const [preview, setPreview] = useState(false);

  const showPreview = () => {
    setPreview(true);
    onDropPreview?.();
  };

  return (
    <div data-skb-drop-preview={preview ? 'true' : 'false'} style={wrapStyle}>
      <button
        aria-label={label}
        data-skb-drag-handle
        draggable
        onDragEnd={showPreview}
        onMouseUp={showPreview}
        style={handleStyle}
        type="button"
      >
        ::
      </button>
      {preview ? (
        <div data-testid="skb-drop-preview" style={previewStyle}>
          <DropPulse />
        </div>
      ) : null}
    </div>
  );
}
