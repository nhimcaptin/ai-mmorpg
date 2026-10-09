import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = dirname(fileURLToPath(import.meta.url));
const root = resolve(base, '..');
const errors = [];
const checks = [];
const server = createServer(async (req, res) => {
  const target = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`);
  const rel = relative(root, target);
  if (rel === '..' || rel.startsWith(`..${sep}`)) { res.writeHead(403); res.end(); return; }
  try { const body = await readFile(target); res.setHeader('Content-Type', target.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8'); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/${base.split(sep).at(-1)}/preview.html`);
  await page.waitForFunction(() => Number(document.body.dataset.renderVersion) > 0);
  async function mutate(action) {
    const before = await page.locator('body').getAttribute('data-render-version');
    await action();
    await page.waitForFunction(v => document.body.dataset.renderVersion !== v, before);
  }
  const pixels = () => page.locator('#composite').evaluate(canvas => canvas.toDataURL());
  for (const sex of ['male', 'female']) {
    await mutate(() => page.locator('#sex').selectOption(sex));
    const original = await pixels();
    for (const name of ['hair_back','body','pants','shoes','shirt','hair_front','weapon']) {
      await mutate(() => page.locator(`#${name}`).uncheck());
      const changed = (await pixels()) !== original;
      checks.push({ sex, test: `toggle:${name}`, passed: changed === (name !== 'weapon') });
      await mutate(() => page.locator(`#${name}`).check());
      checks.push({ sex, test: `restore:${name}`, passed: (await pixels()) === original });
    }
    await mutate(() => page.locator('#clothing').selectOption('other'));
    checks.push({ sex, test: 'swap clothing', passed: (await pixels()) !== original });
    await mutate(() => page.locator('#clothing').selectOption('own'));
    for (const name of ['Physical DPS','Magic DPS','Tank']) {
      await mutate(() => page.locator('#class').selectOption(name));
      checks.push({ sex, test: `static reuse:${name}`, passed: (await pixels()) === original });
    }
    await page.screenshot({ path: resolve(base, `${sex}-browser-proof.png`) });
  }
  const report = { browserTechnicalStatus: checks.every(c => c.passed) && errors.length === 0 ? 'PASS' : 'FAIL',
    artAcceptance: 'BLOCKED', checks, errors,
    limitation: 'Validates only offline static compositor controls, not production layers or animation.' };
  await writeFile(resolve(base, 'browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ browserTechnicalStatus: report.browserTechnicalStatus,
    checks: checks.filter(c => c.passed).length, total: checks.length, errors, artAcceptance: report.artAcceptance }));
  if (report.browserTechnicalStatus !== 'PASS') process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise(resolveClosed => server.close(resolveClosed));
}
