import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createDatabase } from '../src/database.js';
import { testTransactions } from './transactions.smoke.js';
import { testCharacters } from './characters.smoke.js';

const url = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres@127.0.0.1:54329/mmorpg_test';
const parsed = new URL(url);
if (parsed.hostname !== '127.0.0.1' || parsed.pathname !== '/mmorpg_test') {
  throw new Error('DB smoke requires the isolated local mmorpg_test database');
}
const database = createDatabase(url);
const id = randomUUID();
try {
  await database.$connect();
  try {
    await database.$transaction(async tx => {
      await tx.foundationProbe.create({ data: { id } });
      assert.equal((await tx.foundationProbe.findUniqueOrThrow({ where: { id } })).id, id);
      throw new Error('expected rollback');
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'expected rollback') throw error;
  }
  assert.equal(await database.foundationProbe.findUnique({ where: { id } }), null);
  console.log('DB round-trip and rollback passed');
  await testTransactions(database);
  await testCharacters(database);
} finally { await database.$disconnect(); }
