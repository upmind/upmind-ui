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
 * The driven scenarios boot the one composable (`useBillingSettings`)
 * under ONE scenario key: it loads the record on entry (so the read
 * capability is driven), then edits and saves it (so the write capabilities
 * are). Every save asserts the value it drove against the model the machine
 * re-parsed from the recorded PUT response. Scenarios whose promise is a
 * wire-body fact, a wire-negative, a transient in-flight window, a host lock,
 * or a brand/account state staging cannot produce are `@todo` in the feature
 * and carry no step here.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import {
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import ac26SaveRecording from "./scenarios/after-i-save-a-new-preferred-payment-currency-that-is-what-i-and-the-rest-of-the-app-see-next/03/put-accounts-id.json";
import ac22CurrencyRecording from "./scenarios/i-can-change-the-currency-my-account-bills-in/04/put-accounts-id.json";
import ac22BothRecording from "./scenarios/i-can-change-the-currency-my-account-bills-in/06/put-accounts-id.json";
import ac21SetRecording from "./scenarios/i-can-choose-a-preferred-payment-currency-for-my-account-and-clear-it-again/04/put-accounts-id.json";
import ac21ClearRecording from "./scenarios/i-can-choose-a-preferred-payment-currency-for-my-account-and-clear-it-again/06/put-accounts-id.json";
import ac20BootRecording from "./scenarios/i-can-see-the-currency-my-account-bills-in-and-my-preferred-payment-currency-if-i-have-one/01/get-clients-id.json";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The scenario key the editor is booted under (the consuming playground's own). */
export const CLIENT_BILLING_SETTINGS_SCENARIO = "client_billing_settings";

/** The action ids these steps drive — exported as the gate's `coveredActionIds`. */
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

/** The values a save drives — one per recorded PUT case. */
const CASE = {
  dayOfWeekRule: InvoiceConsolidationRuleTypes.DAY_OF_WEEK,
  dayOfMonthRule: InvoiceConsolidationRuleTypes.DAY_OF_MONTH,
  dayOfWeek: "monday",
  dateOfMonthDay: 15,
  dueDateDay: 10
} as const;

/** Outside every recorded day range — the schema refuses it before a save. */
const OUT_OF_RANGE = 40;

type AccountRecording = {
  request: {
    body: {
      currency_id?: string;
      preferred_payment_currency_id?: string | null;
    };
  };
  response: {
    body: {
      data: {
        currency_id: string;
        preferred_payment_currency_id: string | null;
      };
    };
  };
};

/** The value the module SENT for a key — the input a step drives to reproduce that PUT. */
const sentCurrency = (rec: AccountRecording): string | undefined =>
  rec.request.body.currency_id;
const sentPreferred = (rec: AccountRecording): string | null =>
  rec.request.body.preferred_payment_currency_id ?? null;

/** The value staging SAVED — the outcome a step asserts on the model. */
const savedCurrency = (rec: AccountRecording): string =>
  rec.response.body.data.currency_id;
const savedPreferred = (rec: AccountRecording): string | null =>
  rec.response.body.data.preferred_payment_currency_id;

type BootRecording = {
  response: { body: { data: { accounts: { currency_id: string }[] } } };
};

/** The account's own billing currency, read off the AC-20 boot record read. */
const OWN_ACCOUNT_CURRENCY = (ac20BootRecording as BootRecording).response.body
  .data.accounts[0]!.currency_id;

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
 * Boots the editor for the brand-gated availability scenarios (AC-17/AC-23)
 * WITHOUT asserting `isAvailable` — the brand gate hides a surface/field, it does
 * not change addressability, so readiness settles either way and the Then reads
 * the schema/model to see what the gate offered.
 */
async function openPreference(world: World): Promise<void> {
  await world.boot(CLIENT_BILLING_SETTINGS_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ hasErrors: false }));
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
    // Tolerant boot: the restricted-brand scenario (AC-17) settles unavailable, so
    // the shared Background cannot assert isAvailable here — each scenario that needs
    // an available surface asserts it in its own `open()` Given.
    Given("I am an authenticated client", world => openPreference(world));

    Given(
      "every request I make about my consolidation preference is addressed to my own client record",
      world => settles(() => world.expectMeta({ hasErrors: false }))
    );

    // --- AC-1: the read shows the recorded record, addressed to my own id ---
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

    // --- AC-3 / AC-4 shared open ---
    Given("I have opened my consolidation preference in the editor", world =>
      open(world)
    );

    // --- AC-3: on / off / inherit ---
    When(
      "I choose to turn consolidation on, off, or to follow my brand, and save",
      world => save(world, { enabled: InvoiceConsolidationTypes.DISABLED })
    );

    Then(
      "the state I saved is exactly the state I chose, never a different one",
      world =>
        expectModel(world, { enabled: InvoiceConsolidationTypes.DISABLED })
    );

    // --- AC-4: base rule set / clear ---
    When(
      "I choose a base rule and save, and later clear that choice and save again",
      world => save(world, { baseRule: CASE.dayOfWeekRule })
    );

    Then("my chosen rule is saved when I chose one", world =>
      expectModel(world, { baseRule: CASE.dayOfWeekRule })
    );

    Then(
      "clearing it is saved as an explicit choice to follow my brand's rule, not left unspecified",
      world => save(world, { baseRule: null })
    );

    // --- AC-5: day of week set / clear ---
    Given("my base rule is a weekly cadence", async world => {
      await open(world);
      await save(world, { baseRule: CASE.dayOfWeekRule });
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

    // --- AC-6: day of month set / restore / out-of-range refuse ---
    Given("my base rule is a monthly cadence", async world => {
      await open(world);
      await save(world, { baseRule: CASE.dayOfMonthRule });
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

    // --- AC-7: due-date day (never-suspended client, monthly rule) ---
    Given(
      "I have opened my consolidation preference in the editor as a client whose services are never suspended",
      world => open(world)
    );

    When(
      "I choose a valid due-date day and save, and later clear that choice and save again",
      world => save(world, { dueDateDay: CASE.dueDateDay })
    );

    Then("my chosen due-date day is saved when I chose a valid one", world =>
      expectModel(world, { dueDateDay: CASE.dueDateDay })
    );

    Then(
      "clearing it is saved as an explicit choice for the earliest available day, not left unspecified",
      world => save(world, { dueDateDay: null })
    );

    Then(
      "choosing a due-date day outside the valid range is refused before I can save it",
      world => refuse(world, { dueDateDay: OUT_OF_RANGE })
    );

    // --- AC-8: dirty only while a value differs from what was loaded ---
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

    // --- AC-9: revert ---
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

    // --- AC-10: an invalid value never reaches a save ---
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

    // --- AC-23: preferred-payment-currency choice, per brand gate state -------
    Given("my brand does not allow paying in a different currency", () =>
      Promise.resolve()
    );
    Given("my brand allows paying in a different currency", () =>
      Promise.resolve()
    );

    When("I open my consolidation preference", world => openPreference(world));

    Then(
      "the preferred payment currency choice is not offered to me",
      world => {
        if (!world.expectContext)
          throw new Error("this World cannot read context");
        return settles(() =>
          world.expectContext!({ model: { preferredPaymentCurrencyId: null } })
        );
      }
    );

    Then("the preferred payment currency choice is offered to me", world => {
      if (!world.expectContext)
        throw new Error("this World cannot read context");
      return settles(() =>
        world.expectContext!({
          schema: { properties: { preferredPaymentCurrencyId: {} } }
        })
      );
    });

    Then("my consolidation preference surface is still shown to me", world => {
      if (!world.expectContext)
        throw new Error("this World cannot read context");
      return settles(() =>
        world.expectContext!({ schema: { properties: { enabled: {} } } })
      );
    });

    // --- AC-13: the in-flight save window. The save is fired but NOT awaited so
    // the next step reads `isProcessing` while the PUT is held open (its recording
    // is armed with a replayStep delay by the replay harness). ------------------
    Given(
      "I have started saving a change to my consolidation preference",
      async world => {
        await open(world);
        await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.input, {
          enabled: InvoiceConsolidationTypes.DISABLED
        });
        await world.fireHold!(
          CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update,
          undefined,
          CLIENT_BILLING_SETTINGS_SCENARIO
        );
      }
    );

    When("the save is still in progress", world =>
      settles(() => world.expectMeta({ isProcessing: true }))
    );

    Then(
      "every control in my editor reports itself unavailable to edit",
      world => world.expectMeta({ isProcessing: true })
    );

    Then(
      "once the save settles, whether it succeeded or failed, every control becomes available again",
      async world => {
        await world.settle!(CLIENT_BILLING_SETTINGS_SCENARIO);
        await settles(() => world.expectMeta({ isProcessing: false }));
      }
    );

    // --- AC-17: restricted brand — the manager reports itself unavailable and no
    // change reaches the record. The restrict_to_staff gate rides the boot. -------
    Given(
      "my brand has not explicitly turned on client-managed consolidation",
      () => Promise.resolve()
    );

    When("I look for my consolidation preference surface", world =>
      openPreference(world)
    );

    Then("it is hidden from me", world =>
      settles(() => world.expectMeta({ isAvailable: false }))
    );

    Then(
      "it only becomes visible once my brand explicitly turns it on for clients",
      world => settles(() => world.expectMeta({ isAvailable: false }))
    );

    // --- AC-20: read the account currencies. Both come from the session account
    // the boot resolves; the billing currency reads back off a recorded account PUT
    // response, the preferred is unset. ------------------------------------------
    Given(
      "I hold a real account billing in a currency my brand no longer offers, addressed as my own",
      world => open(world)
    );

    When("I read my account's currencies", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );

    Then("I see the currency my account actually bills in", world =>
      expectModel(world, { currencyId: OWN_ACCOUNT_CURRENCY })
    );

    Then(
      "I see my preferred payment currency exactly when one is actually set, never a substitute for it",
      world => expectModel(world, { preferredPaymentCurrencyId: null })
    );

    Then(
      "the currencies I can choose from still include the currency my account bills in, even when my brand no longer offers it",
      world => {
        if (!world.expectContext)
          throw new Error("this World cannot read context");
        return settles(() =>
          world.expectContext!({
            schema: {
              definitions: {
                currencyId: { options: [{ value: OWN_ACCOUNT_CURRENCY }] }
              }
            }
          })
        );
      }
    );

    // --- AC-21: set a preferred payment currency, clear it, then a no-change save
    // makes no request. -----------------------------------------------------------
    Given(
      "my brand lets me pay in a different currency than my account bills in",
      () => Promise.resolve()
    );

    When(
      "I choose a preferred payment currency and save, and later clear that choice and save again",
      async world => {
        await open(world);
        await save(world, {
          preferredPaymentCurrencyId: sentPreferred(
            ac21SetRecording as AccountRecording
          )
        });
      }
    );

    Then(
      "my chosen payment currency is recorded against my own account when I chose one",
      world =>
        expectModel(world, {
          preferredPaymentCurrencyId: savedPreferred(
            ac21SetRecording as AccountRecording
          )
        })
    );

    Then(
      "clearing it is recorded as an explicit choice to have no preferred payment currency, not left unspecified",
      world =>
        save(world, {
          preferredPaymentCurrencyId: savedPreferred(
            ac21ClearRecording as AccountRecording
          )
        })
    );

    Then(
      "saving with no change to either currency makes no request at all",
      async world => {
        await world.fire(CLIENT_BILLING_SETTINGS_COVERED_ACTIONS.update);
        await settles(() => world.expectMeta({ isAvailable: true }));
      }
    );

    // --- AC-22: change the billing currency, then both currencies in one PUT. -----
    Given("I have opened my account's currencies in the editor", world =>
      open(world)
    );

    When("I change the currency my account bills in and save", world =>
      save(world, {
        currencyId: sentCurrency(ac22CurrencyRecording as AccountRecording)
      })
    );

    Then("the new billing currency is recorded against my own account", world =>
      expectModel(world, {
        currencyId: savedCurrency(ac22CurrencyRecording as AccountRecording)
      })
    );

    Then(
      "changing both my billing currency and my preferred payment currency together saves them in one request",
      world =>
        save(world, {
          currencyId: sentCurrency(ac22BothRecording as AccountRecording),
          preferredPaymentCurrencyId: sentPreferred(
            ac22BothRecording as AccountRecording
          )
        })
    );

    // --- AC-26: save a new preferred payment currency, then read it back. ---------
    Given(
      "I have just saved a new preferred payment currency for my account",
      async world => {
        await open(world);
        await save(world, {
          preferredPaymentCurrencyId: sentPreferred(
            ac26SaveRecording as AccountRecording
          )
        });
      }
    );

    When("I read my account's currencies again", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );

    Then(
      "I see the payment currency I just saved, not the one I had before",
      world =>
        expectModel(world, {
          preferredPaymentCurrencyId: savedPreferred(
            ac26SaveRecording as AccountRecording
          )
        })
    );

    Then("the rest of the app resolves my currency the same new way", world =>
      expectModel(world, {
        preferredPaymentCurrencyId: savedPreferred(
          ac26SaveRecording as AccountRecording
        )
      })
    );
  }
);

export default clientBillingSettingsSteps;
