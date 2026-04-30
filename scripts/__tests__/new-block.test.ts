import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getNewBlockHelp, newBlock, PRECONDITION_ERROR } from '../new-block.ts';

const FIXTURE_ROOT = join(process.cwd(), 'scripts/__tests__/fixtures/new-block');

function buildWorkspace(): string {
  const workspace = mkdtempSync(join(tmpdir(), 'new-block-'));
  cpSync(join(FIXTURE_ROOT, 'initial'), workspace, { recursive: true });
  return workspace;
}

describe('newBlock', () => {
  it('returns prerequisite warning when template is missing and exits with code 0', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'new-block-missing-template-'));

    try {
      const report = newBlock({
        name: 'note',
        kind: 'simple',
        cwd: workspace,
      });

      expect(report.exitCode).toBe(0);
      expect(report.prerequisiteMissing).toBe(true);
      expect(report.plan.join('\n')).toContain(PRECONDITION_ERROR);
      expect(report.packagePath).toContain('packages/block-note');
      expect(existsSync(join(workspace, 'packages/block-note'))).toBe(false);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('prints a dry-run plan and does not write files', () => {
    const workspace = buildWorkspace();
    const templateCalloutSource = readFileSync(
      join(FIXTURE_ROOT, 'initial/packages/block-callout/core/callout.ts'),
      'utf8',
    );
    const tsconfigBefore = readFileSync(join(FIXTURE_ROOT, 'initial/tsconfig.json'), 'utf8');

    try {
      const report = newBlock({
        name: 'timeline',
        kind: 'render',
        dryRun: true,
        cwd: workspace,
      });

      expect(report.dryRun).toBe(true);
      expect(report.plan[0]).toContain('DRY RUN: no files will be written.');
      expect(existsSync(join(workspace, 'packages/block-timeline'))).toBe(false);
      expect(readFileSync(join(workspace, 'packages/block-callout/core/callout.ts'), 'utf8')).toBe(
        templateCalloutSource,
      );
      expect(readFileSync(join(workspace, 'tsconfig.json'), 'utf8')).toBe(tsconfigBefore);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('generates a new block package and updates tsconfig references when template exists', () => {
    const workspace = buildWorkspace();

    try {
      const report = newBlock({
        name: 'timeline',
        kind: 'viz',
        cwd: workspace,
      });

      const generatedCore = readFileSync(
        join(workspace, 'packages/block-timeline/core/callout.ts'),
        'utf8',
      );
      const generatedUi = readFileSync(
        join(workspace, 'packages/block-timeline/ui-default/index.ts'),
        'utf8',
      );
      const tsconfig = JSON.parse(readFileSync(join(workspace, 'tsconfig.json'), 'utf8')) as {
        references?: Array<{ path: string }>;
      };

      expect(report.dryRun).toBe(false);
      expect(report.tsconfigUpdated).toBe(true);
      expect(generatedCore).toContain('timeline');
      expect(generatedCore).toContain('Timeline');
      expect(generatedUi).toContain('TimelineUi');
      expect(tsconfig.references).toEqual(
        expect.arrayContaining([{ path: './scripts' }, { path: './packages/content-types' }, { path: './packages/block-timeline' }]),
      );
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('throws when target package already exists', () => {
    const workspace = buildWorkspace();

    try {
      expect(() =>
        newBlock({
          name: 'callout',
          kind: 'simple',
          cwd: workspace,
        }),
      ).toThrow(/Package already exists/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('throws when kind is invalid', () => {
    const workspace = buildWorkspace();

    try {
      expect(() =>
        newBlock({
          name: 'timeline',
          kind: 'not-a-kind',
          cwd: workspace,
        }),
      ).toThrow(/Invalid --kind/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('--help prints usage and exits 0', () => {
    const help = getNewBlockHelp();

    expect(help).toContain('Usage:');
    expect(help).toContain('Usage: new-block [options] <name>');
  });
});
