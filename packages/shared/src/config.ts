import { z } from 'zod';

// GAME_SPEC 2.1: immutable world unit; remaining numeric fields are config.
export const WORLD_UNIT = 32;
const positive = z.number().finite().positive();
const id = z.string().min(1);
const position = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
export const worldConfigSchema = z.object({
  id, areaId: id, width: positive, height: positive, unit: z.literal(WORLD_UNIT),
  spawn: position, footprint: z.object({ halfWidth: positive, halfHeight: positive }).strict(),
  moveSpeed: positive, tickMs: positive, inputTimeoutMs: positive,
  renderScale: positive, zoomMin: positive, zoomMax: positive,
  obstacles: z.array(z.object({ x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(), width: positive, height: positive }).strict())
}).strict().superRefine((world, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  if (world.zoomMin > world.zoomMax) issue('zoomMin must not exceed zoomMax');
  const { halfWidth: w, halfHeight: h } = world.footprint;
  const p = world.spawn;
  if (p.x - w < 0 || p.y - h < 0 || p.x + w > world.width || p.y + h > world.height) issue('spawn footprint outside world');
  for (const r of world.obstacles) {
    if (r.x + r.width > world.width || r.y + r.height > world.height) issue('obstacle outside world');
    if (p.x + w > r.x && p.x - w < r.x + r.width && p.y + h > r.y && p.y - h < r.y + r.height) issue('spawn overlaps collision');
  }
});
export const gameplayConfigSchema = z.object({
  areas: z.array(z.object({ id, mapId: id }).strict()),
  worlds: z.array(worldConfigSchema)
}).strict().superRefine((config, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  const worlds = new Map(config.worlds.map(world => [world.id, world]));
  const areas = new Map(config.areas.map(area => [area.id, area]));
  if (worlds.size !== config.worlds.length || areas.size !== config.areas.length) issue('duplicate world/area ID');
  for (const area of config.areas) if (!worlds.has(area.mapId)) issue(`unknown map reference: ${area.mapId}`);
  for (const world of config.worlds) if (areas.get(world.areaId)?.mapId !== world.id) issue(`invalid area reference: ${world.areaId}`);
});
export function loadGameplayConfig(value: unknown) {
  const result = gameplayConfigSchema.safeParse(value);
  if (!result.success) throw new Error(`Invalid gameplay config: ${result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  return result.data;
}
