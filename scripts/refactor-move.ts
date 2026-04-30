#!/usr/bin/env tsx
import { Command } from 'commander';
import { Project, type ExportDeclaration, type SourceFile } from 'ts-morph';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';

const SOURCE_GLOBS = ['packages/**/*.{ts,tsx}', 'apps/**/*.{ts,tsx}'];

type RewriteRecord = {
  filePath: string;
  from: string;
  to: string;
  apply: () => void;
};

export type RefactorMoveReport = {
  from: string;
  to: string;
  dryRun: boolean;
  updates: Array<{ filePath: string; from: string; to: string }>;
  plan: string[];
};

type RefactorMoveOptions = {
  from: string;
  to: string;
  dryRun?: boolean;
  cwd?: string;
};

const TS_IMPORT_EXT = /\.tsx?$/;

function asPosix(filePath: string): string {
  return filePath.split(sep).join('/');
}

function toDisplayPath(path: string, baseDir: string): string {
  const rel = relative(baseDir, path);
  return asPosix(rel === '' ? '.' : rel);
}

function candidatesForImport(sourceDir: string, moduleSpecifier: string): string[] {
  const base = resolve(sourceDir, moduleSpecifier);
  return [base, `${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts'), resolve(base, 'index.tsx')];
}

function hasMatchingTarget(
  sourceDir: string,
  moduleSpecifier: string,
  targetAbsolutePath: string,
): boolean {
  if (!moduleSpecifier.startsWith('.')) {
    return false;
  }
  return candidatesForImport(sourceDir, moduleSpecifier).includes(targetAbsolutePath);
}

function nextSpecifier(sourceDir: string, targetAbsolutePath: string, oldSpecifier: string): string {
  let next = asPosix(relative(sourceDir, targetAbsolutePath));
  if (!next.startsWith('.')) {
    next = `./${next}`;
  }

  const requestedExt = extname(oldSpecifier);
  const keepExt = requestedExt === '.ts' || requestedExt === '.tsx';
  if (keepExt) {
    return `${next.replace(TS_IMPORT_EXT, '')}${requestedExt}`;
  }
  return next.replace(TS_IMPORT_EXT, '');
}

function appendImportUpdate(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  oldFileAbsolutePath: string,
  newFileAbsolutePath: string,
  updates: RewriteRecord[],
): void {
  const sourceDir = sourceFile.getDirectoryPath();
  if (!hasMatchingTarget(sourceDir, moduleSpecifier, oldFileAbsolutePath)) {
    return;
  }

  const newSpecifier = nextSpecifier(sourceDir, newFileAbsolutePath, moduleSpecifier);
  if (newSpecifier === moduleSpecifier) {
    return;
  }

  updates.push({
    filePath: sourceFile.getFilePath(),
    from: moduleSpecifier,
    to: newSpecifier,
    apply: () => sourceFile
      .getImportDeclarations()
      .filter((i) => i.getModuleSpecifierValue() === moduleSpecifier)
      .forEach((i) => i.setModuleSpecifier(newSpecifier)),
  });
}

function appendExportUpdate(
  sourceFile: SourceFile,
  exportDecl: ExportDeclaration,
  oldFileAbsolutePath: string,
  newFileAbsolutePath: string,
  updates: RewriteRecord[],
): void {
  const moduleSpecifier = exportDecl.getModuleSpecifierValue();
  if (!moduleSpecifier || !moduleSpecifier.startsWith('.')) {
    return;
  }

  const sourceDir = sourceFile.getDirectoryPath();
  if (!hasMatchingTarget(sourceDir, moduleSpecifier, oldFileAbsolutePath)) {
    return;
  }

  const newSpecifier = nextSpecifier(sourceDir, newFileAbsolutePath, moduleSpecifier);
  if (newSpecifier === moduleSpecifier) {
    return;
  }

  updates.push({
    filePath: sourceFile.getFilePath(),
    from: moduleSpecifier,
    to: newSpecifier,
    apply: () => exportDecl.setModuleSpecifier(newSpecifier),
  });
}

function buildReport(
  fromPath: string,
  toPath: string,
  dryRun: boolean,
  updates: RewriteRecord[],
  cwd: string,
): RefactorMoveReport {
  const header = dryRun ? 'DRY RUN: no files will be written.' : 'Applied file move and import updates.';
  const plan = [
    header,
    `Move: ${toDisplayPath(fromPath, cwd)} -> ${toDisplayPath(toPath, cwd)}`,
    ...(updates.length === 0
      ? ['No import specifiers to rewrite.']
      : updates.map(
          (update) =>
            `Update ${toDisplayPath(update.filePath, cwd)}: "${update.from}" -> "${update.to}"`,
        )),
  ];
  return {
    from: fromPath,
    to: toPath,
    dryRun,
    updates: updates.map((update) => ({
      filePath: toDisplayPath(update.filePath, cwd),
      from: update.from,
      to: update.to,
    })),
    plan,
  };
}

export function refactorMove(options: RefactorMoveOptions): RefactorMoveReport {
  const cwd = resolve(options.cwd ?? process.cwd());
  const from = resolve(cwd, options.from);
  const to = resolve(cwd, options.to);
  const dryRun = Boolean(options.dryRun);

  if (!existsSync(from)) {
    throw new Error(`Source file does not exist: ${options.from}`);
  }
  if (existsSync(to)) {
    throw new Error(`Destination already exists: ${options.to}`);
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  const sourceFiles: SourceFile[] = [];
  const seenFiles = new Set<string>();

  for (const glob of SOURCE_GLOBS) {
    const matchedFiles = project.addSourceFilesAtPaths(resolve(cwd, glob));
    for (const sourceFile of matchedFiles) {
      const filePath = sourceFile.getFilePath();
      if (seenFiles.has(filePath)) {
        continue;
      }
      sourceFiles.push(sourceFile);
      seenFiles.add(filePath);
    }
  }

  const updates: RewriteRecord[] = [];
  const seenImports = new Set<string>();

  for (const sourceFile of project.getSourceFiles()) {
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) {
        continue;
      }
      appendImportUpdate(sourceFile, moduleSpecifier, from, to, updates);
    }

    for (const exportDecl of sourceFile.getExportDeclarations()) {
      appendExportUpdate(sourceFile, exportDecl, from, to, updates);
    }
  }

  const uniqueUpdates = updates.filter((update) => {
    const key = `${update.filePath}:${update.from}->${update.to}`;
    if (seenImports.has(key)) return false;
    seenImports.add(key);
    return true;
  });

  if (!dryRun) {
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);

    const touched = new Set<string>();
    for (const update of uniqueUpdates) {
      update.apply();
      touched.add(update.filePath);
    }

    for (const sourceFile of project.getSourceFiles()) {
      if (touched.has(sourceFile.getFilePath())) {
        sourceFile.saveSync();
      }
    }
  }

  return buildReport(from, to, dryRun, uniqueUpdates, cwd);
}

function runCli(): void {
  const program = new Command();
  program
    .name('refactor-move')
    .description('Move a TypeScript file and update import paths under packages/* and apps/*')
    .argument('<from>', 'source file path')
    .argument('<to>', 'destination file path')
    .option('--dry-run', 'print planned changes only')
    .helpOption('--help', 'display help for command')
    .action((from: string, to: string, options: { dryRun?: boolean }) => {
      const report = refactorMove({ from, to, dryRun: options.dryRun });
      for (const line of report.plan) {
        console.log(line);
      }
    });

  try {
    program.parse(process.argv);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
