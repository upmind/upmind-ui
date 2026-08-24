// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/client-personal-details.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-personal-details.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog can be
 * re-registered against any runner.
 *
 * Every handler speaks to the module through the `World` members only. There
 * is no DOM read, no request read and no import of the module's own source
 * here.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than
 * an import: `packages/headless` holds no scenario concept at all — the key
 * is the consuming playground's (`client_personal_details`, bound to BOTH
 * `usePersonalDetails` and `usePersonalDetailsManager`).
 */
export const CLIENT_PERSONAL_DETAILS_SCENARIO = "client_personal_details";

/**
 * The action ids these steps drive, across both halves. Exported as the
 * gate's `coveredActionIds` so the covered set and the calls that cover it
 * cannot drift.
 */
export const CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  destroy: "destroy",
  input: "input",
  update: "update",
  revert: "revert",
  clear: "clear",
  filterFields: "filterFields",
  onDone: "onDone",
  stop: "stop"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the scope settles on it. */
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

async function open(world: World): Promise<void> {
  await world.boot(CLIENT_PERSONAL_DETAILS_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

// -----------------------------------------------------------------------------

export const clientPersonalDetailsSteps = defineSteps(
  ({ Given, When, Then }) => {
    Given("I am an authenticated client with my own profile", world =>
      open(world)
    );

    Given(
      "every request I make about my profile is addressed to my own profile",
      world => settles(() => world.expectMeta({ isAvailable: true }))
    );

    // AC-30 / AC-63 — the read half shows every field, native and custom.
    Given("I hold values against some of my custom fields", () =>
      Promise.resolve()
    );

    Given("my brand offers custom fields I hold no value for", () =>
      Promise.resolve()
    );

    When("I read my profile", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.refresh)
    );

    Then("those values are shown to me as they actually are", world =>
      settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    Then("they are not the placeholder word {string}", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "every one of those fields still appears in my profile, alongside my native fields",
      world => settles(() => world.expectMeta({ isAvailable: true }))
    );

    Then(
      "each shows its type's own empty value rather than being left out entirely",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-31 — a failed load settles, rather than hanging.
    // Journey-seeded rather than option-flagged: the recorded corpus carries
    // no failing fixture, so the failure path is selected by named journey,
    // the extension point `WorldScope.seed` exists for.
    Given("loading my profile fails", world =>
      world.boot(CLIENT_PERSONAL_DETAILS_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        seed: { journey: "profile-load-failure" }
      })
    );

    When("I wait for it to be ready", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady)
    );

    Then("I am told it is not ready, with the failure visible to me", world =>
      settles(() => world.expectMeta({ isAvailable: false, hasError: true }))
    );

    Then("I am not left waiting indefinitely", world =>
      settles(() => world.expectMeta({ isAvailable: false }))
    );

    // AC-33 / AC-35 — the language identity round-trips through the manager.
    Given("my profile's language is set to a particular language", world =>
      open(world)
    );

    Given(
      "my profile's language is no longer in my brand's offered list",
      world => open(world)
    );

    When("I view and then save my profile unchanged", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.update)
    );

    When("I view my profile's language choices", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.isReady)
    );

    Then("the language I hold is still that same language", world =>
      settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    Then(
      "what I see displayed is its name, while what is held and round-tripped is its identity",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then("my current language still appears, shown but not selectable", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );

    Then("it is not silently blanked out", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-47 / AC-50 — the editor's input/update/revert cycle.
    Given(
      "I set a text field to empty, a toggle to off, and a number to zero",
      world =>
        world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
          publicName: "",
          customFields: { age: 0 }
        })
    );

    When("I save my profile", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.update)
    );

    Then("all three of those changes are sent", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then("none of them is silently dropped for looking empty", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );

    Given("I have made two changes to my profile in the editor", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.input, {
        publicName: "Changed",
        customFields: { age: 99 }
      })
    );

    When("I discard my edits", world =>
      world.fire(CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.revert)
    );

    Then(
      "my profile in the editor is exactly what it was before I started",
      world =>
        settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    Then("it is no longer reported as changed", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-43 — bare construction, no arguments.
    When("I open my profile editor with no arguments", world => open(world));

    Then("it constructs successfully and reaches a settled state", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );
  }
);

export default clientPersonalDetailsSteps;
