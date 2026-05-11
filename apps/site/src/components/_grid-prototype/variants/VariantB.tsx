/**
 * THROWAWAY — Variant B: "LEGO studs"
 *
 * Mental model: building with LEGO bricks on a baseplate.
 * - Slot size: 80px (chunky, tactile)
 * - Baseplate: visible "stud" dot at every (col, row) intersection +
 *   subtle grid line cell borders
 * - Block: NO border default; per-kind hue background tint (very soft);
 *   small kind-glyph in top-left corner; on hover → 2px solid border
 * - Drag affordance hint: studs visible THROUGH semi-transparent block
 *   tint suggests "this brick is on top of those studs"
 * - Vibe: tactile, playful, brick-like
 */
import type { Block } from '@skb/grid-engine';
import { totalRows } from '@skb/grid-engine';
import { KIND_GLYPHS, KIND_HUES, KIND_LABELS, SAMPLE_BLOCKS } from '../sample-data';

const SLOT_SIZE_PX = 80;
const TOTAL_COLS = 12;
const STUD_SIZE = 6;

export function VariantB(): React.JSX.Element {
  const state = { blocks: SAMPLE_BLOCKS, totalCols: TOTAL_COLS };
  const rows = totalRows(state) + 2;
  const totalWidthPx = TOTAL_COLS * SLOT_SIZE_PX;
  const totalHeightPx = rows * SLOT_SIZE_PX;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'oklch(94% 0.005 80)',
        minHeight: '100vh',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${totalWidthPx}px`,
          height: `${totalHeightPx}px`,
          // Baseplate: visible studs at every cell center
          background: 'oklch(96% 0.005 80)',
          backgroundImage: `
            radial-gradient(circle at center, oklch(70% 0.02 80) ${STUD_SIZE / 2}px, transparent ${STUD_SIZE / 2}px),
            linear-gradient(to right, oklch(85% 0.005 80) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(85% 0.005 80) 1px, transparent 1px)
          `,
          backgroundSize: `${SLOT_SIZE_PX}px ${SLOT_SIZE_PX}px`,
          borderRadius: '6px',
          boxShadow: 'inset 0 0 0 1px oklch(85% 0.005 80)',
        }}
      >
        {state.blocks.map((b) => (
          <BrickBlock key={b.id} block={b} />
        ))}
        <Caption rows={rows} />
      </div>
    </div>
  );
}

function BrickBlock({ block }: { block: Block }): React.JSX.Element {
  const left = block.col * SLOT_SIZE_PX;
  const top = block.row * SLOT_SIZE_PX;
  const width = block.colSpan * SLOT_SIZE_PX;
  const height = block.rowSpan * SLOT_SIZE_PX;
  const hue = KIND_HUES[block.kind] ?? 'oklch(60% 0.05 0)';
  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        // hue tint, semi-transparent so studs glow through faintly
        background: `color-mix(in oklch, ${hue} 12%, white)`,
        border: '1px solid oklch(80% 0.01 80)',
        borderRadius: '4px',
        boxSizing: 'border-box',
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: 'system-ui, sans-serif',
        color: 'oklch(30% 0.02 80)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px oklch(0% 0 0 / 6%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontSize: '20px',
            color: hue,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {KIND_GLYPHS[block.kind]}
        </span>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>
          {KIND_LABELS[block.kind]}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.45, marginLeft: 'auto' }}>
          {block.id} · {block.colSpan}×{block.rowSpan}
        </span>
      </div>
      <div style={{ fontSize: '11px', opacity: 0.7, lineHeight: 1.5 }}>
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
      Variant B — LEGO studs · slot {SLOT_SIZE_PX}px · {TOTAL_COLS}×{rows} grid · prominent stud baseplate
    </div>
  );
}

function placeholder(b: Block): string {
  if (b.kind === 'markdown') return 'Markdown content. Some prose lives in this block, in this mental model. Lorem ipsum.';
  if (b.kind === 'image') return '[image preview]';
  if (b.kind === 'code') return 'function example() {\n  return 42;\n}';
  if (b.kind === 'callout') return 'A callout note for emphasis.';
  if (b.kind === 'math') return 'E = mc²';
  if (b.kind === 'pdf') return '[PDF viewer]';
  return `[${b.kind}]`;
}
