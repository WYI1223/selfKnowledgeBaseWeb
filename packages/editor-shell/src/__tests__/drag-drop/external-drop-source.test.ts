/**
 * @skb/editor-shell external-drop-source unit tests (Wave 6 cf-24).
 *
 * Covers the cf-24 D5 + D7 + ADR-0017 v0.4 D14 contract:
 * - MIME constant + sentinel constant identity
 * - writeBlockKindToDataTransfer sets effectAllowed + MIME data
 * - readBlockKindFromDataTransfer round-trips known kinds
 * - readBlockKindFromDataTransfer returns null on missing MIME,
 *   empty value, whitespace-only, and unknown kinds (defense in
 *   depth per cf-24 Q4)
 * - isExternalDragSource type-narrowing predicate
 * - sentinel is distinct from any plausible UUID Tiptap might emit
 *
 * No React, no DOM module mocking — uses a minimal in-memory
 * DataTransfer-shape object. The setDragImage path is intentionally
 * not exercised here because jsdom lacks Image; the helper guards
 * with a try/catch so the test surface focuses on the marshalling
 * contract.
 */
import { describe, expect, it } from 'vitest';
import {
  EXTERNAL_DROP_MIME,
  EXTERNAL_DROP_SENTINEL,
  isExternalDragSource,
  readBlockKindFromDataTransfer,
  writeBlockKindToDataTransfer,
} from '../../drag-drop/external-drop-source';

interface FakeDataTransfer {
  effectAllowed: string;
  data: Map<string, string>;
  setData: (mime: string, value: string) => void;
  getData: (mime: string) => string;
  setDragImage: (img: unknown, x: number, y: number) => void;
}

function createFakeDT(): FakeDataTransfer {
  const data = new Map<string, string>();
  return {
    effectAllowed: '',
    data,
    setData(mime: string, value: string) {
      data.set(mime, value);
    },
    getData(mime: string) {
      return data.get(mime) ?? '';
    },
    setDragImage() {
      // no-op; the real DT calls into the renderer's drag layer
    },
  };
}

describe('EXTERNAL_DROP_MIME + EXTERNAL_DROP_SENTINEL constants', () => {
  it('MIME is the v2-reference protocol value `application/x-block-kind`', () => {
    expect(EXTERNAL_DROP_MIME).toBe('application/x-block-kind');
  });

  it('SENTINEL is a stable underscore-bracketed string distinct from UUIDs', () => {
    expect(EXTERNAL_DROP_SENTINEL).toBe('__external_palette__');
    // Negative test — UUIDs use hex + hyphen; the sentinel must
    // not match a v4 UUID pattern so per-block code paths never
    // accidentally treat a real UUID as external.
    const v4Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(v4Uuid.test(EXTERNAL_DROP_SENTINEL)).toBe(false);
  });
});

describe('writeBlockKindToDataTransfer', () => {
  it('sets effectAllowed to copy + writes the kind under EXTERNAL_DROP_MIME', () => {
    const dt = createFakeDT();
    writeBlockKindToDataTransfer(dt as unknown as DataTransfer, 'callout');
    expect(dt.effectAllowed).toBe('copy');
    expect(dt.data.get(EXTERNAL_DROP_MIME)).toBe('callout');
  });

  it('round-trips every BLOCK_KIND_OPTIONS member through write+read', () => {
    const allKinds = [
      'callout',
      'componentCode',
      'image',
      'math',
      'pdf',
      'jupyter',
      'nn-viz',
      'agent-flow',
    ] as const;
    for (const kind of allKinds) {
      const dt = createFakeDT();
      writeBlockKindToDataTransfer(dt as unknown as DataTransfer, kind);
      expect(readBlockKindFromDataTransfer(dt as unknown as DataTransfer)).toBe(kind);
    }
  });
});

describe('readBlockKindFromDataTransfer — null fallbacks (Q4 defense in depth)', () => {
  it('returns null when the MIME is absent from the DataTransfer', () => {
    const dt = createFakeDT();
    expect(readBlockKindFromDataTransfer(dt as unknown as DataTransfer)).toBeNull();
  });

  it('returns null when the MIME holds an empty string', () => {
    const dt = createFakeDT();
    dt.setData(EXTERNAL_DROP_MIME, '');
    expect(readBlockKindFromDataTransfer(dt as unknown as DataTransfer)).toBeNull();
  });

  it('returns null when the MIME holds whitespace-only content', () => {
    const dt = createFakeDT();
    dt.setData(EXTERNAL_DROP_MIME, '   ');
    expect(readBlockKindFromDataTransfer(dt as unknown as DataTransfer)).toBeNull();
  });

  it('returns null on unknown kind (extension / page injection rogue value)', () => {
    const dt = createFakeDT();
    dt.setData(EXTERNAL_DROP_MIME, 'evil-kind');
    expect(readBlockKindFromDataTransfer(dt as unknown as DataTransfer)).toBeNull();
  });

  it('returns null on attempted code-injection MIME value', () => {
    const dt = createFakeDT();
    // The whitelist is the defense — even a syntactically valid
    // JS expression in the MIME slot must NOT escape into the
    // editor's dispatch path.
    dt.setData(EXTERNAL_DROP_MIME, 'eval("alert(1)")');
    expect(readBlockKindFromDataTransfer(dt as unknown as DataTransfer)).toBeNull();
  });

  it('strips surrounding whitespace before whitelist check (lenient parse)', () => {
    const dt = createFakeDT();
    dt.setData(EXTERNAL_DROP_MIME, '  callout  ');
    expect(readBlockKindFromDataTransfer(dt as unknown as DataTransfer)).toBe('callout');
  });
});

describe('isExternalDragSource — type-narrowing predicate', () => {
  it('returns true for the sentinel string', () => {
    expect(isExternalDragSource(EXTERNAL_DROP_SENTINEL)).toBe(true);
  });

  it('returns false for null (no drag in flight)', () => {
    expect(isExternalDragSource(null)).toBe(false);
  });

  it('returns false for a plausible UUID-shaped block id', () => {
    expect(isExternalDragSource('123e4567-e89b-42d3-a456-556642440000')).toBe(false);
  });

  it('returns false for an arbitrary non-sentinel string', () => {
    expect(isExternalDragSource('callout')).toBe(false);
    expect(isExternalDragSource('block-1')).toBe(false);
  });
});
