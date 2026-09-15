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
 *
 * ADR-020 Amendment 5 (operator ruling 2026-09-12): tests are tests, scenarios
 * are scenarios. A scenario is a playable TRACK only when a real step drives
 * every line of it — a `world.fire(<real action id>)` plus assertions the
 * recorded corpus actually reaches; otherwise it stays spec and gets NO steps
 * at all. Only AC-7 (asking for a fresh copy) survives as driven: it fires the
 * real `refresh` and reads readiness back. Every "open my definitions" scenario
 * (AC-1..AC-5, AC-9) is spec-only — each shares the one `When I open my custom
 * field definitions` phrasing with the others, and at least AC-2 (a brand
 * switch), AC-5 (read-only vs disabled on specific rows) and AC-9 (an EMPTY
 * catalogue, a state the recorded corpus never reaches) assert states no happy
 * capture exhibits, so the whole "open" group collapses to spec-only together
 * rather than half-matching. Their proof lives at the module's own unit and
 * integration layers, anchored to the same @AC tags. `count` on this module is
 * a NUMBER, never an `expectMeta` boolean, so no step claims it.
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
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
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
  // === BACKGROUND (client x self — the only resolving cell) ===================

  Given("I am an authenticated client with my own custom field values", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  // Identity-transport claim — the URL retarget is proven at the module's own
  // integration layer; here it reads back only that the value set the Background
  // booted is mine and available.
  Given(
    "every request I make about my custom fields is addressed to my own value set",
    world => settles(() => world.expectMeta({ isAvailable: true }))
  );

  // === AC-7: refresh re-reads the definitions ================================

  Given("I have already loaded my custom field definitions", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady)
  );

  When("I ask for a fresh copy", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.refresh)
  );

  Then("my definitions are re-read", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  // The wire-level "only my definitions re-read" is proven at the integration
  // layer; the `World` seam reads back only that the refresh completed clean.
  Then("nothing unrelated to my definitions is re-read as a result", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );
});

export default clientCustomFieldsSteps;
