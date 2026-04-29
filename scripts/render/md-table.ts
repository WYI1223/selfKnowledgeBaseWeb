/**
 * GFM table formatter that matches Prettier's column-padding output.
 *
 * Prettier (with default `proseWrap`) pads each column to the max content width
 * across header + body, then renders `| h1 | h2 |` with trailing spaces and a
 * separator line of `-` repeats. We reproduce that here so the generator's
 * output is prettier-clean and the CI drift check stays a no-op.
 */

// Visible width — counts characters, not byte/grapheme width. Prettier itself
// uses the `string-width` package for CJK / emoji width awareness; we mirror
// that for tables containing CJK so columns line up the way Prettier expects.
//
// Implementation: minimal subset of Unicode East Asian Wide. Enough for the
// CJK characters in agent-contract.md (Han, full-width punctuation).
function visibleWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0x303e) ||
      (cp >= 0x3041 && cp <= 0x33ff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0xa000 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe4f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6)
    ) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

function padCell(cell: string, width: number): string {
  const pad = width - visibleWidth(cell);
  return pad > 0 ? cell + ' '.repeat(pad) : cell;
}

export function mdTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => {
    let w = visibleWidth(h);
    for (const row of rows) {
      const cell = row[i] ?? '';
      const cw = visibleWidth(cell);
      if (cw > w) w = cw;
    }
    // Separator must be at least 3 dashes wide to be valid GFM.
    return Math.max(w, 3);
  });

  const renderRow = (cells: string[]): string =>
    '| ' + cells.map((c, i) => padCell(c, widths[i] ?? 0)).join(' | ') + ' |';

  const separator = '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';

  return [renderRow(headers), separator, ...rows.map(renderRow)].join('\n');
}
