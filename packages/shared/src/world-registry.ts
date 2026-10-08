import { z } from 'zod';
import { worldConfigSchema } from './config.js';
import { boundsSchema, footprintOverlapsRect } from './geometry.js';

const id = z.string().min(1);
const areaSchema = z.object({ id, mapId: id, bounds: boundsSchema }).strict();
const respawnSchema = z.object({ id, mapId: id, areaId: id, x: z.number().finite(), y: z.number().finite() }).strict();
export const worldRegistrySchema = z.object({ maps: z.array(worldConfigSchema).min(1), areas: z.array(areaSchema).min(1), respawns: z.array(respawnSchema).min(1) }).strict().superRefine((data, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  const maps = new Map(data.maps.map(map => [map.id, map]));
  const areas = new Map(data.areas.map(area => [area.id, area]));
  if (maps.size !== data.maps.length || areas.size !== data.areas.length || new Set(data.respawns.map(spawn => spawn.id)).size !== data.respawns.length) issue('Duplicate registry ID');
  for (const area of data.areas) {
    const map = maps.get(area.mapId), b = area.bounds;
    if (!map || b.x < 0 || b.y < 0 || b.x + b.width > map.width || b.y + b.height > map.height) issue('Invalid area map or bounds');
  }
  for (const map of data.maps) {
    const area = areas.get(map.areaId);
    if (area?.mapId !== map.id) { issue('Invalid default area reference'); continue; }
    const b = area.bounds, p = map.spawn, { halfWidth: w, halfHeight: h } = map.footprint;
    if (p.x - w < b.x || p.y - h < b.y || p.x + w > b.x + b.width || p.y + h > b.y + b.height) issue('Default spawn footprint outside area');
  }
  for (const spawn of data.respawns) {
    const map = maps.get(spawn.mapId), area = areas.get(spawn.areaId);
    if (!map || !area || area.mapId !== map.id) { issue('Invalid respawn reference'); continue; }
    const { halfWidth: w, halfHeight: h } = map.footprint;
    const rect = { x: spawn.x - w, y: spawn.y - h, width: 2 * w, height: 2 * h }, b = area.bounds;
    if (rect.x < b.x || rect.y < b.y || rect.x + rect.width > b.x + b.width || rect.y + rect.height > b.y + b.height) issue('Respawn footprint outside area');
    if ([...map.obstacles, ...map.collisionPolygons].some(shape => footprintOverlapsRect(shape, rect))) issue('Respawn overlaps collision');
  }
});

/** Shared coordinate data: an Area belongs to a Map; neither is inferred from the other ID. */
export function loadWorldRegistry(value: unknown) {
  const data = worldRegistrySchema.parse(value);
  const maps = new Map(data.maps.map(map => [map.id, map]));
  const areas = new Map(data.areas.map(area => [area.id, area]));
  const respawns = new Map(data.respawns.map(spawn => [spawn.id, spawn]));
  return { data, resolveLocation(location: { mapId: string; areaId: string; respawnId: string }) {
    const map = maps.get(location.mapId), area = areas.get(location.areaId), respawn = respawns.get(location.respawnId);
    if (!map || !area || !respawn || area.mapId !== map.id || respawn.mapId !== map.id || respawn.areaId !== area.id) throw new Error('Invalid world location');
    return { map, area, respawn };
  } };
}
