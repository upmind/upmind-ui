# 🗂️ 2. Project Structure & Conventions

## Top-level layout

```
tests/Playwright/
├── e2e/                       # all runnable tests + the support library
│   ├── e2e-tests/             # behavioural e2e tests
│   ├── visual-regression/     # screenshot tests
│   ├── support/               # fixtures, page objects, helpers, mocks, etc.
│   ├── snapshots/             # committed baseline screenshots
│   ├── reports/               # HTML reporter output (gitignored)
│   └── test-output/           # raw test results, traces, videos (gitignored)
└── specs/                     # seed scaffolding for AI test generation
```

The root [playwright.config.ts](../../playwright.config.ts) points `testDir` at `tests/Playwright/e2e/`, so both `e2e-tests` and `visual-regression` are picked up automatically. `testMatch` is `**/*.spec.ts`.

## Inside `e2e/e2e-tests/`

Tests are grouped by feature area. Each subdirectory roughly corresponds to a surface area of the cart app:

| Directory | What it tests |
| --- | --- |
| `basket/` | basket display, editing, warning-note banners |
| `brand-settings/` | UI template overrides, footer customisation, template slots |
| `buying-journeys/` | full customer journeys for domain and hosting products |
| `checkout/` | billing details, payment gateways (Stripe, PayPal, bank transfer, offline, account credit), partial payments, 3DS |
| `confirmation/` | order confirmation page |
| `domain-availability-checker/` | Domain Availability Checker (DAC) — search, suggestions, pagination, transfer mode, add-to-basket flow; covers both the legacy and smart-suggest split-endpoint flows |
| `errors/` | error handling (dialog, redirect, toast) + form validation |
| `login-registration/` | login, registration, 2FA, terms and conditions |
| `products/` | product config, bundles, trials, payment terms, UI metadata, URL query strings |
| `tracking/` | GTM tag verification, UPM campaign params |
| `promotions.spec.ts` | top-level promotion scenarios |

## Inside `e2e/support/`

The support library is organised by responsibility, not by feature. See [Support Library Reference](05-support-library.md) for the file-by-file breakdown.

```
support/
├── actions/          # raw UI action helpers (inputLogin, selectRadixRadio)
├── api/              # REST calls against staging: auth, basket, client
├── constants/        # URLs, logins, products, languages, payment cards, etc.
├── fixtures/         # Playwright test fixtures: test, newUser, registeredUser
├── flows/            # multi-step setup helpers (e.g. goToCheckout)
├── helpers/          # small utilities: dates, strings, locale, nav, GTM
├── mocks/            # route-based response mocking and request interception
├── page-objects/
│   ├── components/   # reusable UI primitives (buttons, forms, popovers, etc.)
│   └── templates/    # per-page/per-surface page objects
└── secrets/          # external account credentials (e.g. PayPal sandbox. This folder is gitignored, so you will have to create your own)
```

## Naming conventions

### Test files

- Always `*.spec.ts`.
- Use kebab-case matching the feature name: `billing-details-requirements.spec.ts`.
- One feature area per file. Split files when a surface grows too busy (e.g. the `checkout/payment-gateways/` directory).

### Describe blocks

- Top-level `test.describe` is the surface (e.g. `"Checkout with Stripe"`).
- Nested describes group scenarios (e.g. `"Valid Cards"`, `"Declined Cards"`).
- Test titles describe the expected outcome — prefer "Successful login with 2FA" over "Test 1".

### Page objects

- Classes are PascalCase matching the surface name: `Checkout`, `Basket`, `Login`, `Registration`, `ProductConfig`.
- Locators are assigned in the constructor and typed as `readonly Locator`. Methods are the actions you can perform on that surface.
- See [05-support-library.md](05-support-library.md) for the distinction between `templates/` and `components/`.

### Selectors

The app is instrumented with `data-test-key` attributes, so the overwhelming preference is:

```ts
page.getByTestId("button-place-order-and-pay")
```

When the testid has dynamic parts (e.g. a gateway name), the helper passes the string through `kebabCase()` from [support/helpers/strings.ts](../e2e/support/helpers/strings.ts). This is a separate helper than the standard lodash kebabCase function used in the frontend files:

```ts
this.page.getByTestId(`radio-card-${kebabCase(gatewayName)}`)
```

Fall back to `getByRole`, `getByText`, or `getByPlaceholder` only when the element genuinely has no testid (for example, the elements inside Stripe's iframe which we don't control). Ideally though, if a data-test-key is missing, you should be adding it to the frontend code.

## Spec file anatomy

A typical e2e spec has five parts:

1. **Imports** — `test`/`expect` from Playwright (or from our custom fixtures), plus whatever page objects, flows, API helpers and constants you need.
2. **Typed module-level variables** — e.g. `let checkout: Checkout;` so the same instance is visible to every test and hook in the file.
3. **`test.describe`** — one per feature or sub-feature.
4. **`test.beforeEach`** — instantiate page objects, optionally seed authentication or basket state.
5. **`test(...)` cases** — arrange, act, assert, ideally in that visible order.

See the worked example in [Writing a New Test](04-writing-tests.md).

## Where generated output goes

- **HTML report:** `tests/Playwright/e2e/reports/html/` (regenerated every run). Open `index.html` in your browser.
- **Raw results, traces, videos:** `tests/Playwright/e2e/test-output/test-results/`. Cleaned on each run.
- **Snapshots:** `tests/Playwright/e2e/snapshots/` organised as `{testFilePath}/{projectName}/{arg}.png`. These are git ignored, so you will need to keep local copies.

## `tests/Playwright/specs/` — the AI seed directory

This is a small directory containing only a placeholder spec and a readme. It exists so that Playwright's built-in AI test-generator agents (i.e. the Playwright MCP test generator) have somewhere to drop newly-generated tests without polluting the real suite.

Unless you're specifically using the Playwright AI generator, you can ignore this directory. Generated tests should be reviewed, tidied up and moved into `e2e-tests/` before being committed.

## Things that look like gaps but aren't

- `e2e/reports/` only contains `html/` — that's where the HTML reporter writes. If you add other reporters in the config, they'll land here too.
- Some tests use Playwright's built-in `test` (from `@playwright/test`) rather than our custom fixtures. That's not a mistake — the custom fixtures are opt-in for tests that need specific auth statuses (see section 5).
