import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../../apps/server/src/database';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
test('real auth HTTP contract: registration, login without verified email, verified email recovery and safe reset', async ({ request }) => {
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
    const email = `${requestId}@example.invalid`;
    const mailbox = async () => (await readFile(resolve('logs/recovery/mock-email.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line) as { to: string; purpose: string; token: string }).filter(m => m.to === email);
    expect((await request.post(`${base}/recovery`, { data: { username } })).status()).toBe(202);
    const unknown = await request.post(`${base}/recovery`, { data: { username: randomUUID() } }); expect(await unknown.json()).toEqual({ accepted: true });
    expect((await request.post(`${base}/email/request`, { headers: { Authorization: `Bearer ${session.token}` }, data: { email, password } })).status()).toBe(202);
    expect((await database.credential.findUniqueOrThrow({ where: { accountId } })).emailVerifiedAt).toBeNull();
    const verification = (await mailbox()).find(m => m.purpose === 'VERIFY_EMAIL')!;
    expect((await request.post(`${base}/email/verify`, { data: { token: verification.token } })).status()).toBe(204);
    expect((await request.post(`${base}/email/verify`, { data: { token: verification.token } })).status()).toBe(400);
    expect((await request.post(`${base}/recovery`, { data: { username } })).status()).toBe(202);
    const reset = (await mailbox()).find(m => m.purpose === 'RESET_PASSWORD')!;
    const resetResponse = await request.post(`${base}/password/reset`, { data: { token: reset.token, password: 'e2e-new', confirmation: 'e2e-new' } });
    expect(resetResponse.status()).toBe(204); expect(await resetResponse.text()).not.toContain(reset.token);
    expect((await request.post(`${base}/password/reset`, { data: { token: reset.token, password: 'again', confirmation: 'again' } })).status()).toBe(400);
    expect((await request.post(`${base}/login`, { data: { username, password } })).status()).toBe(401);
    expect((await request.post(`${base}/logout`, { headers: { Authorization: `Bearer ${session.token}` } })).status()).toBe(401);
    const afterReset = await request.post(`${base}/login`, { data: { username, password: 'e2e-new' } }); expect(afterReset.status()).toBe(200);
    const active = await afterReset.json() as { token: string };
    expect((await request.post(`${base}/logout`, { headers: { Authorization: `Bearer ${active.token}` } })).status()).toBe(204);
  } finally {
    if (accountId) {
      await database.emailChallenge.deleteMany({ where: { accountId } });
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
