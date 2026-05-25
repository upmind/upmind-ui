# QA Handover — captured principles

> Distilled from a handover huddle with Nathan on 2026-05-21, before he left the
> team end of week. This is the *why* behind the test suite — the judgment calls,
> the mocking philosophy, the lines that don't show up in the code.
>
> Sibling docs: [04-writing-tests.md](./04-writing-tests.md) covers the *how*.
> [09-cucumber-evaluation.md](./09-cucumber-evaluation.md) covers the open Gherkin
> question.

---

## The cardinal rules

1. **Tests are only invaluable if people run them.** If a suite takes an hour, nobody runs it. Target: ideally <15 min, realistically ≤30 min. This is the constraint that disciplines every other decision below.
2. **Target a specific slice with a clear goal.** Don't replay the full buying journey to test a checkout step. Have a specific action in mind and build the most efficient setup that gets you there.
3. **A couple of full-journey tests for sanity only.** Not a suite. Sanity-check exceptions, not the norm.
4. **Don't write unit tests in Playwright.** If it's "click a button, assert checked," that belongs in component/unit tests. Roughly 30% of the current Playwright suite could be ported down the pyramid.
5. **Don't navigate outside your app.** Playwright's own advice. Spoofing off-site gateway journeys doesn't yield good results — Nathan tried and parked it. Non-Stripe gateway coverage is consciously thin as a result.

## Mocking philosophy

- **Mock settings, not data.** Canonical good case: brand meta settings. Mock the include/exclude VAT setting → flips the basket response → tiny, contained, robust.
- **Don't mock journey data.** You'll forget something mid-journey, the mock will go stale, the test will crumble in unintended ways. More annoying than it's worth.
- **Single-page actions are the sweet spot for mocks.** If you can mock one page and let everything else use real flow, do.
- **For test data: use the API to create staging data.** Not ideal (ideally a local env), but works well in practice. API-driven setup beats mock-the-world.

## AI-assisted generation flow

1. **Plan in plain English first** — Gherkin `.feature` files (`Given / When / Then`). A non-technical reviewer can sanity-check the *logic* before code exists. Pairs naturally with BDD-style Linear stories.
2. **AI-assisted retrofit** — agent runs Playwright against the new feature, records the journey + API calls, captures fixtures, then writes the test against the plain-English intent.
3. **TDD sandwich** — tests defined early (intent), fixtures captured live (recorder), assertions retrofitted (post-build).

### Gherkin adoption — decision locked (2026-05-22)

- **Adopt Gherkin as the planning/spec format**, sitting between Linear AC and generated Playwright tests.
- **`.feature` files are spec only, not executable** — generated `.spec.ts` Playwright files are still the tests that run. The `.feature` file lives next to the test as documentation reviewed by the **product team** (not just engineering) — meaning the readability bar is high and the declarative-style guard is non-negotiable.
- **Predetermined upgrade path:** `playwright-bdd` once the planning-only flow earns it. Re-evaluate after ~10 stories; if `.feature` files are actually getting reviewed, install `playwright-bdd` and let them become executable.
- **Don't migrate existing tests.** New tests only.
- **Convention guard:** declarative-style `.feature` files (domain verbs, no selectors, no UI clicks). The single biggest failure mode is imperative drift — see the style guide.

Reasoning in [09-cucumber-evaluation.md](./09-cucumber-evaluation.md) (short-lived doc, archive after the workflow stabilises).

## Restart-from-scratch wishlist

- **Keep:** short journeys — add billing address, add payment method, checkout with Stripe.
- **Improve:** non-Stripe gateway coverage. The off-site nav problem is real; might be where AI-assisted spoofing finally pays off.
- **Pattern for off-site gateways:** the backend only cares about the callback returning one of 2–3 params. So the test scope = spoof positive/negative callback and verify machine/UI recovery. Don't try to drive the third-party page.

## Portal (upcoming) approach

- Micro journeys: "add new thing → UI updates", "change setting → confirmation".
- Short bursts also help the AI stay coherent — Nathan: *"the longer you make it, the more complexity slips in and the AI starts to go wobbly."*
- Storybook resurrected for component-level visual coverage; Playwright reserved for the action/confirmation slices.

## Quotables

> "Tests are only invaluable if people run them. If it takes an hour, nobody's gonna run it."
>
> "Mocking a journey, you'll lose something. Eventually you'll hit a page where the mock's no longer valid and the test falls over. I just create something via the API instead."
>
> "We should have a specific action or slice of a user flow in mind. There should be a specific goal there. We shouldn't be doing the full buying journey every time."
>
> "The longer you make it, the more complexity slips in and the AI starts to go a bit wobbly."
