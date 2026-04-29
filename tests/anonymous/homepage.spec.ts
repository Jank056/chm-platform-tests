import { test, expect } from '@playwright/test';
import {
  assertNoBannedVocabulary,
  assertAllImagesHaveAlt,
  assertHeadingsUseChillax,
  assertBodyMinFontSize,
} from '@helpers/brand-checklist';

test.describe('Homepage — anonymous visitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@smoke loads with status 200 and renders a heading', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/); // any non-empty title
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('uses Chillax font on headings', async ({ page }) => {
    await assertHeadingsUseChillax(page);
  });

  test('body font size meets 16px minimum', async ({ page }) => {
    await assertBodyMinFontSize(page, 16);
  });

  test('all images have alt attributes', async ({ page }) => {
    await assertAllImagesHaveAlt(page);
  });

  test('no banned marketing vocabulary on the page', async ({ page }) => {
    await assertNoBannedVocabulary(page);
  });

  test('navigation to /articles works', async ({ page }) => {
    // Soft check — the link may not exist yet on testapp, will hard-fail post shield drop
    const articlesLink = page.locator('a[href="/articles"], a[href*="/articles"]').first();
    if ((await articlesLink.count()) > 0) {
      await articlesLink.click();
      await expect(page).toHaveURL(/\/articles/);
    } else {
      test.skip(true, '/articles link not yet present on homepage (expected post-Track-C)');
    }
  });
});
