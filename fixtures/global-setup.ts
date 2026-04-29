/**
 * Global setup — runs once before the test suite.
 *
 * Logs in as the seeded HCP and admin test users via the real auth flow,
 * persists their storage state to `auth/hcp.json` and `auth/admin.json` so
 * subsequent tests can reuse the session without re-logging in.
 *
 * Test accounts must exist on the target environment (created via the CHT
 * Prisma seed script — see backend/prisma/seed.ts in cht-platform-tool).
 *
 * If credentials aren't set in env (local dev without `.env`), this no-ops
 * gracefully so anonymous tests can still run.
 */

import { chromium, FullConfig } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function loginAndSaveState(
  baseURL: string,
  email: string,
  password: string,
  outputPath: string,
): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/auth/login`);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Wait for redirect to authenticated area; tolerant of /app/home, /admin/dashboard, etc.
    await page.waitForURL(/\/(app|admin)/, { timeout: 10_000 });
    await context.storageState({ path: outputPath });
    console.log(`✓ Auth state saved: ${outputPath}`);
  } catch (err) {
    console.warn(`✗ Failed to seed auth state for ${email}: ${(err as Error).message}`);
    console.warn('  Tests requiring this role will skip or fail explicitly.');
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = process.env.CHT_BASE_URL ?? config.projects[0]?.use?.baseURL ?? '';
  if (!baseURL) {
    console.warn('No CHT_BASE_URL configured — skipping auth state seeding');
    return;
  }

  await mkdir('auth', { recursive: true });

  const hcpEmail = process.env.PLAYWRIGHT_HCP_EMAIL;
  const hcpPassword = process.env.PLAYWRIGHT_HCP_PASSWORD;
  const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

  if (hcpEmail && hcpPassword) {
    await loginAndSaveState(baseURL, hcpEmail, hcpPassword, 'auth/hcp.json');
  } else {
    console.warn('PLAYWRIGHT_HCP_* env vars not set — HCP-authenticated tests will skip');
  }

  if (adminEmail && adminPassword) {
    await loginAndSaveState(baseURL, adminEmail, adminPassword, 'auth/admin.json');
  } else {
    console.warn('PLAYWRIGHT_ADMIN_* env vars not set — admin-authenticated tests will skip');
  }
}
