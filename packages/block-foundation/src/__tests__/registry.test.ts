import { describe, it, expect } from 'vitest';
import {
  BlockRegistry,
  defineCore,
  defineUI,
  type BlockCoreDefinition,
  type BlockUIDefinition,
} from '../registry';
import { z } from 'zod';

const calloutCore = defineCore({
  name: 'callout',
  kind: 'component',
  propsSchema: z.object({ type: z.string() }),
  mdxComponent: 'Callout',
});

const noopComponent = () => null;
const calloutUIDefault = defineUI({
  coreName: 'callout',
  uiId: 'default',
  EditorView: noopComponent,
  RenderView: noopComponent,
});

describe('BlockRegistry — core', () => {
  it('registers and retrieves a core by name', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    expect(reg.getCore('callout')).toBe(calloutCore);
  });

  it('throws on duplicate core name', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    expect(() => reg.registerCore(calloutCore)).toThrow(/duplicate.*core/i);
  });

  it('lists all registered cores', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    reg.registerCore({ ...calloutCore, name: 'other', mdxComponent: 'Other' });
    expect(reg.listCores().map((c) => c.name).sort()).toEqual(['callout', 'other']);
  });

  it('listCores returns a defensive copy', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    const list = reg.listCores();
    (list as BlockCoreDefinition[]).push({
      ...calloutCore,
      name: 'rogue',
      mdxComponent: 'Rogue',
    });
    expect(reg.listCores()).toHaveLength(1);
    expect(reg.getCore('rogue')).toBeUndefined();
  });
});

describe('BlockRegistry — UI', () => {
  it('registers a UI bound to an existing core', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    reg.registerUI(calloutUIDefault);
    expect(reg.getUI('callout')).toBe(calloutUIDefault);
  });

  it('throws if registering UI for an unknown core', () => {
    const reg = new BlockRegistry();
    expect(() => reg.registerUI(calloutUIDefault)).toThrow(/unknown core/i);
  });

  it('supports multiple UIs per core; getUI without uiId returns first registered', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    reg.registerUI(calloutUIDefault);
    const minimal = defineUI({ ...calloutUIDefault, uiId: 'minimal' });
    reg.registerUI(minimal);
    expect(reg.getUI('callout')).toBe(calloutUIDefault);
    expect(reg.getUI('callout', 'minimal')).toBe(minimal);
    expect(reg.listUIs('callout')).toHaveLength(2);
  });

  it('throws on duplicate (coreName, uiId) pair', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    reg.registerUI(calloutUIDefault);
    expect(() => reg.registerUI(calloutUIDefault)).toThrow(/duplicate.*UI/i);
  });

  it('listUIs returns a defensive copy', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    reg.registerUI(calloutUIDefault);
    const list = reg.listUIs('callout');
    const rogue = defineUI({ ...calloutUIDefault, uiId: 'rogue' });
    (list as BlockUIDefinition[]).push(rogue);
    expect(reg.listUIs('callout')).toHaveLength(1);
    expect(reg.getUI('callout', 'rogue')).toBeUndefined();
  });
});

describe('BlockRegistry — grid fields', () => {
  it('round-trips gridDefault through defineUI', () => {
    const withGridDefault = defineUI({
      ...calloutUIDefault,
      gridDefault: { col: 1, colSpan: 12, rowSpan: 1 },
    });

    expect(withGridDefault.gridDefault).toEqual({
      col: 1,
      colSpan: 12,
      rowSpan: 1,
    });
  });

  it('round-trips rowSpanSemantic and gridKind through defineUI', () => {
    const withGridSemantics = defineUI({
      ...calloutUIDefault,
      rowSpanSemantic: 'auto',
      gridKind: 'prose',
    });

    expect(withGridSemantics.rowSpanSemantic).toBe('auto');
    expect(withGridSemantics.gridKind).toBe('prose');
  });
});
