# 📚 5. Support Library Reference

Every directory under [tests/Playwright/e2e/support/](../e2e/support/) has a specific role. This page is the file-by-file reference.

## `support/fixtures/` — custom Playwright test fixtures

Playwright's `test` object can be extended with custom fixtures that get injected into every test as named arguments. We ship three:

### [test-contexts.ts](../e2e/support/fixtures/test-contexts.ts)

Exports `test` — a minimally-wrapped Playwright `test` that builds its own `BrowserContext` and `Page` and closes them cleanly. Useful when you want the lifecycle to be explicit without adding any auth behaviour.

### [auth-context.ts](../e2e/support/fixtures/auth-context.ts)

Exports two auth-enabled fixtures:

- **`newUser`** — registers a brand-new client via the API on every test, and gives you `checkout`, `confirmation`, `session`, and `token` fixtures alongside `page`/`context`. This is the default for anything that exercises the checkout pipeline from a fresh-account perspective.
- **`registeredUser`** — logs in as a caller-provided username/password. Set via `registeredUser.use({ userLogin: ..., userPassword: ... })` at the describe level. Less common than `newUser`.

Both fixtures call `waitForSessionCookie` from [helpers/session.ts](../e2e/support/helpers/session.ts) before calling the API — this is critical; without it, the OAuth call often races the cookie write.

### [index.ts](../e2e/support/fixtures/index.ts)

Re-exports the fixtures. Most specs import from this file.

## `support/api/` — REST calls against staging

These are **real** API calls against `api.staging.upmind.io`. Tests create actual records in staging.

### [auth.ts](../e2e/support/api/auth.ts)

- `getSessionToken(context)` — extracts the access token from the `upm_client_session` or `upm_guest_session` cookie.
- `getClientToken(page, username, password)` — `POST /oauth/access_token` with `grant_type=password`, then writes `upm_client_session` cookie. This is how every "log in as staging user X" test gets its credentials in.

### [client.ts](../e2e/support/api/client.ts)

- `registerClient(guestToken, options?)` — `POST /api/clients/register` with faker-generated defaults. Returns the OAuth response plus the email + password used so tests can log in again later.
- `registerAndLogin(page, context, options?)` — convenience wrapper that does `registerClient` and writes the session cookie.
- `getCurrentAddressId(token)` — returns the `address_id` on the current order, or null.
- `addAddressToClient(token, clientId)` — hard-codes a 10 Downing Street address onto the client.

### [basket.ts](../e2e/support/api/basket.ts)

The richest module. Key functions:

- `createOrder(token)` — `POST /api/orders` with `category_slug: "new_contract", currency_code: "GBP"`.
- `getCurrentOrder(token)` — `GET /api/orders/current` with the monster `with=...` query string.
- `getBasketProducts(token)` — just the products array from current order.
- `addProductToOrder(token, orderId, productId, qty, billingCycle, attrs, options, provisionFields, promos, provisionFieldsValidate, start_trial)` — the giant arity exists because the API endpoint takes all those fields explicitly. Most tests pass `[]`, `[]`, `{}`, `[]`, `true`, `false` for the last block.
- `removeProductFromOrder(token, orderId, productId)` — DELETE.
- `addPromotionToOrder(orderId, promoCode, token)` — POST promotions.
- `setOrderCurrency(token, orderId, currency)` — PUT the currency code.
- `setOrderAddress(token, orderId, addressId, companyId?, phoneId?)` — PUT billing address.
- `getInvoice(token, invoiceId)` — GET an invoice.

### [index.ts](../e2e/support/api/index.ts)

Re-exports the public surface. Prefer importing from this barrel rather than reaching into individual files.

## `support/flows/` — multi-step setup helpers

### [checkout.ts](../e2e/support/flows/checkout.ts)

One helper: `goToCheckout(page, context, product, promotion?, currency?, trialValue?)`. It:

1. Navigates to `/order/basket/` so the guest cookie is set (there may be a cleaner way to do with with a specific test fixture that creates the cookie itself).
2. Polls for the session cookie.
3. Reads the guest token, creates an order, (optionally) sets currency, adds the product with auto-generated domain values if applicable, optionally applies a promo code.
4. Navigates to `/order/checkout/`.

This is the cheapest way to land on a populated checkout page. **It does not log the user in** — pair with `getClientToken` (or the `newUser` fixture) if you need an authenticated customer. If you do not use some kind of method of obtaining a client token, when you try to navigate to checkout using goToCheckout you will instead be redirected to registration (this in intentional as the behaviour itself can be asserted on as a test of the routing)

## `support/actions/` — small UI action helpers

These are raw functional helpers — no state, no class, just a function that performs a sequence of UI actions. Used when a page object feels too heavyweight.

- [login.ts](../e2e/support/actions/login.ts) — `inputLogin(page)` (logs in as the default checkout test user via form fill) and `inputRegistration(page)` (registers a new user via form fill with faker data).
- [radix-radio.ts](../e2e/support/actions/radix-radio.ts) — `selectRadixRadio(page, options)`. Radix Vue's radio components don't always reflect clicks when driven by Playwright, so this helper clicks the **label** element (rather than the radio input), then polls `aria-checked` for up to 10 × 50ms. If you run into flaky radio selection anywhere, check whether you should be using this.

## `support/helpers/` — tiny shared utilities

- [catalogue.ts](../e2e/support/helpers/catalogue.ts) — `overrideBasketProductsLimit(page, limit)` intercepts `GET /api/basket/products?...` and rewrites the `limit` query param so an in-situ catalogue spec can render many products on a single page without paginating.
- [dates.ts](../e2e/support/helpers/dates.ts) — `getFormattedDate()` (e.g. `Apr 23rd, 2026`) and `getTimestamp()` (`YYYY-MM-DD HH:MM:SS`). Used by tests that assert on visible order dates.
- [gtm.ts](../e2e/support/helpers/gtm.ts) — `getDataLayer(page)` pulls the current `window.dataLayer`; `waitForEvent(page, eventName)` polls the data layer until a specific event appears.
- [locale.ts](../e2e/support/helpers/locale.ts) — `setLocale(page, value)` writes `i18n/locale` into localStorage and reloads. Used extensively in visual regression.
- [navigation.ts](../e2e/support/helpers/navigation.ts) — `waitForUrlChange(page, expectedUrl)` thin wrapper around `page.waitForURL`.
- [session.ts](../e2e/support/helpers/session.ts) — `waitForSessionCookie(context, { timeout, guestOnly })` polls `context.cookies()` until either `upm_guest_session` or `upm_client_session` is present (or just the guest cookie when `guestOnly: true`). Used by the auth fixtures and anywhere a test needs to read a session token shortly after navigation.
- [strings.ts](../e2e/support/helpers/strings.ts) — `kebabCase(input)` used anywhere we template a testid off a user-visible label.

## `support/constants/` — shared test data

- [urls.ts](../e2e/support/constants/urls.ts) — `URLs` (all navigable URLs in the app + the API base) and `ProductIds` (raw UUIDs used by URL-query-string tests).
- [logins.ts](../e2e/support/constants/logins.ts) — **every staging test user, with passwords in plaintext.** These accounts must exist on staging for the tests to pass. Organised by category: checkout testing, locale testing. If passwords are rotated on staging, update this file.
- [products.ts](../e2e/support/constants/products.ts) — the `products` map with the curated set of products used across tests. Keys are UPPER_CASE. Each entry has `id`, `name`, `billingCycle`, `gbpPrice`, and `type`.
- [languages.ts](../e2e/support/constants/languages.ts) — 28 supported locales as `{ language, locale }`. Used by all visual-regression locale loops.
- [brand.ts](../e2e/support/constants/brand.ts) — `slotTemplates` map: per-surface list of template slot names for the brand-settings tests.
- [default-payment-terms.ts](../e2e/support/constants/default-payment-terms.ts) — the four `termSetting` → `radioOption` mappings for the default-payment-terms tests.
- [domain-suggestions.ts](../e2e/support/constants/domain-suggestions.ts) — canned suggestion rows + matching `DomainSuggestionProduct` payloads (with stable `domainProductIds`) for the DAC smart-suggest split-endpoint specs. Pairs with [mocks/domain.ts](../e2e/support/mocks/domain.ts).
- [error-codes.ts](../e2e/support/constants/error-codes.ts) — catalogue of error scenarios: route, URL, HTTP status, response body, expected button testid, expected error UI (`dialog`, `redirect`, or `toast`). Consumed by [error-handling.spec.ts](../e2e/e2e-tests/errors/error-handling.spec.ts).
- [test-data.ts](../e2e/support/constants/test-data.ts) — `TEST_EMAILS`: non-login emails typed into UI forms (domain registrant, SEPA, iDEAL). These are **not** login accounts — for credentials use `Logins`.
- [checkout/payment-cards/](../e2e/support/constants/checkout/payment-cards/) — catalogues of Stripe test cards, grouped by outcome: `AcceptedCards`, `DeclinedCards`, `FraudChecks`, `3dSecureCards`, `InvalidData` (the last with expected error text per card).
- [checkout/test-cases/](../e2e/support/constants/checkout/test-cases/) — domain-specific test matrices (`DevBlocks`, `StarterHosting`, domains `Com`/`Uk`) used for parametric product-config tests.

## `support/mocks/` — route-based response mocks

All functions register a `context.route` (or `page.route`) handler. They are idempotent — calling the same mock twice on the same context will usually throw. Register mocks **before** the navigation that triggers the mocked request.

| File | What it does |
| --- | --- |
| [brand.ts](../e2e/support/mocks/brand.ts) | `interceptConfigValues` (brand config: require address, company, phone, price-display type); `interceptTermsAndConditions` (override T&Cs); `interceptUISchema` (set `@context.*.template` and other cart meta keys); `interceptSlots` (inject HTML into a named template slot). |
| [checkout.ts](../e2e/support/mocks/checkout.ts) | `mockStripeCardDecline` (force a 402 from Stripe's `/v1/payment_methods`); `mockCorsPreflightRequests` (blanket CORS OPTIONS passthrough — useful when debugging flaky cross-origin preflights). |
| [client.ts](../e2e/support/mocks/client.ts) | `mockClientAddresses` — intercepts `GET /api/clients/{id}/addresses` and rewrites the first address to 10 Downing Street with a realistic country relation. |
| [domain.ts](../e2e/support/mocks/domain.ts) | DAC smart-suggest split-endpoint mocks: `mockDomainSuggestions` (`/modules/web_hosting/domains/suggestions`), `mockDomainSuggestionsTlds` (`.../suggestions/tlds`), `mockDomainAvailability` (`.../availability/{domain}`). Each is fully synthetic so tests can control row content, paging and resolution order; `latencyMs` lets a spec slow one call down to assert the progressive-render contract (suggestions → price skeletons → tlds → prices). |
| [errors.ts](../e2e/support/mocks/errors.ts) | `returnError(page, route, errorCode, responseError)` — fulfil any route with an error response in the Upmind standard shape. |
| [orders.ts](../e2e/support/mocks/orders.ts) | `orderUpdated(page, orderId, timeout)` (waits for a PUT to `/api/orders/{id}`); `overrideWarningNotes(page, message)` (injects a warning note into `GET /api/orders/current`). |
| [patch-response.ts](../e2e/support/mocks/patch-response.ts) | `interceptAndPatchResponse(context, urlPattern, path, newValue)` — surgical deep-key set via a dotted path (`data.products.0.price`). |
| [products.ts](../e2e/support/mocks/products.ts) | `mockTrialProduct` (inject `trial_supported`, `trial_force`, `trial_duration`, `trial_end_action`); `interceptProductMeta` (override `data.meta` on product responses). |
| [promotions.ts](../e2e/support/mocks/promotions.ts) | `mockPromos(context, route, overrides, billingCycleMonths, targetArray)` — injects promotion data into `prices`, `products_options`, or `products_attributes` arrays, targeting one or all billing cycles. |
| [wallet.ts](../e2e/support/mocks/wallet.ts) | `mockWalletBalance(context, options)` — mocks `GET /api/wallet/balance` and `POST /api/cart/calculate` to simulate a client with account credit at checkout. |
| [index.ts](../e2e/support/mocks/index.ts) | Barrel export. Import from here. |

## `support/page-objects/components/` — reusable UI primitives

Small, generic classes that model a single UI primitive. They don't know about any specific page — you pass in a scoped `Locator` when you need the component constrained to a region.

| File | Models |
| --- | --- |
| [accordion.ts](../e2e/support/page-objects/components/accordion.ts) | Radix accordion — `getAccordion(option)` returns an item by kebabCased label. |
| [button.ts](../e2e/support/page-objects/components/button.ts) | Generic button-by-role helper scoped to a container. |
| [checkboxes.ts](../e2e/support/page-objects/components/checkboxes.ts) | Radix checkbox cards with optional qty +/- controls. |
| [drawer.ts](../e2e/support/page-objects/components/drawer.ts) | Side-drawer overlay (used for domain search). |
| [form.ts](../e2e/support/page-objects/components/form.ts) | Wraps `form-item-*` / `input-*` testid convention: `getFormField`, `getFormInput`, `fillFormInput`, `clearFormInput`. |
| [lineclamp.ts](../e2e/support/page-objects/components/lineclamp.ts) | The "Read more" line-clamp control. |
| [markdown.ts](../e2e/support/page-objects/components/markdown.ts) | Rendered markdown blocks. |
| [pagination.ts](../e2e/support/page-objects/components/pagination.ts) | Pagination controls. |
| [popover.ts](../e2e/support/page-objects/components/popover.ts) | Radix popover trigger/content pair. |
| [radio-buttons.ts](../e2e/support/page-objects/components/radio-buttons.ts) | Radix radio cards, `getRadioButton(option)` and `selectRadioOption(option)`. See also the standalone `selectRadixRadio` action in [actions/radix-radio.ts](../e2e/support/actions/radix-radio.ts) for when Radix doesn't update state reliably on `.click()`. |
| [select.ts](../e2e/support/page-objects/components/select.ts) | `clickSelectOption` against a combobox. |
| [text-input.ts](../e2e/support/page-objects/components/text-input.ts) | Text input scoped to a container. |

## `support/page-objects/templates/` — per-page page objects

One class per major surface. These hold all the locators for that surface and expose meaningful actions (not just raw clicks).

| File | Surface |
| --- | --- |
| [basket.ts](../e2e/support/page-objects/templates/basket.ts) | `Basket` — basket page, includes trial alerts, promo form, proceed-to-checkout button. |
| [billing-page.ts](../e2e/support/page-objects/templates/billing-page.ts) | `BillingPage` — the standalone `/order/billing` page (less common). |
| [checkout.ts](../e2e/support/page-objects/templates/checkout.ts) | `Checkout` — the big one. Payment method selection, Stripe iframe input (cards, SEPA, iDEAL), change-amount modal, billing card edit, place-order buttons, payment response interception. |
| [confirmation.ts](../e2e/support/page-objects/templates/confirmation.ts) | `Confirmation` — order summary, invoice number, order date, payment method. |
| [dac.ts](../e2e/support/page-objects/templates/dac.ts) | `Dac` — Domain Availability Checker. Used on both the standalone `/domains/` page and inside the Register / Transfer accordions on a product config page (testids are shared across the two surfaces). Holds locators for result cards, price/button loading skeletons, pagination, and the transfer-mode input. |
| [footer.ts](../e2e/support/page-objects/templates/footer.ts) | `Footer` — currency and language selectors. |
| [login.ts](../e2e/support/page-objects/templates/login.ts) | `Login` — both the standalone `/auth/login/` page and the login popover opened from other pages. Includes `twoFactorInput` for 2FA tests. |
| [product-config.ts](../e2e/support/page-objects/templates/product-config.ts) | `ProductConfig` — the most complex. Holds locators for options, billing terms, domain registration/transfer/existing/basket accordions, registrant fields, order summary, trial opt-in, plus composed actions like `addDomain` and `enterRegistrantDetails`. Aggregates many of the component classes. |
| [registration.ts](../e2e/support/page-objects/templates/registration.ts) | `Registration` — includes a `getCookie(tokenType)` helper so tests can assert the session was written. |

## `support/secrets/` — external-account credentials

- [paypal.ts](../e2e/support/secrets/paypal.ts) — PayPal **sandbox** buyer credentials used by [paypal.spec.ts](../e2e/e2e-tests/checkout/payment-gateways/paypal.spec.ts). Not real money; still, don't check this file's credentials into any public repo. See section 7 for more on how credentials like this are handled.
