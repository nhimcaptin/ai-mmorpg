import { describe, it, expect } from 'vitest';
import { FOUNDATION_WORLD } from '@mmorpg/shared';
import { move, canOccupy, directionFor } from '../src/index.js';
describe('authoritative movement', () => {
  it('normalizes diagonal speed', () => {
    const start = { x: 100, y: 100 };
    const cardinal = move(start, { x: 1, y: 0 }, 0.1, FOUNDATION_WORLD);
    const diagonal = move(start, { x: 1, y: 1 }, 0.1, FOUNDATION_WORLD);
    expect(Math.hypot(diagonal.x - start.x, diagonal.y - start.y)).toBeCloseTo(cardinal.x - start.x);
  });
  it('blocks footprint at walls, world bounds and thin obstacles without tunneling', () => {
    expect(canOccupy({ x: 400, y: 320 }, FOUNDATION_WORLD)).toBe(false);
    expect(move({ x: 350, y: 320 }, { x: 1, y: 0 }, 1, FOUNDATION_WORLD).x).toBeLessThanOrEqual(374);
    expect(move({ x: 12, y: 20 }, { x: -1, y: 0 }, 1, FOUNDATION_WORLD).x).toBeGreaterThanOrEqual(10);
    const thin = { ...FOUNDATION_WORLD, obstacles: [{ x: 200, y: 0, width: 1, height: 640 }] };
    expect(move({ x: 160, y: 320 }, { x: 1, y: 0 }, 2, thin).x).toBeLessThanOrEqual(190);
  });
  it('preserves stopped facing and maps diagonals consistently', () => {
    expect(directionFor(0, 0, 'W')).toBe('W');
    expect(directionFor(1, -1, 'S')).toBe('N');
    expect(directionFor(-1, 1, 'N')).toBe('S');
  });
});
