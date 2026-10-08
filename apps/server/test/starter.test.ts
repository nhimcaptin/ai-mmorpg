import { expect, it } from 'vitest';
import { STARTER_MAP } from '@mmorpg/shared';
import { STARTER_STATS, validateStarter } from '../src/starter.js';
it('approved starter config fails closed for wrong identity, PK or collision', () => {
  expect(STARTER_STATS.PHYSICAL_DPS).toEqual({ maxHp: 120, maxKi: 60 });
  expect(STARTER_STATS.MAGIC_DPS).toEqual({ maxHp: 90, maxKi: 120 });
  expect(STARTER_STATS.TANK).toEqual({ maxHp: 180, maxKi: 50 });
  expect(validateStarter()).toEqual(STARTER_MAP);
  const map = structuredClone(STARTER_MAP); map.world.obstacles.push({ x: 600, y: 600, width: 64, height: 64 });
  expect(() => validateStarter(map)).toThrow();
  const wrong = structuredClone(STARTER_MAP); wrong.respawn.x = 123;
  expect(() => validateStarter(wrong)).toThrow();
});
