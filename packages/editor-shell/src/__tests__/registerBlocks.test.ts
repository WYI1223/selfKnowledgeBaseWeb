import { describe, it, expect } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { registerBlocks } from '../registerBlocks';

const EXPECTED_NAMES = [
  'callout',
  // Wave 6 carry-forward #15b 2026-05-08 — block-Code core renamed
  // from 'code' to 'componentCode' (ProseMirror node/mark namespace
  // collision with StarterKit's inline `code` mark).
  'componentCode',
  'image',
  'math',
  'pdf',
  'jupyter',
  'nn-viz',
  'agent-flow',
] as const;

describe('@skb/editor-shell registerBlocks', () => {
  it('registers 8 cores with kebab-case names in locked-plan order', () => {
    const registry = new BlockRegistry();
    registerBlocks(registry);
    const cores = registry.listCores();
    expect(cores).toHaveLength(8);
    expect(cores.map((c) => c.name)).toEqual([...EXPECTED_NAMES]);
  });

  it('registers a default ui per core, retrievable via getUI(name)', () => {
    const registry = new BlockRegistry();
    registerBlocks(registry);
    for (const name of EXPECTED_NAMES) {
      const ui = registry.getUI(name);
      expect(ui).toBeDefined();
      expect(ui!.coreName).toBe(name);
      expect(ui!.uiId).toBe('default');
    }
  });

  it('matches the ADR-0009 D1 BlockKind distribution: 3 component + 2 render + 3 viz', () => {
    const registry = new BlockRegistry();
    registerBlocks(registry);
    const byKind: Record<string, string[]> = {};
    for (const core of registry.listCores()) {
      byKind[core.kind] = byKind[core.kind] ?? [];
      byKind[core.kind]!.push(core.name);
    }
    expect(byKind.component?.slice().sort()).toEqual(['callout', 'componentCode', 'image']);
    expect(byKind.render?.slice().sort()).toEqual(['math', 'pdf']);
    expect(byKind.viz?.slice().sort()).toEqual(['agent-flow', 'jupyter', 'nn-viz']);
  });
});
