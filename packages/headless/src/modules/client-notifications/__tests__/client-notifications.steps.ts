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
 * live collection action and asserts the collection's own published meta
 * (`isAvailable`/`hasError`/`isServed`) or context (`topics`/`channels`) — the
 * members `collection.int.test.ts` reads back. Assertions are pinned to the
 * corpus's STRUCTURE (the six topics, the two client channels, the one locked
 * topic `System`), never to a specific opt-out row: the QA account's live
 * opt-outs drift, so a structural read-back is the fact that holds under both
 * the recorded replay and a live session.
 *
 * WHY THE EDITOR IS ABSENT FROM THIS CATALOG — the seam offers no write door.
 * The playground world boots ONE port (`entry.useList ?? entry.useMutate`), and
 * this module's `useList` is the read-only collection, so the only fireable
 * action ids are the collection's own. Verified in the browser against the live
 * page (2026-09-10): `fire("refresh")` advances the scene, while
 * `fire("manage")` and `fire("editRow")` each fail it with
 * `scenario world: unknown action "<id>"` — the declaration's handoff ids are
 * NOT addressable through `World.fire`, and `World` (`world.types.ts`) exposes
 * no other way to reach them. The archetype `client-email` drives its writes
 * because `ensure`/`remove`/`verify`/`setDefault` are members of the collection
 * it boots; this module's equivalent verbs live on the manager, which the world
 * never boots.
 *
 * So every editor capability — the per-pair edit and save (`AC-3`), the
 * locked-topic refusal on all five of its doors (`AC-6`/`AC-14`), the
 * whole-topic bulk toggle and its sentinel (`AC-4`), the dirty/clean flags and
 * pointless-save refusal (`AC-5`), the swallowed-failure and retry paths
 * (`AC-7`), `revert`, the emailed-link write and transport (`AC-8`/`AC-18`) and
 * the late-session sequencing (`AC-16`) — is proven at the manager's own
 * integration layer (`client-notifications.manager.*.int.test.ts`,
 * `*.token*.int.test.ts`) and is deliberately left unmatched here. Matching one
 * of those sentences with a read-only probe would be a lying step; matching it
 * with a handoff id the world does not know produces a track that reads as
 * playable in the menu and dies on play.
 *
 * THE MATCHED SET IS THE PLAYLIST, so this catalog is deliberately CLOSED. The
 * playground derives its scenario menu from this feature by matching step TEXT
 * against this catalog with no per-scenario scoping: a scenario with no
 * matching step leaves the menu, and one with only some becomes a greyed-out,
 * unplayable track. The catalog is therefore exactly the union of the SIX
 * capability scenarios this seam drives end to end, and nothing more. Defining
 * one more step — even a harmless-looking shared precondition — resurrects
 * every variant family that shares it as a greyed-out track, which is why
 * those families' preconditions are worded uniquely in the feature.
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
 * step rather than a covered action.
 */
export const CLIENT_NOTIFICATIONS_COVERED_ACTIONS = {
  isReady: "isReady",
  manage: "manage"
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

/**
 * The recorded ids of the ONE pair the edit track drives, and the draft key
 * that addresses it. The manager's draft is a flat boolean record keyed
 * `"<topicId>::<channelId>"`, `true` meaning enabled, so turning a channel off
 * is that key set to `false`.
 *
 * @see fixtures/get-notifications-topics.json — `Billing` is opt-outable.
 * @see fixtures/get-notifications-channels-filter-recipient-types-code-client.json
 */
const RECORDED_PAIR = {
  topicId: "85d085e6-9d56-2371-9ea2-18e940d42370",
  channelId: "3825d96e-763e-d091-3dc4-174825283406"
} as const;

const RECORDED_PAIR_KEY = `${RECORDED_PAIR.topicId}::${RECORDED_PAIR.channelId}`;

/**
 * The opt-outs the account already held when the edit track opened. AC-3's
 * whole-set write means a save carries EVERY prior opt-out plus the new one,
 * never a diff — so the baseline is what that assertion is made against. The
 * QA account's rows drift, so it is read live rather than named.
 */
let priorOptOuts: { topicId: string; channelId: string }[] = [];

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
  // --- Boots -----------------------------------------------------------------

  Given(
    "I am an authenticated client managing my own notification preferences",
    world =>
      world.boot(CLIENT_NOTIFICATIONS_SCENARIO, {
        actor: ScopeActorTypes.SELF
      })
  );

  Given("I am staff", world =>
    world.boot(CLIENT_NOTIFICATIONS_SCENARIO, {
      actor: ScopeActorTypes.STAFF
    })
  );

  Given("any actor reaches this module", world =>
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

  When(
    "I look for a way to manage a named client's notification preferences",
    // Staff get no cell at all; the Then reads that refusal back off the port.
    async () => {}
  );

  When("that actor looks for an account to act on behalf of", async () => {});

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

  // --- AC-13 staff denial (isServed:false) -----------------------------------

  Then("this module offers me none", world =>
    settles(() => world.expectMeta({ isServed: false }))
  );

  Then("there is no account I can name to act on behalf of", world =>
    settles(() => world.expectMeta({ isServed: false }))
  );

  Then(
    "nothing in this module reads or writes preferences for anyone but the acting identity",
    world => settles(() => world.expectMeta({ isServed: false }))
  );

  // --- AC-13 self is served; no `.for()` context is offered ------------------

  Then("none is offered, on either the collection or the editor", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then(
    "the only preferences reachable are those of the acting identity itself",
    world =>
      settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );

  // --- AC-12 nothing to filter or sort ---------------------------------------

  Then("the module offers me none, because the server offers none", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then(
    "the whole grid is always present, so there is nothing a filter would reveal",
    world => seesWholeGrid(world)
  );

  // --- AC-3 the edit door: one pair off, saved, read back off the grid -------
  //
  // Driven through the declaration's own `manage` handoff — the same control a
  // hand presses ("Manage preferences"), which opens the real draft editor over
  // the grid and submits it. The read-back is on the COLLECTION, never on the
  // editor that made the change, so what is asserted is what a consumer reads
  // after the save settles.

  Given(
    "my notification preferences are ready to edit and save",
    async world => {
      await open(world);
      await world.expectContext(ctx => {
        priorOptOuts = [...ctx.optOuts];
        return true;
      });
    }
  );

  When("I turn one channel off for one topic and save", world =>
    world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.manage, {
      [RECORDED_PAIR_KEY]: false
    })
  );

  Then("that pair is off for me from then on", world =>
    settles(() =>
      world.expectContext(ctx =>
        ctx.optOuts.some(
          (row: { topicId: string; channelId: string }) =>
            row.topicId === RECORDED_PAIR.topicId &&
            row.channelId === RECORDED_PAIR.channelId
        )
      )
    )
  );

  Then("every other opt-out I already had is still recorded", world =>
    settles(() =>
      world.expectContext(ctx =>
        priorOptOuts.every(prior =>
          ctx.optOuts.some(
            (row: { topicId: string; channelId: string }) =>
              row.topicId === prior.topicId && row.channelId === prior.channelId
          )
        )
      )
    )
  );

  Then("the grid I read reflects the change without my reopening it", world =>
    settles(() =>
      world.expectContext(
        ctx =>
          ctx.isEnabled(RECORDED_PAIR.topicId, RECORDED_PAIR.channelId) ===
          false
      )
    )
  );
});

export default clientNotificationsSteps;
