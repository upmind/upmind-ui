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
 *
 * ## A STEP EXISTS ONLY WHEN IT DRIVES OR STAGES SOMETHING REAL
 *
 * ADR-020 Amendment 5, operator ruling 2026-09-12: "tests are tests, scenarios
 * are scenarios — not every test is a replayable scenario." A scenario becomes
 * a playable TRACK only when a real step drives every line of it. A scenario no
 * step can drive gets NO steps at all — it stays spec, and the player must not
 * list it.
 *
 * So a step is legitimate only if it FIRES a real action id off the booted
 * composable's `useActions()`, or presses a real control on the stage. These
 * are FAKE and may never be written:
 *
 * - `() => Promise.resolve()` — a precondition dressed as a step. A real
 *   precondition is a recorded JOURNEY or it is nothing.
 * - `world.boot(..., { seed: { journey: "…" } })` — `WorldScope.seed` is
 *   honoured by NO executor today, so a seeded boot silently replays the happy
 *   path under a failure scenario's name. Leave the scenario spec-only and say
 *   which recording it waits on.
 * - a `Then` that only reads a flag in a scenario where nothing drives an
 *   action. An assert-only scenario is a contract, proven by a sibling
 *   `*.int.test.ts`, never by a track.
 *
 * And NEVER leave a scenario half-matched: the harness reads a partial match as
 * playable (`partial` is `createTraceabilityCheck`'s only failing bucket), so a
 * scenario that loses one step loses ALL of its own steps.
 *
 * Receipt: `client-billing-settings`, 2026-09-12 — 26 scenarios, 18 genuinely
 * driveable, 8 assert-only ones carrying 32 fake steps between them. Every gate
 * was green the whole time; only executing the catalog found it.
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
 *
 * Every id is a KEY of the composable the declaration BOOTS — read off its
 * `useActions()` return, never off this template. `refresh` is the
 * collection's; a manager re-reads through `reset` and publishes no `refresh`,
 * so a manager-only declaration (a single form) firing `refresh` fails its
 * replay with `unknown action` on the first read step.
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

// The error flag is the BOOTED composable's own meta key, read off its
// `.meta.ts`, never this template's: a collection (`useList`) publishes
// `hasError`; a manager (`useMutate`) publishes `hasErrors`. A module whose
// declaration boots ONLY a manager (a single form — `client-billing-settings`)
// must say `hasErrors` here, or every step mismatches on a key the port never
// had, and the player reports "meta mismatch" on the first scene. `expectMeta`
// is a subset match over raw meta; it renames nothing.
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

  // There is deliberately no `Then("the collection reports no failure")` here.
  // A flag-only `Then` closes a track on the absence of an error, which is
  // green while the surface shows exactly the rows it showed before — and in a
  // scenario nothing else drives it is the whole track, which is the fake-step
  // shape the header bans. `open()` already settles on `hasError: false` as the
  // ARRANGEMENT it is; a scenario has to end on what the user can see changed.
});

export default modulesSteps;
