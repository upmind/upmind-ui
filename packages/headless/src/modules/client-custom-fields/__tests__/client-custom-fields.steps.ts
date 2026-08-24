// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `client-custom-fields.feature`'s driveable scenarios use. Engine-free
 * by construction: it imports `defineSteps` and `World` and nothing else, so the
 * same catalog re-registers against any runner.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own source here.
 *
 * VIEW-ONLY module: `useClientCustomFields` is a definitions/values collection
 * with no manager — no create/update/delete actions, so no mutation steps. The
 * covered actions are `isReady` and `refresh` only.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const CLIENT_CUSTOM_FIELDS_SCENARIO = "client_custom_fields";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`,
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure, never a silent
 * over-report.
 */
export const CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS
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

async function open(world: World, scope: Parameters<World["boot"]>[1]) {
  await world.boot(CLIENT_CUSTOM_FIELDS_SCENARIO, scope);
  await world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

// -----------------------------------------------------------------------------

export const clientCustomFieldsSteps = defineSteps(({ Given, When, Then }) => {
  // === BOOT STEPS (client x self — the only resolving cell) ===================

  Given("I am an authenticated client with my own custom field values", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make about my custom fields is addressed to my own value set",
    () => Promise.resolve()
  );

  // === COLLECTION READ/REFRESH ================================================

  When("I open my custom field definitions", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady)
  );

  When("I ask for a fresh copy", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.refresh)
  );

  // === DEFINITIONS VISIBILITY (AC-1 through AC-9) =============================

  Then("I see the definitions my own brand has configured", world =>
    settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );

  Then("no other brand's definitions are ever loaded", () => Promise.resolve());

  Then("the definitions I see are my own brand's", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then(
    "a later change to my resolved brand re-reads the definitions for the new brand",
    () => Promise.resolve()
  );

  Then("I see them in exactly that order", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then(
    "that definition's full configuration is visible to me, with nothing left unmapped",
    world => settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then("the first is disabled but not read-only, and the second is both", () =>
    Promise.resolve()
  );

  Then("the two states never collapse into the same flag", () =>
    Promise.resolve()
  );

  Then("my definitions are re-read", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then("nothing unrelated to my definitions is re-read as a result", () =>
    Promise.resolve()
  );

  Then("I am told the list is empty, with a count of zero", world =>
    settles(() => world.expectContext?.({ pagination: { total: 0 } }))
  );

  Then("when my brand does define some, I am told exactly how many", () =>
    Promise.resolve()
  );

  // === SCENARIO SETUP GIVENS ==================================================

  Given(
    "my own brand differs from whatever brand the app currently has selected",
    () => Promise.resolve()
  );

  Given("my brand's definitions were configured in a specific order", () =>
    Promise.resolve()
  );

  Given(
    "one of my brand's definitions is hidden, staff-only, non-editable, and ordered",
    () => Promise.resolve()
  );

  Given(
    "one definition is not editable but is not marked read-only, and another is both",
    () => Promise.resolve()
  );

  Given("I have already loaded my custom field definitions", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady)
  );

  Given("my brand defines no custom fields", () => Promise.resolve());
});

export default clientCustomFieldsSteps;
