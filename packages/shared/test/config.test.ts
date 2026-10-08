import { expect, it } from 'vitest';
import { FOUNDATION_WORLD, loadGameplayConfig } from '../src/index.js';
const fixture = () => ({ worlds: [structuredClone(FOUNDATION_WORLD)], areas: [{ id: FOUNDATION_WORLD.areaId, mapId: FOUNDATION_WORLD.id }] });
it('loads a technical fixture and rejects invalid values and references', () => {
  expect(loadGameplayConfig(fixture()).worlds[0]).toEqual(FOUNDATION_WORLD);
  for (const change of [
    (c: ReturnType<typeof fixture>) => { c.worlds[0]!.unit = 16; },
    (c: ReturnType<typeof fixture>) => { c.worlds[0]!.moveSpeed = Infinity; },
    (c: ReturnType<typeof fixture>) => { c.worlds[0]!.spawn.x = 400; },
    (c: ReturnType<typeof fixture>) => { c.worlds[0]!.zoomMin = 99; },
    (c: ReturnType<typeof fixture>) => { c.areas[0]!.mapId = 'missing'; },
    (c: ReturnType<typeof fixture>) => { c.worlds.push(c.worlds[0]!); }
  ]) {
    const config = fixture(); change(config);
    expect(() => loadGameplayConfig(config)).toThrow('Invalid gameplay config');
  }
});
