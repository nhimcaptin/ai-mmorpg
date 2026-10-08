export const SESSION_COOKIE = 'mmorpg_session';
export function authBackend() {
  const url = new URL(process.env.AUTH_SERVER_URL ?? 'http://127.0.0.1:2567');
  if (url.hostname !== '127.0.0.1' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Auth UI currently supports the local backend only');
  return url.origin;
}
