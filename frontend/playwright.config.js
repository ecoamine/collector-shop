// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.js',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: process.env.CI === 'true' || (process.env.PLAYWRIGHT_BASE_URL || '').startsWith('https'),
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    //reuseExistingServer: !process.env.CI,
    reuseExistingServer: true,
    timeout: 120000,
  },
});

