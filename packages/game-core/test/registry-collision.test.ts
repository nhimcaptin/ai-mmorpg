import { expect, it } from 'vitest';
import { FOUNDATION_WORLD, loadWorldRegistry } from '@mmorpg/shared';
import { canOccupy } from '../src/index.js';
it('loaded building/tree bases and water polygons use footprints rather than visual roofs/canopies', () => {
  const world = { ...FOUNDATION_WORLD, obstacles: [{ x: 200, y: 200, width: 60, height: 30 }, { x: 500, y: 350, width: 20, height: 20 }], collisionPolygons: [{ points: [{ x: 700, y: 100 }, { x: 800, y: 130 }, { x: 780, y: 220 }, { x: 690, y: 180 }] }] };
  const loaded = loadWorldRegistry({ maps: [world], areas: [{ id: world.areaId, mapId: world.id, bounds: { x: 0, y: 0, width: world.width, height: world.height } }], respawns: [{ id: 'fixture-spawn', mapId: world.id, areaId: world.areaId, ...world.spawn }] }).data.maps[0]!;
  expect(canOccupy({ x: 230, y: 180 }, loaded)).toBe(true);
  expect(canOccupy({ x: 230, y: 215 }, loaded)).toBe(false);
  expect(canOccupy({ x: 510, y: 320 }, loaded)).toBe(true);
  expect(canOccupy({ x: 510, y: 355 }, loaded)).toBe(false);
  expect(canOccupy({ x: 740, y: 160 }, loaded)).toBe(false);
});
