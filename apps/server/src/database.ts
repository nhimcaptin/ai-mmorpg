import { PrismaClient } from '@prisma/client';
export function createDatabase(url: string): PrismaClient {
  const parsed = new URL(url);
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') throw new Error('PostgreSQL URL required');
  return new PrismaClient({ datasources: { db: { url } } });
}
