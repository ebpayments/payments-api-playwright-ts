import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: '.',
  testMatch: ['api-tests/tests/**/*.spec.ts', 'ui-tests/tests/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'https://sandbox.payments-demo.local',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'api',
      testMatch: 'api-tests/tests/**/*.spec.ts',
    },
    {
      name: 'ui-chromium',
      testMatch: 'ui-tests/tests/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
