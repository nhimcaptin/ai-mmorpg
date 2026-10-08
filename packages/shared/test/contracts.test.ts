import { describe, it, expect } from 'vitest';
import { movementIntentSchema, protocolErrorSchema } from '../src/index.js';
describe('movement contract', () => {
  it('validates versioned errors without accepting arbitrary server payload', () => {
    expect(protocolErrorSchema.safeParse({ version: 1, code: 'INVALID_INTENT' }).success).toBe(true);
    for (const invalid of [{ version: 2, code: 'INVALID_INTENT' }, { version: 1, code: 'UNKNOWN' }, { version: 1, code: 'STALE_SEQUENCE', gold: 100 }]) {
      expect(protocolErrorSchema.safeParse(invalid).success).toBe(false);
    }
  });
  it('rejects outcome injection, invalid numbers and incompatible protocol', () => {
    const input = { version: 1, sequence: 1, x: 1, y: 0 };
    expect(movementIntentSchema.safeParse(input).success).toBe(true);
    for (const invalid of [{ ...input, position: { x: 900 } }, { ...input, x: Infinity }, { ...input, x: 2 }, { ...input, version: 2 }, { ...input, sequence: -1 }]) {
      expect(movementIntentSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
