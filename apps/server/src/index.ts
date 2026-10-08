import { createGameServer } from './server.js';
import { createDatabase } from './database.js';
import { AuthService } from './auth.js';
let auth: AuthService | undefined;
if (process.argv.includes('--auth-local')) {
  if (!process.env.DATABASE_URL || !process.env.AUTH_SESSION_TTL_MS) throw new Error('DATABASE_URL and AUTH_SESSION_TTL_MS required');
  auth = new AuthService(createDatabase(process.env.DATABASE_URL), Number(process.env.AUTH_SESSION_TTL_MS));
}
const { server } = createGameServer(process.argv.includes('--foundation'), process.argv.includes('--starter-preview'), auth);
await server.listen(Number(process.env.PORT ?? 2567), '127.0.0.1');
