import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
// OWASP scrypt baseline: N=2^17, r=8, p=1; native asynchronous Node implementation.
const options = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, options, (error, key) => error ? reject(error) : resolve(key)));
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1:${salt}:${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const parts = /^scrypt-v1:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(encoded);
  if (!parts) return false;
  return timingSafeEqual(await derive(password, parts[1]!), Buffer.from(parts[2]!, 'hex'));
}
