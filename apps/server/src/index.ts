import { createGameServer } from './server.js';
import { createDatabase } from './database.js';
import { AuthService } from './auth.js';
import { RecoveryService } from './recovery.js';
import { testEmailDelivery } from './test-email.js';
let auth: AuthService | undefined;
if (process.argv.includes('--auth-local')) {
  if (!process.env.DATABASE_URL || !process.env.AUTH_SESSION_TTL_MS) throw new Error('DATABASE_URL and AUTH_SESSION_TTL_MS required');
  auth = new AuthService(createDatabase(process.env.DATABASE_URL), Number(process.env.AUTH_SESSION_TTL_MS));
  if (process.argv.includes('--test-email')) {
    auth.recovery = new RecoveryService(auth, testEmailDelivery(process.env.DATABASE_URL, process.env.EMAIL_MOCK_FILE ?? ''), {
      tokenTtlMs: Number(process.env.AUTH_EMAIL_TOKEN_TTL_MS), cooldownMs: Number(process.env.AUTH_EMAIL_COOLDOWN_MS)
    });
  }
}
if (process.argv.includes('--test-email') && !auth) throw new Error('Mock email requires auth');
const { server } = createGameServer(process.argv.includes('--foundation'), process.argv.includes('--starter-preview'), auth);
await server.listen(Number(process.env.PORT ?? 2567), '127.0.0.1');
