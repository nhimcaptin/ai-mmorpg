import { test, expect, type Page } from '@playwright/test';
const actors = async (page: Page) => JSON.parse(await page.getByTestId('world').getAttribute('data-players') ?? '[]') as {id:string;x:number;y:number}[];
test('preview reconnect and SPA unmount leave one canvas, one entity and correct HUD; panel focus blocks movement', async ({ browser, baseURL }) => {
  test.setTimeout(60000);
  const firstContext = await browser.newContext({baseURL}), observerContext = await browser.newContext({baseURL});
  const page = await firstContext.newPage(), observer = await observerContext.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await observer.goto('/'); await page.goto('/');
    await expect(page.getByTestId('world')).toHaveAttribute('data-status','connected');
    await expect(page.getByTestId('player-count')).toHaveText('2');
    for (let cycle = 0; cycle < 3; cycle++) {
      const previous = await page.getByTestId('world').getAttribute('data-local-id');
      await page.getByRole('button',{name:'Kết nối lại preview'}).click();
      await expect(page.getByTestId('world')).toHaveAttribute('data-status','connected');
      await expect.poll(() => page.getByTestId('world').getAttribute('data-local-id')).not.toBe(previous);
      await expect(page.locator('canvas')).toHaveCount(1);
      await expect.poll(async () => (await actors(observer)).length).toBe(2);
      expect((await actors(observer)).some(actor => actor.id === previous)).toBe(false);
      await expect(page.getByTestId('player-count')).toHaveText('2');
    }
    await page.bringToFront();
    await page.evaluate(() => {
      const panel = document.createElement('div'); panel.dataset.blockWorldInput = '';
      panel.innerHTML = '<button id="panel-focus">Panel focus</button>'; document.body.append(panel);
      document.getElementById('panel-focus')!.focus();
    });
    const before = await actors(page);
    await page.keyboard.down('d'); await page.waitForTimeout(300); await page.keyboard.up('d');
    expect(await actors(page)).toEqual(before);
    await page.getByRole('link',{name:'Mở preview Starter Village'}).click();
    await expect(page.getByTestId('world')).toHaveAttribute('data-map-id','starter_village');
    await expect(page.getByTestId('world')).toHaveAttribute('data-status','connected');
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect.poll(async () => (await actors(observer)).length).toBe(1);
    await page.getByRole('link',{name:'Về phòng thử nền tảng'}).click();
    await expect(page.getByTestId('world')).toHaveAttribute('data-status','connected');
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect.poll(async () => (await actors(observer)).length).toBe(2);
    expect(errors).toEqual([]);
  } finally { await firstContext.close(); await observerContext.close(); }
});
