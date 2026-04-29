# Adding tests

Quick guide for writing new specs.

## Pick the right folder

| If your test... | Put it in... |
|---|---|
| ...exercises an anonymous (logged-out) page | `tests/anonymous/` |
| ...requires a logged-in HCP account | `tests/hcp/` |
| ...requires admin access | `tests/admin/` |
| ...exercises both CHT and MediaHub together | `tests/cross-system/` |
| ...is about visual brand compliance | `tests/brand/` |

## Use the right fixture

```ts
// Anonymous (default)
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
```

```ts
// Logged-in HCP
import { test, expect } from '@fixtures/auth';

test('HCP can register for webinar', async ({ hcpPage }) => {
  await hcpPage.goto('/app/webinars');
  // ...
});
```

```ts
// Admin
import { test, expect } from '@fixtures/auth';

test('admin can publish article', async ({ adminPage }) => {
  await adminPage.goto('/admin/articles');
  // ...
});
```

## Use brand helpers

```ts
import { fullBrandAudit, assertPrimaryCtaIsOrange } from '@helpers/brand-checklist';

test('article page is brand-compliant', async ({ page }) => {
  await page.goto('/articles/example-slug');
  await fullBrandAudit(page);
  await assertPrimaryCtaIsOrange(page, '[data-testid="cta-subscribe"]');
});
```

## Tag the smoke subset

Tests that should run on every commit (cheap critical-path coverage) get the `@smoke` tag:

```ts
test('@smoke loads with status 200', async ({ page }) => {
  // ...
});
```

Run only smoke tests: `npx playwright test --grep @smoke`

## Avoid these patterns

- ❌ `await page.waitForTimeout(N)` — use `await page.waitForSelector(...)` or `expect(...).toBeVisible()`
- ❌ Hardcoded URLs — use relative paths so `baseURL` from config can switch envs
- ❌ Tests that depend on test-order — each spec must be independent
- ❌ Logging in inside the test body when an auth fixture exists
- ❌ `console.log` for debugging committed code — use `--debug` mode locally

## Testing data mutations

Tests that mutate state (creating a survey response, marking attendance, etc.) should:

1. Use a unique identifier (timestamp or random suffix) so they don't collide across parallel runs
2. Ideally clean up via API after the spec — but failing to clean up shouldn't break other tests

## Cross-system tests

Cross-system tests touch both CHT and MediaHub APIs. Pattern:

```ts
import { test, expect } from '@playwright/test';

test('article edit propagates to CHT', async ({ page, request }) => {
  // 1. Edit article via MediaHub admin API
  await request.put(`${process.env.MEDIAHUB_BASE_URL}/admin/articles/test-slug`, {
    data: { headline: 'Updated headline' },
  });

  // 2. Wait for revalidation (≤30s)
  await page.goto('/articles/test-slug');
  await expect(page.getByRole('heading', { name: 'Updated headline' }))
    .toBeVisible({ timeout: 30_000 });
});
```
