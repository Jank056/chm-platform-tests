/**
 * Auth fixtures.
 *
 * Extends the base `test` with three flavors of authenticated context:
 *   - test           — anonymous (default)
 *   - test.hcp       — logged-in HCP
 *   - test.admin     — logged-in admin
 *
 * Auth state is generated once by `fixtures/global-setup.ts` and persisted to
 * `auth/hcp.json` and `auth/admin.json`. Each test that needs a logged-in
 * role spins up a fresh browser context with the saved storage state — fast,
 * isolated, no per-test login.
 */

import { test as base, BrowserContext, Page } from '@playwright/test';

type AuthFixtures = {
  hcpContext: BrowserContext;
  hcpPage: Page;
  adminContext: BrowserContext;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  hcpContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth/hcp.json' });
    await use(context);
    await context.close();
  },

  hcpPage: async ({ hcpContext }, use) => {
    const page = await hcpContext.newPage();
    await use(page);
  },

  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth/admin.json' });
    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
