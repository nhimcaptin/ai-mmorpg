import { test, expect, type Page } from '@playwright/test';
async function local(page: Page) {
  const host = page.getByTestId('world');
  const id = await host.getAttribute('data-local-id');
  return (JSON.parse(await host.getAttribute('data-players') ?? '[]') as { id: string; x: number; y: number }[]).find(p => p.id === id)!;
}
test('official starter map loads; walk under canopy, restore alpha, collide with trunk and building, responsive camera', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [], failed: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().includes('/assets/') && !r.ok()) failed.push(r.url()); });
  await page.goto('/starter');
  await expect(page.getByRole('heading')).toHaveText('Starter Village — SAFE');
  const host = page.getByTestId('world');
  await expect(host).toHaveAttribute('data-status', 'connected');
  await expect(host).toHaveAttribute('data-map-id', 'starter_village');
  await expect(host).toHaveAttribute('data-area-id', 'area_01');
  await expect(host).toHaveAttribute('data-respawn-id', 'starter_respawn_01');
  await expect(host).toHaveAttribute('data-pk-allowed', 'false');
  expect(await local(page)).toMatchObject({ x: 624, y: 624 });
  await page.keyboard.down('a');
  // Stop ahead of the target to account for the existing 50ms input/patch cadence.
  await expect.poll(async () => (await local(page)).x, { intervals: [20] }).toBeLessThan(342);
  await page.keyboard.up('a');
  await page.waitForTimeout(200);
  expect((await local(page)).x).toBeGreaterThan(272);
  expect((await local(page)).x).toBeLessThan(328);
  const props = async () => JSON.parse(await host.getAttribute('data-props') ?? '[]') as { id: string; alpha: number; depth: number }[];
  await expect.poll(async () => (await props()).find(p => p.id === 'tree-4')?.alpha).toBe(0.5);
  expect((await props()).find(p => p.id === 'tree-4')!.depth).toBeGreaterThan((await local(page)).y);
  await page.screenshot({ path: 'test-results/starter-canopy.png' });
  await page.keyboard.down('s');
  await expect.poll(async () => (await local(page)).y).toBeGreaterThanOrEqual(732);
  await page.waitForTimeout(300); await page.keyboard.up('s');
  expect((await local(page)).y).toBeLessThanOrEqual(732);
  await expect.poll(async () => (await props()).find(p => p.id === 'tree-4')?.alpha).toBe(1);
  await page.reload(); await expect(host).toHaveAttribute('data-status', 'connected');
  await page.keyboard.down('w'); await expect.poll(async () => (await local(page)).y).toBeLessThan(205); await page.keyboard.up('w');
  await page.keyboard.down('a'); await expect.poll(async () => (await local(page)).x).toBeLessThan(420);
  await page.waitForTimeout(300); await page.keyboard.up('a');
  expect((await local(page)).x).toBeGreaterThanOrEqual(402);
  await page.setViewportSize({ width: 640, height: 700 });
  expect((await page.locator('canvas').boundingBox())!.width).toBeLessThanOrEqual(640);
  const before = JSON.parse(await host.getAttribute('data-camera') ?? '{}').zoom as number;
  await page.locator('canvas').hover(); await page.mouse.wheel(0, -100);
  await expect.poll(async () => JSON.parse(await host.getAttribute('data-camera') ?? '{}').zoom as number).toBeGreaterThan(before);
  await page.screenshot({ path: 'test-results/starter-scene.png' });
  expect(errors).toEqual([]); expect(failed).toEqual([]);
});
