#!/usr/bin/env tsx
import { Command } from 'commander';
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { relative, resolve } from 'node:path';

export const PRECONDITION_ERROR =
  '⚠ block-callout template not yet created (Task C1 prerequisite)';

const KIND_AUDIT_TABLE = [
  { value: 'simple', label: 'Simple block kind' },
  { value: 'render', label: 'Rendered block kind' },
  { value: 'viz', label: 'Visualization block kind' },
] as const;

const KIND_SET: Set<string> = new Set(KIND_AUDIT_TABLE.map((entry) => entry.value));

export const BLOCK_KINDS = KIND_AUDIT_TABLE.map((row) => row.value);
export type NewBlockKind = (typeof BLOCK_KINDS)[number];

const NAME_VALIDATION_RULES = [
  {
    name: 'only lowercase letters, digits, and hyphens',
    check: (value: string) => /^[a-z0-9-]+$/.test(value),
  },
  {
    name: 'must start with lowercase letter',
    check: (value: string) => /^[a-z]/.test(value),
  },
  {
    name: 'must end with lowercase letter or digit',
    check: (value: string) => /[a-z0-9]$/.test(value),
  },
  {
    name: 'must not contain consecutive hyphens',
    check: (value: string) => !value.includes('--'),
  },
] as const;

type NewBlockOptions = {
  name: string;
  kind: string;
  ui?: string | undefined;
  dryRun?: boolean | undefined;
  cwd?: string;
};

export type NewBlockReport = {
  dryRun: boolean;
  prerequisiteMissing: boolean;
  name: string;
  kind: NewBlockKind;
  ui: string;
  packageName: string;
  packagePath: string;
  targetTemplatePath: string;
  tsconfigUpdated: boolean;
  plan: string[];
  exitCode: 0 | 1;
};

function derivePascalCase(name: string): string {
  return name
    .split('-')
    .filter((segment) => segment.length > 0)
    .map((segment) => `${segment[0]?.toUpperCase()}${segment.slice(1)}`)
    .join('');
}

function validateKind(value: string | undefined): NewBlockKind {
  if (!value) {
    throw new Error(`Missing --kind. Accepted values: ${KIND_AUDIT_TABLE.map((v) => v.value).join(', ')}`);
  }

  if (!KIND_SET.has(value)) {
    throw new Error(
      `Invalid --kind: ${value}. Accepted values: ${KIND_AUDIT_TABLE.map((v) => v.value).join(', ')}`,
    );
  }

  return value as NewBlockKind;
}

function validateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error(`Invalid block name: cannot be empty`);
  }

  for (const rule of NAME_VALIDATION_RULES) {
    if (!rule.check(name)) {
      throw new Error(`Invalid block name "${name}": must satisfy ${rule.name}`);
    }
  }
}

function replaceTokens(filePath: string, name: string, pascal: string): boolean {
  const content = readFileSync(filePath, 'utf8');
  const replaced = content.replaceAll('callout', name).replaceAll('Callout', pascal);

  if (replaced === content) {
    return false;
  }

  writeFileSync(filePath, replaced, 'utf8');
  return true;
}

function walkFiles(basePath: string, rootPath: string, onFile: (filePath: string) => void): void {
  for (const entry of readdirSync(basePath, { withFileTypes: true })) {
    const absolute = resolve(basePath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolute, rootPath, onFile);
      continue;
    }

    if (entry.isFile()) {
      onFile(absolute);
    }
  }
}

function updateRootTsConfigReferences(
  rootDir: string,
  packageName: string,
  dryRun: boolean,
): boolean {
  const tsconfigPath = resolve(rootDir, 'tsconfig.json');
  const raw = readFileSync(tsconfigPath, 'utf8');
  const tsconfig = JSON.parse(raw) as { references?: Array<{ path: string }>; [key: string]: unknown };
  const references = [...(tsconfig.references ?? [])];
  const target = `./packages/${packageName}`;

  if (references.some((entry) => entry.path === target)) {
    return false;
  }

  const insertAfterIndex = references.findIndex((entry) => entry.path.localeCompare(target) > 0);
  if (insertAfterIndex === -1) {
    references.push({ path: target });
  } else {
    references.splice(insertAfterIndex, 0, { path: target });
  }

  if (!dryRun) {
    tsconfig.references = references;
    writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`, 'utf8');
  }

  return true;
}

function buildPlan(baseDir: string, name: string, kind: NewBlockKind, ui: string, dryRun: boolean): string[] {
  const root = relative(process.cwd(), baseDir) || '.';
  return [
    dryRun ? 'DRY RUN: no files will be written.' : 'Applying scaffold plan.',
    `Target package: ${resolve(root, 'packages', `block-${name}`)}`,
    `Template source: ${resolve(root, 'packages', 'block-callout')}`,
    `Kind: ${kind}`,
    `UI variant: ${ui}`,
  ];
}

export function newBlock(options: NewBlockOptions): NewBlockReport {
  const cwd = resolve(options.cwd ?? process.cwd());
  const name = options.name.trim();
  const dryRun = Boolean(options.dryRun);
  const ui = options.ui?.trim() || 'default';
  const templateRoot = resolve(cwd, 'packages', 'block-callout');
  const templateCore = resolve(templateRoot, 'core');
  const templateUiDefault = resolve(templateRoot, 'ui-default');

  if (!existsSync(templateRoot) || !existsSync(templateCore) || !existsSync(templateUiDefault)) {
    return {
      dryRun,
      prerequisiteMissing: true,
      name,
      kind: 'simple',
      ui,
      packageName: `block-${name}`,
      packagePath: resolve(cwd, 'packages', `block-${name}`),
      targetTemplatePath: templateRoot,
      tsconfigUpdated: false,
      plan: [PRECONDITION_ERROR],
      exitCode: 0,
    };
  }

  const kind = validateKind(options.kind);

  validateName(name);

  const packageName = `block-${name}`;
  const packagePath = resolve(cwd, 'packages', packageName);
  if (existsSync(packagePath)) {
    throw new Error(`Package already exists: packages/${packageName}`);
  }

  const plan = buildPlan(cwd, name, kind, ui, dryRun);
  const pascalName = derivePascalCase(name);
  let tsconfigUpdated = false;

  if (!dryRun) {
    cpSync(templateRoot, packagePath, { recursive: true });
    let rewrittenCount = 0;

    walkFiles(packagePath, packagePath, (filePath) => {
      if (replaceTokens(filePath, name, pascalName)) {
        rewrittenCount += 1;
      }
    });

    plan.push(`Updated ${rewrittenCount} files with block token replacements.`);
    tsconfigUpdated = updateRootTsConfigReferences(cwd, packageName, dryRun);
    plan.push(
      tsconfigUpdated
        ? `Updated root tsconfig references for ${packageName}`
        : `Root tsconfig already references ${packageName}`,
    );
  } else {
    plan.push('DRY RUN: no file content replacements will be written.');
    tsconfigUpdated = updateRootTsConfigReferences(cwd, packageName, true);
    plan.push(
      tsconfigUpdated
        ? `Would add ./packages/${packageName} to root tsconfig references.`
        : `Root tsconfig already references ${packageName}.`,
    );
  }

  return {
    dryRun,
    prerequisiteMissing: false,
    name,
    kind,
    ui,
    packageName,
    packagePath,
    targetTemplatePath: templateRoot,
    tsconfigUpdated,
    plan,
    exitCode: 0,
  };
}

function buildNewBlockCommand(): Command {
  const program = new Command();

  program
    .name('new-block')
    .description('Scaffold a new block package from the block-callout template')
    .argument('<name>', 'block name (lowercase-kebab, e.g. callout-admonition)')
    .option('--kind <kind>', 'block kind: simple | render | viz')
    .option('--ui <ui>', 'ui variant', 'default')
    .option('--dry-run', 'print planned changes without writing files')
    .helpOption('--help', 'display help for command')
    .action((name: string, options: { kind?: string; ui?: string; dryRun?: boolean }) => {
      const report = newBlock({
        name,
        kind: options.kind ?? '',
        ui: options.ui ?? 'default',
        dryRun: options.dryRun,
      });

      for (const line of report.plan) {
        console.log(line);
      }

      if (report.exitCode !== 0) {
        process.exit(report.exitCode);
      }
    });

  return program;
}

export function getNewBlockHelp(): string {
  return buildNewBlockCommand().helpInformation();
}

function runCli(): void {
  const program = buildNewBlockCommand();

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
