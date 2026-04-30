import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { refactorMove } from '../refactor-move.ts';

const FIXTURE_ROOT = join(process.cwd(), 'scripts/__tests__/fixtures/refactor-move');

function buildFixture(): string {
  const workspace = mkdtempSync(join(tmpdir(), 'refactor-move-'));
  cpSync(join(FIXTURE_ROOT, 'initial'), workspace, { recursive: true });
  return workspace;
}

function readFixture(fixtureName: string, relativePath: string): string {
  return readFileSync(join(FIXTURE_ROOT, fixtureName, relativePath), 'utf8');
}

describe('refactorMove', () => {
  it('prints plan only in --dry-run mode and does not modify files', () => {
    const workspace = buildFixture();
    try {
      const report = refactorMove({
        from: 'packages/feature/util.ts',
        to: 'packages/feature/shared/util.ts',
        dryRun: true,
        cwd: workspace,
      });

      expect(report.dryRun).toBe(true);
      expect(report.plan.join('\n')).toContain('DRY RUN');
      expect(report.updates).toHaveLength(2);
      expect(readFileSync(join(workspace, 'packages/feature/util.ts'), 'utf8')).toBe(
        readFixture('initial', 'packages/feature/util.ts'),
      );
      expect(readFileSync(join(workspace, 'packages/feature/consumer.ts'), 'utf8')).toBe(
        readFixture('initial', 'packages/feature/consumer.ts'),
      );
      expect(readFileSync(join(workspace, 'apps/feature/app.ts'), 'utf8')).toBe(
        readFixture('initial', 'apps/feature/app.ts'),
      );
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('moves file and rewrites matching import paths in packages and apps', () => {
    const workspace = buildFixture();
    try {
      const report = refactorMove({
        from: 'packages/feature/util.ts',
        to: 'packages/feature/shared/util.ts',
        cwd: workspace,
      });

      expect(report.dryRun).toBe(false);
      expect(readFileSync(join(workspace, 'packages/feature/shared/util.ts'), 'utf8')).toBe(
        readFixture('after', 'packages/feature/shared/util.ts'),
      );
      expect(readFileSync(join(workspace, 'packages/feature/consumer.ts'), 'utf8')).toBe(
        readFixture('after', 'packages/feature/consumer.ts'),
      );
      expect(readFileSync(join(workspace, 'apps/feature/app.ts'), 'utf8')).toBe(
        readFixture('after', 'apps/feature/app.ts'),
      );
      expect(() => readFileSync(join(workspace, 'packages/feature/util.ts'), 'utf8')).toThrow();

      expect(report.updates).toEqual([
        {
          filePath: 'packages/feature/consumer.ts',
          from: './util',
          to: './shared/util',
        },
        {
          filePath: 'apps/feature/app.ts',
          from: '../../packages/feature/util.ts',
          to: '../../packages/feature/shared/util.ts',
        },
      ]);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('throws when source file does not exist', () => {
    const workspace = buildFixture();
    try {
      expect(() =>
        refactorMove({
          from: 'packages/feature/does-not-exist.ts',
          to: 'packages/feature/shared/util.ts',
          cwd: workspace,
        }),
      ).toThrow(/Source file does not exist/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('throws when destination already exists', () => {
    const workspace = buildFixture();
    try {
      expect(() =>
        refactorMove({
          from: 'packages/feature/consumer.ts',
          to: 'packages/feature/util.ts',
          cwd: workspace,
        }),
      ).toThrow(/Destination already exists/);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });
});
