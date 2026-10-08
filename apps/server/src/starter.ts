import type { Prisma } from '@prisma/client';
import { STARTER_MAP, loadWorldRegistry, characterInitializationRequestSchema } from '@mmorpg/shared';
import { createCharacter } from './characters.js';

// Official GAME_SPEC 3.2 config; no D02 formulas or Phase 1 fixture data.
export const STARTER_STATS = {
  PHYSICAL_DPS: { maxHp: 120, maxKi: 60 },
  MAGIC_DPS: { maxHp: 90, maxKi: 120 },
  TANK: { maxHp: 180, maxKi: 50 }
} as const;
export function validateStarter(map = STARTER_MAP) {
  loadWorldRegistry({ maps: [map.world], areas: [{ id: map.area.id, mapId: map.area.mapId, bounds: { x: 0, y: 0, width: map.world.width, height: map.world.height } }], respawns: [map.respawn] });
  if (map.world.id !== 'starter_village' || map.area.id !== 'area_01' || map.area.mapId !== map.world.id || map.area.zone !== 'SAFE' || map.area.pkAllowed !== false ||
    map.respawn.id !== 'starter_respawn_01' || map.respawn.areaId !== map.area.id || map.respawn.mapId !== map.world.id || map.respawn.x !== map.world.spawn.x || map.respawn.y !== map.world.spawn.y) throw new Error('Invalid official starter registry');
  for (const stats of Object.values(STARTER_STATS)) for (const value of Object.values(stats)) if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid starter stats');
  return map;
}
/** Trusted transaction helper. Authentication registration must create Account and credentials in this SAME transaction. */
export async function initializeCharacter(tx: Prisma.TransactionClient, value: unknown, map = STARTER_MAP) {
  const request = characterInitializationRequestSchema.parse(value);
  validateStarter(map);
  const stats = STARTER_STATS[request.class];
  const character = await createCharacter(tx, { ...request, realm: 1, star: 1, hp: stats.maxHp, ki: stats.maxKi, gold: '0', mapId: map.world.id,
    areaId: map.area.id, respawnId: map.respawn.id, pkEnabled: false });
  await tx.characterInitialization.create({ data: { characterId: character.id, maxHp: BigInt(stats.maxHp), maxKi: BigInt(stats.maxKi), cultivationExp: 0n, x: map.respawn.x, y: map.respawn.y } });
  return character;
}
