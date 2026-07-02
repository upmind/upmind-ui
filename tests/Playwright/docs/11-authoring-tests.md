# ✍️ 11. Authoring Tests for a Story

> **⏱️ Time:** ~30–60 min once you know the flow. ~90 min the first time.
> **🎚️ Difficulty:** Medium. Assumes you've shipped at least one PR in this repo.
> **📦 You'll touch:** `tests/Playwright/features/`, `tests/Playwright/e2e/e2e-tests/`, the relevant feature area in `apps/cart/` or `apps/portal/`.

This guide walks you end-to-end from a Linear story to a green Playwright test, using the Gherkin planning layer adopted in [ADR 020](../../docs/adr/020-gherkin-test-planning.md). If you've written tests in this repo before, this is the *new* shape — the `.feature` file is the spec, the `.spec.ts` is the executable.

---

## What you'll build

For each story you ship, you'll produce two co-located artefacts:

```
tests/Playwright/
├── features/<flow>/<feature>.feature       ← the spec (product team reviews this)
└── e2e/e2e-tests/<flow>/<feature>.spec.ts  ← the test (CI runs this)
```

The `.feature` file describes *what* happens in domain language. The `.spec.ts` file is the Playwright code that proves it. Both ship in the same PR; both get reviewed.

---

## Prerequisites

- Monorepo set up per [01-getting-started.md](./01-getting-started.md) (`pnpm install`, `pnpm exec playwright install`).
- Branch off `develop`: `git checkout -b feature/FE-XXXX`.
- A Linear story in **Ready for Build** with acceptance criteria. If AC are missing or vague, **stop and push back** — the `.feature` file can't be better than the AC it derives from.
- You've read the cardinal rules in [08-qa-handover.md](./08-qa-handover.md) and the declarative-style rules in [10-feature-style.md](./10-feature-style.md). Both are short. Don't skip them.

---

## Step 1 — Decide whether Playwright is the right layer

Before you write a line of Gherkin, ask: **is this even a Playwright test?**

> **💻 For Developers:** consult [08-qa-handover.md § The cardinal rules](./08-qa-handover.md#the-cardinal-rules). The 60-second version:
>
> - "Click a button, assert checked"? → Component / unit test, not Playwright.
> - "Calculate a total, validate input, transform data"? → Unit test.
> - "Full buying journey, end to end"? → Only if you genuinely need a new sanity test (we already have one or two).
> - "A user-observable slice of behaviour that hits real staging and proves the wiring works"? → Playwright. Continue below.

If the answer isn't *clearly* Playwright, pause and discuss in the PR-prep stage rather than writing the wrong kind of test.

---

## Step 2 — Map AC to a `.feature` file

Take the Linear AC and convert each to a `Scenario`. Shared `Given`s lift into `Background`.

### Start from AC like this

```
**AC1:** Given a basket with one Starter Hosting product,
  when I apply the promo code "WELCOME10",
  then the basket total should reflect the 10% discount.

**AC2:** Given a basket with one Starter Hosting product,
  when I apply an expired code,
  then I see a "This code has expired" message
  and the basket total is unchanged.
```

### Write `tests/Playwright/features/basket/apply-promo-code.feature`

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

**Rules to internalise** (full list in [10-feature-style.md](./10-feature-style.md)):

- Domain verbs only. No `click`, `type`, `navigate to`, `data-test-key`, URLs.
- One `When` per scenario.
- File path mirrors `tests/Playwright/e2e/e2e-tests/<flow>/` — same folder name (`basket`, `checkout`, `login-registration`, etc.).

---

## Step 3 — Get the `.feature` reviewed *before* writing test code

This is the load-bearing step. The whole point of `.feature` files is that a non-engineer can sanity-check the test intent. If you skip review here, the spec→test mapping is unverified.

> **👀 For Product/QA reviewers:** if the `.feature` file doesn't match the story you wrote, push back. The test plan should be a faithful read of the AC, not an interpretation.

Push the `.feature` file as a draft PR with the story link in the description. Ask the product owner and at least one engineer to skim. Typical turnaround: same day.

**Common rewrites at this stage:**

- "This scenario is what AC1 actually means" — restructure.
- "The expected error wording is different" — fix the `Then` string.
- "We also need to cover the case where the basket has zero items" — add a scenario.

Cheaper to discover all of this now than after you've written 200 lines of Playwright.

---

## Step 4 — Write the Playwright `.spec.ts`

Once the `.feature` is approved in principle, write the executable test against it.

Follow [04-writing-tests.md](./04-writing-tests.md) for fixture choice, file location conventions, and selector patterns. The `.spec.ts` file goes at the matching path:

```
tests/Playwright/e2e/e2e-tests/basket/apply-promo-code.spec.ts
```

### Pattern: one Playwright `test()` block per `Scenario`

The `.feature` file is your TODO list. Map each `Scenario` to one `test()` call. Keep the test names *identical* to the scenario names so the mapping is obvious in CI output.

```ts
// tests/Playwright/e2e/e2e-tests/basket/apply-promo-code.spec.ts
import { newUser, expect } from "../../../support/fixtures/auth-context";
import { addToBasket, applyPromo, getBasketTotal } from "../../support/helpers/basket";

newUser.describe("Apply a promo code to the basket", () => {
  newUser("Valid percentage-off code reduces the basket total", async ({ page, token }) => {
    // Given: catalogue + basket setup
    await addToBasket(page, token, "Starter Hosting", 1);

    // When
    await applyPromo(page, "WELCOME10");

    // Then
    await expect(getBasketTotal(page)).resolves.toBe(9.00);
    await expect(page.getByTestId("promo-WELCOME10")).toBeVisible();
  });

  newUser("Expired code is rejected with a clear message", async ({ page, token }) => {
    await addToBasket(page, token, "Starter Hosting", 1);
    await applyPromo(page, "EXPIRED2025");
    await expect(page.getByTestId("promo-error")).toHaveText("This code has expired");
    await expect(getBasketTotal(page)).resolves.toBe(10.00);
  });
});
```

A few things to internalise:

- **The `.feature` describes intent; the `.spec.ts` does the work.** Selectors and mechanics live here, never in the `.feature`.
- **Reuse helpers aggressively.** `addToBasket`, `applyPromo`, etc. — extract into `tests/Playwright/support/helpers/<flow>/` so the next `Scenario` covering the same step is one line.
- **Mock settings, not data.** Per [08-qa-handover.md § Mocking philosophy](./08-qa-handover.md#mocking-philosophy). Brand-meta settings: yes. Journey data: no — use the API.
- **Keep it fast.** The cardinal rule: tests must be runnable in <30 min total. A scenario that takes 90s is a code smell; investigate.

---

## Step 5 — Capture fixtures if you need them

If your test needs real-world response shapes (e.g. for `fixtures`-driven unit tests downstream), record them:

```bash
pnpm dev:record
```

Drive through the relevant flow once; fixtures land under `tests/fixtures/`. See `code-tests` rules — never hardcode fake data; either use a real fixture or throw.

---

## Step 6 — Run and iterate

```bash
# Run only the new test
pnpm test:chrome -- tests/Playwright/e2e/e2e-tests/basket/apply-promo-code.spec.ts

# Interactive UI mode (best for debugging)
pnpm test:ui

# Full suite, all browsers (before PR)
pnpm test:all-browsers
```

If a scenario goes red, debug it like any Playwright test — see [03-running-tests.md](./03-running-tests.md) for trace viewer, screenshots, and the HTML report.

When you hit a flake, **fix the root cause**. Retries are 0 by default. A flaky test that retries to green is worse than a red one because nobody trusts it any more.

---

## Step 7 — Open the PR

Both files ship in the same PR. Keep them together:

- `tests/Playwright/features/basket/apply-promo-code.feature`
- `tests/Playwright/e2e/e2e-tests/basket/apply-promo-code.spec.ts`

**PR description should:**

- Link the Linear story.
- Note any product/QA reviewer who signed off on the `.feature` file.
- Flag any `Scenario` you couldn't automate and is going to be a manual QA item instead.

The reviewer guide ([12-reviewing-tests.md](./12-reviewing-tests.md)) describes what a PR reviewer is looking for.

---

## Complete example — start to finish

For reference, here's the full flow as a single sequence. Use this as a checklist on your first few stories.

1. **Linear story:** FE-1234 — "Customer can redeem a promo code at basket."
2. **Branch:** `git checkout -b feature/FE-1234`.
3. **Read the AC.** If unclear, fix it now.
4. **Decide test layer.** "Apply a code, basket total updates" → user-observable slice → Playwright. ✅
5. **Write `.feature` file.** `tests/Playwright/features/basket/apply-promo-code.feature`. Two scenarios.
6. **Push draft PR with `.feature` only.** Tag product owner. Get sign-off in chat or a PR comment.
7. **Write `.spec.ts`.** `tests/Playwright/e2e/e2e-tests/basket/apply-promo-code.spec.ts`. One `test()` per `Scenario`.
8. **Extract helpers** for `addToBasket`, `applyPromo` if they don't exist yet.
9. **Run locally.** `pnpm test:chrome -- ...basket/apply-promo-code.spec.ts`. Iterate to green.
10. **Run full suite.** `pnpm test:all-browsers`. Make sure you didn't break anyone else.
11. **Update PR.** Both files now present. Move out of draft. Link Linear story. Note reviewer.
12. **Merge** once both an engineer and a product reviewer have approved.

---

## Variations

### Amending an existing test instead of creating a new one

If the story touches a flow that already has a `.spec.ts` (e.g. expanding promo-code coverage), check whether an existing `.feature` already exists for it. If yes: add a `Scenario` to the existing file. If no: create a new `.feature` co-located with the existing `.spec.ts`. Don't duplicate.

### Story has no acceptance criteria

Stop. Don't write a test against assumptions. Push back to the story author with the question: "What does done look like?" The `.feature` file is the lowest-cost place to discover ambiguity — but only if AC exist.

### The behaviour is fundamentally a unit test

Don't force it into Playwright. Write the unit test under `packages/headless/src/modules/<module>/__tests__/` per [ADR 013](../../docs/adr/013-testing-strategy.md). Roughly 30% of the existing Playwright suite could be unit tests instead (see [08-qa-handover.md](./08-qa-handover.md)) — don't add to that backlog.

### Off-site payment gateway

Don't drive the third-party page. Spoof the callback positive/negative — the backend only cares about 2–3 params on return. See [08-qa-handover.md § Restart-from-scratch wishlist](./08-qa-handover.md#restart-from-scratch-wishlist).

---

## Next steps

- After your first story: review with someone who's done one before. The flow is short; the calibration is what takes practice.
- After ~10 stories team-wide: we re-evaluate the Gherkin adoption against the escalation gate in [ADR 020](../../docs/adr/020-gherkin-test-planning.md). If we promote to Option A (`playwright-bdd`), step 4 of this guide will change — `.feature` files will become executable directly.

---

## See also

- [04-writing-tests.md](./04-writing-tests.md) — the existing how-to (fixtures, file conventions, selectors). Still authoritative for `.spec.ts` mechanics.
- [08-qa-handover.md](./08-qa-handover.md) — principles (the *why*).
- [10-feature-style.md](./10-feature-style.md) — the declarative-style rulebook for `.feature` files.
- [12-reviewing-tests.md](./12-reviewing-tests.md) — what your PR reviewer is checking.
- [ADR 020: Gherkin Test Planning](../../docs/adr/020-gherkin-test-planning.md) — the decision behind this workflow.
- [ADR 013: Testing Strategy](../../docs/adr/013-testing-strategy.md) — the layered strategy this extends.
