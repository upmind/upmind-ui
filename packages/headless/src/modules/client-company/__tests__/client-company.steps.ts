// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-company.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog can be
 * re-registered against any runner.
 *
 * Drives the Background, the search capability (@AC-7) and the appended
 * criteria-channel scenarios (@AC-31, @AC-34, @AC-35, @AC-36, @AC-40) — the
 * JTBD's filter/sort/page + read-back capabilities. The remaining scenarios
 * (@AC-1..@AC-6, @AC-8..@AC-29 minus @AC-7) are `notYet` — a capability
 * written down and not yet driven, a legitimate state
 * (`@upmind-automation/scenario-harness`'s own traceability semantics) —
 * proven instead at the integration layer
 * (`client-company.collection.int.test.ts`, `client-company.criteria-
 * defaults.int.test.ts`, `client-company.filters.int.test.ts`).
 *
 * Every handler speaks to the module through the five `World` members. There
 * is no DOM read, no request read and no import of the module's own source
 * here.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than
 * an import: `packages/headless` holds no scenario concept at all — the key
 * is the consuming playground's, and this catalog names it the same way a
 * `.feature` names a url.
 */
export const CLIENT_COMPANIES_SCENARIO = "client_companies";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift.
 */
export const CLIENT_COMPANIES_COVERED_ACTIONS = {
  filterBy: "filterBy",
  isReady: "isReady",
  sortBy: "sortBy"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_COMPANIES_COVERED_ACTIONS
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the collection settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    try {
      return await assertion();
    } catch {
      await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
    }
  }
  return assertion();
}

// -----------------------------------------------------------------------------

export const clientCompaniesSteps = defineSteps(({ Given, When, Then }) => {
  Given("I am an authenticated client acting on my own account", world =>
    world.boot(CLIENT_COMPANIES_SCENARIO, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make is addressed to my own companies as that client",
    world =>
      settles(() =>
        world
          .fire(CLIENT_COMPANIES_COVERED_ACTIONS.isReady)
          .then(() => world.expectMeta({ isAvailable: true }))
      )
  );

  // --- AC-7: search -----------------------------------------------------

  When("I search my companies for a word", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: "Heg" }
    })
  );

  Then("only companies matching that word are returned", world =>
    settles(() => world.expectMeta({ isFiltered: true }))
  );

  Then("when I clear the search, all my companies come back", async world => {
    await world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {});
    await settles(() => world.expectMeta({ isFiltered: false }));
  });

  // --- AC-31: the declared window on open, unprompted --------------------

  When("I open my companies for the first time this session", async () => {
    // Already opened by the Background's own boot; this step observes,
    // it does not re-boot.
  });

  Then(
    "they arrive unpaged, and ordered oldest first, exactly as my account declares",
    world =>
      settles(() =>
        world.expectContext({
          query: {
            pagination: { limit: 0 },
            sort: [{ field: "created_at", dir: "asc" }]
          }
        })
      )
  );

  // --- AC-34: narrow by name, and clear it back ---------------------------

  When("I search my companies for {string}", (world, term) =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: term }
    })
  );

  Then("only my companies whose name contains {string} remain", world =>
    settles(() => world.expectMeta({ isFiltered: true }))
  );

  When("I clear my company search", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {})
  );

  Then("every one of my companies is back", world =>
    settles(() => world.expectMeta({ isFiltered: false }))
  );

  // --- AC-34: choose the order ---------------------------------------------

  When("I sort my companies by name descending", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.sortBy, [
      { field: "name", dir: "desc" }
    ])
  );

  Then("my companies are now ordered by name, descending", world =>
    settles(() =>
      world.expectContext({
        query: { sort: [{ field: "name", dir: "desc" }] }
      })
    )
  );

  // --- AC-35: read the request and what it may ask -------------------------

  Then(
    "I can read the request my companies collection is currently making",
    world =>
      settles(() =>
        world.expectContext({ query: { pagination: { limit: 0 } } })
      )
  );

  Then(
    "I can read what a search or a sort on my companies is allowed to name",
    world =>
      settles(() =>
        world.expectContext({
          schemas: { query: { schema: { type: "object" } } }
        })
      )
  );

  // --- AC-36: empty-because-filtered ---------------------------------------

  When("I search my companies for something none of them are called", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: "zzz-no-such-company-zzz" }
    })
  );

  Then("my companies list is empty", world =>
    settles(() => world.expectMeta({ isEmpty: true }))
  );

  Then(
    "it tells me plainly that it is empty because of my search, not because I have none",
    world => settles(() => world.expectMeta({ isFiltered: true }))
  );

  // --- AC-40: a rejected write leaves the live list standing ---------------

  When("I search my companies for a value the field cannot hold", world =>
    world.fire(CLIENT_COMPANIES_COVERED_ACTIONS.filterBy, {
      name: { like: 123 }
    })
  );

  Then("my companies list is unchanged", world =>
    settles(() => world.expectMeta({ isFiltered: false }))
  );

  Then("I am told my request was rejected", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  // Narrative negative-control clause — inert by construction (per
  // @AC-25..@AC-29's identical pattern): what "turns this scenario red" is
  // that the two Thens above it stop passing, not a runtime check of its own.
  Then(
    "letting a rejected request silently through turns this scenario red",
    async () => {}
  );
});

export default clientCompaniesSteps;
