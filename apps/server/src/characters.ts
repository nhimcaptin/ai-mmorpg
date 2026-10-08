import type { Prisma, Character } from '@prisma/client';
import { characterSchema, parseGold, serializeGold } from '@mmorpg/shared';
import { changeGold } from '@mmorpg/game-core';
import { atomicOperation } from './transactions.js';
import type { PrismaClient } from '@prisma/client';
// Storage boundary, not a balance cap. Domain BigInt itself is unbounded.
export const POSTGRES_BIGINT_MAX = 9223372036854775807n;
export function storedGold(value: bigint): bigint {
  if (value < 0n || value > POSTGRES_BIGINT_MAX) throw new Error('Gold storage overflow');
  return value;
}
export function characterToWire(row: Character) {
  return characterSchema.parse({ ...row, hp: Number(row.hp), ki: Number(row.ki), gold: serializeGold(row.gold) });
}
export async function createCharacter(tx: Prisma.TransactionClient, value: unknown) {
  const data = characterSchema.parse(value);
  return tx.character.create({ data: { ...data, hp: BigInt(data.hp), ki: BigInt(data.ki), gold: storedGold(parseGold(data.gold)) } });
}
/** Trusted server operation only; authentication/authorization is the caller's responsibility. */
export function transactGold(database: PrismaClient, characterId: string, key: string, delta: bigint) {
  if (typeof delta !== 'bigint') throw new Error('BigInt delta required');
  return atomicOperation(database, { scope: `gold:${characterId}`, key, payload: delta.toString() }, async tx => {
    const rows = await tx.$queryRaw<{ gold: bigint }[]>`SELECT "gold" FROM "Character" WHERE "id" = ${characterId}::uuid FOR UPDATE`;
    if (!rows[0]) throw new Error('Character not found');
    const gold = storedGold(changeGold(rows[0].gold, delta));
    await tx.character.update({ where: { id: characterId }, data: { gold } });
    return { gold: serializeGold(gold) };
  });
}
