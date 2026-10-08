import { expect, it } from 'vitest';
import { STARTER_MAP, STARTER_TILED_DATA, STARTER_REGISTRY, loadStarterMap, isPkAllowed } from '../src/index.js';
it('loads official map geometry and fails closed for invalid registry, spawn or asset paths', () => {
  expect(STARTER_MAP.world.spawn).toEqual({ x: 624, y: 624 });
  expect(STARTER_MAP.respawn.id).toBe('starter_respawn_01');
  expect(STARTER_MAP.world.obstacles).toHaveLength(6);
  expect(isPkAllowed(STARTER_MAP.area)).toBe(false);
  for (const change of [
    (map: typeof STARTER_TILED_DATA) => { map.properties.find(p => p.name === 'mapId')!.value = 'fixture'; },
    (map: typeof STARTER_TILED_DATA) => { const spawn = map.layers.flatMap(l => 'objects' in l ? l.objects : []).find(o => o.name === 'starter_respawn_01')!; spawn.x = 260; spawn.y = 200; },
    (map: typeof STARTER_TILED_DATA) => { map.tilesets[0]!.tiles[0]!.image = '../secret.png'; }
  ]) { const data = structuredClone(STARTER_TILED_DATA); change(data); expect(() => loadStarterMap(data, STARTER_REGISTRY)).toThrow(); }
  expect(() => loadStarterMap(STARTER_TILED_DATA, { ...STARTER_REGISTRY, areas: [{ ...STARTER_REGISTRY.areas[0], zone: 'PVP' }] })).toThrow();
});
