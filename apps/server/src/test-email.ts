import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { EmailDelivery, EmailMessage } from './recovery.js';
/** Test-only side channel, never an HTTP endpoint or application log. */
export function testEmailDelivery(databaseUrl: string, file: string): EmailDelivery {
  const url = new URL(databaseUrl);
  if (process.env.NODE_ENV !== 'test' || url.hostname !== '127.0.0.1' || url.pathname !== '/mmorpg_test' || !file) throw new Error('Mock email requires isolated test environment');
  return { async send(message: EmailMessage) {
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, JSON.stringify(message) + '\n', { mode: 0o600 });
  } };
}
