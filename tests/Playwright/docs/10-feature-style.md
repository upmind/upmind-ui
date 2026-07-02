# 🥒 10. Writing `.feature` Files — Style Guide

> The rules that make a `.feature` file worth having. If any product-team
> reviewer can't read it without a developer translating, it has failed its job.
>
> Context: per [08-qa-handover.md](./08-qa-handover.md), Gherkin is our planning
> layer between Linear AC and the Playwright test. `.feature` files describe
> *what* happens; generated `.spec.ts` files do the work. The `.feature` is the
> spec the product team reviews. If we get the style right, everyone can
> sanity-check test intent at glance. Get it wrong and we've built a slower way
> to write Playwright code.

---

## The one rule

**A `.feature` file describes behaviour in domain language. It never describes mechanics.**

Domain language is what a customer or product manager would say. Mechanics are what a developer would write. The moment a `.feature` file mentions a selector, a button label, a URL, or a UI input, it has stopped being a spec and started being a script wearing English clothing.

> **👀 Reviewer rule of thumb:** if reading the scenario tells you *what the user is trying to achieve*, it's good. If it tells you *what buttons they press in what order*, rewrite it.

---

## Declarative vs imperative — the canonical bad/good pair

Same scenario, two ways to write it. The first is the trap; the second is the goal.

### ❌ Imperative (do NOT write like this)

```gherkin
Scenario: Apply a promo code
  Given I open the storefront at "/"
  And I click the "Cookie Accept" button
  And I click the "Starter Hosting" card
  And I click the "Add to basket" button
  And I navigate to "/basket"
  And I type "WELCOME10" into the input with id "promo-input"
  And I click the button with data-test-key "apply-promo"
  Then the element with data-test-key "basket-total" contains "9.00"
```

Problems:

- A non-developer can't tell what the customer was trying to do.
- Any UI redesign breaks the spec, not just the test.
- The `.feature` file duplicates the Playwright test instead of explaining it.
- Reusable across scenarios? Almost zero — every step is hyper-specific to this UI.

### ✅ Declarative (write like this)

```gherkin
Scenario: Valid percentage-off code reduces the basket total
  Given my basket contains 1 "Starter Hosting"
  When I apply the promo code "WELCOME10"
  Then the basket total is 9.00 GBP
  And the promo "WELCOME10" is shown as applied
```

Why this works:

- Sarah/Chris/anyone in product can read it without a developer.
- The UI can be redesigned without rewriting the spec — only the step definition (the code behind `When I apply the promo code`) changes.
- The steps are reusable across many scenarios.
- It says **what** the user wants and **what** they observe — never **how**.

---

## Step writing rules

| Rule | What it means |
|---|---|
| **Use domain verbs.** | `I apply the promo code`, `I add a payment method`. Not `I click...`, `I type...`. |
| **No selectors. Ever.** | `data-test-key`, CSS classes, element IDs — none of these belong in a `.feature` file. They live in step definitions. |
| **No URLs, no paths.** | `Given I am on the basket page` instead of `Given I navigate to "/basket"`. |
| **Outcomes are observable, not technical.** | `Then the basket total is 9.00 GBP`, not `Then the element with data-test-key "total" contains "9.00"`. |
| **One `When` per scenario.** | The `When` is the trigger under test. If you have two, you have two scenarios. |
| **`And` continues the previous keyword.** | Cucumber/Gherkin treats `And` as identical to whatever came before — use it for readability, not for meaning. |
| **Avoid conjunction steps.** | Don't write `Given I have a basket and apply a promo`. Two separate `Given`s. Otherwise reuse dies. |
| **Parameterise values, not behaviours.** | `When I apply the promo code "WELCOME10"` — the *value* is the parameter. Don't parameterise verbs (`When I {action} the promo code`). |

---

## File and folder conventions

```
tests/Playwright/
├── e2e/
│   └── e2e-tests/         ← existing Playwright .spec.ts files (unchanged)
└── features/              ← new — .feature files only
    ├── basket/
    │   ├── apply-promo-code.feature
    │   └── update-quantity.feature
    ├── checkout/
    │   └── stripe-card-payment.feature
    └── login-registration/
        └── new-user-registration.feature
```

Rules:

- **Mirror the per-flow grouping** in `e2e/e2e-tests/`. Same folder names: `basket`, `checkout`, `login-registration`, etc. Per-flow, not per-component.
- **One `Feature:` per file.** File name in kebab-case matching the feature: `apply-promo-code.feature`.
- **No migrations.** Existing `.spec.ts` files stay as they are. `.feature` files are for new coverage only.

---

## Tags

Use tags for filtering test runs and signalling intent.

| Tag | Meaning |
|---|---|
| `@smoke` | Must pass on every CI run. The "if this is broken, ship is broken" set. |
| `@slow` | Takes longer than the suite average. Run nightly or on demand. |
| `@wip` | Work in progress. Excluded from default runs. Don't leave it in for more than a day. |
| `@manual` | Recorded as a scenario but executed by a human, not the runner. Use sparingly. |
| `@flow:<name>` | Optional domain tag for cross-cutting concerns (e.g. `@flow:auth`). |

Place tags on the line above the `Feature:` (applies to whole file) or above an individual `Scenario:` (applies to that scenario only).

---

## From Linear AC to `.feature` file

The killer pairing: if your Linear story already ships AC in Given/When/Then shape, the `.feature` file is a near copy-paste.

### Example — Linear story AC

```
**Story:** Customer can redeem a promo code at the basket stage.

**AC1:** Given a basket with one Starter Hosting product,
  when I apply the promo code "WELCOME10",
  then the basket total should reflect the 10% discount.

**AC2:** Given a basket with one Starter Hosting product,
  when I apply an expired code,
  then I see a "This code has expired" message
  and the basket total is unchanged.
```

### → `apply-promo-code.feature`

```gherkin
@basket @promo @smoke
Feature: Apply a promo code to the basket
  As a customer building a basket
  I want to redeem a promo code
  So that I pay the discounted price at checkout

  Background:
    Given the catalogue has a "Starter Hosting" product priced at 10.00 GBP

  Scenario: Valid percentage-off code reduces the basket total
    Given my basket contains 1 "Starter Hosting"
    When I apply the promo code "WELCOME10"
    Then the basket total is 9.00 GBP
    And the promo "WELCOME10" is shown as applied

  Scenario: Expired code is rejected with a clear message
    Given my basket contains 1 "Starter Hosting"
    When I apply the promo code "EXPIRED2025"
    Then I see the error "This code has expired"
    And the basket total remains 10.00 GBP
```

The mapping is mechanical: each AC becomes one `Scenario`. Shared `Given`s lift into `Background`. Values become quoted parameters.

> **🧪 For Product/QA reviewers:** if reading the `.feature` file doesn't match the story you wrote, that's the signal to push back — either the AC was ambiguous or the test plan misread it.

---

## What this is not for

| Don't use a `.feature` file for... | Use instead |
|---|---|
| Component-level UI state ("button is disabled when X") | Component / unit tests |
| Pure logic verification (calculations, validators) | Unit tests |
| Visual regression | The existing snapshot suite in `tests/Playwright/visual-regression/` |
| Full end-to-end buying journeys | Keep one or two sanity tests as plain `.spec.ts`. Don't multiply. |

See the cardinal rules in [08-qa-handover.md](./08-qa-handover.md) — `.feature` files inherit all of them, especially "tests are only invaluable if people run them" and "slice, not journey".

---

## PR review checklist

Before approving a PR that touches a `.feature` file:

- [ ] Could a non-engineer in the product team read this scenario and tell me what it tests?
- [ ] Are there any selectors, URLs, element IDs, or UI mechanics? (There shouldn't be.)
- [ ] Does each scenario have exactly one `When`?
- [ ] Are step phrasings consistent with existing step definitions, or did the author invent a new variant of a step that already exists?
- [ ] If this scenario fails, is the failure message going to point at the right place?

The reviewer is doing the load-bearing work here. The style guide stops imperative drift only if PRs are reviewed against it.

---

## Promotion path — when we go executable

We are intentionally starting with `.feature` files as **spec only**. They sit next to a generated Playwright `.spec.ts`. After ~10 stories run through this flow, we'll evaluate:

- Are product-team reviewers actually reading the `.feature` files in PRs?
- Are the `.feature` files staying declarative, or drifting imperative?
- Is the spec→test mapping holding (no surprise behaviours hiding in the `.spec.ts`)?

If yes to all three: install [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) and let the `.feature` files become the executable tests. Step definitions take over from generated `.spec.ts`.

If no: tighten the convention, retry, or revert to AC-only planning. Either way, no harm done — we never invested in a runner that wasn't earning its keep.

---

## Further reading

- [Cucumber docs — Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/) — declarative style, first principles.
- [Cucumber docs — Anti-patterns](https://cucumber.io/docs/guides/anti-patterns/) — the named smells (feature-coupled, conjunction, imperative).
- [It's a Delivery Thing — Declarative vs Imperative Gherkin](https://itsadeliverything.com/declarative-vs-imperative-gherkin-scenarios-for-cucumber) — the clearest treatment of the central pitfall.
- [09-cucumber-evaluation.md](./09-cucumber-evaluation.md) — the decision behind this doc (short-lived).
