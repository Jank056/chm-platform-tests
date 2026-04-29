/**
 * Viewport definitions matching the playwright.config projects.
 * Use these in tests when you need to switch viewport mid-test.
 */

export const VIEWPORTS = {
  desktopChrome: { width: 1920, height: 1080 },
  mobileSafari: { width: 390, height: 844 },
  tablet: { width: 1024, height: 1366 }, // iPad — v2 only
} as const;

export const PUBLIC_URLS_FOR_BRAND_AUDIT = [
  '/',
  '/articles',
  '/kols',
  '/disease/breast-cancer',
  '/videos',
  '/search?q=t-dxd',
  '/about',
] as const;
