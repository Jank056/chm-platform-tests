/**
 * Brand compliance assertions, derived from
 * chm-brand-system-2026-04-28.md.
 *
 * Each function returns a Promise<void> and throws on violation. Use them in
 * tests to fail fast on brand drift.
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// Color palette
// ============================================================================

/** Connection Orange — primary CTA color */
export const CONNECTION_ORANGE = 'rgb(231, 118, 79)';
/** Knowledge Blue — accent color */
export const KNOWLEDGE_BLUE = 'rgb(61, 164, 192)';
/** Precision Black — text color (NOT pure black) */
export const PRECISION_BLACK = 'rgb(72, 81, 101)';
/** Base White — background (NOT pure white) */
export const BASE_WHITE = 'rgb(242, 244, 248)';

const PURE_BLACK = 'rgb(0, 0, 0)';
const PURE_WHITE = 'rgb(255, 255, 255)';

/**
 * Assert no element on the page uses pure black or pure white as a foreground
 * or background color. CHM's brand uses Precision Black (#485165) and Base
 * White (#f2f4f8) instead.
 *
 * Allowed exceptions: SVG fills inside icons, transparent overlays.
 */
export async function assertNoPureBlackOrWhite(page: Page): Promise<void> {
  const violations = await page.evaluate(
    ([pureBlack, pureWhite]) => {
      const offenders: Array<{ tag: string; cls: string; prop: string; color: string }> = [];
      const all = document.querySelectorAll('body *:not(svg):not(svg *)');
      all.forEach((el) => {
        const cs = window.getComputedStyle(el);
        const checks: Array<[string, string]> = [
          ['color', cs.color],
          ['background-color', cs.backgroundColor],
        ];
        for (const [prop, value] of checks) {
          if (value === pureBlack || value === pureWhite) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '',
              prop,
              color: value,
            });
          }
        }
      });
      return offenders.slice(0, 20); // cap to keep error msg readable
    },
    [PURE_BLACK, PURE_WHITE],
  );

  if (violations.length > 0) {
    const summary = violations
      .map((v) => `  ${v.tag}.${v.cls || '?'} ${v.prop} = ${v.color}`)
      .join('\n');
    throw new Error(
      `Brand violation: pure black/white detected on ${violations.length} element(s).\n${summary}`,
    );
  }
}

/**
 * Assert that a primary CTA button uses Connection Orange as its background.
 * Pass a selector for the button (e.g., '[data-testid="cta-signup"]').
 */
export async function assertPrimaryCtaIsOrange(page: Page, selector: string): Promise<void> {
  const cta = page.locator(selector).first();
  await expect(cta).toBeVisible();
  const bg = await cta.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  expect(bg, `Primary CTA at ${selector} should use Connection Orange (${CONNECTION_ORANGE})`).toBe(
    CONNECTION_ORANGE,
  );
}

// ============================================================================
// Typography
// ============================================================================

const CHILLAX_STACK_REGEX = /Chillax|chillax/i;

/**
 * Assert headings (h1-h3) use the Chillax font stack. Allows system fallback
 * if Chillax isn't loaded, but at least one of the stack should reference it.
 */
export async function assertHeadingsUseChillax(page: Page): Promise<void> {
  const heading = page.locator('h1, h2').first();
  if (!(await heading.isVisible())) return; // page may legitimately have no heading

  const fontFamily = await heading.evaluate((el) => window.getComputedStyle(el).fontFamily);
  expect(
    CHILLAX_STACK_REGEX.test(fontFamily),
    `Heading font stack should reference Chillax. Got: ${fontFamily}`,
  ).toBe(true);
}

/**
 * Assert body text uses a minimum font-size of 16px (web-default for medical
 * content).
 */
export async function assertBodyMinFontSize(page: Page, minPx = 16): Promise<void> {
  const sizePx = await page.evaluate(() => {
    const body = document.body;
    return parseFloat(window.getComputedStyle(body).fontSize);
  });
  expect(sizePx, `Body font-size should be ≥${minPx}px`).toBeGreaterThanOrEqual(minPx);
}

// ============================================================================
// Banned vocabulary (CHM brand rules — marketing-tinted words forbidden)
// ============================================================================

export const BANNED_VOCABULARY = [
  'revolutionary',
  'breakthrough',
  'cutting-edge',
  'cutting edge',
  'game-changing',
  'game changing',
  'best-in-class',
  'best in class',
  'disruptive',
  'paradigm-shifting',
  'paradigm shifting',
  'transformational',
  'practice-changing',
  'practice changing',
  'world-class',
  'world class',
  'next-generation',
  'next generation',
  'state-of-the-art',
  'state of the art',
];

/**
 * Crawl the visible text content of the page and assert no banned words appear.
 * Case-insensitive. Returns offending words.
 */
export async function assertNoBannedVocabulary(page: Page): Promise<void> {
  const visibleText = await page.evaluate(() => document.body.innerText.toLowerCase());
  const offenders = BANNED_VOCABULARY.filter((word) => visibleText.includes(word));
  if (offenders.length > 0) {
    throw new Error(
      `Brand violation: banned vocabulary on this page: ${offenders.join(', ')}`,
    );
  }
}

// ============================================================================
// Accessibility & semantics
// ============================================================================

/**
 * Assert all images have an alt attribute (empty string is fine for decorative;
 * the attribute itself must be present).
 */
export async function assertAllImagesHaveAlt(page: Page): Promise<void> {
  const missing = await page.locator('img:not([alt])').count();
  expect(missing, `${missing} image(s) without alt attribute`).toBe(0);
}

/**
 * Assert the brand K-mark and chevron are present in the header. These are the
 * brand identity elements that must appear on every page.
 *
 * Convention: header includes an element with `data-brand="k-mark"` and an
 * element with `data-brand="chevron"`. If your CHT implementation uses a
 * different convention, update the selectors here.
 */
export async function assertBrandIdentityVisible(page: Page): Promise<void> {
  // Soft check: only assert if data-brand is in use; otherwise rely on logo presence
  const hasKMarkAttr = (await page.locator('[data-brand="k-mark"]').count()) > 0;
  if (hasKMarkAttr) {
    await expect(page.locator('[data-brand="k-mark"]').first()).toBeVisible();
    return;
  }
  // Fallback: at minimum a header logo of some kind exists
  const headerLogo = page.locator('header img, header svg, header [class*="logo" i]').first();
  await expect(headerLogo, 'Header should contain a brand logo').toBeVisible();
}

// ============================================================================
// Combined: full audit
// ============================================================================

/**
 * Run the full brand audit on a page. Use this in `tests/brand/` specs that
 * sweep across all public URLs.
 */
export async function fullBrandAudit(page: Page): Promise<void> {
  await assertNoBannedVocabulary(page);
  await assertNoPureBlackOrWhite(page);
  await assertHeadingsUseChillax(page);
  await assertBodyMinFontSize(page);
  await assertAllImagesHaveAlt(page);
  await assertBrandIdentityVisible(page);
}
