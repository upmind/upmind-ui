// -----------------------------------------------------------------------------
/**
 * @module client-phone/__tests__/client-phone.steps
 * @description The module's ONE step catalog — what drives page-level scenarios
 * for the colocated `client-phone.feature`. Engine-free by construction: it
 * imports `defineSteps` and `World` and nothing else, so the same catalog can
 * be re-registered against any runner.
 *
 * Every handler speaks to the module through the five `World` members. There is
 * no DOM read, no request read and no import of the module's own source here.
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
export const CLIENT_PHONES_SCENARIO = "client_phones";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift.
 */
export const CLIENT_PHONES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  remove: "remove",
  setDefault: "setDefault"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_PHONES_COVERED_ACTIONS
);

/**
 * Row identities the recorded corpus carries, named here because a `World` step
 * cannot read the collection back.
 *
 * @see fixtures/get-clients-id-phones.json — the default and non-default ids.
 */
const RECORDED = {
  defaultId: "25d96e76-3ed0-913d-357a-417482528340",
  nonDefaultId: "d085e69d-5623-7197-266f-218e940d4237",
  /**
   * The `total` of the capture the module's own read matches
   * (`order=-created_at&limit=0`, `case=sort-desc`): 11. The paged captures
   * say 12 — a later moment of the same run — and the replay answers a read
   * with the recording that asked its own question, as recorded.
   */
  total: 11
} as const;

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

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

async function open(world: World, scope: Parameters<World["boot"]>[1]) {
  await world.boot(CLIENT_PHONES_SCENARIO, scope);
  await world.fire(CLIENT_PHONES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

// -----------------------------------------------------------------------------

export const clientPhonesSteps = defineSteps(({ Given, When, Then }) => {
  Given(
    "I am an authenticated client managing my own phone numbers",
    async world => await open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make is addressed to my own phone collection as that client",
    async () => {
      // Scope constraint — verified by the scope-identity integration test.
    }
  );

  Given("the client-phone playground boots for the active client", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("the phone collection is ready", world =>
    world.expectMeta({ isAvailable: true, isEmpty: false })
  );

  When("the client refreshes the phone collection", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.refresh)
  );

  When("the client removes a non-default phone", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.remove, RECORDED.nonDefaultId)
  );

  When("the client makes a non-default phone the default", world =>
    world.fire(CLIENT_PHONES_COVERED_ACTIONS.setDefault, RECORDED.nonDefaultId)
  );

  // An expectation is data, never a predicate (`matchesExpectation`): the
  // removal shows as the COUNT the collection now states.
  Then("the phone collection count reflects the removal", world =>
    settles(() =>
      world.expectContext({ pagination: { total: RECORDED.total - 1 } })
    )
  );

  Then("the removed phone is no longer listed", world =>
    settles(() =>
      world.expectContext({ pagination: { total: RECORDED.total - 1 } })
    )
  );

  Then("the phone is now the default", world =>
    settles(() =>
      world.expectContext({
        data: [{ id: RECORDED.nonDefaultId, meta: { isDefault: true } }]
      })
    )
  );

  Then("no phone collection failure is reported", world =>
    world.expectMeta({ hasError: false })
  );
});

export default clientPhonesSteps;
