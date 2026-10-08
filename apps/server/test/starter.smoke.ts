import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { STARTER_MAP } from '@mmorpg/shared';
import { initializeCharacter, STARTER_STATS } from '../src/starter.js';
import { atomicOperation } from '../src/transactions.js';
export async function testStarter(database: PrismaClient) {
  for (const className of ['PHYSICAL_DPS', 'MAGIC_DPS', 'TANK'] as const) {
    const accountId = randomUUID(), id = randomUUID(), scope = `starter-test:${accountId}`;
    const request = { id, accountId, class: className };
    try {
      const apply = () => atomicOperation(database, { scope, key: 'register', payload: JSON.stringify(request) }, async tx => {
        await tx.account.create({ data: { id: accountId } });
        const row = await initializeCharacter(tx, request);
        return { id: row.id };
      });
      const results = await Promise.all([apply(), apply()]);
      assert.deepEqual(results[0], results[1]);
      assert.equal(await database.character.count({ where: { accountId } }), 1);
      const row = await database.character.findUniqueOrThrow({ where: { id }, include: { initialization: true } });
      const stats = STARTER_STATS[className];
      assert.equal(row.hp, BigInt(stats.maxHp)); assert.equal(row.ki, BigInt(stats.maxKi)); assert.equal(row.gold, 0n);
      assert.equal(row.realm, 1); assert.equal(row.star, 1); assert.equal(row.pkEnabled, false);
      assert.equal(row.mapId, 'starter_village'); assert.equal(row.areaId, 'area_01'); assert.equal(row.respawnId, 'starter_respawn_01');
      assert.equal(row.initialization!.maxHp, row.hp); assert.equal(row.initialization!.maxKi, row.ki); assert.equal(row.initialization!.cultivationExp, 0n);
      assert.equal(row.initialization!.x, STARTER_MAP.respawn.x); assert.equal(row.initialization!.y, STARTER_MAP.respawn.y);
      await assert.rejects(database.$transaction(tx => initializeCharacter(tx, { ...request, id: randomUUID() })));
      await assert.rejects(database.$transaction(tx => initializeCharacter(tx, { ...request, hp: 999 })));
    } finally {
      await database.operationReceipt.deleteMany({ where: { scope } });
      await database.characterInitialization.deleteMany({ where: { characterId: id } });
      await database.character.deleteMany({ where: { accountId } });
      await database.account.deleteMany({ where: { id: accountId } });
    }
  }
  const accountId = randomUUID();
  const map = structuredClone(STARTER_MAP); map.world.spawn = { x: 260, y: 200 }; map.respawn.x = 260; map.respawn.y = 200;
  await assert.rejects(database.$transaction(async tx => { await tx.account.create({ data: { id: accountId } }); await initializeCharacter(tx, { id: randomUUID(), accountId, class: 'TANK' }, map); }));
  assert.equal(await database.account.findUnique({ where: { id: accountId } }), null);
  const rollbackId = randomUUID();
  await assert.rejects(database.$transaction(async tx => { await tx.account.create({ data: { id: rollbackId } }); await initializeCharacter(tx, { id: randomUUID(), accountId: rollbackId, class: 'TANK' }); throw new Error('Injected failure after Character creation'); }));
  assert.equal(await database.account.findUnique({ where: { id: rollbackId } }), null);
  assert.equal(await database.character.count({ where: { accountId: rollbackId } }), 0);
  console.log('Starter initialization: all 3 classes, real PostgreSQL atomic retries/concurrency, uniqueness, rollback and invalid config passed');
}
