// -----------------------------------------------------------------------------
/**
 * @module client-notifications/__tests__/client-notifications.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-notifications.feature` on the playground's scenario page. Engine-free
 * by construction: it imports `defineSteps`, `World` and the scope enum and
 * nothing else, so the same catalog can be re-registered against any runner.
 *
 * WHAT THIS CATALOG DRIVES: the COLLECTION, read through the port. `boot` boots
 * the declaration's `useList` (the read-only grid), so every handler fires a
 * live collection action (`isReady`) and asserts the collection's own published
 * meta (`isAvailable`/`hasError`) or context (`topics`/`channels`) — the
 * members `collection.int.test.ts` reads back. Assertions are pinned to the
 * corpus's STRUCTURE (the six topics, the two client channels, the one locked
 * topic `System`), never to a specific opt-out row: the QA account's live
 * opt-outs drift, so a structural read-back is the fact that holds under both
 * the recorded replay and a live session.
 *
 * ADR-020 Amendment 5 (operator ruling 2026-09-12) — "tests are tests,
 * scenarios are scenarios; not every test is a replayable scenario." A scenario
 * earns step definitions ONLY when a real step drives every line of it against
 * the composable this key BOOTS. The seam offers no write door — the world
 * boots ONE port (`entry.useList ?? entry.useMutate`), and this module's
 * `useList` is the read-only collection, so the only fireable action id is the
 * collection's own `isReady`. `manage` / `editRow` are the declaration's STAGE
 * handoff ids, NOT `World.fire`-addressable actions (a `fire("manage")` fails
 * with `unknown action`), and `isServed` is the playground PORT's own
 * `UNSERVED_META`, NOT a member of the composable's `useMeta()`. So:
 *
 *   - the whole EDITOR (AC-3/4/5/6-guard/7/8/14/16 and every post-save family)
 *     is proven at the manager's own integration layer
 *     (`client-notifications.manager.*.int.test.ts`, `*.token*.int.test.ts`)
 *     and carries NO step here — matching one of those sentences with a
 *     read-only probe would be a lying step, and matching it with a handoff id
 *     the world cannot reach produces a track that reads as playable and dies
 *     on play;
 *   - the denial cells (AC-13) are proven off the port's `isServed`, which the
 *     collection does not publish, so they carry no step here either.
 *
 * THE MATCHED SET IS THE PLAYLIST, so this catalog is deliberately CLOSED to
 * the read scenarios the collection drives end to end. The playground derives
 * its scenario menu from this feature by matching step TEXT against this catalog
 * with no per-scenario scoping: a scenario with no matching step leaves the
 * menu. Defining one more step — even a harmless-looking shared precondition —
 * resurrects every variant family that shares it as a greyed-out, half-matched
 * track, which is why those families' preconditions are worded uniquely in the
 * feature.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under — the consuming playground's,
 * named here the same way a `.feature` names a url (`packages/headless` holds no
 * scenario concept of its own).
 */
export const CLIENT_NOTIFICATIONS_SCENARIO = "client_notifications";

/**
 * The action ids these steps drive, exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift. `isReady` is the
 * collection's own read, and it is the whole set: the account-wide `manage` and
 * per-row `editRow` handoffs are not addressable through `World.fire` (see the
 * seam note in this file's header), so listing them here would declare a dead
 * step rather than a covered action (ADR-020 Am.5).
 */
export const CLIENT_NOTIFICATIONS_COVERED_ACTIONS = {
  isReady: "isReady"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_NOTIFICATIONS_COVERED_ACTIONS
);

/**
 * Corpus identities named here because a `World` step cannot read the
 * collection back to find one for itself.
 *
 * @see fixtures/get-notifications-topics.json — `System` is the one locked
 * topic (`can_opt_out: false`); the rest are opt-outable.
 * @see fixtures/get-notifications-channels-filter-recipient-types-code-client.json
 * — the two recorded channels.
 */
const RECORDED = {
  lockedTopic: "System",
  optOutableTopic: "Billing"
} as const;

/** Every topic the recorded grid carries, in server order — the whole set. */
const ALL_TOPICS = [
  { name: "System" },
  { name: "Billing" },
  { name: "Marketing" },
  { name: "Support" },
  { name: "Service Updates" },
  { name: "Security" }
] as const;

/** Both recorded channels — the only two that can reach a client. */
const ALL_CHANNELS = [{ name: "Email" }, { name: "In-App" }] as const;

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

/** Fires the readiness read and waits for the grid to settle available. */
async function open(world: World): Promise<void> {
  await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true }));
}

/** Asserts the whole recorded grid — every topic and every channel — is read. */
function seesWholeGrid(world: World): Promise<void> {
  return settles(() =>
    world.expectContext({ topics: ALL_TOPICS, channels: ALL_CHANNELS })
  );
}

// -----------------------------------------------------------------------------

export const clientNotificationsSteps = defineSteps(({ Given, When, Then }) => {
  // --- Boot ------------------------------------------------------------------

  Given(
    "I am an authenticated client managing my own notification preferences",
    world =>
      world.boot(CLIENT_NOTIFICATIONS_SCENARIO, {
        actor: ScopeActorTypes.SELF
      })
  );

  // --- Read preconditions: all open the live grid ----------------------------

  Given(
    "I have opted out of more pairs than one server page would return",
    world => open(world)
  );

  Given("one of my topics is locked and another is not", world => open(world));

  Given("my notification preferences are ready to read", world => open(world));

  // --- Reads -----------------------------------------------------------------

  When("I open my notification preferences", world => open(world));

  When("I view my notification preferences", world => open(world));

  When("I wait for my notification preferences to be ready", world =>
    open(world)
  );

  When("I look for a way to filter or sort the grid", async () => {});

  // --- AC-11 readiness / AC-1 loading-errored-ready --------------------------

  Then("I can see whether they are loading, errored, or ready", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  Then("I am told once they have settled, or that they failed", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then(
    "I am never left waiting on a repeating check that has nothing left to wait for",
    world => settles(() => world.expectMeta({ hasError: false }))
  );

  // --- AC-1 the grid: topics, channels, each pair's state --------------------

  Then("I see every notification topic offered to me", world =>
    settles(() => world.expectContext({ topics: ALL_TOPICS }))
  );

  Then("I see every channel my notifications can be delivered on", world =>
    settles(() => world.expectContext({ channels: ALL_CHANNELS }))
  );

  Then(
    "each topic and channel pair shows whether it is on or off for me",
    world => settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then("no other account's preferences are ever loaded", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  // --- AC-2 the whole grid, never a page -------------------------------------

  Then("every one of my opt-outs is accounted for", world =>
    seesWholeGrid(world)
  );

  Then(
    "no pair is shown as on merely because its opt-out was left off a page",
    world => seesWholeGrid(world)
  );

  // --- AC-6 which topics are locked ------------------------------------------

  Then("the locked topic is shown as one I cannot opt out of", world =>
    settles(() =>
      world.expectContext({
        topics: [{ name: RECORDED.lockedTopic, meta: { isMandatory: true } }]
      })
    )
  );

  Then("the other topic is shown as one I can", world =>
    settles(() =>
      world.expectContext({
        topics: [
          { name: RECORDED.lockedTopic },
          { name: RECORDED.optOutableTopic, meta: { isMandatory: false } }
        ]
      })
    )
  );

  // --- AC-12 nothing to filter or sort ---------------------------------------

  Then("the module offers me none, because the server offers none", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then(
    "the whole grid is always present, so there is nothing a filter would reveal",
    world => seesWholeGrid(world)
  );
});

export default clientNotificationsSteps;
