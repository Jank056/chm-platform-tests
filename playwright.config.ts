import { defineConfig, devices } from '@playwright/test';

/**
 * CHM platform E2E test config.
 *
 * - baseURL is the CHT staging environment by default
 * - Tests against MediaHub use the MEDIAHUB_BASE_URL env var
 * - Two browsers in v1: Chrome desktop + Mobile Safari
 * - Auth state for HCP/admin is generated once via globalSetup, reused per test
 */

const CHT_BASE_URL = process.env.CHT_BASE_URL ?? 'https://staging.testapp.communityhealth.media';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github']] as const : [] as const),
  ],

  use: {
    baseURL: CHT_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  globalSetup: './fixtures/global-setup.ts',

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
      },
    },
  ],
});
