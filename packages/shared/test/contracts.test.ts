import { describe, it, expect } from 'vitest';
import { movementIntentSchema } from '../src/index.js';
describe('movement contract', () => {
  it('rejects outcome injection, invalid numbers and incompatible protocol', () => {
    const input = { version: 1, sequence: 1, x: 1, y: 0 };
    expect(movementIntentSchema.safeParse(input).success).toBe(true);
    for (const invalid of [{ ...input, position: { x: 900 } }, { ...input, x: Infinity }, { ...input, x: 2 }, { ...input, version: 2 }, { ...input, sequence: -1 }]) {
      expect(movementIntentSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
