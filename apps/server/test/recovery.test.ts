import { expect, it } from 'vitest';
import { emailVerificationRequestSchema, passwordResetSchema, recoveryRequestSchema } from '@mmorpg/shared';
import { testEmailDelivery } from '../src/test-email.js';
it('rejects malformed email/reset payloads and confirmation mismatch', () => {
  expect(emailVerificationRequestSchema.safeParse({ email: 'invalid', password: 'test' }).success).toBe(false);
  expect(passwordResetSchema.safeParse({ token: 'a'.repeat(64), password: 'one', confirmation: 'two' }).success).toBe(false);
  expect(passwordResetSchema.safeParse({ token: 'a'.repeat(64), password: 'one', confirmation: 'one', accountId: 'injected' }).success).toBe(false);
  expect(recoveryRequestSchema.safeParse({ username: 'test', email: 'attacker@example.invalid' }).success).toBe(false);
});
it('refuses mock email outside the isolated test database', () => {
  expect(() => testEmailDelivery('postgresql://postgres@127.0.0.1:54329/mmorpg_dev', 'mail.jsonl')).toThrow();
  expect(() => testEmailDelivery('postgresql://postgres@remote:54329/mmorpg_test', 'mail.jsonl')).toThrow();
});
