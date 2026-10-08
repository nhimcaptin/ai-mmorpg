import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { credentialsSchema, registrationSchema } from '@mmorpg/shared';
import { hashPassword, verifyPassword } from './password.js';
import { initializeCharacter, validateStarter } from './starter.js';
import { atomicOperation } from './transactions.js';
import type { RecoveryService } from './recovery.js';
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export class AuthService {
  recovery?: RecoveryService;
  private listeners = new Set<(accountId: string, sessionId: string) => void>();
  private readonly dummyHash: Promise<string>;
  constructor(readonly database: PrismaClient, readonly ttlMs: number, readonly now = Date.now) {
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0 || !Number.isFinite(now() + ttlMs)) throw new Error('Explicit valid session TTL required');
    validateStarter();
    this.dummyHash = hashPassword(randomBytes(32).toString('hex'));
  }
  subscribe(listener: (accountId: string, sessionId: string) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private notify(accountId: string, sessionId: string) { for (const listener of this.listeners) listener(accountId, sessionId); }
  async register(value: unknown) {
    const input = registrationSchema.parse(value);
    const passwordHash = await hashPassword(input.password);
    const result = await atomicOperation(this.database, { scope: 'registration', key: input.requestId, payload: JSON.stringify({ username: input.username, class: input.class }) }, async tx => {
      const accountId = randomUUID(), characterId = randomUUID();
      await tx.account.create({ data: { id: accountId } });
      await tx.credential.create({ data: { accountId, username: input.username, passwordHash } });
      await initializeCharacter(tx, { id: characterId, accountId, class: input.class });
      return { accountId, characterId };
    }) as { accountId: string; characterId: string };
    // Receipt contains no password or its fast hash. Same-key different-password retries fail closed.
    const credential = await this.database.credential.findUniqueOrThrow({ where: { accountId: result.accountId } });
    if (!await verifyPassword(input.password, credential.passwordHash)) throw new Error('INVALID_REGISTRATION');
    return result;
  }
  async login(value: unknown) {
    const input = credentialsSchema.parse(value);
    const credential = await this.database.credential.findUnique({ where: { username: input.username } });
    const valid = await verifyPassword(input.password, credential?.passwordHash ?? await this.dummyHash);
    if (!credential || !valid) throw new Error('INVALID_CREDENTIALS');
    const token = randomBytes(32).toString('hex'), id = randomUUID(), expiresAt = new Date(this.now() + this.ttlMs);
    await this.database.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id" = ${credential.accountId}::uuid FOR UPDATE`;
      const current = await tx.credential.findUniqueOrThrow({ where: { accountId: credential.accountId } });
      if (current.passwordHash !== credential.passwordHash) throw new Error('INVALID_CREDENTIALS');
      await tx.gameplaySession.upsert({ where: { accountId: credential.accountId }, create: { accountId: credential.accountId, id, tokenHash: tokenHash(token), expiresAt }, update: { id, tokenHash: tokenHash(token), expiresAt } });
    });
    this.notify(credential.accountId, id);
    return { token, sessionId: id, expiresAt: expiresAt.toISOString() };
  }
  async authenticate(token: unknown) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error('INVALID_SESSION');
    const session = await this.database.gameplaySession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { account: { include: { character: { include: { initialization: true } } } } } });
    if (!session || session.expiresAt.getTime() <= this.now() || !session.account.character?.initialization) throw new Error('INVALID_SESSION');
    return session;
  }
  async logout(token: string) {
    const session = await this.authenticate(token);
    await this.database.gameplaySession.deleteMany({ where: { accountId: session.accountId, id: session.id, tokenHash: tokenHash(token) } });
    this.notify(session.accountId, 'logged-out');
  }
  invalidate(accountId: string) { this.notify(accountId, 'password-reset'); }
}
