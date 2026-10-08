import { z } from 'zod';
export const nonNegativeIntegerSchema = z.number().finite().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const goldStringSchema = z.string().regex(/^(0|[1-9][0-9]*)$/);
export function parseGold(value: unknown): bigint { return BigInt(goldStringSchema.parse(value)); }
export function serializeGold(value: bigint): string {
  if (typeof value !== 'bigint' || value < 0n) throw new Error('Invalid Gold');
  return value.toString();
}
export const characterSchema = z.object({
  id: z.string().uuid(), accountId: z.string().uuid(),
  class: z.enum(['PHYSICAL_DPS', 'MAGIC_DPS', 'TANK']),
  realm: z.number().int().min(1).max(11), star: z.number().int().min(1).max(9),
  hp: nonNegativeIntegerSchema, ki: nonNegativeIntegerSchema, gold: goldStringSchema,
  mapId: z.string().min(1), areaId: z.string().min(1), respawnId: z.string().min(1), pkEnabled: z.boolean()
}).strict();
export type CharacterData = z.infer<typeof characterSchema>;
