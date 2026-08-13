// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and the one built catalog it
 * cites. Authority: `packages/scenario-harness/src/steps/steps.types.ts` (the
 * `StepCatalog` contract) and `agent-seat-separation` (this file is the
 * PROVER's). A disagreement between the skeleton, the reference catalog and the
 * contract is a surfaced finding, never silently resolved toward either.
 *
 * Emitted by the PROVER seat into
 * `packages/headless/src/modules/<module>/__tests__/`, beside the feature it
 * implements. Colocation is the convention; the catalog is the PLAYGROUND's,
 * because without a page nothing drives the feature.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { values } from "lodash-es";
import { ScopeActorTypes } from "../../scope/scope.types";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------
/**
 * @module module/__tests__/module.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `module.feature`'s driveable scenarios use. Engine-free by
 * construction: it imports `defineSteps` and `World` and nothing else, so the
 * same catalog re-registers against any runner.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own source here.
 *
 * @reference `packages/headless/src/modules/client-email/__tests__/` — the one
 * built pair, read while authoring this skeleton, never a match target.
 */

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const MODULES_SCENARIO = "modules";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`,
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure, never a silent
 * over-report.
 */
export const MODULES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh"
} as const;

export const coveredActionIds: readonly string[] = values(
  MODULES_COVERED_ACTIONS
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
  await world.boot(MODULES_SCENARIO, scope);
  await world.fire(MODULES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

// -----------------------------------------------------------------------------

export const modulesSteps = defineSteps(({ Given, When, Then }) => {
  Given("the modules playground is generated for the active client", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("a staff member acting for that client", world =>
    open(world, {
      actor: ScopeActorTypes.STAFF,
      context: { type: "client", id: "mock-uuid-1" }
    })
  );

  When("the client refreshes the collection", world =>
    world.fire(MODULES_COVERED_ACTIONS.refresh)
  );

  Then("the collection holds {int} items", (world, total) =>
    settles(() => world.expectContext({ pagination: { total } }))
  );

  // A WRITING scenario ends on the COLLECTION, never on the absence of an
  // error: "reports no failure" passes while the surface shows the same rows it
  // showed before, which is the replay reading as cosplay. Every track that
  // writes closes on what the user can see changed — the count, the new record
  // listed, the flag moved (operator ruling 2026-08-13).
  Then("{string} is listed", (world, name) =>
    settles(() => world.expectContext({ data: [{ name }] }))
  );

  Then("the collection reports no failure", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );
});

export default modulesSteps;
