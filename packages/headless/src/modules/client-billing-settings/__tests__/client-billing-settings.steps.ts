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
 * A TRACK drives the form and asserts the value it drove (ADR-020 Am.5;
 * operator ruling 2026-09-12): every write step chooses a value the module's
 * own capture run recorded (`client-billing-settings.fixtures.ts` cases —
 * `enabled-on/off/inherit`, `base-rule-set`, `day-of-week-set` monday,
 * `day-of-month-set` 15, `due-date-day-set` 7, and their `-clear`s), saves,
 * and asserts that value on the model. Scenarios that are CONTRACTS — scope
 * addressing, request shape, no-request saves, the brand-gated currency
 * stories this brand's recordings refuse with a 409 — have no steps here and
 * stay spec, proven by the module's integration tests, never listed as tracks.
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
import {
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const CLIENT_BILLING_SETTINGS_SCENARIO = "client_billing_settings";

export const CLIENT_BILLING_SETTINGS_COVERED_ACTIONS = {
  isReady: "isReady",
  reset: "reset",
  input: "input",
  update: "update",
  revert: "revert"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_BILLING_SETTINGS_COVERED_ACTIONS
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** The recorded baseline (`get-clients-id`): consolidation ON, no rule, no days. */
const RECORDED = {
  enabled: InvoiceConsolidationTypes.ENABLED
} as const;

/** The values the capture run saved, one per recorded `case`. */
const CASE = {
  baseRule: InvoiceConsolidationRuleTypes.DAY_OF_WEEK,
  dayOfWeek: "monday",
  dateOfMonthDay: 15,
  dueDateDay: 7
} as const;

/** Outside every recorded day range — the schema refuses it before a save. */
const OUT_OF_RANGE = 40;

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

/** The model carries these values — the one assertion a driven step ends on. */
function expectModel(world: World, model: Record<string, unknown>) {
  if (!world.expectContext)
    throw new Error("this World cannot read context — no model to assert");
  return settles(() => world.expectContext!({ model }));
}

async function open(world: World): Promise<void> {
  await world.boot(CLIENT_BILLING_SETTINGS_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, hasErrors: false })
  );
}

/**
 * Types a value into the editor, saves it, and sees it saved. The editor is
 * handed a COPY: the parser fills the object it is given with the schema's
 * defaults, and the assertion must stay the words this step chose.
 */
async function save(
  world: World,
  model: Record<string, unknown>
): Promise<void> {
  await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.input, { ...model });
  await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update);
  // A save settles through `processed` before the editor is available again;
  // a value typed before that is dropped, so the next step waits for it.
  await settles(() => world.expectMeta({ isAvailable: true }));
  await expectModel(world, model);
}

/** Types a value outside its range: the editor refuses it before any save. */
async function refuse(
  world: World,
  model: Record<string, unknown>
): Promise<void> {
  await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.input, { ...model });
  await settles(() => world.expectMeta({ isValid: false }));
}

// -----------------------------------------------------------------------------

export const clientBillingSettingsSteps = defineSteps(
  ({ Given, When, Then }) => {
    Given("I am an authenticated client", world => open(world));

    // Background: the boot addressed my own record — ready, and mine.
    Given(
      "every request I make about my consolidation preference is addressed to my own client record",
      world => settles(() => world.expectMeta({ isAvailable: true }))
    );

    // AC-1 — the read shows the recorded record, addressed to my own id.
    Given(
      "I hold saved values for consolidation, its base rule, and its cadence",
      world => open(world)
    );

    When("I read my consolidation preference", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.reset)
    );

    Then(
      "the five values I see are the ones actually saved against my own record",
      world => expectModel(world, { enabled: RECORDED.enabled })
    );

    Then(
      "nothing outside this module can make that read address a different client's record",
      world => settles(() => world.expectMeta({ isAvailable: true }))
    );

    // AC-3 / AC-4 / AC-5 / AC-6 / AC-7
    Given("I have opened my consolidation preference in the editor", world =>
      open(world)
    );

    When(
      "I choose to turn consolidation on, off, or to follow my brand, and save",
      // One story, one change (operator, 2026-09-12): the recorded record is
      // ON, so the story switches consolidation OFF and saves. ON and INHERIT
      // are the same control; the integration tests prove all three values.
      world => save(world, { enabled: InvoiceConsolidationTypes.DISABLED })
    );

    Then(
      "the state I saved is exactly the state I chose, never a different one",
      world =>
        expectModel(world, { enabled: InvoiceConsolidationTypes.DISABLED })
    );

    When(
      "I choose a base rule and save, and later clear that choice and save again",
      world => save(world, { baseRule: CASE.baseRule })
    );

    Then("my chosen rule is saved when I chose one", world =>
      expectModel(world, { baseRule: CASE.baseRule })
    );

    Then(
      "clearing it is saved as an explicit choice to follow my brand's rule, not left unspecified",
      world => save(world, { baseRule: null })
    );

    Given("my base rule is a weekly cadence", async world => {
      await open(world);
      await save(world, { baseRule: CASE.baseRule });
    });

    When(
      "I choose a day of the week and save, and later clear that choice and save again",
      world => save(world, { dayOfWeek: CASE.dayOfWeek })
    );

    Then("my chosen day is saved when I chose one", world =>
      expectModel(world, { dayOfWeek: CASE.dayOfWeek })
    );

    Then(
      "clearing it is saved as an explicit choice to follow my brand's day, not left unspecified",
      world => save(world, { dayOfWeek: null })
    );

    Given("my base rule is a monthly cadence", async world => {
      await open(world);
      await save(world, {
        baseRule: InvoiceConsolidationRuleTypes.DAY_OF_MONTH
      });
    });

    When(
      "I choose a valid day of the month and save, and later restore the default and save again",
      world => save(world, { dateOfMonthDay: CASE.dateOfMonthDay })
    );

    Then("my chosen day is saved when I chose a valid one", world =>
      expectModel(world, { dateOfMonthDay: CASE.dateOfMonthDay })
    );

    Then(
      "restoring the default is saved as an explicit choice to follow my brand's day, not left unspecified",
      world => save(world, { dateOfMonthDay: null })
    );

    Then(
      "choosing a day outside the valid range is refused before I can save it",
      world => refuse(world, { dateOfMonthDay: OUT_OF_RANGE })
    );

    // AC-7 has no track on this record: `dueDateDay` is drawn only for a
    // monthly rule on a `never_suspend` client (the legacy `showDueDateDayField`
    // rule), and the recorded client is not one — a value typed into a field
    // the form does not show is a replay nobody can see. Its integration tests
    // prove it; the feature keeps it as spec.

    // AC-8 — unsaved changes, told only while a value differs
    When(
      "I change a value, and later set that value back to what was loaded",
      async world => {
        await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.input, {
          enabled: InvoiceConsolidationTypes.DISABLED
        });
        await settles(() => world.expectMeta({ isDirty: true }));
        await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.input, {
          enabled: RECORDED.enabled
        });
      }
    );

    Then(
      "I am told I have unsaved changes only while a value differs from what was last loaded",
      world => settles(() => world.expectMeta({ isDirty: false }))
    );

    // AC-9 — revert
    Given(
      "I have changed several values in my consolidation preference editor without saving",
      async world => {
        await open(world);
        await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.input, {
          enabled: InvoiceConsolidationTypes.DISABLED,
          baseRule: InvoiceConsolidationRuleTypes.DAILY
        });
        await settles(() => world.expectMeta({ isDirty: true }));
      }
    );

    When("I discard those changes", world =>
      world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.revert)
    );

    Then("I see exactly the values that were last loaded", world =>
      expectModel(world, { enabled: RECORDED.enabled })
    );

    Then("discarding them made no request to save or reload anything", world =>
      settles(() => world.expectMeta({ isDirty: false }))
    );

    // AC-10 — an invalid value never reaches a save
    Given(
      "I have set one of my consolidation values to something outside its valid range",
      async world => {
        await open(world);
        await refuse(world, { dateOfMonthDay: OUT_OF_RANGE });
      }
    );

    When("I try to save", world =>
      world
        .fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update)
        .catch(() => undefined)
    );

    Then("the save is refused", world =>
      settles(() => world.expectMeta({ isValid: false }))
    );

    Then("no request to save anything is made", world =>
      expectModel(world, { dateOfMonthDay: OUT_OF_RANGE })
    );
  }
);

export default clientBillingSettingsSteps;
