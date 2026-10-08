import { it, expect } from 'vitest';
import { FOUNDATION_WORLD } from '@mmorpg/shared';
it('world geometry is independent of the camera scale', () => {
  const world = { ...FOUNDATION_WORLD, renderScale: 1.2 };
  expect(world.obstacles).toEqual(FOUNDATION_WORLD.obstacles);
  expect(world.footprint).toEqual(FOUNDATION_WORLD.footprint);
  expect(world.unit).toBe(32);
});
