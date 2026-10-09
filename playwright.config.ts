import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 30000,
  // Continuous WebGL readbacks for trace screencasts stall input/waypoints on this host.
  // Keep DOM/network/console traces and explicit failure screenshots without that capture loop.
  use: { baseURL: 'http://127.0.0.1:3137', browserName: 'chromium', viewport: { width: 1280, height: 900 }, trace: { mode: 'retain-on-failure', screenshots: false, snapshots: true, sources: true }, screenshot: 'only-on-failure' },
  webServer: [
    { command: 'pnpm --filter @mmorpg/server exec node dist/index.js --foundation --starter-preview --auth-local --test-email', url: 'http://127.0.0.1:2567/health', reuseExistingServer: false, timeout: 30000,
      env: { NODE_ENV: 'test', DATABASE_URL: 'postgresql://postgres@127.0.0.1:54329/mmorpg_test', AUTH_SESSION_TTL_MS: '120000', AUTH_EMAIL_TOKEN_TTL_MS: '120000', AUTH_EMAIL_COOLDOWN_MS: '1000', EMAIL_MOCK_FILE: resolve('logs/recovery/mock-email.jsonl') } },
    { command: 'pnpm --filter @mmorpg/web start --port 3137', url: 'http://127.0.0.1:3137', reuseExistingServer: false, timeout: 60000 }
  ]
});
