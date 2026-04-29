import { test } from '@playwright/test';
import { assertNoBannedVocabulary } from '@helpers/brand-checklist';
import { PUBLIC_URLS_FOR_BRAND_AUDIT } from '@helpers/viewports';

/**
 * Crawls every public URL and asserts no banned marketing vocabulary appears.
 *
 * If a page hasn't been built yet (e.g. /articles before Track C ships), the
 * navigation will 404 and the test will be skipped, not failed. Once the page
 * exists, the audit becomes a hard gate.
 */

test.describe('Brand — banned vocabulary audit', () => {
  for (const url of PUBLIC_URLS_FOR_BRAND_AUDIT) {
    test(`no banned words on ${url}`, async ({ page }) => {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() === 404) {
        test.skip(true, `${url} not yet built — will fail post-shield-drop`);
        return;
      }
      await assertNoBannedVocabulary(page);
    });
  }
});
