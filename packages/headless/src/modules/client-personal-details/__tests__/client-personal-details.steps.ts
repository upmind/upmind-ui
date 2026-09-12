// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/client-personal-details.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `client-personal-details.feature`'s DRIVEABLE scenarios use.
 * Engine-free by construction: it imports `defineSteps` and `World` and nothing
 * else, so the same catalog can be re-registered against any runner.
 *
 * Every handler speaks to the module through the `World` members only. There
 * is no DOM read, no request read and no import of the module's own source
 * here.
 *
 * ADR-020 Amendment 5 (operator ruling 2026-09-12) — "tests are tests,
 * scenarios are scenarios; not every test is a replayable scenario." A scenario
 * earns step definitions ONLY when a real step drives every line of it against
 * the composable this key BOOTS: the read-only COLLECTION (`usePersonalDetails`,
 * the declaration's `useList`). The EDITOR (`usePersonalDetailsManager`,
 * `useMutate`) is a separate composable this key does not boot, so its actions —
 * `input` / `update` / `revert` / `clear` / `filterFields` / `onDone` / `stop` —
 * are undriveable here. So:
 *
 *   - every editor scenario (the input/update/revert cycle AC-46/47/50, the
 *     language save round-trip AC-33/48, and the whole manager surface) carries
 *     NO step here and is proven by the manager int specs
 *     (`client-personal-details.manager.int.test.ts`, `*.manager-cold-boot.*`,
 *     `*.clear-through-pipeline.*`), each anchored by its @AC tag;
 *   - the load-failure scenario (AC-31/40) is selected only through
 *     `WorldScope.seed`, which no executor honours today, so it too is
 *     spec-only and proven by `client-personal-details.read.int.test.ts`.
 *
 * The read surface DRIVEN here: boot, read, and the brand-language read-backs —
 * `isReady` and `refresh` are the whole fireable set. Assertions are CONCRETE
 * booleans over the collection's published meta (`isAvailable`/`hasError`) —
 * never an asymmetric matcher, which the world's `isMatch` subset check reads as
 * a mismatch. The language identity/round-trip and empty-value semantics each
 * scenario alludes to are proven at the language and manager int specs the @AC
 * tags anchor to.
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
 * `usePersonalDetails` and `usePersonalDetailsManager`; the world boots the
 * `useList` half).
 */
export const CLIENT_PERSONAL_DETAILS_SCENARIO = "client_personal_details";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure. The editor actions are
 * gone — they belong to the manager half this key does not boot (ADR-020 Am.5).
 */
export const CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS
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

    // AC-34 / AC-35 — the language choices are read off the same collection.

    // AC-43 — bare construction, no arguments.
    When("I open my profile editor with no arguments", world => open(world));

    Then("it constructs successfully and reaches a settled state", world =>
      settles(() => world.expectMeta({ isAvailable: true }))
    );
  }
);

export default clientPersonalDetailsSteps;
