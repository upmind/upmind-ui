# pseudo-Nathan — Principles, Conventions and Patterns for the Upmind Playwright Suite

> A reverse-engineered field guide to Nathan Robinson's tacit knowledge of the
> e2e suite. Built from his docs, his code, and the shape of his commits.
> The intended reader is a future agent (especially `code-test-e2e`) or a
> new human contributor extending the suite *in his style* without contradicting
> ADRs 020 / 021 / 022.

---

## 1. Preamble

Nathan Robinson was the team's dedicated tester. He owned the Playwright e2e
suite under `tests/Playwright/` and left at the end of the week of 2026-05-22.
The suite that ships today — Vue cart against staging API, three browsers,
~22-test critical-journey subset, fixture-driven `newUser` flow — is largely
his work. He left behind eleven docs in `tests/Playwright/docs/` and a deep
folder of representative tests. He did not leave behind a tester replacement;
ADR 021 codifies the transition from "one tester owns judgment" to "the team
owns judgment via written policy + agentic enforcement."

This document is the bridge. It captures *why* Nathan wrote the suite the way
he did so the next contributor (silicon or carbon) can extend it in the same
voice. It is **not** a replacement for ADRs 020/021/022 — where Nathan's
default and the ADR's default disagree, the ADR wins. It also is not a
mechanical style-lint; some of what Nathan knew lives only in the shape of
his commits and is reproduced here under cautious labels.

---

## 2. Source map

| Source | What it taught |
| --- | --- |
| [08-qa-handover.md](./08-qa-handover.md) | The explicit cardinal rules, mocking philosophy, restart-wishlist. Highest-priority source. |
| [00-index.md](./00-index.md) | Live config (base URL, retries=1, fullyParallel, viewport, animations off). |
| [02-project-structure.md](./02-project-structure.md) | Folder taxonomy by surface area; kebab-case `.spec.ts`; `templates/` vs `components/` page objects. |
| [04-writing-tests.md](./04-writing-tests.md) | The 9-step authoring drill. The "fixture pick" matrix. Locators, assertion patterns, isolation rule. |
| [10-feature-style.md](./10-feature-style.md) | Declarative-Gherkin style rules. Post-Nathan, co-authored with the team but built on his framing. |
| [11-authoring-tests.md](./11-authoring-tests.md) | Step-by-step AC→`.feature`→`.spec.ts` flow. Post-Nathan, implements ADR 020. |
| [stripe-card.spec.ts](../e2e/e2e-tests/checkout/payment-gateways/stripe-card.spec.ts) | Canonical data-driven test loop, nested `describe` by validity class, `${name}` in the test title. |
| [basket-display.spec.ts](../e2e/e2e-tests/basket/basket-display.spec.ts) | Plain `test` (not `newUser`) for API-seeded setup; faker domain generation; module-level `let basket: Basket`. |
| [error-handling.spec.ts](../e2e/e2e-tests/errors/error-handling.spec.ts) | Mocked route + `serial` mode + `unrouteAll` cleanup. The route-cleanup pattern. |
| [login.spec.ts](../e2e/e2e-tests/login-registration/login.spec.ts) | Why `serial` is required for shared-staging-user tests; commented-out reason inline. |
| [auth-context.ts](../e2e/support/fixtures/auth-context.ts) | `newUser` and `registeredUser` fixtures, `_authReady` auto-fixture pattern. |
| [flows/checkout.ts](../e2e/support/flows/checkout.ts) | API-driven setup as the default; JSDoc explains *why* (faster, avoids CDP hang). |
| [page-objects/templates/checkout.ts](../e2e/support/page-objects/templates/checkout.ts) | Constructor-only locator wiring, `readonly Locator`, action methods below. |
| [mocks/checkout.ts](../e2e/support/mocks/checkout.ts) | One mock = one route handler; inline JSON for response shape; JSDoc on intent. |
| [api/basket.ts](../e2e/support/api/basket.ts) | Typed `Order` interface; per-call `APIRequestContext`; `try/finally context.dispose()`. |
| [constants/products.ts](../e2e/support/constants/products.ts) | Hardcoded staging UUIDs + `gbpPrice` / `billingCycle` co-located; one source of product truth. |
| `git log --author="Nathan Robinson"` | Commit cadence: prefix `qa:` / `QA:`, branch-per-ticket (`qa/<thing>`), Linear ID in scope (`(FE-2457)`), small focused diffs. |
| [ADR 020](../../../docs/adr/020-gherkin-test-planning.md) | Decision spec wins over Nathan's planning hint where they overlap. |
| [ADR 021](../../../docs/adr/021-testing-pyramid-and-agentic-workflow.md) | Supersedes Nathan's e2e-heavy ice-cream cone with a Trophy; codifies "shadow implementations" anti-pattern. |
| [ADR 022](../../../docs/adr/022-ui-testing-strategy.md) | Proposed; pushes UI-component coverage out of Playwright entirely. |

---

## 3. Principles (load-bearing)

> **Rule:** non-negotiable.  **Evidence:** file or doc + quote.  **Prevents:** the failure mode it forecloses.

### P1 — A suite that takes an hour is a suite nobody runs

- **Rule:** total suite runtime is the constraint that disciplines every other decision. Target <15 min, ceiling 30 min.
- **Evidence:** [08-qa-handover.md:15](./08-qa-handover.md#L15) — *"Tests are only invaluable if people run them. If a suite takes an hour, nobody runs it. Target: ideally <15 min, realistically ≤30 min. This is the constraint that disciplines every other decision below."*
- **Prevents:** new tests being added on their individual merit while ignoring aggregate suite cost. ADR 021 promotes this to a hard CI ceiling.

### P2 — Slice, not journey

- **Rule:** Every test targets a specific action with a specific goal. The full buying journey is reserved for a handful of sanity tests, not the dominant pattern.
- **Evidence:** [08-qa-handover.md:16-18](./08-qa-handover.md#L16-L18) — *"Target a specific slice... Don't replay the full buying journey to test a checkout step... A couple of full-journey tests for sanity only. Not a suite."*
- **Prevents:** combinatorial blow-up. Also prevents AI-authored tests losing coherence over long flows.

### P3 — Don't write unit tests in Playwright

- **Rule:** "Click a button, assert checked" is a unit/component test. ~30% of the current suite belongs lower down.
- **Evidence:** [08-qa-handover.md:18](./08-qa-handover.md#L18) — *"Don't write unit tests in Playwright... Roughly 30% of the current Playwright suite could be ported down the pyramid."*
- **Prevents:** the ice-cream-cone shape ADR 021 explicitly retires.

### P4 — Mock settings, not journey data

- **Rule:** Brand meta / UI schema / feature flags are fair game to mock. Basket contents, orders, payments are not — those come from real API.
- **Evidence:** [08-qa-handover.md:22-26](./08-qa-handover.md#L22-L26) — *"Mock settings, not data. Canonical good case: brand meta settings... Don't mock journey data. You'll forget something mid-journey, the mock will go stale."* Codified in `support/mocks/` (only settings/route-shape mocks: `interceptUISchema`, `interceptConfigValues`, `mockStripeCardDecline`, `mockWalletBalance`, `mockPromos`, `mockTrialProduct`).
- **Prevents:** silent test rot when journey responses drift. ADR 021 generalises this as the "shadow implementations" anti-pattern.

### P5 — Set up via API, drive via UI

- **Rule:** Use API helpers / flow wrappers to reach the page under test. Don't pay the cost of clicking through unrelated UI.
- **Evidence:** [flows/checkout.ts:14-29](../e2e/support/flows/checkout.ts#L14-L29) JSDoc — *"Registering via the API (rather than the UI) is faster and avoids occasional CDP hangs on the registration UI — that's why we have the fixture."* [04-writing-tests.md:81](./04-writing-tests.md#L81) — *"Set up basket state via API using `goToCheckout`... much faster than clicking through the product-config UI."*
- **Prevents:** test runtimes blowing past P1's budget; CDP-hang flakes from the registration page.
- **ADR 021 caveat:** API/flow helpers are legitimate setup only if they reach a state a real user can reach in production. The hand-rolled, business-logic-replicating variants (e.g. `seedInvalidProduct`) are *shadow implementations* and slated for retirement.

### P6 — Don't navigate outside the app under test

- **Rule:** Playwright tests stay on the cart app. Off-site gateway pages (PayPal full flow, third-party 3DS) are not driven via the browser.
- **Evidence:** [08-qa-handover.md:19](./08-qa-handover.md#L19) — *"Don't navigate outside your app. Playwright's own advice. Spoofing off-site gateway journeys doesn't yield good results — Nathan tried and parked it."* Restart-wishlist ([08-qa-handover.md:48](./08-qa-handover.md#L48)): off-site gateways = spoof the 2-3 callback params, don't drive the third-party page.
- **Prevents:** brittle cross-origin flake; tests that depend on third-party UI which we cannot stabilise.

### P7 — Fix the root cause; don't lean on retries

- **Rule:** Retries are 1, set to absorb staging hiccups, not to mask flake.
- **Evidence:** [00-index.md:18](./00-index.md#L18) — *"The single retry exists to absorb the occasional staging API hiccup — flaky tests should still be fixed at the root rather than masked by it."* ADR 021 hardens this: two flakes = quarantine, 30 days = delete.
- **Prevents:** retry-as-flake-tolerance, which trains the team to ignore failures.

### P8 — Tests that need a fresh customer use `newUser`. Tests that share staging accounts must opt into serial

- **Rule:** `fullyParallel: true` is the global default. The shared-staging-user exception requires explicit `test.describe.configure({ mode: "serial" })`.
- **Evidence:** [04-writing-tests.md:191-203](./04-writing-tests.md#L191-L203); [login.spec.ts:13](../e2e/e2e-tests/login-registration/login.spec.ts#L13) carries a comment explaining *why* serial is used there (the `Logins.checkoutUser` account is also used in `update-billing-details.spec.ts`).
- **Prevents:** cross-test corruption of a single staging account; non-deterministic order failures.

---

## 4. Conventions (style)

These are preferences. Useful to follow for consistency; not failing-grade if missed.

1. **File names: kebab-case `.spec.ts`** matching the feature (`partial-payments.spec.ts`). Source: [02-project-structure.md:60](./02-project-structure.md#L60); [04-writing-tests.md:9](./04-writing-tests.md#L9).
2. **Group by feature area** under `e2e-tests/` (`basket/`, `checkout/`, `login-registration/`, etc.). Each area maps to a cart surface, not a component. Source: [02-project-structure.md:23-37](./02-project-structure.md#L23-L37).
3. **Describe-block hierarchy:** top-level describe = surface (`"Checkout with Stripe"`); nested describe = scenario class (`"Valid Cards"`, `"Declined Cards"`). Source: [stripe-card.spec.ts:20-44](../e2e/e2e-tests/checkout/payment-gateways/stripe-card.spec.ts#L20-L44); [02-project-structure.md:62-66](./02-project-structure.md#L62-L66).
4. **Test titles describe the outcome**, not the action: "Successful login with 2FA", not "Test 1". Source: [02-project-structure.md:66](./02-project-structure.md#L66).
5. **Data-driven loops bake the discriminator into the title** — `` `Accepted Stripe Cards - ${name}` ``. Source: [04-writing-tests.md:113](./04-writing-tests.md#L113); canonical example [stripe-card.spec.ts:25](../e2e/e2e-tests/checkout/payment-gateways/stripe-card.spec.ts#L25).
6. **Constants live in `support/constants/`** as named typed objects. Hardcoded staging UUIDs are co-located with display metadata (`gbpPrice`, `billingCycle`, `type`). Source: [constants/products.ts:1-22](../e2e/support/constants/products.ts#L1-L22).
7. **Page objects are PascalCase classes** named for the surface (`Checkout`, `Basket`, `Login`, `ProductConfig`). Locators in the constructor, typed `readonly Locator`. Actions are methods below. Source: [page-objects/templates/checkout.ts:5-50](../e2e/support/page-objects/templates/checkout.ts#L5-L50); [02-project-structure.md:69-71](./02-project-structure.md#L69-L71).
8. **Locator preference order: `getByTestId` → `getByRole` → `getByText` → `getByPlaceholder`.** Add a `data-test-key` to the frontend rather than fall back. Source: [02-project-structure.md:74-86](./02-project-structure.md#L74-L86); [04-writing-tests.md:118-128](./04-writing-tests.md#L118-L128).
9. **Dynamic testids run through `kebabCase()`** from `support/helpers/strings.ts` (not the lodash one — separate intentional copy). Source: [02-project-structure.md:80-84](./02-project-structure.md#L80-L84); [page-objects/templates/checkout.ts:177](../e2e/support/page-objects/templates/checkout.ts#L177).
10. **Module-level `let` for the page object instance**, instantiated in `beforeEach`. Pattern: `let basket: Basket; ... beforeEach(... basket = new Basket(page))`. Source: [basket-display.spec.ts:9-16](../e2e/e2e-tests/basket/basket-display.spec.ts#L9-L16); [02-project-structure.md:94-95](./02-project-structure.md#L94-L95).
11. **Prefer `expect().toBeVisible()` over `waitForTimeout` or `waitForLoadState("networkidle")`.** Auto-retry up to 30s is your safety net. `networkidle` is banned because the cart polls. Source: [04-writing-tests.md:131-149](./04-writing-tests.md#L131-L149).
12. **`test.afterEach` with `page.unrouteAll({ behavior: "wait" })`** when tests register route mocks. Canonical example: [error-handling.spec.ts:22-25](../e2e/e2e-tests/errors/error-handling.spec.ts#L22-L25). Source: [04-writing-tests.md:167](./04-writing-tests.md#L167).
13. **One mock helper = one route handler with inline JSON response.** JSDoc one-liner on what it mocks. Source: [mocks/checkout.ts:3-28](../e2e/support/mocks/checkout.ts#L3-L28).
14. **API helpers use a per-call `APIRequestContext`** scoped with try/finally `context.dispose()`. Bearer token passed in. Typed return interface (`Order`, etc.). Source: [api/basket.ts:24-56](../e2e/support/api/basket.ts#L24-L56).
15. **Faker is `fakerEN_GB`**, not the default. Used for domain names, alphanumeric IDs. Source: [basket-display.spec.ts:2,18](../e2e/e2e-tests/basket/basket-display.spec.ts#L2); [flows/checkout.ts:12,49](../e2e/support/flows/checkout.ts#L12).
16. **JSDoc on flow helpers explains *why*, not just *what*** — see [flows/checkout.ts:14-29](../e2e/support/flows/checkout.ts#L14-L29) (the registration-via-API rationale).
17. **Create a page object when:** same locator in ≥3 spec files, or a non-obvious qualification (compound chained locator), or an action of >2 primitive calls. Otherwise inline. Source: [04-writing-tests.md:180-186](./04-writing-tests.md#L180-L186).
18. **Commit convention:** branch `qa/<topic-or-ticket>`, message prefix `qa:` (small) or `QA:` (substantive), Linear ID in trailing parens (`(FE-2457)`). Source: `git log --author="Nathan Robinson"`.
19. **Commit scope = one concern.** Test-suite refactors land separately from new coverage (`qa/test-parallelisation-fixes`, `qa/fixing-ai-jank` vs `qa/product-upsells`). Source: same.
20. **Docs are numbered for reading order** ([00-index.md](./00-index.md) → [11-authoring-tests.md](./11-authoring-tests.md)). New docs slot into the sequence; the index gets a one-line summary added. Source: [00-index.md:33-46](./00-index.md#L33-L46).

---

## 5. Anti-patterns Nathan avoided

1. **Mocking journey data.** Explicitly rejected: *"You'll forget something mid-journey, the mock will go stale, the test will crumble in unintended ways. More annoying than it's worth."* ([08-qa-handover.md:24](./08-qa-handover.md#L24)). Mocks under `support/mocks/` are settings/route-error scoped, never basket/order content.
2. **Driving off-site gateway UI.** Tried, parked: *"Spoofing off-site gateway journeys doesn't yield good results — Nathan tried and parked it. Non-Stripe gateway coverage is consciously thin as a result."* ([08-qa-handover.md:19](./08-qa-handover.md#L19)).
3. **`networkidle` waits.** Banned because the cart polls in background. *"`networkidle` can hang forever."* ([04-writing-tests.md:144-149](./04-writing-tests.md#L144-L149)).
4. **Hardcoded `waitForTimeout`.** Anti-example sits in the docs as a counter-pattern ([04-writing-tests.md:135-139](./04-writing-tests.md#L135-L139)). The exception is the Radix-radio retry loop ([support/actions/radix-radio.ts](../e2e/support/actions/radix-radio.ts)), which is the only documented case where a manual loop earns its keep.
5. **One assertion per test.** Implicitly rejected — the canonical Stripe loop asserts URL, body text, and gateway response in the same test ([stripe-card.spec.ts:37-40](../e2e/e2e-tests/checkout/payment-gateways/stripe-card.spec.ts#L37-L40)). Co-tested assertions are the norm.
6. **Page-object proliferation.** *"You should not create a page object for one-off locators or assertions. Inline them — it's easier to read than chasing through support files."* ([04-writing-tests.md:185](./04-writing-tests.md#L185)).
7. **`test.only` / `test.skip` left in committed code.** Explicit don't-do ([04-writing-tests.md:175](./04-writing-tests.md#L175)). The single intentional `describe.skip` in [brand-settings/ui-templates.spec.ts:23](../e2e/e2e-tests/brand-settings/ui-templates.spec.ts#L23) carries a comment explaining the baseline regen.
8. **Stale `test.describe.configure({ mode: "parallel" })` calls.** Now redundant since `fullyParallel` is global. *"Don't add new ones; they only make the intent ambiguous."* ([04-writing-tests.md:204](./04-writing-tests.md#L204)).
9. **TitleCase or snake-case `.spec.ts` names.** Explicit don't-do — *"`partial-payments.spec.ts`, not `PartialPayments.spec.ts` or `test_partial.spec.ts`."* ([04-writing-tests.md:9](./04-writing-tests.md#L9)).
10. **Migrating existing tests when adopting new patterns.** Nathan's pattern (and ADR 020): convention applies to new tests; existing tests stay as-is unless they're broken. Source: [08-qa-handover.md:39](./08-qa-handover.md#L39); [ADR 020:39](../../../docs/adr/020-gherkin-test-planning.md#L39).

---

## 6. Patterns to extend safely

Areas where adding more — in Nathan's style — is encouraged.

- **New page objects under `support/page-objects/templates/`** following the `Checkout` template: PascalCase class, constructor wires every `readonly Locator`, action methods underneath, dynamic testids piped through `kebabCase`. Source: [page-objects/templates/checkout.ts:5-178](../e2e/support/page-objects/templates/checkout.ts#L5-L178).
- **New mocks under `support/mocks/`** following the `mockStripeCardDecline` template: one exported async function, JSDoc one-liner, single `page.route` call, inline JSON. Add to [mocks/index.ts](../e2e/support/mocks/index.ts). Source: [mocks/checkout.ts](../e2e/support/mocks/checkout.ts).
- **New API helpers under `support/api/`** following [api/basket.ts](../e2e/support/api/basket.ts): typed return interface, per-call `APIRequestContext`, try/finally dispose, explicit `Bearer` header, `.text()` + `throw new Error(...)` on non-OK responses.
- **New data-driven loops** — pull payloads into `support/constants/<flow>/<thing>.ts`, iterate with `for (const { name, ... } of Cases)`, embed `${name}` in the test title. Source: [stripe-card.spec.ts:23](../e2e/e2e-tests/checkout/payment-gateways/stripe-card.spec.ts#L23).
- **New `.feature` files** under `tests/Playwright/features/<flow>/` following [10-feature-style.md](./10-feature-style.md) declarative rules (ADR 020). Note: `features/` is *new* per ADR 020 and post-dates Nathan, but the per-flow folder mirror matches his `e2e-tests/` taxonomy precisely.
- **New flows under `support/flows/`** wrapping API helpers in page-aware setup, with a JSDoc explaining *why* the flow exists (slow UI? CDP hang? shared seed?). Source: [flows/checkout.ts:14-29](../e2e/support/flows/checkout.ts#L14-L29).

---

## 7. Tensions with the new ADRs

Where Nathan's defaults and the new ADRs diverge. **The ADR wins** in all cases; Nathan's pattern is recorded so the migration is graceful.

### T1 — E2E was the dominant test layer; now it's the smallest

- **Nathan:** the suite is the primary coverage mechanism; ~22 critical journeys + dozens of finer tests. Slice-not-journey, but still e2e-first within the slice budget.
- **[ADR 021](../../../docs/adr/021-testing-pyramid-and-agentic-workflow.md):** Testing **Trophy**, integration-dominant. Unit (XState, composables, utilities) + integration (API contracts, recorded fixtures) carry the bulk; e2e is intentionally smallest, ~10-20 critical journeys.
- **Resolution:** ADR wins. Old e2e tests stay until the audit gives each a verdict: `delete` / `move-down-to-{unit,integration}` / `keep-at-e2e`. New e2e coverage is gated on "must be e2e — not unit or integration in disguise" (per the [`/code-test-e2e`](../../../.agent/workflows/code-test-e2e.md) skill and [11-authoring-tests.md:38-45](./11-authoring-tests.md#L38-L45)).

### T2 — Shadow implementations were Nathan's speed hack; they're now named debt

- **Nathan's code:** `seedInvalidProduct`, hand-rolled `createOrder` with hardcoded `currency_id`, [flows/checkout.ts](../e2e/support/flows/checkout.ts) calling API directly — all faster than UI navigation, fine when one tester held the rope.
- **[ADR 021](../../../docs/adr/021-testing-pyramid-and-agentic-workflow.md):** these are **shadow implementations** when they bypass `headless` and replicate business logic. *Module-driven* setup (driving `useBasket` programmatically, calling `useOrders.create()`) is legitimate; hand-rolled HTTP with hardcoded shapes is not. FE-1365's 97 failures were the receipt.
- **Resolution:** ADR wins. The retirement rule is mechanical: a shortcut helper is retired the moment the layer beneath covers what it was masking. New setup helpers should drive real `headless`/`client-vue` modules — *not* hand-rolled HTTP — unless the audit explicitly accepts the cost.

### T3 — Planning was implicit in the spec; now it's a separate `.feature` artefact

- **Nathan:** the `.spec.ts` was the artefact. Linear AC → test code in one step. He floated Gherkin in the handover huddle as a likely improvement ([08-qa-handover.md:30-32](./08-qa-handover.md#L30-L32)).
- **[ADR 020](../../../docs/adr/020-gherkin-test-planning.md):** Adopt Gherkin as a planning/spec format. `.feature` files spec-only, declarative-style enforced, `playwright-bdd` reserved as the explicit promotion path after ~10 stories.
- **Resolution:** ADR wins. New tests get a paired `.feature` under `tests/Playwright/features/<flow>/` *before* the `.spec.ts` is written ([11-authoring-tests.md](./11-authoring-tests.md) flow). Existing `.spec.ts` files are not migrated. Per [10-feature-style.md:17](./10-feature-style.md#L17) the declarative-style guard is the single biggest failure mode — agents authoring `.feature` files must read [10-feature-style.md](./10-feature-style.md) first or risk imperative drift.

### T4 — Component-level UI coverage drifted into Playwright; it shouldn't

- **Nathan:** the existing suite has component-scale tests (e.g. password-field variant in [login.spec.ts:43-58](../e2e/e2e-tests/login-registration/login.spec.ts#L43-L58)) sitting in the e2e layer because that was the only layer with infra.
- **[ADR 022](../../../docs/adr/022-ui-testing-strategy.md) (Proposed):** stories are the canonical UI test artefact. `play()` does interaction tests; axe does a11y. Per-package Storybook.
- **Resolution:** ADR wins (when promoted from Proposed → Accepted). Until then, component-level checks in Playwright are tolerated but should not multiply. New component-coverage requests route to the Storybook + addon-vitest stack from `code-test-component` (planned skill).

### T5 — Visual regression in Playwright was Nathan's choice; the future is open

- **Nathan:** [tests/Playwright/visual-regression/](../e2e/visual-regression/) — Playwright screenshots across 28 locales ([00-index.md:7-8](./00-index.md#L7-L8)).
- **[ADR 022](../../../docs/adr/022-ui-testing-strategy.md):** visual regression tool is **explicitly open** (Chromatic / Percy / keep Playwright). Recommendation: decide later, don't add new Playwright visual tests unless they cover a regression risk that stories + component tests + a11y will not catch.
- **Resolution:** ADR wins (interim posture). Keep the existing visual suite running. New visual coverage waits on the package-split + tool decision.

### T6 — Cucumber/Gherkin runner was on the table; it's been explicitly deferred

- **Nathan:** authored [09-cucumber-evaluation.md](./09-cucumber-evaluation.md) as a research artefact. Marked it short-lived, deletable once the workflow stabilises.
- **[ADR 020](../../../docs/adr/020-gherkin-test-planning.md):** **Do not adopt the Cucumber runner**. `playwright-bdd` is the predetermined promotion path *if* the planning-layer adoption earns it (gate at ~10 stories).
- **Resolution:** ADR wins. Don't add `@cucumber/cucumber`. The `.feature` files stay non-executable until the gate. [09-cucumber-evaluation.md](./09-cucumber-evaluation.md) is safe to delete once [11-authoring-tests.md](./11-authoring-tests.md) has lived for one release cycle.

---

## 8. The "pseudo-Nathan" voice

Stylistic markers so future authors (or agents) can write *like* Nathan.

- **Numbered docs with playful headers and emojis.** `# 🎭 Playwright Testing Guide`, `# ✍️ 4. Writing a New Test`, `# 🥒 10. Writing .feature Files`. Tone is direct, principle-led, sparing on filler.
- **"Cardinal rules" framing.** Big decisions list ordinally with one-line rationale; the rationale is always *why this prevents a real failure mode*. See [08-qa-handover.md:13-19](./08-qa-handover.md#L13-L19).
- **Quotables block at the end** of [08-qa-handover.md](./08-qa-handover.md). Verbatim Nathan in the first person. Future docs that capture team principles can use the same closing pattern.
- **Inline file/line citations in docs.** `[2fa.spec.ts:14](../e2e/e2e-tests/login-registration/2fa.spec.ts#L14)`. Every load-bearing claim points at a specific line.
- **Tables for matrices, prose for rationale.** Fixture choice ([04-writing-tests.md:88-93](./04-writing-tests.md#L88-L93)), serial-vs-parallel rule, tag taxonomy ([10-feature-style.md:108-118](./10-feature-style.md#L108-L118)). Never a wall of bullets when a 3-column table will do.
- **JSDoc on flow helpers is *narrative*, not API ref.** It explains *why the helper exists in the first place* — [flows/checkout.ts:14-29](../e2e/support/flows/checkout.ts#L14-L29) calls out the CDP hang on registration UI as the reason API-driven registration exists.
- **Comments in spec files are rare but load-bearing.** When present (e.g. [login.spec.ts:9-12](../e2e/e2e-tests/login-registration/login.spec.ts#L9-L12), [error-handling.spec.ts:7-17](../e2e/e2e-tests/errors/error-handling.spec.ts#L7-L17)) they explain test-isolation reasons or run-order constraints. Nathan didn't comment what the code does; he commented why the test exists in *that shape*.
- **"Things that look like gaps but aren't"** sections. End-of-doc disclaimer about negative space — [02-project-structure.md:113-116](./02-project-structure.md#L113-L116). Heads off the "why isn't there a Y here" question.
- **Commit subjects are short and tagged.** `qa: <short>` (lowercase, light) or `QA: <Title-cased description> (FE-XXXX)` (substantive, ticketed). Merge commits via `qa/<topic>` branches. Future commits to the suite should match.
- **Mermaid is not Nathan's idiom in the test docs.** He used tables and short prose. Don't add mermaid into test docs unless the architecture clearly demands it (post-Nathan ADRs do use mermaid — different surface).

---

## 9. What this doc does NOT capture

- **Live-debug intuition.** The "where to look in the trace viewer" muscle memory. Nathan had it; the docs gesture at it ([03-running-tests.md](./03-running-tests.md)) but it's experiential.
- **Why specific staging accounts exist.** `Logins.checkoutUser`, `Logins.twoFactor`, `Logins.priceListUser` — the docs explain the serial-mode rule ([04-writing-tests.md:191-203](./04-writing-tests.md#L191-L203)) but not the historical reason each shared account was provisioned. Risk: someone deletes one without realising what depends on it.
- **The 28-locale matrix story.** Visual regression covers 28 locales ([00-index.md:7-8](./00-index.md#L7-L8)). The reason it's 28 and not another number is not in any doc I read.
- **The non-Stripe gateway thinness in detail.** Nathan flagged it as a known gap ([08-qa-handover.md:46](./08-qa-handover.md#L46)) but the *what fails today* picture per-gateway isn't here. The wishlist says the off-site spoof pattern *might* be where AI-assisted testing finally pays off — that's a hypothesis, not a recipe.
- **CDP-hang specifics.** [flows/checkout.ts:14-29](../e2e/support/flows/checkout.ts#L14-L29) mentions "occasional CDP hangs on the registration UI" — the reproduction trigger and the root cause aren't documented; only the workaround is.
- **The judgment behind "this is a unit test in disguise."** ~30% of the suite is unit-test-shaped ([08-qa-handover.md:18](./08-qa-handover.md#L18)) but which 30% is the work of the audit (ADR 021). Nathan would have done it by hand; the audit's verdict column is the codified replacement.
- **The Allure dashboard's read habits.** [08-allure-dashboard.md](./08-allure-dashboard.md) documents the dashboard; how Nathan used it day-to-day (which views first, what triggered investigation) isn't captured.
- **`secrets/` content.** Gitignored — by design. New contributors will need to ask for the PayPal sandbox credentials etc. out-of-band.

---

## 10. References

**Docs (Nathan's voice):**

- [00-index.md](./00-index.md)
- [02-project-structure.md](./02-project-structure.md)
- [04-writing-tests.md](./04-writing-tests.md)
- [08-qa-handover.md](./08-qa-handover.md)
- [09-cucumber-evaluation.md](./09-cucumber-evaluation.md)

**Docs (post-Nathan, implementing the ADRs but built on his framing):**

- [10-feature-style.md](./10-feature-style.md)
- [11-authoring-tests.md](./11-authoring-tests.md)

**Representative code:**

- [stripe-card.spec.ts](../e2e/e2e-tests/checkout/payment-gateways/stripe-card.spec.ts)
- [basket-display.spec.ts](../e2e/e2e-tests/basket/basket-display.spec.ts)
- [error-handling.spec.ts](../e2e/e2e-tests/errors/error-handling.spec.ts)
- [login.spec.ts](../e2e/e2e-tests/login-registration/login.spec.ts)
- [auth-context.ts](../e2e/support/fixtures/auth-context.ts)
- [flows/checkout.ts](../e2e/support/flows/checkout.ts)
- [page-objects/templates/checkout.ts](../e2e/support/page-objects/templates/checkout.ts)
- [mocks/checkout.ts](../e2e/support/mocks/checkout.ts)
- [api/basket.ts](../e2e/support/api/basket.ts)
- [constants/products.ts](../e2e/support/constants/products.ts)

**ADRs (the new strategic direction — these win over Nathan's defaults where they conflict):**

- [ADR 020 — Gherkin Test Planning](../../../docs/adr/020-gherkin-test-planning.md)
- [ADR 021 — Testing Pyramid and Agentic Workflow](../../../docs/adr/021-testing-pyramid-and-agentic-workflow.md)
- [ADR 022 — UI Testing Strategy](../../../docs/adr/022-ui-testing-strategy.md)

**Git history:** `git log --author="Nathan Robinson"` for branch names, commit cadence, ticket scope.

---

> **Source provenance:** This document was promoted from `~/.claude-upmind/projects/-Users-domdacosta-Dev-Upmind-monorepo/drafts/pseudo-nathan.md` into the repo as the canonical reference for the pseudo-Nathan subagent ([.agent/agents/pseudo-nathan.md](../../../.agent/agents/pseudo-nathan.md)) and the path-scoped rule ([.agent/rules/code-tests-e2e.md](../../../.agent/rules/code-tests-e2e.md)). Both cite this doc by section.
