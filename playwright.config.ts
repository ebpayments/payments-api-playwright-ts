import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: '.',
  testMatch: ['api-tests/tests/**/*.spec.ts', 'ui-tests/tests/**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true,
      environmentInfo: {
        framework: 'Playwright',
        language: 'TypeScript',
        environment: 'Stripe Sandbox',
        node_version: process.version,
      },
    }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://api.stripe.com',
    trace: 'on',
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