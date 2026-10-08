import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { createCharacter, characterToWire, transactGold, POSTGRES_BIGINT_MAX } from '../src/characters.js';

export async function testCharacters(database: PrismaClient) {
  const accountId = randomUUID(), id = randomUUID();
  const data = { id, accountId, class: 'PHYSICAL_DPS', realm: 1, star: 1, hp: 100, ki: 50,
    gold: '9007199254740993', mapId: 'test-map', areaId: 'test-area', respawnId: 'test-respawn', pkEnabled: false };
  await database.account.create({ data: { id: accountId } });
  try {
    await database.$transaction(tx => createCharacter(tx, data));
    const row = await database.character.findUniqueOrThrow({ where: { id } });
    assert.deepEqual(characterToWire(row), data);
    assert.equal(row.gold, 9007199254740993n);
    await assert.rejects(database.$transaction(tx => createCharacter(tx, { ...data, id: randomUUID() })));
    await assert.rejects(database.character.update({ where: { id }, data: { hp: -1n } }));
    await assert.rejects(database.character.update({ where: { id }, data: { ki: -1n } }));
    await assert.rejects(database.character.update({ where: { id }, data: { gold: -1n } }));
    await assert.rejects(database.character.update({ where: { id }, data: { class: 'TANK' } }));
    await assert.rejects(database.character.update({ where: { id }, data: { star: 10 } }));
    await assert.rejects(database.$transaction(tx => createCharacter(tx, { ...data, gold: (POSTGRES_BIGINT_MAX + 1n).toString() })));
    const response = { gold: '9007199254740990' };
    assert.deepEqual(await Promise.all([transactGold(database, id, 'debit', -3n), transactGold(database, id, 'debit', -3n)]), [response, response]);
    await assert.rejects(transactGold(database, id, 'underflow', -9007199254740991n));
    await assert.rejects(transactGold(database, id, 'debit', -4n));
    await database.character.update({ where: { id }, data: { gold: POSTGRES_BIGINT_MAX } });
    await assert.rejects(transactGold(database, id, 'overflow', 1n));
    assert.deepEqual(await transactGold(database, id, 'zero', 0n), { gold: POSTGRES_BIGINT_MAX.toString() });
    assert.equal((await database.character.findUniqueOrThrow({ where: { id } })).gold, POSTGRES_BIGINT_MAX);
    console.log('Character round-trip, uniqueness, immutable class, numeric DB constraints and atomic BigInt Gold passed');
  } finally {
    await database.operationReceipt.deleteMany({ where: { scope: `gold:${id}` } });
    await database.character.deleteMany({ where: { accountId } });
    await database.account.delete({ where: { id: accountId } });
  }
}
