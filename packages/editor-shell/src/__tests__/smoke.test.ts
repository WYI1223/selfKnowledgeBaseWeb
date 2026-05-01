import { describe, it, expect } from 'vitest';
import * as editorShell from '../index';

describe('@skb/editor-shell smoke', () => {
  it('module imports resolve to an object', () => {
    expect(typeof editorShell).toBe('object');
    expect(editorShell).toBeDefined();
  });
});
