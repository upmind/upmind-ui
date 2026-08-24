// -----------------------------------------------------------------------------
/**
 * @module client-address/__tests__/client-address.steps
 * @description The module's ONE step catalog — what drives page-level scenarios
 * for the colocated `client-address.feature`. Engine-free by construction: it
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
export const CLIENT_ADDRESSES_SCENARIO = "client_addresses";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift.
 */
export const CLIENT_ADDRESSES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  remove: "remove",
  setDefault: "setDefault"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_ADDRESSES_COVERED_ACTIONS
);

/**
 * Row identities the recorded corpus carries, named here because a `World` step
 * cannot read the collection back.
 *
 * @see fixtures/get-clients-id-addresses.json — the default and non-default ids.
 */
const RECORDED = {
  defaultId: "20e43579-5e78-d184-78db-31643202d986",
  nonDefaultId: "d0367942-4d0e-7109-44da-3153698d582e"
} as const;

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

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
  await world.boot(CLIENT_ADDRESSES_SCENARIO, scope);
  await world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

// -----------------------------------------------------------------------------

export const clientAddressesSteps = defineSteps(({ Given, When, Then }) => {
  // The feature's Background pair — part of EVERY scenario in the file, so the
  // catalog defines both or nothing in the file is driveable.
  Given("I am signed in as a client managing my addresses", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("my account has saved postal addresses", world =>
    world.expectMeta({ isEmpty: false })
  );

  Given("I am an authenticated client on the addresses page", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("the address collection has loaded", world =>
    world.expectMeta({ isAvailable: true, isEmpty: false })
  );

  When("I refresh the address collection", world =>
    world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.refresh)
  );

  When("I remove a non-default address", world =>
    world.fire(CLIENT_ADDRESSES_COVERED_ACTIONS.remove, RECORDED.nonDefaultId)
  );

  When("I make the non-default address my default", world =>
    world.fire(
      CLIENT_ADDRESSES_COVERED_ACTIONS.setDefault,
      RECORDED.nonDefaultId
    )
  );

  Then("the collection shows the address I removed is gone", world =>
    settles(() =>
      world.expectContext(
        ctx =>
          !ctx.data.some(
            (addr: { id: string }) => addr.id === RECORDED.nonDefaultId
          )
      )
    )
  );

  Then("the newly defaulted address is now the default", world =>
    settles(() =>
      world.expectContext(ctx =>
        ctx.data.some(
          (addr: { id: string; meta: { isDefault: boolean } }) =>
            addr.id === RECORDED.nonDefaultId && addr.meta.isDefault
        )
      )
    )
  );

  Then("no failure is reported", world =>
    world.expectMeta({ hasError: false })
  );
});

export default clientAddressesSteps;
