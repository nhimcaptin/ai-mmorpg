import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/password.js';
import { sendRecoveryEmail } from '../src/recovery.js';
it('native scrypt uses fresh salts and rejects wrong passwords or malformed hashes', async () => {
  const first = await hashPassword('same'), second = await hashPassword('same');
  expect(first).not.toBe(second);
  expect(await verifyPassword('same', first)).toBe(true);
  expect(await verifyPassword('wrong', first)).toBe(false);
  expect(await verifyPassword('same', 'plaintext')).toBe(false);
  await expect(sendRecoveryEmail()).rejects.toThrow('RECOVERY_NOT_CONFIGURED');
}, 10000);
