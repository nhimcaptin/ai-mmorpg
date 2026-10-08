import { expect, it } from 'vitest';
import { roundDamage, roundHealing, applyDamage, applyHealing, changeGold } from '../src/index.js';
import { parseGold, serializeGold } from '@mmorpg/shared';
it('floors damage/healing and protects non-negative integer health', () => {
  expect(roundDamage(1.9)).toBe(1); expect(roundHealing(0.9)).toBe(0);
  expect(applyDamage(3, 9.9)).toBe(0); expect(applyHealing(3, 2.9)).toBe(5);
  for (const invalid of [-1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(() => roundDamage(invalid)).toThrow();
  expect(() => applyHealing(Number.MAX_SAFE_INTEGER, 1)).toThrow();
  expect(() => applyDamage(1.5, 1)).toThrow();
});
it('keeps Gold lossless above Number precision and rejects ambiguous transport', () => {
  const gold = 9223372036854775807n;
  expect(parseGold(JSON.parse(JSON.stringify({ gold: serializeGold(gold) })).gold)).toBe(gold);
  expect(changeGold(gold, 1n)).toBe(gold + 1n);
  expect(() => changeGold(0n, -1n)).toThrow();
  for (const invalid of [1, '-1', '01', '1.5', '1e3', ' 1', '+1', '']) expect(() => parseGold(invalid)).toThrow();
});
