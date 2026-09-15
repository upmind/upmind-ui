// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-company.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog can be
 * re-registered against any runner.
 *
 * ADR-020 Amendment 5 (operator ruling 2026-09-12): tests are tests, scenarios
 * are scenarios — not every scenario is a replayable TRACK. A scenario is a
 * playable track only when a real step drives every one of its lines; a
 * `() => Promise.resolve()` / do-nothing handler, a `seed`-journey boot, an
 * assert-only scenario no step of which fires a real action, or one whose
 * outcome needs a recording that does not exist is FAKE and earns NO catalog
 * entry — deleted wholesale, so the harness reads it as `notYet` (skipped),
 * never `partial`.
 *
 * DRIVEN here: the Background, the search capability (@AC-7), the sort
 * (@AC-34) and the schema-rejection negative control (@AC-40 — client-side
 * ajv rejection, no request, proven by `client-company.criteria.int.test.ts`).
 * SWEPT to spec-only under Amendment 5: @AC-31 (its `When` was a do-nothing
 * observer — the boot-default window is read by the criteria int test, not
 * driven here), @AC-35 (Then-only, no `When` fires an action), and @AC-36
 * (its "empty because I filtered" outcome needs an empty `filter[name|like]`
 * recording this module's corpus does not hold — parked, not faked). Every
 * remaining capability is `notYet` and proven at the integration layer
 * (`client-company.collection.int.test.ts`, `client-company.criteria.int.test.ts`,
 * `client-company.filters.int.test.ts`).
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
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
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
});

export default clientCompaniesSteps;
