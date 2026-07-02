# ADR 013: Testing Strategy

> **Superseded by [ADR 021: Testing Pyramid, Agentic Workflow & Coverage Policy](./021-testing-pyramid-and-agentic-workflow.md)** (May 2026). This ADR is retained for historical context only.

**Date:** January 2024 (Retroactive)
**Status:** Superseded by ADR 021
**Authors:** Upmind Engineering Team

---

## Context

Quality assurance for the platform requires:

1. Unit testing for business logic and utilities
2. Component testing for Vue components
3. End-to-end testing for critical user flows
4. Visual regression testing for UI consistency

---

## Decision

Adopt a layered testing strategy:

| Layer | Tool | Purpose |
| ----- | ---- | ------- |
| Unit | Vitest | Business logic, utilities, composables |
| Component | Vitest + Vue Test Utils | Vue component behavior |
| E2E | Playwright | User flows across browsers |
| Visual | Playwright | UI regression screenshots |

---

## Test Structure

```
upmind-monorepo/
├── packages/
│   └── headless/
│       └── src/
│           └── modules/
│               └── basket/
│                   ├── __tests__/
│                   │   └── useBasket.test.ts
│                   └── useBasket.ts
│
└── tests/
    ├── e2e-tests/
    │   ├── checkout.spec.ts
    │   ├── login.spec.ts
    │   └── product-selection.spec.ts
    │
    └── visual-regression/
        └── cart-pages.spec.ts
```

---

## Unit Testing (Vitest)

### Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### Example Test

```typescript
// packages/headless/src/modules/basket/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTotal } from '../utils'

describe('calculateTotal', () => {
  it('sums product prices correctly', () => {
    const products = [
      { price: 10.00 },
      { price: 25.50 },
    ]
    expect(calculateTotal(products)).toBe(35.50)
  })

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })
})
```

### Running

```bash
# All unit tests
pnpm test:unit

# With coverage
pnpm test:coverage

# Watch mode
pnpm vitest
```

---

## E2E Testing (Playwright)

### Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm --filter cart dev',
    port: 5173,
  },
})
```

### Example Test

```typescript
// tests/e2e-tests/checkout.spec.ts
import { test, expect } from '@playwright/test'

test('complete checkout flow', async ({ page }) => {
  await page.goto('/')

  // Add product to basket
  await page.click('[data-test-key="add-to-basket"]')

  // Proceed to checkout
  await page.click('[data-test-key="checkout-button"]')

  // Fill billing details
  await page.fill('[name="email"]', 'test@example.com')

  // Complete order
  await page.click('[data-test-key="place-order"]')

  // Verify success
  await expect(page.locator('[data-test-key="order-confirmation"]')).toBeVisible()
})
```

### Running

```bash
# All browsers
pnpm test:all-browsers

# Specific browser
pnpm test:chrome
pnpm test:firefox
pnpm test:safari

# Interactive UI
pnpm test:ui
```

---

## Visual Regression

### Example

```typescript
// tests/visual-regression/cart-pages.spec.ts
import { test, expect } from '@playwright/test'

test('product listing page', async ({ page }) => {
  await page.goto('/products')
  await expect(page).toHaveScreenshot('product-listing.png')
})

test('shopping cart', async ({ page }) => {
  await page.goto('/cart')
  await expect(page).toHaveScreenshot('shopping-cart.png')
})
```

### Running

```bash
pnpm visreg:chrome
```

---

## Test Data

### Faker for Test Data

```typescript
import { faker } from '@faker-js/faker'

const testUser = {
  email: faker.internet.email(),
  name: faker.person.fullName(),
  address: faker.location.streetAddress(),
}
```

---

## CI Integration

Tests run on merge requests:

```yaml
# .gitlab-ci.yml
test:unit:
  script:
    - pnpm install
    - pnpm test:unit

test:e2e:
  script:
    - pnpm install
    - pnpm playwright install
    - pnpm test:all-browsers
```

---

## Consequences

### Positive

1. **Confidence** — tests catch regressions
2. **Multi-browser** — Playwright covers Chrome, Firefox, Safari
3. **Visual safety** — screenshot tests catch UI drift
4. **Fast feedback** — Vitest is fast for unit tests

### Negative

1. **Maintenance** — tests require upkeep
2. **E2E flakiness** — network-dependent tests can fail
3. **Screenshot churn** — visual tests need baseline updates

### Neutral

1. **Coverage targets** — not strictly enforced yet

---

## Related Documents

- [TESTING.md](/TESTING.md) — Testing guidelines
- [ADR 005: XState State Management](./005-xstate-state-management.md) — XState testing
