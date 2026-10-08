import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';

/** Caller supplies a canonical payload and a trusted actor/operation scope. */
export async function atomicOperation(
  database: PrismaClient,
  request: { scope: string; key: string; payload: string },
  apply: (transaction: Prisma.TransactionClient) => Promise<Prisma.InputJsonObject>
): Promise<Prisma.JsonValue> {
  const { scope, key, payload } = request;
  if (!scope || !key) throw new Error('Operation scope/key required');
  const payloadHash = createHash('sha256').update(payload).digest('hex');
  return database.$transaction(async tx => {
    // Serialize same-key callers across all server processes, until commit/rollback.
    // Lock collisions only reduce concurrency; receipt comparison remains exact.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify([scope, key])}, 0))::text`;
    const previous = await tx.operationReceipt.findUnique({ where: { scope_key: { scope, key } } });
    if (previous) {
      if (previous.payloadHash !== payloadHash) throw new Error('Idempotency payload conflict');
      return previous.result;
    }
    const result = await apply(tx);
    const receipt = await tx.operationReceipt.create({ data: { scope, key, payloadHash, result } });
    return receipt.result;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}
