/**
 * THROWAWAY — Variant C: "Bento canvas"
 *
 * Mental model: arranging product-card sections on a designer dashboard.
 * - Slot size: 100px (large, generous)
 * - Baseplate: INVISIBLE when blocks present; appears as soft 1px lines
 *   ONLY during drag (mocked here via "drag-mode" toggle button)
 * - Block: filled card with rounded corners, soft shadow, per-kind hue
 *   header band (not just stripe — full header background) + glyph chip,
 *   content area filled with white, generous padding
 * - Vibe: dashboard cards, designer's bento, dominant blocks
 */
import { useState } from 'react';
import type { Block } from '@skb/grid-engine';
import { totalRows } from '@skb/grid-engine';
import { KIND_GLYPHS, KIND_HUES, KIND_LABELS, SAMPLE_BLOCKS } from '../sample-data';

const SLOT_SIZE_PX = 100;
const TOTAL_COLS = 12;
const PADDING_PX = 6;

export function VariantC(): React.JSX.Element {
  const [dragMode, setDragMode] = useState(false);
  const state = { blocks: SAMPLE_BLOCKS, totalCols: TOTAL_COLS };
  const rows = totalRows(state) + 2;
  const totalWidthPx = TOTAL_COLS * SLOT_SIZE_PX;
  const totalHeightPx = rows * SLOT_SIZE_PX;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'oklch(98% 0.005 80)',
        minHeight: '100vh',
        padding: '40px 20px',
      }}
    >
      <button
        onClick={() => setDragMode(!dragMode)}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          background: dragMode ? 'oklch(60% 0.15 240)' : 'white',
          color: dragMode ? 'white' : 'oklch(40% 0.02 80)',
          border: '1px solid oklch(80% 0.01 80)',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {dragMode ? '✓ Drag mode (baseplate visible)' : 'Toggle drag mode (baseplate hidden by default)'}
      </button>
      <div
        style={{
          position: 'relative',
          width: `${totalWidthPx}px`,
          height: `${totalHeightPx}px`,
          background: dragMode
            ? `repeating-linear-gradient(0deg, transparent, transparent ${SLOT_SIZE_PX - 1}px, oklch(85% 0.01 80) ${SLOT_SIZE_PX - 1}px, oklch(85% 0.01 80) ${SLOT_SIZE_PX}px), repeating-linear-gradient(90deg, transparent, transparent ${SLOT_SIZE_PX - 1}px, oklch(85% 0.01 80) ${SLOT_SIZE_PX - 1}px, oklch(85% 0.01 80) ${SLOT_SIZE_PX}px)`
            : 'transparent',
          transition: 'background 200ms',
        }}
      >
        {state.blocks.map((b) => (
          <BentoBlock key={b.id} block={b} />
        ))}
        <Caption rows={rows} dragMode={dragMode} />
      </div>
    </div>
  );
}

function BentoBlock({ block }: { block: Block }): React.JSX.Element {
  const left = block.col * SLOT_SIZE_PX + PADDING_PX;
  const top = block.row * SLOT_SIZE_PX + PADDING_PX;
  const width = block.colSpan * SLOT_SIZE_PX - 2 * PADDING_PX;
  const height = block.rowSpan * SLOT_SIZE_PX - 2 * PADDING_PX;
  const hue = KIND_HUES[block.kind] ?? 'oklch(60% 0.05 0)';
  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px oklch(0% 0 0 / 8%), 0 1px 2px oklch(0% 0 0 / 4%)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          background: `color-mix(in oklch, ${hue} 14%, white)`,
          borderBottom: `1px solid color-mix(in oklch, ${hue} 25%, white)`,
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hue,
            color: 'white',
            borderRadius: '5px',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          {KIND_GLYPHS[block.kind]}
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: '13px',
            color: 'oklch(25% 0.02 80)',
          }}
        >
          {KIND_LABELS[block.kind]}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.4, marginLeft: 'auto' }}>
          {block.id} · {block.colSpan}×{block.rowSpan}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          padding: '14px 16px',
          fontSize: '11px',
          color: 'oklch(35% 0.02 80)',
          lineHeight: 1.55,
          overflow: 'hidden',
        }}
      >
        {placeholder(block)}
      </div>
    </div>
  );
}

function Caption({ rows, dragMode }: { rows: number; dragMode: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '-30px',
        left: 0,
        fontSize: '11px',
        color: 'oklch(50% 0.02 80)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      Variant C — Bento canvas · slot {SLOT_SIZE_PX}px · {TOTAL_COLS}×{rows} grid ·
      baseplate {dragMode ? 'visible (drag mode)' : 'hidden (rest mode)'}
    </div>
  );
}

function placeholder(b: Block): string {
  if (b.kind === 'markdown') return 'Markdown content lives here. A few sentences of prose explaining a concept, with proper spacing and breathing room.';
  if (b.kind === 'image') return '[image preview area]';
  if (b.kind === 'code') return 'function example() {\n  return 42;\n}';
  if (b.kind === 'callout') return 'A callout draws attention to an important point worth highlighting separately.';
  if (b.kind === 'math') return 'E = mc²';
  if (b.kind === 'pdf') return '[PDF viewer]';
  return `[${b.kind}]`;
}
