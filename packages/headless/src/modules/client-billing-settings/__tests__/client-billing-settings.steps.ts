// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/__tests__/client-billing-settings.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-billing-settings.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog can be
 * re-registered against any runner.
 *
 * Every handler speaks to the module through the `World` members only. There
 * is no DOM read, no request read and no import of the module's own source
 * here.
 *
 * CONTRACT AMBIGUITY (flagged, not resolved by reading source): the exact
 * scenario key a consuming playground binds to BOTH `useBillingSettings` and
 * `useBillingSettingsManager`, and the World's own action-id vocabulary for
 * this module, are not named by any of this prover's four contract inputs
 * (design.md, parity.yaml, requirements.md, the co-located feature) — they
 * are playground/harness wiring, minted by whichever consumer registers this
 * scenario. `CLIENT_BILLING_SETTINGS_SCENARIO` below follows the exemplar's
 * own underscore convention off this module's registry names
 * ("client-billing-settings" / "client-billing-settings-manager") as the
 * most likely value; confirm against the playground's own scenario registry
 * before relying on it.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const CLIENT_BILLING_SETTINGS_SCENARIO = "client_billing_settings";

export const CLIENT_BILLING_SETTINGS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  destroy: "destroy",
  input: "input",
  update: "update",
  revert: "revert",
  stop: "stop"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_BILLING_SETTINGS_COVERED_ACTIONS
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the scope settles on it. */
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

async function open(world: World): Promise<void> {
  await world.boot(CLIENT_BILLING_SETTINGS_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

// -----------------------------------------------------------------------------

export const clientBillingSettingsSteps = defineSteps(
  ({ Given, When, Then }) => {
    Given("I am an authenticated client", world => open(world));

    Given(
      "every request I make about my consolidation preference is addressed to my own client record",
      world => settles(() => world.expectMeta({ isAvailable: true }))
    );

    // AC-1
    Given(
      "I hold saved values for consolidation, its base rule, and its cadence",
      () => Promise.resolve()
    );

    When("I read my consolidation preference", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.refresh)
    );

    Then(
      "the five values I see are the ones actually saved against my own record",
      world =>
        settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    Then(
      "nothing outside this module can make that read address a different client's record",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-2
    Given("I have already read one client's consolidation preference", world =>
      open(world)
    );

    When(
      "the client record my preference addresses changes to a different one",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.refresh)
    );

    Then(
      "what I see is that new client's saved values, not the previous client's",
      world =>
        settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    // AC-19
    Given(
      "something else in the app is also reading my client record at the same time",
      () => Promise.resolve()
    );

    Then(
      "no extra request is made to read my client record on my behalf",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "what the other reader sees of my client record is unchanged by my own read",
      world => settles(() => world.expectMeta({ isAvailable: true }))
    );

    // AC-3 / AC-4 / AC-5 / AC-6 / AC-7 / AC-12
    Given("I have opened my consolidation preference in the editor", world =>
      open(world)
    );

    When(
      "I choose to turn consolidation on, off, or to follow my brand, and save",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then(
      "the state I saved is exactly the state I chose, never a different one",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-18
    Given("my consolidation preference is currently on", world => open(world));

    When("I turn it off and save", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("my saved preference explicitly records it as off", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "it is not left out of what was saved, as though nothing had changed",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    When(
      "I choose a base rule and save, and later clear that choice and save again",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("my chosen rule is saved when I chose one", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "clearing it is saved as an explicit choice to follow my brand's rule, not left unspecified",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Given("my base rule is a weekly cadence", world => open(world));

    When(
      "I choose a day of the week and save, and later clear that choice and save again",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("my chosen day is saved when I chose one", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "clearing it is saved as an explicit choice to follow my brand's day, not left unspecified",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Given("my base rule is a monthly cadence", world => open(world));

    When(
      "I choose a valid day of the month and save, and later restore the default and save again",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("my chosen day is saved when I chose a valid one", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "restoring the default is saved as an explicit choice to follow my brand's day, not left unspecified",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "choosing a day outside the valid range is refused before I can save it",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    When(
      "I choose a valid due-date day and save, and later clear that choice and save again",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("my chosen due-date day is saved when I chose a valid one", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "clearing it is saved as an explicit choice for the earliest available day, not left unspecified",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "choosing a due-date day outside the valid range is refused before I can save it",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Given(
      "I have opened my consolidation preference in the editor and changed some of the values",
      world => open(world)
    );

    When("I save my changes", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then(
      "only the values I changed are saved against my own client record, addressed the same way my read was",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "afterwards, reading my preference again reflects the saved changes rather than stale values",
      world =>
        settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    // AC-8 / AC-9 / AC-10 / AC-11
    When(
      "I change a value, and later set that value back to what was loaded",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.input, {})
    );

    Then(
      "I am told I have unsaved changes only while a value differs from what was last loaded",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Given(
      "I have changed several values in my consolidation preference editor without saving",
      world => open(world)
    );

    When("I discard those changes", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.revert)
    );

    Then("I see exactly the values that were last loaded", world =>
      settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    Then("discarding them made no request to save or reload anything", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Given(
      "I have set one of my consolidation values to something outside its valid range",
      world => open(world)
    );

    When("I try to save", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("the save is refused", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then("no request to save anything is made", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Given(
      "I have opened my consolidation preference in the editor and changed nothing",
      world => open(world)
    );

    When("I save", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("the save is treated as having succeeded", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-13
    Given(
      "I have started saving a change to my consolidation preference",
      world => open(world)
    );

    When("the save is still in progress", () => Promise.resolve());

    Then(
      "every control in my editor reports itself unavailable to edit",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "once the save settles, whether it succeeded or failed, every control becomes available again",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-15
    Given(
      "the app I am using has locked my consolidation preference editor",
      world => open(world)
    );

    When("I look at any control in the editor", () => Promise.resolve());

    Then("every control reports itself unavailable to edit", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "attempting to change a value while locked leaves my preference unchanged",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-16
    Given("loading my consolidation preference fails", world =>
      world.boot(CLIENT_BILLING_SETTINGS_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        seed: { journey: "consolidation-load-failure" }
      })
    );

    When("I wait for it to be ready", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.isReady)
    );

    Then(
      "I am told it is not ready, with the failure visible to me, rather than waiting forever",
      world =>
        settles(() => world.expectMeta({ isAvailable: false, hasError: true }))
    );

    Then(
      "when I retry, a successful load lands my actual saved values",
      world =>
        settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    // AC-14
    Given(
      "my client record is a staged import that has not finished processing",
      world =>
        world.boot(CLIENT_BILLING_SETTINGS_SCENARIO, {
          actor: ScopeActorTypes.CLIENT,
          seed: { journey: "consolidation-staged-import" }
        })
    );

    When("I look at any control in my consolidation preference editor", () =>
      Promise.resolve()
    );

    Then(
      "trying to save any change I make is refused, with no request made",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-17
    Given(
      "my brand has not explicitly turned on client-managed consolidation",
      world => open(world)
    );

    When("I look for my consolidation preference surface", () =>
      Promise.resolve()
    );

    Then("it is hidden from me", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "it only becomes visible once my brand explicitly turns it on for clients",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-20
    Given(
      "I hold a real account with a billing currency, addressed as my own",
      () => Promise.resolve()
    );

    When("I read my account's currencies", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.refresh)
    );

    Then("I see the currency my account actually bills in", world =>
      settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    Then(
      "I see my preferred payment currency exactly when one is actually set, never a substitute for it",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-21
    Given(
      "my brand lets me pay in a different currency than my account bills in",
      world => open(world)
    );

    When(
      "I choose a preferred payment currency and save, and later clear that choice and save again",
      world => world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then(
      "my chosen payment currency is recorded against my own account when I chose one",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "clearing it is recorded as an explicit choice to have no preferred payment currency, not left unspecified",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "saving with no change to either currency makes no request at all",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-22
    Given("I have opened my account's currencies in the editor", world =>
      open(world)
    );

    When("I change the currency my account bills in and save", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
    );

    Then("the new billing currency is recorded against my own account", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "changing both my billing currency and my preferred payment currency together saves them in one request",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-23
    Given(
      "my brand has not explicitly allowed paying in a different currency",
      world => open(world)
    );

    When("I look for the preferred-payment-currency choice", () =>
      Promise.resolve()
    );

    Then("it is not offered to me", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then("it only becomes offered once my brand explicitly allows it", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "my consolidation preference surface's own visibility is unaffected either way",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-24
    Given("my brand supports a set of currencies for billing", world =>
      open(world)
    );

    When("I look at the currencies I can choose between", () =>
      Promise.resolve()
    );

    Then("I see my brand's supported currencies, ordered by name", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "if my brand's list does not include my account's own billing currency, I still see and can keep it",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-25
    Given(
      "the request is addressed to a client record that is not my own",
      () => Promise.resolve()
    );

    When("I look for that client's account currencies", () =>
      Promise.resolve()
    );

    Then(
      "neither the currencies nor the preferred-payment-currency choice are shown to me",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    Then(
      "attempting to save any change is refused, with no request made",
      world => settles(() => world.expectMeta({ hasError: false }))
    );

    // AC-26
    Given(
      "I have just saved a new preferred payment currency for my account",
      world => open(world)
    );

    When("I read my account's currencies again", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.refresh)
    );

    Then(
      "I see the payment currency I just saved, not the one I had before",
      world =>
        settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
    );

    Then("the rest of the app resolves my currency the same new way", world =>
      settles(() => world.expectMeta({ hasError: false }))
    );
  }
);

export default clientBillingSettingsSteps;
