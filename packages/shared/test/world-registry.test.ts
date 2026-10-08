import { expect, it } from 'vitest';
import { FOUNDATION_WORLD, STARTER_MAP, STARTER_WORLD_REGISTRY, loadWorldRegistry } from '../src/index.js';
const fixture = () => ({ maps: [structuredClone(FOUNDATION_WORLD)], areas: [
  { id: FOUNDATION_WORLD.areaId, mapId: FOUNDATION_WORLD.id, bounds: { x: 0, y: 0, width: 480, height: 640 } },
  { id: 'east', mapId: FOUNDATION_WORLD.id, bounds: { x: 480, y: 0, width: 480, height: 640 } }
], respawns: [{ id: 'west-spawn', mapId: FOUNDATION_WORLD.id, areaId: FOUNDATION_WORLD.areaId, x: 160, y: 320 }, { id: 'east-spawn', mapId: FOUNDATION_WORLD.id, areaId: 'east', x: 600, y: 300 }] });
it('resolves separate areas in one map and shares official coordinates', () => {
  const loader = loadWorldRegistry(fixture());
  expect(loader.resolveLocation({ mapId: FOUNDATION_WORLD.id, areaId: 'east', respawnId: 'east-spawn' }).respawn.x).toBe(600);
  expect(() => loader.resolveLocation({ mapId: FOUNDATION_WORLD.id, areaId: 'east', respawnId: 'west-spawn' })).toThrow();
  expect(STARTER_WORLD_REGISTRY.resolveLocation({ mapId: STARTER_MAP.world.id, areaId: STARTER_MAP.area.id, respawnId: STARTER_MAP.respawn.id }).map).toEqual(STARTER_MAP.world);
});
it('rejects duplicate IDs, unknown references, invalid bounds and obstructed spawns', () => {
  for (const mutate of [
    (c: ReturnType<typeof fixture>) => { c.maps.push(c.maps[0]!); },
    (c: ReturnType<typeof fixture>) => { c.areas.push(c.areas[0]!); },
    (c: ReturnType<typeof fixture>) => { c.respawns.push(c.respawns[0]!); },
    (c: ReturnType<typeof fixture>) => { c.areas[0]!.mapId = 'unknown'; },
    (c: ReturnType<typeof fixture>) => { c.areas[0]!.bounds.x = -1; },
    (c: ReturnType<typeof fixture>) => { c.areas[1]!.bounds.width = 999; },
    (c: ReturnType<typeof fixture>) => { c.respawns[1]!.areaId = 'unknown'; },
    (c: ReturnType<typeof fixture>) => { c.respawns[1]!.x = 480; },
    (c: ReturnType<typeof fixture>) => { c.respawns[0]!.x = 400; },
    (c: ReturnType<typeof fixture>) => { c.maps[0]!.collisionPolygons = [{ points: [{ x: 10, y: 10 }, { x: 30, y: 30 }, { x: 10, y: 30 }, { x: 30, y: 10 }] }]; }
  ]) { const data = fixture(); mutate(data); expect(() => loadWorldRegistry(data)).toThrow(); }
});
