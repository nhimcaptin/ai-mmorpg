import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDatabase } from '../../apps/server/src/database';
const databaseUrl = 'postgresql://postgres@127.0.0.1:54329/mmorpg_test';
async function signIn(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/game$/);
  await expect(page.getByTestId('world')).toHaveAttribute('data-status', 'connected');
}
async function removeAccount(accountId: string, requestId: string) {
  const database = createDatabase(databaseUrl);
  try {
    await database.emailChallenge.deleteMany({ where: { accountId } });
    await database.gameplaySession.deleteMany({ where: { accountId } });
    await database.credential.deleteMany({ where: { accountId } });
    await database.characterInitialization.deleteMany({ where: { character: { accountId } } });
    await database.character.deleteMany({ where: { accountId } });
    await database.account.deleteMany({ where: { id: accountId } });
    await database.operationReceipt.deleteMany({ where: { scope: 'registration', key: requestId } });
  } finally { await database.$disconnect(); }
}
test('login UI guards game, handles waiting/errors, refresh, text focus, replacement, expiry and logout', async ({ browser, request, baseURL }) => {
  test.setTimeout(45000);
  const requestId = randomUUID(), username = `ui-${requestId}`, password = 'ui-test-password';
  const registration = await request.post('http://127.0.0.1:2567/auth/register', { data: { requestId, username, password, class: 'PHYSICAL_DPS' } });
  expect(registration.status()).toBe(201);
  const { accountId, characterId } = await registration.json() as { accountId: string; characterId: string };
  const firstContext = await browser.newContext({ baseURL }), secondContext = await browser.newContext({ baseURL });
  const first = await firstContext.newPage(), second = await secondContext.newPage(), errors: string[] = [];
  first.on('pageerror', e => errors.push(e.message)); second.on('pageerror', e => errors.push(e.message));
  try {
    await first.goto('/game'); await expect(first).toHaveURL(/\/login$/); await expect(first.locator('canvas')).toHaveCount(0);
    expect((await firstContext.request.get('/api/auth/me')).status()).toBe(401);
    expect((await firstContext.request.post('/api/auth/login', { headers: { Origin: 'https://untrusted.invalid' }, data: { username, password } })).status()).toBe(403);
    await first.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await first.getByLabel('Mật khẩu', { exact: true }).fill('wrong');
    await first.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(first.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeDisabled();
    await expect(first.getByRole('status')).toContainText('Không thể đăng nhập');
    const loginResponse = first.waitForResponse(r => r.url().endsWith('/api/auth/login') && r.status() === 200);
    await first.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await first.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    expect(await (await loginResponse).text()).not.toContain('token');
    await expect(first).toHaveURL(/\/game$/);
    await expect(first.getByTestId('world')).toHaveAttribute('data-local-id', characterId);
    const cookie = (await firstContext.cookies()).find(c => c.name === 'mmorpg_session')!;
    expect(cookie.httpOnly).toBe(true); expect(cookie.sameSite).toBe('Strict');
    expect(await first.evaluate(() => document.cookie)).not.toContain('mmorpg_session');
    await first.reload(); await expect(first.getByTestId('world')).toHaveAttribute('data-local-id', characterId); await expect(first.locator('canvas')).toHaveCount(1);
    const position = async () => (JSON.parse(await first.getByTestId('world').getAttribute('data-players') ?? '[]') as { id: string; x: number; y: number }[]).find(p => p.id === characterId)!;
    await first.getByRole('heading').click(); const start = await position();
    await first.keyboard.down('d'); await expect.poll(async () => (await position()).x).toBeGreaterThan(start.x + 16); await first.keyboard.up('d');
    await first.locator('details.auth-panel > summary').click(); await first.getByLabel('Email', { exact: true }).fill('dddd@example.invalid');
    await first.waitForTimeout(300); const before = await position(); await first.keyboard.press('d'); await first.waitForTimeout(300); expect(await position()).toEqual(before);
    await signIn(second, username, password);
    await expect(first).toHaveURL(/\/login\?expired=1$/); await expect(first.getByRole('status')).toContainText('Phiên đã hết hạn');
    await expect(second.getByTestId('character-id')).toHaveAttribute('data-character-id', characterId);
    const database = createDatabase(databaseUrl);
    try {
      expect(await database.character.count({ where: { accountId } })).toBe(1);
      await database.gameplaySession.update({ where: { accountId }, data: { expiresAt: new Date(Date.now() - 1) } });
    } finally { await database.$disconnect(); }
    await expect(second).toHaveURL(/\/login\?expired=1$/);
    await signIn(second, username, password);
    await second.screenshot({ path: 'test-results/authenticated-game.png' });
    await second.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(second).toHaveURL(/\/login/); await second.goto('/game'); await expect(second).toHaveURL(/\/login/);
    expect((await secondContext.request.get('/api/auth/me')).status()).toBe(401); expect(errors).toEqual([]);
  } finally { await Promise.allSettled([firstContext.close(), secondContext.close()]); await removeAccount(accountId, requestId); }
});
test('browser email verification and password recovery use mock mail, then require a new login', async ({ page, request }) => {
  test.setTimeout(45000);
  const requestId = randomUUID(), username = `mail-ui-${requestId}`, password = 'mail-ui-test', email = `${requestId}@example.invalid`;
  const registration = await request.post('http://127.0.0.1:2567/auth/register', { data: { requestId, username, password, class: 'TANK' } });
  expect(registration.status()).toBe(201); const { accountId } = await registration.json() as { accountId: string };
  const message = async (purpose: string) => (await readFile(resolve('logs/recovery/mock-email.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line) as { to: string; purpose: string; token: string }).find(m => m.to === email && m.purpose === purpose)?.token;
  try {
    await signIn(page, username, password);
    await page.locator('details.auth-panel > summary').click(); await page.getByLabel('Email', { exact: true }).fill(email); await page.getByLabel('Mật khẩu hiện tại').fill(password);
    await page.getByRole('button', { name: 'Gửi mã xác minh' }).click(); await expect(page.getByText('Đã yêu cầu mã xác minh email.', { exact: false })).toBeVisible();
    await expect.poll(() => message('VERIFY_EMAIL')).toBeTruthy(); const verify = (await message('VERIFY_EMAIL'))!;
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click(); await expect(page).toHaveURL(/\/login/);
    await page.getByText('Xác minh email bằng mã', { exact: true }).click(); await page.getByLabel('Mã xác minh').fill(verify); await page.getByRole('button', { name: 'Xác minh email', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Thành công');
    await page.getByText('Quên mật khẩu', { exact: true }).click(); await page.getByLabel('Tên tài khoản cần khôi phục').fill(username); await page.getByRole('button', { name: 'Gửi hướng dẫn khôi phục' }).click();
    await expect(page.getByRole('status')).toContainText('Nếu tài khoản có email đã xác minh');
    await expect.poll(() => message('RESET_PASSWORD')).toBeTruthy();
    await page.getByText('Đặt lại mật khẩu bằng mã', { exact: true }).click(); await page.getByLabel('Mã khôi phục').fill((await message('RESET_PASSWORD'))!);
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill('mail-ui-new'); await page.getByLabel('Nhập lại mật khẩu').fill('mail-ui-new'); await page.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Thành công'); await expect(page).toHaveURL(/\/login/);
    await signIn(page, username, 'mail-ui-new'); await expect(page.getByText('Email: Đã xác minh', { exact: true })).toBeVisible();
  } finally { await page.goto('/login'); await removeAccount(accountId, requestId); }
});
