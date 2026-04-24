# 🔐 7. Special Test Setups & Gotchas

Tribal knowledge that isn't obvious from reading the code. Skim this once before your first few PRs.

## 2FA / TOTP login

The 2FA test in [login-registration/2fa.spec.ts](../e2e/e2e-tests/login-registration/2fa.spec.ts) logs in as a dedicated staging user who has TOTP enabled on their account, then derives the one-time code at runtime using the `otpauth` package.

```ts
import { TOTP } from "otpauth";

const twoFactor = new TOTP({
  secret: "********",
  algorithm: "SHA1",
  digits: 6,
  period: 30
});
const oneTimeCode = twoFactor.generate();
```

**Why this pattern:** Playwright can't receive TOTP codes from an authenticator app, so the shared secret is baked into the test and the same secret is enrolled on the staging user's account. If you ever re-enrol the `twofactor` staging user (`twofactor` / `Twofactor1` — credentials in [logins.ts](../e2e/support/constants/logins.ts)), you must:

1. Copy the new secret from the enrolment QR code (base32 string, not the QR image).
2. Paste it into the `secret` field in `2fa.spec.ts` (or a /constants/ file if you decide to use that).
3. Verify locally — run the single test — before committing.

The code input in the UI is 6 separate slots; we use `pressSequentially` on the `twoFactorInput.first()` locator so Playwright types each digit with a slight delay (synthetic `.fill` doesn't dispatch per-digit events on Radix's OTP input).

> ⚠️ The TOTP secret is committed in plaintext on 2fa.spec.ts so that the tests can be run by users other than the one who originally set up the 2FA. It's for a test account on staging only, so the security risk here is minimal. Still, don't be silly with it.

## PayPal sandbox

[checkout/payment-gateways/paypal.spec.ts](../e2e/e2e-tests/checkout/payment-gateways/paypal.spec.ts) drives a real PayPal sandbox checkout.

Credentials live at [support/secrets/paypal.ts](../e2e/support/secrets/paypal.ts) and are **real sandbox credentials, not production**. My advice would be to create your own account and set up the secret like so :

```ts
export const payPalDetails = {
  user: "your-email@upmind.com",
  password: "password"
};
```

The test flow:

1. Add a product to basket via API (`goToCheckout`).
2. Click "Pay-Pal Express" on the checkout page.
3. Playwright follows the redirect to `sandbox.paypal.com`.
4. Fills email + password, clicks the login button, then the "submit" button on the PayPal-hosted confirmation screen.
5. Waits for the redirect back to `qa-automation.local:5173/order/**`.
6. Asserts the thank-you text.

If PayPal changes their sandbox login UI (which happens every few months), these selectors will break: `page.getByPlaceholder("Email address or mobile number")`, `page.getByPlaceholder("Password")`, `#btnLogin`, and `page.getByTestId("submit-button-initial")`. When that happens, run the test in `--headed` mode, inspect the new selectors, and update in place. Admittedly this is bad practice, and a better way to implement this would be to find a way drop into a simulated API flow during the paypal checkout and not follow the redirect out at all. 

## Stripe test cards

The Stripe card tests use catalogues of test cards from [support/constants/checkout/payment-cards/](../e2e/support/constants/checkout/payment-cards/):

| File | Purpose |
| --- | --- |
| `AcceptedCards.ts` | Cards that should result in a successful order. |
| `DeclinedCards.ts` | Cards that Stripe will decline — tests that we show the decline message. |
| `FraudChecks.ts` | Cards flagged by Stripe's fraud checks. |
| `3dSecureCards.ts` | Cards that trigger 3D Secure flow. |
| `InvalidData.ts` | Cards with invalid data — tests that client-side validation fires in the Stripe iframe. |

These are all **public Stripe test cards** (e.g. `4242424242424242`). They only work against Stripe's test key, which the staging brand uses. If you ever need to run these against a different Stripe account, the same card numbers will work provided that account is also in test mode.

### Stripe iframe handling

The card number, expiry, and CVC fields live in a Stripe-hosted iframe. The checkout page object has a helper that targets it by title:

```ts
const stripeFrame = this.page.frameLocator('iframe[title="Secure payment input frame"]');
await stripeFrame.getByPlaceholder("1234 1234 1234 1234").fill(cardNumber);
```

The postcode field is also filled to `SW1A 2AB` to keep tests deterministic regardless of geolocation.

### SEPA and iDEAL

Both use the same Stripe iframe but with different forms selected. `inputSepaDetails` and `inputIdealDetails` on the `Checkout` page object know the right selectors. Both require the order currency to be `EUR` — tests set this via `goToCheckout(page, context, product, null, "EUR")`.

## Staging users — the `Logins` catalogue

[support/constants/logins.ts](../e2e/support/constants/logins.ts) has two groups:

### Checkout testing users

Named by the payment gateway they own — `stripeCard`, `bankTransfer`, `offlinePayment`, `micropayment`, `payLater`, `existingMethodUser`, `priceListUser`, `brandUser`, plus utility users (`checkoutUser`, `twoFactor`, `UiTesting`), domain/hosting customer pairs (`domain1`, `domain2`, `hosting1`, `hosting2`), etc.

These accounts must exist on staging with the exact email/password combos in the file. If they're deleted or the passwords change, every test that references them fails at login.

### Locale testing users

One account per supported locale (`english`, `french`, `german`, ...). All share the password `Password1`. These are used by the visual-regression locale loops.

### Where secrets go long-term

Currently all test passwords are committed in plaintext in `logins.ts` and `secrets/paypal.ts`. They're staging-only, but if you ever want to harden this:

- Move to an `.env` file loaded at test startup (Playwright already supports `dotenv`).
- Or use 1Password / a vault + a pre-test step that populates `process.env`.

No such rework is planned as of April 2026 — noted here so you know what to say if any security consultants asks.

## Session cookie quirks

### Guest vs client session

The app has two cookies that the tests treat as interchangeable when polling for auth state:

- `upm_guest_session` — present when there's no logged-in customer.
- `upm_client_session` — replaces the guest cookie after login/registration.

Tests poll for **either** to confirm the session layer is initialised:

```ts
await expect.poll(async () => {
  const cookies = await context.cookies();
  return cookies.some(c => c.name === "upm_guest_session" || c.name === "upm_client_session");
}, { timeout: 30000 }).toBeTruthy();
```

Without this poll, calling `getSessionToken` too early produces a "Session cookie not found" error.

### The `qa-automation.local` domain

All `upm_client_session` cookies the tests write (via `getClientToken` or the auth fixtures) are explicitly scoped to `qa-automation.local`:

```ts
await context.addCookies([{
  name: "upm_client_session",
  value: JSON.stringify(json),
  domain: "qa-automation.local",
  path: "/",
  httpOnly: false,
  secure: false,
  sameSite: "Lax"
}]);
```

This is why your hosts file MUST map that domain to the loopback address — otherwise the cookie is written to a domain the browser can't reach, and the cart app won't see it. If you're not using that domain, you'll need to update the getClientToken function and any similar code.

## "Why do we register via API, not UI?"

The registration fixture (`newUser`) and the `registerClient`/`registerAndLogin` helpers all go through `POST /api/clients/register` rather than filling the registration form. This is intentional, for two reasons:

1. **Speed** — API registration is ~1s; UI registration is 8–15s depending on form animations and back-end latency.
2. **CDP hangs** — when running under Chromium's DevTools Protocol (which Playwright uses), the registration UI has historically caused the test worker to hang intermittently. Switching to API registration fixed the hang.

We keep a small number of UI registration tests (e.g. [register.spec.ts](../e2e/e2e-tests/login-registration/register.spec.ts), and the "Register at checkout" flow in [buying-journeys/hosting-customers.spec.ts](../e2e/e2e-tests/buying-journeys/hosting-customers.spec.ts)) to verify the form actually works, but for any test where registration is setup-only, use the API.

## Radix radio buttons and the `.click()` race

Radix Vue's radio-card components sometimes do not reflect a `.click()` on the radio input itself — the `aria-checked` attribute stays `false` even after the click. The workaround is to click the enclosing `<label>` and poll `aria-checked`. That's [actions/radix-radio.ts](../e2e/support/actions/radix-radio.ts) in a nutshell:

```ts
const label = radio.locator("xpath=ancestor::label[1]");
await label.click({ force: true });
for (let attempt = 0; attempt < maxRetries; attempt++) {
  if ((await radio.getAttribute("aria-checked")) === "true") return;
  await page.waitForTimeout(retryDelayMs);
}
```

If you see a radio-selection assertion flake, switch to `selectRadixRadio`. The `RadioButtons` component class has a simpler `selectRadioOption` that works for most cases — use `selectRadixRadio` as the fallback.

## CORS preflight handling in mocks

Most of our response-mocking helpers under [support/mocks/](../e2e/support/mocks/) include this guard:

```ts
if (route.request().method() === "OPTIONS") {
  await route.fallback();
  return;
}
```

This is because the mocks intercept **all** requests to a given URL pattern, including the CORS preflight OPTIONS that fires before the actual GET/POST. If you fulfil the OPTIONS with a JSON body instead of the empty 204 the browser expects, the browser cancels the real request and the test fails in a confusing way. Always let OPTIONS fall through to the real server (or to the next handler) unless you're explicitly stubbing CORS (see `mockCorsPreflightRequests`).

## The `tests/Playwright/specs/` directory

This is **only** used by Playwright's AI-driven test-generator agents (the planner / generator tools from `@playwright/test-mcp`). Its README is intentionally tiny:

```
# Specs
This is a directory for test plans.
```

And [seed.spec.ts](../specs/seed.spec.ts) is a placeholder that the generator can use as a template.

If you use the generator, review and move generated tests into `tests/Playwright/e2e/e2e-tests/` before committing. Don't leave anything in `specs/` that's meant to be part of the real suite.

## Known gotchas / footguns

- **Don't use `test.only`** — it gets committed more often than it should. The MR template reviewers check for it, but don't rely on that.
- **Don't assert on `page.url()` directly** without awaiting a navigation — it returns synchronously and can read the old URL. Prefer `await expect(page).toHaveURL(...)` or `await page.waitForURL(...)`.
- **`waitForLoadState("networkidle")`** is fine on cold pages but dangerous on pages with background polling. If a test starts timing out after an app change, check whether a new polling loop was introduced.
- **"UI Template" tests are currently skipped** — see [`test.describe.skip`](../e2e/e2e-tests/brand-settings/ui-templates.spec.ts#L23). They rely on baselines that were regenerated as part of the template refactor and have not been re-baselined. Regenerating and un-skipping is on the QA backlog.
