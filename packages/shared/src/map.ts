import { z } from 'zod';
import { worldConfigSchema } from './config.js';
const number = z.number().finite();
const properties = z.array(z.object({ name: z.string(), value: z.union([number, z.string(), z.boolean()]) }).passthrough()).default([]);
const object = z.object({ name: z.string(), type: z.string(), x: number, y: number, width: number.default(0), height: number.default(0), gid: z.number().int().optional(), properties }).passthrough();
const tiledSchema = z.object({ type: z.literal('map'), orientation: z.literal('orthogonal'), tilewidth: z.literal(32), tileheight: z.literal(32), properties,
  layers: z.array(z.object({ name: z.string(), type: z.enum(['imagelayer', 'objectgroup']), image: z.string().optional(), objects: z.array(object).default([]) }).passthrough()),
  tilesets: z.array(z.object({ firstgid: z.number().int(), tiles: z.array(z.object({ id: z.number().int(), image: z.string(), imagewidth: number, imageheight: number, properties }).passthrough()) }).passthrough())
}).passthrough();
type Properties = z.infer<typeof properties>;
const property = (values: Properties, name: string) => values.find(value => value.name === name)?.value;
const imagePath = (value: string) => { if (!/^images\/[\w.-]+\.png$/.test(value)) throw new Error('Unsafe map asset path'); return `/assets/maps/starter_village/${value}`; };

/** Loads the official embedded Tiled export; geometry is shared by FE and BE. */
export function loadStarterMap(value: unknown, registryValue: unknown) {
  const registry = z.object({ areas: z.array(z.object({ id: z.literal('area_01'), mapId: z.literal('starter_village'), zone: z.literal('SAFE'), bounds: z.tuple([number, number, number, number]) }).strict()).length(1),
    runtime: worldConfigSchema.innerType().pick({ moveSpeed: true, tickMs: true, inputTimeoutMs: true, footprint: true, renderScale: true, zoomMin: true, zoomMax: true }).strict()
  }).strict().parse(registryValue);
  const map = tiledSchema.parse(value);
  if (property(map.properties, 'mapId') !== 'starter_village') throw new Error('Wrong starter map ID');
  const respawn = map.layers.flatMap(layer => layer.objects).find(item => item.name === 'starter_respawn_01' && item.type === 'spawn');
  const ground = map.layers.find(layer => layer.name === 'terrain' && layer.type === 'imagelayer')?.image;
  if (!respawn || !ground) throw new Error('Missing terrain/respawn');
  const obstacles = map.layers.filter(layer => layer.name === 'collision').flatMap(layer => layer.objects).map(item => ({ x: item.x, y: item.y, width: item.width, height: item.height }));
  const world = worldConfigSchema.parse({ id: 'starter_village', areaId: 'area_01', width: property(map.properties, 'worldWidth'), height: property(map.properties, 'worldHeight'), unit: 32,
    spawn: { x: respawn.x, y: respawn.y }, obstacles,
    ...registry.runtime });
  if (registry.areas[0]!.bounds.join(',') !== [0, 0, world.width, world.height].join(',')) throw new Error('Starter area bounds mismatch');
  const props = map.layers.filter(layer => layer.name === 'props').flatMap(layer => layer.objects).map(item => {
    const tileset = map.tilesets.find(set => set.tiles.some(tile => set.firstgid + tile.id === item.gid));
    const tile = tileset?.tiles.find(tile => tileset.firstgid + tile.id === item.gid);
    if (!tile || item.width <= 0 || item.height <= 0) throw new Error('Missing prop art/size');
    const kind = z.enum(['house', 'tree']).parse(property(tile.properties, 'prop'));
    return { id: item.name, kind, image: imagePath(tile.image), x: item.x, y: item.y - item.height,
      width: item.width, height: item.height, depth: Number(property(item.properties, 'sortY')) };
  });
  if (props.some(prop => !Number.isFinite(prop.depth) || prop.x < 0 || prop.y < 0 || prop.x + prop.width > world.width || prop.y + prop.height > world.height)) throw new Error('Prop outside world');
  return { world, ground: imagePath(ground), props,
    area: { id: 'area_01', mapId: world.id, zone: 'SAFE' as const, pkAllowed: false as const },
    respawn: { id: respawn.name, areaId: 'area_01', mapId: world.id, x: respawn.x, y: respawn.y } };
}
