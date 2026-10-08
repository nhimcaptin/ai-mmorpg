import { it, expect } from 'vitest';
import { FOUNDATION_WORLD } from '@mmorpg/shared';
import { canOccupy } from '@mmorpg/game-core';
it('technical fixture spawns on valid ground', () => {
  expect(canOccupy(FOUNDATION_WORLD.spawn, FOUNDATION_WORLD)).toBe(true);
});
