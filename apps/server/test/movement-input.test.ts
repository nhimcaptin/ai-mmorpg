import { expect, it } from 'vitest';
import { acceptMovementInput } from '../src/movement-input.js';
const intent = { version: 1, sequence: 8, x: 1, y: -1 };
it('rejects duplicate/reordered packets before and after a server tick', () => {
  expect(acceptMovementInput(intent, 7)).toEqual({ intent });
  expect(acceptMovementInput(intent, 7, 8)).toEqual({ error: 'STALE_SEQUENCE' });
  expect(acceptMovementInput(intent, 8)).toEqual({ error: 'STALE_SEQUENCE' });
  expect(acceptMovementInput({ ...intent, sequence: 6 }, 7, 8)).toEqual({ error: 'STALE_SEQUENCE' });
  expect(acceptMovementInput({ ...intent, sequence: 10 }, 7, 8)).toHaveProperty('intent.sequence', 10);
});
it('accepts only bounded direction intent with a safe integer sequence, never positions', () => {
  for (const value of [null, { ...intent, position: { x: 900, y: 900 } }, { ...intent, x: 900 }, { ...intent, y: 0.1 }, { ...intent, x: NaN }, { ...intent, version: 2 }, { ...intent, sequence: -1 }, { ...intent, sequence: Number.MAX_SAFE_INTEGER + 1 }]) expect(acceptMovementInput(value, -1)).toEqual({ error: 'INVALID_INTENT' });
  expect(acceptMovementInput({ ...intent, sequence: 0, x: 0, y: 0 }, -1)).toHaveProperty('intent.sequence', 0);
});
