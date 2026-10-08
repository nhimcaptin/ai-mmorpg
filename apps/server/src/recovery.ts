import { randomBytes } from 'node:crypto';
import { emailVerificationRequestSchema, recoveryRequestSchema, emailTokenSchema, passwordResetSchema } from '@mmorpg/shared';
import { AuthService, tokenHash } from './auth.js';
import { hashPassword, verifyPassword } from './password.js';
export type EmailMessage = { to: string; purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD'; token: string };
export interface EmailDelivery { send(message: EmailMessage): Promise<void> }
export type RecoveryConfig = { tokenTtlMs: number; cooldownMs: number };
/** Injected email delivery; no automatic verification or production transport. */
export class RecoveryService {
  constructor(readonly auth: AuthService, readonly delivery: EmailDelivery, readonly config: RecoveryConfig) {
    for (const value of Object.values(config)) if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Explicit recovery config required');
    if (!Number.isFinite(auth.now() + config.tokenTtlMs)) throw new Error('Invalid recovery expiry');
  }
  private async issue(accountId: string, purpose: EmailMessage['purpose'], email: string, sessionId?: string, passwordHash?: string) {
    const token = randomBytes(32).toString('hex'), now = this.auth.now();
    const issued = await this.auth.database.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id" = ${accountId}::uuid FOR UPDATE`;
      const credential = await tx.credential.findUniqueOrThrow({ where: { accountId } });
      if (purpose === 'RESET_PASSWORD' && (credential.email !== email || !credential.emailVerifiedAt)) return false;
      if (purpose === 'VERIFY_EMAIL') {
        const session = await tx.gameplaySession.findUnique({ where: { accountId } });
        if (!session || session.id !== sessionId || session.expiresAt.getTime() <= now || credential.passwordHash !== passwordHash) throw new Error('INVALID_SESSION');
      }
      const prior = await tx.emailChallenge.findUnique({ where: { accountId_purpose: { accountId, purpose } } });
      if (prior && now - prior.issuedAt.getTime() < this.config.cooldownMs) return false;
      const data = { tokenHash: tokenHash(token), email, issuedAt: new Date(now), expiresAt: new Date(now + this.config.tokenTtlMs) };
      await tx.emailChallenge.upsert({ where: { accountId_purpose: { accountId, purpose } }, create: { accountId, purpose, ...data }, update: data });
      return true;
    });
    if (issued) {
      try { await this.delivery.send({ to: email, purpose, token }); }
      catch {
        await this.auth.database.emailChallenge.deleteMany({ where: { tokenHash: tokenHash(token) } });
        throw new Error('EMAIL_DELIVERY_FAILED');
      }
    }
  }
  async requestVerification(token: string, value: unknown) {
    const input = emailVerificationRequestSchema.parse(value), session = await this.auth.authenticate(token);
    const credential = await this.auth.database.credential.findUniqueOrThrow({ where: { accountId: session.accountId } });
    if (!await verifyPassword(input.password, credential.passwordHash)) throw new Error('INVALID_CREDENTIALS');
    await this.issue(session.accountId, 'VERIFY_EMAIL', input.email, session.id, credential.passwordHash);
  }
  async requestReset(value: unknown) {
    const input = recoveryRequestSchema.parse(value);
    const credential = await this.auth.database.credential.findUnique({ where: { username: input.username } });
    if (credential?.email && credential.emailVerifiedAt) await this.issue(credential.accountId, 'RESET_PASSWORD', credential.email);
  }
  private async consume(token: string, purpose: EmailMessage['purpose'], passwordHash?: string) {
    const digest = tokenHash(token);
    const challenge = await this.auth.database.emailChallenge.findUnique({ where: { tokenHash: digest } });
    if (!challenge || challenge.purpose !== purpose) throw new Error('INVALID_EMAIL_TOKEN');
    const accountId = challenge.accountId;
    await this.auth.database.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id" = ${accountId}::uuid FOR UPDATE`;
      const current = await tx.emailChallenge.findUnique({ where: { tokenHash: digest } });
      if (!current || current.purpose !== purpose || current.expiresAt.getTime() <= this.auth.now()) throw new Error('INVALID_EMAIL_TOKEN');
      if (purpose === 'VERIFY_EMAIL') {
        await tx.credential.update({ where: { accountId }, data: { email: current.email, emailVerifiedAt: new Date(this.auth.now()) } });
      } else {
        const credential = await tx.credential.findUniqueOrThrow({ where: { accountId } });
        if (!credential.emailVerifiedAt || credential.email !== current.email || !passwordHash) throw new Error('INVALID_EMAIL_TOKEN');
        await tx.credential.update({ where: { accountId }, data: { passwordHash } });
        await tx.gameplaySession.deleteMany({ where: { accountId } });
      }
      // Consume once; invalidate old-address resets and outstanding verification after reset.
      await tx.emailChallenge.deleteMany({ where: { accountId } });
    });
    if (purpose === 'RESET_PASSWORD') this.auth.invalidate(accountId);
  }
  async verifyEmail(value: unknown) { const { token } = emailTokenSchema.parse(value); await this.consume(token, 'VERIFY_EMAIL'); }
  async resetPassword(value: unknown) {
    const input = passwordResetSchema.parse(value);
    await this.consume(input.token, 'RESET_PASSWORD', await hashPassword(input.password));
  }
}
