import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../../apps/server/src/database';
const actors = async (page: Page) => JSON.parse(await page.getByTestId('world').getAttribute('data-players') ?? '[]') as { id: string; x: number; y: number }[];
test('two authenticated accounts observe stable Character IDs, authoritative movement and clean leave/rejoin', async ({ browser, request, baseURL }) => {
  test.setTimeout(45000);
  const database = createDatabase('postgresql://postgres@127.0.0.1:54329/mmorpg_test');
  const records: { accountId: string; characterId: string; requestId: string; username: string; password: string }[] = [];
  const contexts = [await browser.newContext({ baseURL }), await browser.newContext({ baseURL })];
  const pages = await Promise.all(contexts.map(context => context.newPage())); const errors: string[] = [];
  try {
    for (let i = 0; i < 2; i++) {
      const requestId = randomUUID(), username = `browser-room-${requestId}`, password = 'room-e2e-only';
      const response = await request.post('http://127.0.0.1:2567/auth/register', { data: { requestId, username, password, class: i ? 'TANK' : 'MAGIC_DPS' } });
      expect(response.status()).toBe(201); records.push({ ...await response.json() as { accountId: string; characterId: string }, requestId, username, password });
      const page = pages[i]!; page.on('pageerror', error => errors.push(error.message)); await page.goto('/login');
      await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username); await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click(); await expect(page).toHaveURL(/\/game$/);
      await expect(page.getByTestId('world')).toHaveAttribute('data-status', 'connected');
    }
    const ids = records.map(r => r.characterId).sort();
    for (const page of pages) await expect.poll(async () => (await actors(page)).map(p => p.id).sort()).toEqual(ids);
    const first = pages[0]!, observer = pages[1]!, localId = records[0]!.characterId;
    await first.bringToFront(); await first.getByRole('heading').click(); await first.keyboard.down('d');
    await expect.poll(async () => (await actors(observer)).find(p => p.id === localId)!.x).toBeGreaterThan(648); await first.keyboard.up('d');
    for (const page of pages) {
      const serialized = JSON.stringify(await actors(page));
      for (const record of records) { expect(serialized).not.toContain(record.accountId); expect(serialized).not.toContain(record.username); expect(serialized).not.toContain(record.password); }
    }
    await first.screenshot({ path: 'test-results/authenticated-two-players.png' });
    await first.getByRole('button', { name: 'Đăng xuất', exact: true }).click(); await expect(first).toHaveURL(/\/login/);
    await expect.poll(async () => (await actors(observer)).map(p => p.id)).toEqual([records[1]!.characterId]);
    await observer.reload(); await expect(observer.getByTestId('world')).toHaveAttribute('data-local-id', records[1]!.characterId);
    await expect.poll(async () => (await actors(observer)).map(p => p.id)).toEqual([records[1]!.characterId]);
    for (const record of records) expect(await database.character.count({ where: { accountId: record.accountId } })).toBe(1);
    expect(errors).toEqual([]);
  } finally {
    await Promise.allSettled(contexts.map(context => context.close()));
    for (const record of records) {
      const accountId = record.accountId;
      await database.emailChallenge.deleteMany({ where: { accountId } }); await database.gameplaySession.deleteMany({ where: { accountId } });
      await database.credential.deleteMany({ where: { accountId } }); await database.characterInitialization.deleteMany({ where: { characterId: record.characterId } });
      await database.character.deleteMany({ where: { accountId } }); await database.account.deleteMany({ where: { id: accountId } });
      await database.operationReceipt.deleteMany({ where: { scope: 'registration', key: record.requestId } });
    }
    await database.$disconnect();
  }
});
