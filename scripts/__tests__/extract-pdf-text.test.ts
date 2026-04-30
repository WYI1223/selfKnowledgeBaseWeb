import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfText, getExtractPdfTextHelp } from '../extract-pdf-text.ts';

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdfBuffer(pageLines: string[]): Buffer {
  if (pageLines.length === 0) {
    throw new Error('buildPdfBuffer requires at least one page');
  }

  const pageCount = pageLines.length;
  const fontObjectId = 3 + pageCount * 2;
  const maxObjectId = fontObjectId;

  const objects = new Array<string>(maxObjectId + 1);
  const pageIds = pageLines.map((_, index) => 3 + index * 2);
  const kidRefs = pageIds.map((id) => `${id} 0 R`).join(' ');

  objects[1] = [
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
  ].join('\n');

  objects[2] = [
    '2 0 obj',
    `<< /Type /Pages /Kids [${kidRefs}] /Count ${pageCount} >>`,
    'endobj',
  ].join('\n');

  for (let index = 0; index < pageCount; index += 1) {
    const pageObjectId = pageIds[index];
    if (!pageObjectId) {
      throw new Error('Missing page object id');
    }
    const contentObjectId = 4 + index * 2;
    if (!contentObjectId) {
      throw new Error('Missing content object id');
    }
    const line = pageLines[index] ?? '';
    const pageContent = line.length === 0 ? 'BT\n/F1 24 Tf\nET' : `BT\n/F1 24 Tf\n72 720 Td\n(${escapePdfText(line)}) Tj\nET`;
    const pageContentLength = Buffer.byteLength(pageContent, 'utf8');

    objects[pageObjectId] = [
      `${pageObjectId} 0 obj`,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      'endobj',
    ].join('\n');

    objects[contentObjectId] = [
      `${contentObjectId} 0 obj`,
      `<< /Length ${pageContentLength} >>`,
      'stream',
      pageContent,
      'endstream',
      'endobj',
    ].join('\n');
  }

  objects[fontObjectId] = [
    `${fontObjectId} 0 obj`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
  ].join('\n');

  let source = '%PDF-1.4\n%PDF';
  const offsets = new Array<number>(maxObjectId + 1).fill(0);

  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    const objectText = objects[objectId];
    if (!objectText) {
      throw new Error(`Missing object definition: ${objectId}`);
    }

    offsets[objectId] = Buffer.byteLength(source, 'utf8');
    source += `\n${objectText}\n`;
  }

  const xrefOffset = Buffer.byteLength(source, 'utf8');
  const xrefLines = ['xref', `0 ${maxObjectId + 1}`, '0000000000 65535 f '];
  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    xrefLines.push(`${String(offsets[objectId]).padStart(10, '0')} 00000 n `);
  }

  source += `\n${xrefLines.join('\n')}\n`;
  source += [
    `trailer << /Size ${maxObjectId + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
  ].join('\n');

  return Buffer.from(source, 'utf8');
}

function writePdf(workspace: string, fileName: string, pageLines: string[]): string {
  const pdfPath = join(workspace, fileName);
  writeFileSync(pdfPath, buildPdfBuffer(pageLines));
  return pdfPath;
}

describe('extractPdfText', () => {
  it('extracts plain text from a normal PDF', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'extract-pdf-text-'));

    try {
      const pdfPath = writePdf(workspace, 'plain.pdf', ['alpha', 'beta']);
      const result = await extractPdfText({ pdfPath });
      expect(result.warning).toBeUndefined();
      expect(result.text).toContain('alpha');
      expect(result.text).toContain('beta');
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('treats scanned/empty PDFs as OCR fallback and returns empty output with warning', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'extract-pdf-text-'));

    try {
      const pdfPath = writePdf(workspace, 'blank.pdf', ['']);
      const result = await extractPdfText({ pdfPath });

      expect(result.text).toBe('');
      expect(result.warning).toMatch(/No extractable text found/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('throws for missing PDF file', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'extract-pdf-text-'));

    try {
      await expect(
        extractPdfText({ pdfPath: join(workspace, 'does-not-exist.pdf') }),
      ).rejects.toThrow(/does not exist/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('throws for corrupt PDF body', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'extract-pdf-text-'));
    const corruptPath = join(workspace, 'corrupt.pdf');
    writeFileSync(corruptPath, Buffer.from('%PDF-1.4\n<<<not-a-real-pdf-body>>>'));

    try {
      await expect(extractPdfText({ pdfPath: corruptPath })).rejects.toThrow();
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('throws for non-PDF files', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'extract-pdf-text-'));
    const textPath = join(workspace, 'notes.txt');
    writeFileSync(textPath, 'not a pdf');

    try {
      await expect(extractPdfText({ pdfPath: textPath })).rejects.toThrow(/expected \.pdf/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('writes extracted text to --output path when specified', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'extract-pdf-text-'));

    try {
      const pdfPath = writePdf(workspace, 'plain.pdf', ['write output']);
      const outputPath = join(workspace, 'output.txt');

      const result = await extractPdfText({
        pdfPath,
        output: outputPath,
      });

      expect(existsSync(outputPath)).toBe(true);
      expect(readFileSync(outputPath, 'utf8')).toBe(result.text);
      expect(result.text).toContain('write output');
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('--help includes usage and option', () => {
    const help = getExtractPdfTextHelp();
    expect(help).toContain('Usage:');
    expect(help).toContain('extract-pdf-text [options] <pdf-path>');
    expect(help).toContain('--output <txt>');
    expect(help).toContain('--help');
  });
});
