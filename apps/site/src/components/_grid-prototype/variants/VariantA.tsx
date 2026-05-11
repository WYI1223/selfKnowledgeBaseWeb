/**
 * THROWAWAY — Variant A: "Graph paper"
 *
 * Mental model: writing on engineering graph paper.
 * - Slot size: 60px (denser, more grid units visible)
 * - Baseplate: faint dotted lines at every (col, row) intersection
 * - Block: solid 1px border, white background, per-kind 2px top stripe
 *   (matches cf-19 chrome but cleaner)
 * - Kind label: small chip in top-right corner with hue + glyph
 * - Vibe: clean, technical, predictable
 */
import type { Block } from '@skb/grid-engine';
import { totalRows } from '@skb/grid-engine';
import { KIND_GLYPHS, KIND_HUES, KIND_LABELS, SAMPLE_BLOCKS } from '../sample-data';

const SLOT_SIZE_PX = 60;
const TOTAL_COLS = 12;
const PADDING_PX = 4;

export function VariantA(): React.JSX.Element {
  const state = { blocks: SAMPLE_BLOCKS, totalCols: TOTAL_COLS };
  const rows = totalRows(state) + 2;
  const totalWidthPx = TOTAL_COLS * SLOT_SIZE_PX;
  const totalHeightPx = rows * SLOT_SIZE_PX;
  const dotSize = 2;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'oklch(98% 0.005 80)',
        minHeight: '100vh',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${totalWidthPx}px`,
          height: `${totalHeightPx}px`,
          // Baseplate: faint dotted graph paper
          backgroundImage: `radial-gradient(circle, oklch(70% 0.01 80) ${dotSize / 2}px, transparent ${dotSize / 2}px)`,
          backgroundSize: `${SLOT_SIZE_PX}px ${SLOT_SIZE_PX}px`,
          backgroundPosition: `${SLOT_SIZE_PX - dotSize / 2}px ${SLOT_SIZE_PX - dotSize / 2}px`,
        }}
      >
        {state.blocks.map((b) => (
          <BlockBox key={b.id} block={b} />
        ))}
        <Caption rows={rows} />
      </div>
    </div>
  );
}

function BlockBox({ block }: { block: Block }): React.JSX.Element {
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
        border: '1px solid oklch(85% 0.01 80)',
        borderTop: `2px solid ${hue}`,
        borderRadius: '3px',
        boxSizing: 'border-box',
        padding: '8px 10px',
        fontSize: '12px',
        fontFamily: 'system-ui, sans-serif',
        color: 'oklch(35% 0.02 80)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontWeight: 600, color: hue }}>
          {KIND_GLYPHS[block.kind]} {KIND_LABELS[block.kind]}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>
          {block.id} · {block.colSpan}×{block.rowSpan}
        </span>
      </div>
      <div style={{ fontSize: '11px', opacity: 0.7, lineHeight: 1.4 }}>
        {placeholder(block)}
      </div>
    </div>
  );
}

function Caption({ rows }: { rows: number }): React.JSX.Element {
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
      Variant A — Graph paper · slot {SLOT_SIZE_PX}px · {TOTAL_COLS}×{rows} grid · faint dotted baseplate
    </div>
  );
}

function placeholder(b: Block): string {
  if (b.kind === 'markdown') return 'Markdown content. A line of text describing what this block holds. Lorem ipsum dolor sit amet.';
  if (b.kind === 'image') return '[image preview area — would render the actual image]';
  if (b.kind === 'code') return 'function example() {\n  return 42;\n}';
  if (b.kind === 'callout') return 'A callout note draws attention to an important point.';
  if (b.kind === 'math') return 'E = mc²  ·  ∫f(x)dx';
  if (b.kind === 'pdf') return '[PDF viewer area]';
  return `[${b.kind} content]`;
}
