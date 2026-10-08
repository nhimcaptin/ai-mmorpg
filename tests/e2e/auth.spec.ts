import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../../apps/server/src/database';
test('real auth HTTP contract: registration, login without verified email, invalid credentials, logout and deferred recovery', async ({ request }) => {
  const requestId = randomUUID(), username = `e2e-${requestId}`, password = 'e2e-test-only';
  const base = 'http://127.0.0.1:2567/auth';
  const database = createDatabase('postgresql://postgres@127.0.0.1:54329/mmorpg_test');
  let accountId: string | undefined;
  try {
    const registration = await request.post(`${base}/register`, { data: { requestId, username, password, class: 'MAGIC_DPS' } });
    expect(registration.status()).toBe(201);
    const data = await registration.json() as { accountId: string; characterId: string }; accountId = data.accountId;
    expect(await (await request.post(`${base}/register`, { data: { requestId, username, password, class: 'MAGIC_DPS' } })).json()).toEqual(data);
    expect(await registration.text()).not.toContain(password);
    const character = await database.character.findUniqueOrThrow({ where: { id: data.characterId } });
    expect(character.hp).toBe(90n); expect(character.ki).toBe(120n); expect(character.gold).toBe(0n);
    expect((await request.post(`${base}/login`, { data: { username, password: 'invalid' } })).status()).toBe(401);
    const login = await request.post(`${base}/login`, { data: { username, password } }); expect(login.status()).toBe(200);
    const session = await login.json() as { token: string };
    expect(login.headers()['cache-control']).toBe('no-store');
    expect((await request.post(`${base}/logout`, { headers: { Authorization: `Bearer ${session.token}` } })).status()).toBe(204);
    expect((await request.post(`${base}/logout`, { headers: { Authorization: `Bearer ${session.token}` } })).status()).toBe(401);
    expect((await request.post(`${base}/recovery`)).status()).toBe(503);
  } finally {
    if (accountId) {
      await database.gameplaySession.deleteMany({ where: { accountId } });
      await database.credential.deleteMany({ where: { accountId } });
      await database.characterInitialization.deleteMany({ where: { character: { accountId } } });
      await database.character.deleteMany({ where: { accountId } });
      await database.account.deleteMany({ where: { id: accountId } });
      await database.operationReceipt.deleteMany({ where: { scope: 'registration', key: requestId } });
    }
    await database.$disconnect();
  }
});
