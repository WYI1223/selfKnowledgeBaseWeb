#!/usr/bin/env tsx
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

const PDF_SIGNATURE = '%PDF-';
const OCR_FALLBACK_WARNING =
  '⚠ No extractable text found. This PDF may be scanned; output is intentionally empty.';

type ExtractPdfTextResult = {
  text: string;
  outputPath?: string;
  warning?: string;
};

type ExtractPdfTextOptions = {
  pdfPath: string;
  output?: string;
  cwd?: string;
};

function buildPdfWorker(): void {
  const require = createRequire(import.meta.url);
  const packageRoot = require.resolve('pdfjs-dist/package.json');
  GlobalWorkerOptions.workerSrc = resolve(
    dirname(packageRoot),
    'legacy',
    'build',
    'pdf.worker.mjs',
  );
}

function itemToText(item: { str: string } | { type: string }): string {
  return 'str' in item ? item.str : '';
}

function resolvePdfPath(rawPdfPath: string, cwd: string): string {
  const pdfPath = resolve(cwd, rawPdfPath);
  if (!existsSync(pdfPath)) {
    throw new Error(`PDF file does not exist: ${rawPdfPath}`);
  }
  if (extname(pdfPath).toLowerCase() !== '.pdf') {
    throw new Error(`Invalid file extension: expected .pdf`);
  }
  return pdfPath;
}

function ensurePdfHeader(data: Buffer): void {
  if (!data.slice(0, PDF_SIGNATURE.length).equals(Buffer.from(PDF_SIGNATURE))) {
    throw new Error('Corrupt PDF file: unable to read PDF header');
  }
}

async function extractText(pdfPath: string): Promise<string> {
  const raw = readFileSync(pdfPath);
  ensurePdfHeader(raw);

  buildPdfWorker();
  const loadingTask = getDocument({
    data: new Uint8Array(raw),
  });

  let document: Awaited<typeof loadingTask.promise> | null = null;
  try {
    document = await loadingTask.promise;
    const pageCount = document.numPages;
    const pageTexts: string[] = [];

    for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
      const page = await document.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(itemToText).join(' ').trim();
      if (pageText.length > 0) {
        pageTexts.push(pageText);
      }
    }

    return pageTexts.join('\n').trim();
  } finally {
    if (document) {
      await document.destroy();
    }
  }
}

export async function extractPdfText(options: ExtractPdfTextOptions): Promise<ExtractPdfTextResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const pdfPath = resolvePdfPath(options.pdfPath, cwd);
  const outputPath = options.output ? resolve(cwd, options.output) : undefined;

  let text: string;
  try {
    text = await extractText(pdfPath);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Corrupt PDF file: unable to read PDF content',
    );
  }

  const cleanText = text.trim();
  const warning = cleanText.length === 0 ? OCR_FALLBACK_WARNING : undefined;

  if (outputPath) {
    writeFileSync(outputPath, cleanText, 'utf8');
  }

  return {
    text: cleanText,
    ...(outputPath !== undefined && { outputPath }),
    ...(warning !== undefined && { warning }),
  };
}

export function getExtractPdfTextHelp(): string {
  return buildCommand().helpInformation();
}

export function buildCommand(): Command {
  const program = new Command();

  program
    .name('extract-pdf-text')
    .description('Extract plain text from a PDF file for search-index')
    .argument('<pdf-path>', 'path to input PDF')
    .option('--output <txt>', 'write extracted text to file (default: stdout)')
    .helpOption('--help', 'display help for command')
    .action(async (pdfPath: string, options: { output?: string }) => {
      const { text, outputPath, warning } = await extractPdfText({
        pdfPath,
        ...(options.output !== undefined && { output: options.output }),
      });

      if (warning) {
        console.error(warning);
      }

      if (!outputPath) {
        process.stdout.write(text);
      }
    });

  return program;
}

function runCli(): void {
  const program = buildCommand();
  void program.parseAsync(process.argv).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
