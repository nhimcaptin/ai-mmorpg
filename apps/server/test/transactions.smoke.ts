import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { atomicOperation } from '../src/transactions.js';

export async function testTransactions(database: PrismaClient) {
  const scope = `test-${randomUUID()}`, id = randomUUID();
  await database.foundationProbe.create({ data: { id, value: 100 } });
  try {
    const request = { scope, key: 'credit', payload: '{"credit":7}' };
    let calls = 0;
    const credit = () => atomicOperation(database, request, async tx => {
      calls++;
      const row = await tx.foundationProbe.update({ where: { id }, data: { value: { increment: 7 } } });
      return { value: row.value };
    });
    assert.deepEqual(await Promise.all([credit(), credit(), credit()]), [{ value: 107 }, { value: 107 }, { value: 107 }]);
    // Successful commit whose response was lost: retry must return stored result.
    assert.deepEqual(await credit(), { value: 107 });
    assert.equal(calls, 1);
    await assert.rejects(atomicOperation(database, { ...request, payload: '{"credit":8}' }, async () => ({})), /payload conflict/);
    const debit = { scope, key: 'debit', payload: '{"debit":3}' };
    await assert.rejects(atomicOperation(database, debit, async tx => {
      await tx.foundationProbe.update({ where: { id }, data: { value: { decrement: 3 } } });
      throw new Error('simulated failure before commit');
    }), /simulated failure/);
    assert.equal((await database.foundationProbe.findUniqueOrThrow({ where: { id } })).value, 107);
    assert.equal(await database.operationReceipt.count({ where: { scope, key: 'debit' } }), 0);
    const applyDebit = () => atomicOperation(database, debit, async tx => {
      const row = await tx.foundationProbe.update({ where: { id }, data: { value: { decrement: 3 } } });
      return { value: row.value };
    });
    assert.deepEqual(await Promise.all([applyDebit(), applyDebit()]), [{ value: 104 }, { value: 104 }]);
    assert.equal((await database.foundationProbe.findUniqueOrThrow({ where: { id } })).value, 104);
    console.log('DB concurrent credit/debit, lost-response retry, conflict and pre-commit rollback passed');
  } finally {
    // Only records created by this isolated test; never reset tables or user data.
    await database.operationReceipt.deleteMany({ where: { scope } });
    await database.foundationProbe.delete({ where: { id } });
  }
}
