# chm-platform-tests

End-to-end tests for the CHM platform (CHT + MediaHub) using Playwright.

Tests cross system boundaries: anonymous browsing on CHT, HCP webinar flows, admin content management, MediaHub-to-CHT revalidation, and brand compliance audits.

---

## Quickstart

```bash
# Install dependencies
npm install
npx playwright install --with-deps chromium webkit

# Set up local env
cp .env.example .env
# Fill in PLAYWRIGHT_*_PASSWORD values from secrets store

# Run the full suite
npm test

# Run a specific category
npm run test:anonymous
npm run test:brand

# Headed mode for debugging
npm run test:headed
npm run test:debug

# View the last report
npm run report
```

---

## What's tested

| Category | Path | Coverage |
|---|---|---|
| Anonymous flows | `tests/anonymous/` | Public browsing, search, signup, content reading |
| HCP flows | `tests/hcp/` | Login, webinar register, surveys, W-9, honorarium status |
| Admin flows | `tests/admin/` | Program/survey management, attendance, payouts, content publish |
| Cross-system | `tests/cross-system/` | MediaHub → CHT revalidation, KOL page merge logic |
| Brand compliance | `tests/brand/` | Color palette, typography, banned vocabulary, contrast |

## Browser matrix

- **Chrome desktop** (1920×1080) — primary HCP browser
- **Mobile Safari iPhone 14** (390×844) — HCPs read on phones in clinic

Run a single project: `npx playwright test --project=chromium-desktop`

---

## Architecture

```
chm-platform-tests/
├── tests/                # Specs by user-type / category
├── fixtures/             # Auth setup (globalSetup), data seeds, teardown
├── helpers/              # Brand assertions, API clients, viewport defs
├── playwright.config.ts  # Browser/viewport matrix, retries, reporter
└── .github/workflows/    # CI: standalone runs + repository_dispatch from CHT/MediaHub
```

### Auth fixtures

`fixtures/global-setup.ts` runs once before the suite:
1. Logs in as the seeded HCP test user → saves storage state to `auth/hcp.json`
2. Logs in as the seeded admin test user → saves storage state to `auth/admin.json`

Tests that need a logged-in role pick up the saved state via:

```ts
import { test as base } from '@playwright/test';

const test = base.extend({
  hcpPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth/hcp.json' });
    await use(await context.newPage());
    await context.close();
  },
});
```

### Test data

Synthetic seed lives in CHT's `backend/prisma/seed.ts`. It creates deterministic reference data: 5 KOLs, 10 articles, 3 disease hubs, 2 webinars, 3 test users. Tests assume this data exists; mutations are tracked and cleaned up after each spec.

---

## CI integration

Three triggers:

1. **PR in this repo** — `.github/workflows/ci.yml` runs full suite
2. **CHT PR opened/updated** — CHT fires `repository_dispatch` → `cht-pr-trigger.yml` runs against the CHT branch deployed to staging
3. **MediaHub PR opened/updated** — same pattern

Status posted back to the originating PR via the GitHub Checks API.

**Phase 1 (advisory):** results visible but don't block merge. Used to soak the suite (~2 weeks).
**Phase 2 (gate):** required check on CHT and MediaHub PRs.

Transition criteria: ≥50 runs, false-positive rate <5%, median runtime <8 min.

---

## Brand compliance

Brand assertions live in `tests/brand/` and `helpers/brand-checklist.ts`. They cover:

- **Color palette:** no pure `#000000`/`#FFFFFF`; primary CTAs use Connection Orange `#e7764f`; accents use Knowledge Blue `#3da4c0`
- **Typography:** headings use Chillax stack; body text ≥16px; line-height ≥1.5
- **Banned vocabulary:** no occurrences of marketing-tinted words (`revolutionary`, `breakthrough`, `cutting-edge`, etc.) on any anonymous page
- **Accessibility:** alt text on all images, color contrast ≥4.5:1 (axe-core)
- **Layout:** brand chevron + K-mark visible in header on every page

Full checklist: `docs/BRAND-COMPLIANCE.md`

---

## Visual regression

**v1 (current):** semantic checks only — assert presence of branded elements + computed styles match design tokens. No pixel diffs (too noisy on web).

**v2 (post-shield):** add `toHaveScreenshot()` baselines for all anonymous pages on Chrome desktop + Mobile Safari. Tuned threshold (~0.1%). Update via explicit `--update-snapshots` commit.

---

## Adding a new test

1. Pick the right category folder (`anonymous`, `hcp`, `admin`, `cross-system`, `brand`)
2. Use the appropriate auth fixture
3. Use brand-compliance helpers when asserting on UI
4. Keep tests <30s each; parallelize freely
5. No `await page.waitForTimeout()` — use explicit waits
6. Tag tests with `@smoke` for the critical-path subset run on every commit

See `docs/ADDING-TESTS.md` for examples.

---

## Related docs

- Architectural rationale: `~/.claude/plans/chm-platform-tests-plan.md` (Sebastien's planning notes)
- CHT system overview: `cht-platform-tool/docs/STAGING-ENVIRONMENT.md`
- Brand system: `chm-brand-system-2026-04-28.md`

---

## License

Internal CHM tooling. Not for external distribution.
