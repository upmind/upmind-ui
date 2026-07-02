# Cucumber + Gherkin: should Upmind adopt it?

_Researched 2026-05-22 for Dom. Audience: code-literate product/engineering lead, not a tester._

## TL;DR

- **Gherkin** is a plain-text spec language: `Feature / Scenario / Given / When / Then`. It is just text in `.feature` files.
- **Cucumber** is the runner that executes those `.feature` files by matching each line to a "step definition" — a function written in JS/TS (or another language) that actually does the work.
- The two are separable: you can use Gherkin as a planning/spec format without ever running Cucumber. Many teams should.
- **One-line pitch:** human-readable test specs that double as living documentation, reviewable by non-coders.
- **One-line critique:** the readability promise only holds if step definitions are written _declaratively_ — and most teams fail at this, ending up with `.feature` files that are unreadable UI scripts wearing English clothing. Aslak Hellesøy (Cucumber's creator) has publicly lamented that "most organisations use Cucumber for 'BDD testing', whatever that means" — which is exactly the trap.

**Bottom line for Dom:** adopt Gherkin as the planning layer between Linear AC and generated Playwright code. Probably skip the Cucumber runner — use `playwright-bdd` if you do want runtime execution. Details below.

---

## 1. Read your first feature file

Here is a realistic Upmind feature, written declaratively (i.e. the way it should be written):

```gherkin
# features/basket/apply-promo-code.feature
@basket @promo @smoke
Feature: Apply a promo code to the basket
  As a customer building a basket
  I want to redeem a promo code
  So that I pay the discounted price at checkout

  Background:
    Given I am a guest shopper on the storefront
    And the catalogue has a "Starter Hosting" product priced at 10.00 GBP

  Scenario: Valid percentage-off code reduces the basket total
    Given my basket contains 1 "Starter Hosting"
    When I apply the promo code "WELCOME10"
    Then the basket total is 9.00 GBP
    And the promo "WELCOME10" is shown as applied

  Scenario: Expired code is rejected with a clear message
    Given my basket contains 1 "Starter Hosting"
    When I apply the promo code "EXPIRED2025"
    Then the promo is rejected
    And I see the error "This code has expired"
    But the basket total remains 10.00 GBP

  Scenario Outline: Code eligibility depends on basket contents
    Given my basket contains <quantity> "Starter Hosting"
    When I apply the promo code "<code>"
    Then the promo is <result>

    Examples:
      | code        | quantity | result    |
      | WELCOME10   | 1        | accepted  |
      | BULK5OFF    | 1        | rejected  |
      | BULK5OFF    | 5        | accepted  |
      | DOMAINSONLY | 1        | rejected  |
```

### Every keyword, briefly

| Keyword | What it does |
|---|---|
| `Feature:` | Top-of-file header. One per file. Free-text description allowed underneath. |
| `Background:` | Steps run before _every_ `Scenario` in the file. Use for shared `Given`s only. |
| `Scenario:` | A single concrete example. Synonym: `Example:`. |
| `Given` | The starting state. No user action yet. |
| `When` | The trigger — the one thing under test. Ideally one `When` per scenario. |
| `Then` | An observable outcome. Assertions live here. |
| `And` / `But` | Continuation of the previous `Given`/`When`/`Then`. Pure readability sugar — Cucumber treats them identically to the keyword they continue. |
| `Scenario Outline:` + `Examples:` | Parameterised scenario. Each row in the Examples table runs the scenario once with `<placeholders>` substituted. |
| `@tag` | Label on a feature or scenario. Used to filter test runs (`@smoke`, `@wip`, `@slow`). |
| `"""` doc strings / `\|` data tables | Pass multi-line text or tabular data into a step. |
| `Rule:` | (Gherkin 6+) Group scenarios that illustrate one business rule. Optional. |

Note the discipline: this file says **what** happens, never **how**. No "click the basket icon", no "type into the promo input". That is the point — and that is the part teams routinely get wrong.

---

## 2. How it actually works under the hood

A `.feature` file is inert. Cucumber turns each step line into a function call by regex/expression matching against **step definitions** that you write in code.

```ts
// features/steps/basket.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am a guest shopper on the storefront', async function (this: CustomWorld) {
  await this.page.goto('/');
});

Given(
  'the catalogue has a {string} product priced at {float} GBP',
  async function (this: CustomWorld, name: string, price: number) {
    await this.api.seedProduct({ name, price, currency: 'GBP' });
  },
);

Given('my basket contains {int} {string}', async function (
  this: CustomWorld, qty: number, name: string,
) {
  await this.basket.add(name, qty);
});

When('I apply the promo code {string}', async function (
  this: CustomWorld, code: string,
) {
  await this.basket.applyPromo(code);
});

Then('the basket total is {float} GBP', async function (
  this: CustomWorld, expected: number,
) {
  await expect(this.basket.total()).resolves.toBe(expected);
});

Then('the promo {string} is shown as applied', async function (
  this: CustomWorld, code: string,
) {
  await expect(this.page.getByTestId(`promo-${code}`)).toBeVisible();
});
```

A few things to internalise:

- **The indirection is the whole game.** `When I apply the promo code "WELCOME10"` is matched by the `{string}` parameterised step above; `"WELCOME10"` is passed in as `code`. If you delete the step definition, the `.feature` file still parses but the scenario fails as "undefined".
- **`this` is the World** — a per-scenario container you create yourself, typically holding the Playwright `page`, an API client, and page-object-ish helpers (`this.basket`).
- **Hooks** (`Before`, `After`, `BeforeAll`, `AfterAll`) handle setup/teardown, e.g. spinning up a browser per scenario.
- **Steps are global by default.** Any step definition matches any `.feature` file. That is a feature (reuse) and a footgun (collisions, drift).

The principle: **`.feature` files describe behaviour in domain language; step definitions translate domain language into Playwright + API calls.** Get the split right and Dom can review the `.feature` file alone. Get it wrong and the `.feature` file is just a slower way to write a Playwright script.

---

## 3. Cucumber vs. Playwright — how they fit

They are not competitors. Cucumber is a **test runner + spec format**. Playwright is a **browser automation library** (with its own test runner, `@playwright/test`). You almost always want Playwright's automation API. The question is who runs the tests.

Two paths:

### Path A: `@cucumber/cucumber` + Playwright as a library

- Cucumber CLI is the runner.
- You construct/destroy a Playwright `browser` and `page` yourself in `Before`/`After` hooks.
- You lose Playwright's first-class test runner features: built-in parallelism, fixtures, auto-trace/video/screenshot on failure, `playwright show-report`, the VS Code Playwright extension, UI mode, `--ui` debugging.
- You get the full Cucumber ecosystem: tags, JSON/HTML reports, pickle filtering, official BDD pedigree.

### Path B: `playwright-bdd` (recommended for Upmind)

- A small library (currently v9 beta as of May 2026, ~700★, active) that **compiles `.feature` files into native Playwright Test files** at run time.
- You write Gherkin and step definitions exactly as in Cucumber.
- You run `npx playwright test`. Everything Playwright gives you — fixtures, parallel workers, trace viewer, UI mode, sharding, the VS Code extension — works unchanged.
- Caveats: extra build step (feature → test transpile), tooling is one person's project not a Cucumber.io product, and "step decorators / class-based steps" are nice but yet another mini-DSL.

For a Vue/TS monorepo already invested in Playwright, **Path B is the obvious choice** unless you have a strong reason to keep Cucumber's runner.

```ts
// playwright.config.ts (sketch)
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'features/steps/**/*.ts',
});

export default defineConfig({
  testDir,
  reporter: [['html'], ['list']],
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173' },
});
```

---

## 4. Does it solve Dom's job-to-be-done?

The job: Dom (code-literate, not a tester) and Sarah (BA) need to sanity-check test intent without reading test code. Tests need to slot into the `/qa-analyze → /qa-plan → /qa-test` agent flow as a human-readable layer between Linear AC and generated Playwright.

| Question | Honest answer |
|---|---|
| Can Dom review test _logic_ by reading `.feature` files only? | **Yes, conditionally.** Only if step definitions are _declarative_ (domain verbs like `apply the promo code`, not `click [data-test-key=promo-btn]`). This is a convention you must enforce. The promo example above is reviewable; an imperative version of the same scenario is not. |
| Can Sarah read them? | Same answer. The `.feature` syntax is genuinely English-readable. Whether the _content_ is readable depends entirely on how you write steps. |
| Does it slot into the AI test-gen flow? | **Strongly yes.** Gherkin is the ideal intermediate representation between AC and code. `/qa-plan` produces `.feature` files for Dom/Sarah to review; `/qa-test` generates or extends step definitions. Reviewing a 12-line scenario is far cheaper than reviewing a 200-line Playwright test. |
| Does it pair with BDD-style Linear stories? | **Yes — this is the killer combination.** If stories already ship `Given/When/Then` AC, the `.feature` file is a near copy-paste. The spec _is_ the test plan. |

Net: Gherkin pays for itself as a **planning + review artefact**. Whether you also run it as test code is a separate, smaller decision.

---

## 5. The honest case against

- **Indirection tax.** Two artefacts per behaviour (feature + steps). When a test fails, you read the `.feature`, then jump to the step definition, then to the page-object helper. Three hops vs. one Playwright file.
- **Imperative drift is the default failure mode.** Teams start declarative, then someone needs "just one quick UI click" and writes `When I click the "Add to basket" button`. Six months in, every scenario is a UI script and nobody can read them. This is _the_ well-known Cucumber smell ("imperative Gherkin").
- **Feature-coupled steps.** Steps named after a single feature instead of a domain concept → step library explodes, duplication everywhere. Cucumber's own anti-pattern docs lead with this one.
- **Conjunction steps.** `Given I have a basket and apply a promo` instead of two `Given`s — kills reuse.
- **The non-dev myth.** Cucumber is often sold as "now BAs can write tests". They almost never do. They might _read_ and _review_; that is the realistic ceiling.
- **Aslak Hellesøy himself** says Cucumber is widely "misused and misunderstood" — adopted as a testing tool when it was designed as a collaboration / specification tool. Read that sentence twice before adopting it as just a testing tool.
- **Tooling fragmentation.** `@cucumber/cucumber` has IDE support but loses Playwright runner niceties; `playwright-bdd` is great but is one maintainer's project.
- **Pickle parser quirks.** Regex/Cucumber-expression matching has sharp edges (greedy matches, ambiguous step warnings, parameter type plugins). Real but tractable.

---

## 6. What adopting it would actually cost Upmind

| Cost | Size | Notes |
|---|---|---|
| Tooling setup | Half a day | Add `playwright-bdd`, wire `playwright.config.ts`, one example feature green. |
| Convention doc + linter | 1–2 days | "Steps must be domain verbs. No selectors in `.feature` files. No conjunction steps. Tags: `@smoke @wip @slow @auth`." Enforce with a small ESLint-style rule or PR template checklist. |
| Step library bootstrapping | Ongoing, 1–2 weeks to a usable core | Basket, checkout, auth, admin portal domain steps. Front-loaded; pays back quickly. |
| Dom/Sarah training | One 30-min walkthrough each | They are readers, not authors. Show them the keyword cheatsheet + how to map AC → scenario. |
| `/qa-plan` / `/qa-test` rework | A few hours | `/qa-plan` outputs `.feature` files; `/qa-test` generates step definitions and Playwright helpers. The AI is good at this — Gherkin is a constrained grammar. |
| Migration of existing Playwright tests | **Do not migrate.** | Sunk cost. Use Gherkin for _new_ tests and net-new coverage only. Keep Nathan's existing `.spec.ts` files running unchanged. |
| Risk of imperative drift | Permanent vigilance | The single biggest cost. Mitigation: every `.feature` PR is reviewed against the declarative-style rule. Dom is the natural reviewer because if _he_ can't read it, it has failed its job. |

---

## 7. Recommendation matrix

| Option | When it makes sense | Cost | What Dom gets |
|---|---|---|---|
| **A. Adopt fully** (`playwright-bdd` runner + Gherkin specs + step library) | You believe `.feature` files will be the primary review surface for tests, and you can hold the declarative-style line in PRs. | Highest: tooling, conventions, step library, ongoing discipline. | Reviewable test intent, living docs, AI-friendly intermediate format, one canonical spec from AC → test. |
| **B. Gherkin as planning only — no runner** | You want the review/spec benefits but don't want a second runner or step-definition layer. `/qa-plan` produces `.feature` files; `/qa-test` reads them as input and emits regular Playwright tests. The `.feature` lives next to the test as documentation, not as executable. | Low: a writing convention plus prompt updates. No new dependency. | 80% of the upside (reviewability, BDD-shaped stories → test plans) at ~10% of the cost. The `.feature` file may drift from the test over time — mitigated by keeping it co-located and reviewed together. |
| **C. Don't adopt** | The team is comfortable reviewing Playwright tests directly, or AC quality is the real bottleneck (not test-review). | Zero. | Status quo. Continued reliance on Nathan-shaped expertise that is walking out the door. |

**My call for Upmind: start with B, escalate to A only if it earns it.** Specifically:

1. Update `/qa-plan` to emit `.feature` files (one per AC cluster) into `features/` next to the affected module.
2. Update `/qa-test` to take a `.feature` file as input and emit Playwright `.spec.ts` test code — without running Cucumber.
3. Adopt a declarative-style convention now while there is no inertia.
4. Re-evaluate after ~10 stories. If Dom and Sarah are actually using the `.feature` files for review and the spec→test mapping holds, install `playwright-bdd` and promote to option A.

This sequencing avoids the classic Cucumber failure (tooling-first, conventions-never) and keeps the escape hatch open.

---

## 8. Glossary

- **BDD (Behaviour-Driven Development)** — a collaboration practice: discover behaviour by example, formalise as scenarios, automate. Not a testing technique.
- **Gherkin** — the plain-text DSL used to write scenarios. Keywords: `Feature`, `Scenario`, `Given/When/Then`, etc.
- **Cucumber** — the runner that executes Gherkin via step definitions. Originated in Ruby; the JS port is `@cucumber/cucumber`.
- **Feature file** — a `.feature` file containing one `Feature:` and one or more `Scenario:`s.
- **Scenario** — one concrete example of behaviour. A list of steps.
- **Background** — `Given` steps that run before every scenario in the file.
- **Scenario Outline** — a templated scenario run once per row in its `Examples:` table.
- **Step definition** — a function in code that matches a step's text and runs the corresponding automation.
- **Tag** — `@label` on a feature or scenario, used for filtering (`--tags @smoke`).
- **Hook** — `Before` / `After` / `BeforeAll` / `AfterAll` functions for setup and teardown.
- **World** — per-scenario context object passed as `this` to step definitions. Holds the Playwright `page`, API client, helpers.

---

## 9. Further reading

- [Cucumber docs — Gherkin reference](https://cucumber.io/docs/gherkin/reference) — the canonical keyword list.
- [Cucumber docs — Anti-patterns](https://cucumber.io/docs/guides/anti-patterns/) — feature-coupled steps, conjunction steps, the classic smells.
- [Cucumber docs — Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/) — declarative style, first principles.
- [It's a Delivery Thing — Declarative vs Imperative Gherkin](https://itsadeliverything.com/declarative-vs-imperative-gherkin-scenarios-for-cucumber) — the clearest treatment of the central pitfall.
- [playwright-bdd on GitHub](https://github.com/vitalets/playwright-bdd) — the integration path you'd actually use.
- [Aslak Hellesøy on TDD and BDD (Semaphore)](https://semaphore.io/blog/aslak-hellesoy-cucumber) — the creator on how the tool is misused.
- [Cucumber Founder Aslak Hellesøy interview (InfoQ, 10 years of Cucumber)](https://www.infoq.com/news/2018/04/cucumber-bdd-ten-years/) — context on what Cucumber was meant to be vs. what teams made of it.
- [Concise Declarative Gherkin is the Answer (Contino)](https://medium.com/contino-engineering/declarative-gherkin-is-the-answer-c550adbc8ed0) — practical examples of bad vs. good scenarios.
- [@cucumber/cucumber Node.js](https://github.com/cucumber/cucumber-js) — the official JS runner, if you go path A.
