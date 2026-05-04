# ✍️ 4. Writing a New Test

This section walks through the standard patterns, from picking a file location to the last line of a green spec.

## Step 1 — Decide where the test lives

Match it to a feature folder under `tests/Playwright/e2e/e2e-tests/`. If nothing fits cleanly, it's OK to create a new folder — but think twice before adding one; the current taxonomy tracks the app's surface areas pretty closely.

Name the file in kebab-case matching the feature: `partial-payments.spec.ts`, not `PartialPayments.spec.ts` or `test_partial.spec.ts`.

## Step 2 — Pick the right fixture

We have three ways of starting a test, each with a different auth story:

### A. Plain Playwright `test` — for guest or logged-in-as-a-specific-user tests

```ts
import { test, expect } from "@playwright/test";
```

Use this when:

- The test is purely guest (no login)

**Real example:** [ui-metadata.spec.ts](tests/Playwright/e2e/e2e-tests/products/ui-metadata.spec.ts) uses plain `test` as no login is necessary to test ui metadata slots.

### B. `newUser` fixture — for tests that need a disposable/fresh user

```ts
import { newUser, expect } from "../../../support/fixtures/auth-context";
```

Use when the test needs to register a brand-new account via the API before the test runs. Registering via the API (rather than the UI) is faster and avoids occasional CDP hangs on the registration UI — that's why we have the fixture. Registering as a new user rather than using an existing user also bypasses any chance of the tests conflicting with each other when run in parallel.

The `newUser` fixture gives your test callback these named fixtures:

- `page`, `context` — standard Playwright.
- `checkout` — a `Checkout` page object already constructed for this page.
- `confirmation` — a `Confirmation` page object.
- `session` — the OAuth response (includes `access_token`).
- `token` — shortcut to `session.access_token`, handy for API calls inside the test.

**Real example:** every spec under [checkout/payment-gateways/](../e2e/e2e-tests/checkout/payment-gateways/) that creates a fresh buyer uses `newUser`.

### C. `registeredUser` fixture — for tests that log in as a specific account

```ts
import { registeredUser, expect } from "../../../support/fixtures/auth-context";

registeredUser.use({ userLogin: Logins.priceListUser.username, userPassword: Logins.priceListUser.password });
```

Use when you want the fixture to handle login for you with specific credentials. Less common than A and B; prefer plain `test` + `getClientToken` for most login scenarios.

The full fixture source is in [auth-context.ts](../e2e/support/fixtures/auth-context.ts).

## Step 3 — Write the skeleton

Using `newUser` as the example (easiest to read):

```ts
import { newUser, expect } from "../../../support/fixtures/auth-context";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";

newUser.describe("My new feature", () => {
  newUser("does the thing", async ({ page, context, checkout }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
    await checkout.clickPlaceOrderAndPay();
    await expect(page.getByText("Thank you for your order.")).toBeVisible();
  });
});
```

Key points:

- **Imports are relative.** We don't have TS path aliases for the test suite — paths like `../../../support/...` are the norm.
- **`checkout` is already built for you in this ficture** — don't re-instantiate the page object.
- **Set up basket state via API** using `goToCheckout` (from [flows/checkout.ts](../e2e/support/flows/checkout.ts)). This is much faster than clicking through the product-config UI and is the default for payment/checkout tests.

## Step 4 — Choose the right tool for setup

The cart app has three ways to arrive at a checkout page, and your setup cost determines which you pick:

| Scenario | Use | Why |
| --- | --- | --- |
| Test the checkout itself, product config is incidental | `goToCheckout` flow | ~1s setup instead of ~10s UI navigation |
| Test the product config UI itself | UI navigation via `page.goto(URLs.starterHosting)` + `ProductConfig` | you're verifying the UI |
| Test a specific buying journey end-to-end | UI navigation throughout | the journey IS the test |

Flow helpers live in [support/flows/](../e2e/support/flows/). API helpers live in [support/api/](../e2e/support/api/). The flow helpers wrap the API helpers in page-aware setup.

## Step 5 — Data-driven tests

When you have a matrix of inputs — credit cards, currencies, payment terms — wrap the test in a loop. This is the dominant pattern for checkout coverage:

```ts
for (const { name, cardNumber, expiryDate, cvcCode } of AcceptedCards) {
  newUser(`Accepted Stripe Cards - ${name}`, async ({ page, context, checkout }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
    await checkout.clickPlaceOrderAndPay();
    await expect(page.getByText("Thank you for your order.")).toBeVisible();
  });
}
```

Keep the payload in a separate `*.ts` file under `support/constants/` so it can be reused. The [AcceptedCards.ts](../e2e/support/constants/checkout/payment-cards/AcceptedCards.ts) file is a good template.

> ⚠️ Note that the test name includes the loop variable (`${name}`). Always bake the discriminator into the title — otherwise the Playwright UI can't tell the iterations apart, and a partial failure is hard to diagnose.

## Step 6 — Locators and assertions

### Prefer testids

```ts
await page.getByTestId("button-place-order-and-pay").click();
```

If the testid has a dynamic part, run it through `kebabCase()` from [helpers/strings.ts](../e2e/support/helpers/strings.ts):

```ts
import { kebabCase } from "../../support/helpers/strings";
await page.getByTestId(`radio-card-${kebabCase(gatewayName)}`).click();
```

### Prefer `expect` over raw waits

```ts
// Good
await expect(page.getByText("Thank you for your order.")).toBeVisible();

// Bad — hardcoded timeout, no retries
await page.waitForTimeout(5000);
const text = await page.textContent("...");
```

Playwright's `expect` auto-retries for up to 30 seconds (set globally in the config) — you almost never need a manual `waitForTimeout`. The main exception is Radix-style radios; see [support/actions/radix-radio.ts](../e2e/support/actions/radix-radio.ts) for the retry loop we use there.

### Never assert against transient network idle

```ts
await page.waitForLoadState("networkidle");  // flaky if the app has polling
```

The staging API is occasionally slow, and the cart app fires background polls for session refresh. `networkidle` can hang forever. Prefer waiting on a specific element, URL, or network response instead.

## Step 7 — Mocking

The [support/mocks/](../e2e/support/mocks/) directory has ready-made route handlers for the most common overrides:

- `interceptUISchema` — override `@context.*.template` and other cart meta keys.
- `interceptConfigValues` — override brand config (require address/company/phone/region, price-display type).
- `mockStripeCardDecline` — force Stripe's `/v1/payment_methods` to return a card-decline error.
- `mockWalletBalance` — pretend the current client has account credit available.
- `mockPromos` — inject promotions into product/price responses.
- `mockTrialProduct` — inject `trial_supported`, `trial_force`, etc. into product responses.
- `overrideWarningNotes` — inject warning notes on `/api/orders/current`.
- `returnError` — fulfil a given route with an arbitrary `status` + error body.
- `interceptAndPatchResponse` — surgical deep-key patch on a JSON response.

**Full catalogue:** see [Support Library Reference](05-support-library.md).

Always register mocks **before** the navigation that fires the request. Once a route is registered it applies to everything on the context/page until cleared — in tests that need to reset between iterations, use `test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); })`, as done in [error-handling.spec.ts:22-24](../e2e/e2e-tests/errors/error-handling.spec.ts#L22-L24).

## Step 8 — Review & commit

Before pushing:

1. Run the whole file once in `chrome` locally: `pnpm playwright test path/to/your-file.spec.ts --project=chrome`.
2. Spot-check with `--project=firefox` if the test is sensitive to emulated device descriptors.
3. If you changed or added a page object or helper, re-run any spec that imports it (use `grep -r` against the import path).
4. Don't leave `test.only` or `test.skip` in committed code unless skipping is intentional and documented. See [ui-templates.spec.ts:23](../e2e/e2e-tests/brand-settings/ui-templates.spec.ts#L23) for a `test.describe.skip` that IS intentional (baseline regen is pending).

## Step 9 — When to create a new page object

You should create (or extend) a page object when:

- The same locator is used in three or more spec files.
- The locator has non-obvious qualification (e.g. `page.getByTestId("payment-details").getByRole("heading", { level: 4 })`).
- An action is more than two primitive calls (fill, click) — encapsulate it.

You should **not** create a page object for one-off locators or assertions. Inline them — it's easier to read than chasing through support files.

## A note on test isolation

Tests in the same file are **not** parallelised by default (`fullyParallel` is commented out in the config). Within a file, Playwright runs tests sequentially. Across files, Playwright parallelises at the worker level. Parallel testing is turned off to avoid conflicts between tests which use the same user login (e.g. Checkout Test). It can be turned on again if you find a way to avoid this, whether by creating specific users for each test, or finding a way to isolate the user sessoions so that things like user basket are not shared between tests. 

If your tests need to run serially because of shared state (e.g. a route mock that spans several tests), use:

```ts
test.describe.configure({ mode: "serial" });
```

If your tests are independent AND you want within-file parallelism:

```ts
test.describe.configure({ mode: "parallel" });
```

See [checkout-paths.spec.ts:7](../e2e/e2e-tests/checkout/checkout-paths.spec.ts#L7) for an example.
