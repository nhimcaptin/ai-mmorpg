import { expect, it } from 'vitest';
import { STARTER_MAP } from '@mmorpg/shared';
import { canOccupy, move } from '../src/index.js';
it('spawn and paths are walkable; buildings and tree roots block the same AABB used by server', () => {
  const world = STARTER_MAP.world;
  expect(canOccupy(world.spawn, world)).toBe(true);
  for (const input of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) expect(move(world.spawn, input, 0.2, world)).not.toEqual(world.spawn);
  expect(canOccupy({ x: 260, y: 200 }, world)).toBe(false);
  expect(canOccupy({ x: 300, y: 750 }, world)).toBe(false);
  expect(canOccupy({ x: 300, y: 624 }, world)).toBe(true);
  expect(move({ x: 624, y: 200 }, { x: -1, y: 0 }, 5, world).x).toBeGreaterThanOrEqual(402);
});
