# 🧭 14. Behaviour-first URL assertions

> **Rule (FE-2782):** a Playwright e2e test asserts the **behaviour** a URL stood
> for, never the URL shape itself. `waitForURL` / `toHaveURL` / `not.toHaveURL`
> and `expect(page.url())…` couple the suite to the app router — a route rename
> then breaks dozens of specs that never cared about the route name. Assert what
> the user sees, not where the address bar points.

This convention is enforced in review by the [`code-tests-e2e`](../../.agent/rules/code-tests-e2e.md)
rule and the [pseudo-Nathan](12-pseudo-nathan.md) subagent. It sits alongside
the "[Brittle assertions](12-pseudo-nathan.md)" rule (don't hardcode staging
values) — same principle, applied to the address bar.

---

## Why URL assertions rot

- **They couple to the router, not the feature.** `toHaveURL(/\/order\/checkout\//)`
  fails the day `/order/checkout/` becomes `/order/pay/` — even though checkout
  works perfectly. The test protected a route name, not a user outcome.
- **A `waitForURL` before a content assertion is redundant.** Playwright's
  `expect(locator).toBeVisible()` auto-retries for up to 30s, so it already waits
  for the destination page to render. The URL wait adds coupling and buys nothing.
- **Tautological checks assert the framework.** `await page.goto(X)` already
  waits for `X`; a following `toHaveURL(X)` asserts that `goto` did its job.

Navigating **to** a URL (`page.goto(URLs.basket)`) is fine — that's a test
input, defined once in [`support/constants/urls.ts`](../Playwright/e2e/support/constants/urls.ts).
A route rename is then a one-file edit there, and no spec assertion changes.

---

## The three categories

Every URL assertion falls into one of three buckets. Sweep each accordingly.

### Category 1 — tautological check after `page.goto` → **delete it**

```ts
// ❌ goto already waited for this URL; the assertion tests Playwright, not the app
await page.goto(returnUrl); // returnUrl already carries ?payment_success=true
await expect(page).toHaveURL(/payment_success=true/);
await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();

// ✅ the content assertion is the whole test
await page.goto(returnUrl);
await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
```

### Category 2 — URL check after an action-triggered navigation → **assert content**

Assert the element that proves you reached the destination. It doubles as the
navigation wait (auto-retrying) *and* the behavioural check.

```ts
// ❌ couples to the checkout route; says nothing about what rendered
await checkout.clickCompleteCheckout();
await page.waitForURL(`order/**`);
await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();

// ✅ the confirmation heading proves the order was placed — no route coupling
await checkout.clickCompleteCheckout();
await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
```

```ts
// ❌ "still on the catalogue" expressed as a route
await clickAndAwaitBasketAdd(page, cta);
await expect(page).toHaveURL(/\/order\/shop\b/);

// ✅ the catalogue grid is still shown → the add happened in-situ
await clickAndAwaitBasketAdd(page, cta);
await expect(page.getByTestId("products-grid")).toBeVisible();
```

For "the funnel skipped a step" outcomes, assert the page you *did* land on plus
the absence of the page you skipped:

```ts
// ❌ waitForURL(/order/basket/) + expect(page.url()).not.toMatch(/recommendations/)
// ✅
await expect(page.getByTestId("basket-product").first()).toBeVisible();
await expect(page.getByTestId("carousel-card")).toHaveCount(0);
```

### Category 3 — genuinely unavoidable → **keep it, and document why**

A few behaviours *are* the URL and cannot be asserted any other way. These stay,
each with an inline comment naming why it is unavoidable. Reviewers reject any
new `toHaveURL`/`waitForURL` that is not one of these:

- **External redirects** — the destination is off our app, so there is no in-app
  DOM to assert (e.g. brand-unavailable → `platformUrl`, a gateway's hosted page).
  Not an app-router coupling: renaming our routes never touches it.
- **Deep-linkable query contracts** — e.g. catalogue pagination's `?page=N`. The
  query string is the public, bookmarkable contract the feature exists to provide,
  and there is no page-number component testid. (This is the exact case the
  brittle-assertions rule already endorses with `toHaveURL(/[?&]page=\d+/)`.)
- **Overlay-routing contracts** — a deep-linkable overlay whose whole job is to
  layer over, and restore, a specific route (see
  [`auth-overlay-routes.spec.ts`](../Playwright/e2e/e2e-tests/login-registration/auth-overlay-routes.spec.ts)).
  The open/closed *state* is still asserted behaviourally via the page object; only
  the "restored to route X / bid preserved in path" contract names a URL.

```ts
// ✅ Category 3 — documented as unavoidable
// FE-2782 Category 3: external redirect off our app — no in-app DOM to assert.
await expect(page).toHaveURL(/upmind\.com/);
```

---

## Checklist before you commit

- [ ] No `waitForURL` / `toHaveURL` / `not.toHaveURL` / `expect(page.url())` on an
      **app-router path** remains — unless it is a documented Category 3.
- [ ] Each Category-2 replacement asserts a `data-test-key` that proves the
      destination rendered (never translated text — see [P9](12-pseudo-nathan.md)).
- [ ] Every surviving URL assertion carries an inline Category-3 justification.
- [ ] A route rename would touch only `support/constants/urls.ts` (navigation
      targets), never a spec's assertions.

> `req.url()` / `res.url()` / `frame.url()` inside `page.route(...)`,
> `waitForRequest`, or `waitForResponse` are **not** in scope — those match
> *network* requests, which is exactly how you assert a mutation payload. This
> rule is only about asserting the **page's** address.
