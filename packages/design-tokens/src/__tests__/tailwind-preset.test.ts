/*
 * Tailwind preset shape + .d.cts presence.
 *
 * The .d.cts file is what enables future consumers (Track A apps/site,
 * every Wave 2 block ui-default tailwind.config.ts) to import the preset
 * under `strict: true` + no-`allowJs` without `@ts-ignore`. Renaming or
 * removing it is a contract break.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const presetCjsPath = resolve(here, '../tailwind-preset.cjs');
const presetDctsPath = resolve(here, '../tailwind-preset.d.cts');
const requireCjs = createRequire(import.meta.url);

describe('@skb/design-tokens tailwind-preset (runtime)', () => {
  it('exports a Tailwind Config object with the design-token theme', () => {
    const preset = requireCjs(presetCjsPath) as {
      theme?: { colors?: Record<string, string>; spacing?: Record<string, string> };
    };
    expect(preset.theme).toBeDefined();
    expect(preset.theme?.colors).toBeDefined();
    expect(preset.theme?.spacing).toBeDefined();
  });

  it('exposes the rgb(var(--x) / <alpha-value>) color pattern (Tailwind opacity-modifier support)', () => {
    const preset = requireCjs(presetCjsPath) as { theme?: { colors?: Record<string, string> } };
    expect(preset.theme?.colors?.bg).toMatch(/rgb\(var\(--color-bg\) \/ <alpha-value>\)/);
    expect(preset.theme?.colors?.fg).toMatch(/rgb\(var\(--color-fg\) \/ <alpha-value>\)/);
  });
});

describe('@skb/design-tokens tailwind-preset (consumer types)', () => {
  it('ships a .d.cts alongside the .cjs so strict consumers can import without @ts-ignore', () => {
    expect(existsSync(presetDctsPath)).toBe(true);
  });

  it('the .d.cts declares Config from tailwindcss with CommonJS export shape', () => {
    const decl = readFileSync(presetDctsPath, 'utf8');
    expect(decl).toContain("import('tailwindcss').Config");
    expect(decl).toMatch(/export\s*=\s*preset/);
  });
});
