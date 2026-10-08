import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:3137', browserName: 'chromium', viewport: { width: 1280, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'pnpm --filter @mmorpg/server exec node dist/index.js --foundation --starter-preview --auth-local', url: 'http://127.0.0.1:2567/health', reuseExistingServer: false, timeout: 30000,
      env: { DATABASE_URL: 'postgresql://postgres@127.0.0.1:54329/mmorpg_test', AUTH_SESSION_TTL_MS: '120000' } },
    { command: 'pnpm --filter @mmorpg/web start --port 3137', url: 'http://127.0.0.1:3137', reuseExistingServer: false, timeout: 60000 }
  ]
});
