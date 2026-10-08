import { test, expect, type Page } from '@playwright/test';
import { canOccupy } from '@mmorpg/game-core';
import { FOUNDATION_WORLD } from '@mmorpg/shared';

async function players(page: Page): Promise<{ id: string; x: number; y: number }[]> {
  return JSON.parse(await page.getByTestId('world').getAttribute('data-players') ?? '[]');
}
async function local(page: Page) {
  const id = await page.getByTestId('world').getAttribute('data-local-id');
  return (await players(page)).find(player => player.id === id)!;
}
test('two browsers share authoritative movement, collision, resize and disconnect', async ({ browser, baseURL }) => {
  const firstContext = await browser.newContext({ baseURL }), secondContext = await browser.newContext({ baseURL });
  const first = await firstContext.newPage(), second = await secondContext.newPage();
  const errors: string[] = [];
  first.on('pageerror', error => errors.push(error.message));
  second.on('pageerror', error => errors.push(error.message));
  await first.goto('/'); await second.goto('/');
  await expect(first.getByTestId('world')).toHaveAttribute('data-status', 'connected');
  await expect.poll(async () => (await players(first)).length).toBe(2);
  await expect.poll(async () => (await players(second)).length).toBe(2);
  await expect(first.locator('canvas')).toHaveCount(1);
  const start = await local(first);
  await first.bringToFront(); await first.keyboard.down('d');
  await expect.poll(async () => (await local(first)).x).toBeGreaterThan(start.x + 16);
  await first.keyboard.up('d');
  const id = start.id;
  await expect.poll(async () => (await players(second)).find(p => p.id === id)!.x).toBeGreaterThan(start.x + 16);
  await first.keyboard.down('d');
  await expect.poll(async () => (await local(first)).x, { timeout: 5000 }).toBeGreaterThan(360);
  for (let sample = 0; sample < 12; sample++) {
    expect(canOccupy(await local(first), FOUNDATION_WORLD)).toBe(true);
    await first.waitForTimeout(20);
  }
  await first.keyboard.up('d');
  expect(canOccupy(await local(first), FOUNDATION_WORLD)).toBe(true);
  await first.setViewportSize({ width: 640, height: 700 });
  await expect(first.locator('canvas')).toHaveCount(1);
  const box = await first.locator('canvas').boundingBox();
  expect(box!.width).toBeLessThanOrEqual(640);
  await first.screenshot({ path: 'test-results/foundation-scene.png' });
  await first.getByRole('button', { name: 'Ngắt kết nối' }).click();
  await expect(first.getByTestId('world')).toHaveAttribute('data-status', 'disconnected');
  await expect.poll(async () => (await players(second)).length).toBe(1);
  await first.reload();
  await expect(first.getByTestId('world')).toHaveAttribute('data-status', 'connected');
  await expect(first.locator('canvas')).toHaveCount(1);
  await expect.poll(async () => (await players(second)).length).toBe(2);
  expect(errors).toEqual([]);
  await firstContext.close(); await secondContext.close();
});
