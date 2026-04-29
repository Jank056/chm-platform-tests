# Brand Compliance Checklist

Derived from `chm-brand-system-2026-04-28.md`. These assertions are encoded as Playwright helpers in `helpers/brand-checklist.ts` and run as specs in `tests/brand/`.

## Color palette

| # | Rule | Helper | Why |
|---|---|---|---|
| 1 | No element uses pure black (`#000000`) or pure white (`#FFFFFF`) | `assertNoPureBlackOrWhite` | Brand uses Precision Black `#485165` and Base White `#f2f4f8` |
| 2 | Primary CTAs use Connection Orange `#e7764f` | `assertPrimaryCtaIsOrange` | Brand voice is warm, not corporate |
| 3 | Accent elements use Knowledge Blue `#3da4c0` | (manual review) | Visual consistency |

## Typography

| # | Rule | Helper |
|---|---|---|
| 4 | Headings (h1-h2) use Chillax font stack | `assertHeadingsUseChillax` |
| 5 | Body text minimum 16px | `assertBodyMinFontSize` |
| 6 | Line-height ≥1.5 (manual review for v1) | — |

## Banned vocabulary

| # | Rule | Helper |
|---|---|---|
| 7 | No occurrences of marketing-tinted words on any anonymous page | `assertNoBannedVocabulary` |

Banned list (in `helpers/brand-checklist.ts → BANNED_VOCABULARY`):

`revolutionary`, `breakthrough`, `cutting-edge`, `game-changing`, `best-in-class`, `disruptive`, `paradigm-shifting`, `transformational`, `practice-changing`, `world-class`, `next-generation`, `state-of-the-art`

## Accessibility

| # | Rule | Helper |
|---|---|---|
| 8 | All images have alt attribute (empty allowed for decorative) | `assertAllImagesHaveAlt` |
| 9 | Color contrast ≥4.5:1 for body, ≥3:1 for large text | (axe-core integration — TODO post-shield) |
| 10 | Focus states visible (no `outline: none` without alternative) | (manual review for v1) |

## Brand identity

| # | Rule | Helper |
|---|---|---|
| 11 | Brand chevron + K-mark visible in header on every page | `assertBrandIdentityVisible` |

Convention: header includes `[data-brand="k-mark"]` and `[data-brand="chevron"]` attributes. If CHT uses different selectors, update `assertBrandIdentityVisible` to match.

## Layout

| # | Rule | Helper |
|---|---|---|
| 12 | Hero sections use Two Core Areas pattern (text + visual) on key pages | (per-spec semantic check) |

## Running

Full audit: `npm run test:brand`

Single page: `npx playwright test tests/anonymous/homepage.spec.ts`

The full suite runs against every URL in `PUBLIC_URLS_FOR_BRAND_AUDIT` (in `helpers/viewports.ts`).

## Updating

Brand changes → update `helpers/brand-checklist.ts` constants → run suite → fix any drift → commit.

Banned vocabulary changes → update `BANNED_VOCABULARY` array → re-run.
