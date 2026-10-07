// -----------------------------------------------------------------------------
/**
 * @module client-notifications/__tests__/client-notifications.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-notifications.feature`. Engine-free by construction: it imports
 * `defineSteps`, `World` and the scope enum and nothing else of the runner, so
 * the same catalog re-registers against any runner.
 *
 * ONE scenario, ONE recording (FE-3145, ADR 035): each driven scenario replays
 * its own per-step fixtures under `scenarios/<slug>/<NN>/`. The topic, channel
 * and pair identities a `Then` asserts are READ from the recording that returned
 * them — never a copied literal a re-record would stale.
 *
 * WHAT THIS CATALOG DRIVES: BOTH halves. The COLLECTION (`useClientNotifications`)
 * booted under the collection scenario key, and the always-PUT aggregate EDITOR
 * (`useClientNotificationsManager`) booted under a SECOND scenario key — bare,
 * `.as(CLIENT)` with no `.for()` context, because it edits the one account-wide
 * opt-out aggregate. The editor writes the WHOLE grid back in one save, so every
 * edit `input`s the whole draft (server-held state plus the change), exactly as
 * the consuming form does — a partial input would drop the opt-outs already held.
 *
 * Every handler speaks to the module through the `World` members only: no DOM
 * read, no request read, no import of the module's source.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import channelsRecording from "./scenarios/see-every-topic-every-channel-and-the-state-of-each-pair/02/get-notifications-channels-filter-recipient-types-code-client.json";
import topicsRecording from "./scenarios/see-every-topic-every-channel-and-the-state-of-each-pair/02/get-notifications-topics.json";
import editorOptOutsRecording from "./scenarios/turn-one-channel-off-for-one-topic-and-save/02/get-notifications-opt-outs.json";
import { every, find, flatMap, fromPairs, map, some, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The collection scenario key. */
export const CLIENT_NOTIFICATIONS_SCENARIO = "client_notifications";

/** The aggregate EDITOR scenario key — the manager composable boots under this. */
export const CLIENT_NOTIFICATIONS_MANAGER_SCENARIO =
  "client_notifications_manager";

/**
 * The emailed-link token AC-8/10/18 boot with (`.as('client').withId(token)`).
 * The replay reads it from the scenario's own recording and sets it here before
 * the scenario runs, so the boot addresses the exact `?token=` the recording
 * answers — never a literal a re-record would stale.
 */
let LINK_TOKEN = "";
export const setLinkToken = (token: string): void => {
  LINK_TOKEN = token;
};

/**
 * The action ids these steps drive, exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift. `isReady` is the
 * whole-set read (collection and editor); `input`/`update`/`revert` are the
 * shared `dataManagerMachine` editor verbs the manager publishes.
 */
export const CLIENT_NOTIFICATIONS_COVERED_ACTIONS = {
  isReady: "isReady",
  input: "input",
  update: "update",
  revert: "revert"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_NOTIFICATIONS_COVERED_ACTIONS
);

// -----------------------------------------------------------------------------

type WireTopic = { id: string; name: string; can_opt_out: boolean };
type WireChannel = { id: string; name: string };
type WireOptOut = { topic_id: string; channel_id: string };

const topicRows = (
  topicsRecording as { response: { body: { data: WireTopic[] } } }
).response.body.data;
const channelRows = (
  channelsRecording as { response: { body: { data: WireChannel[] } } }
).response.body.data;
const optOutRows = (
  editorOptOutsRecording as { response: { body: { data: WireOptOut[] } } }
).response.body.data;

/** Every topic the recorded grid carries, in server order — the whole set. */
const ALL_TOPICS = map(topicRows, row => ({ name: row.name }));
/** Every channel the recorded grid carries — the only ones that reach a client. */
const ALL_CHANNELS = map(channelRows, row => ({ name: row.name }));

const LOCKED_TOPIC = (find(topicRows, row => !row.can_opt_out) ?? topicRows[0])
  .name;
const UNLOCKED_TOPIC = (find(topicRows, row => row.can_opt_out) ?? topicRows[0])
  .name;

/** The preference-record key for one topic x channel pair (`NotificationsModel`). */
const key = (topicId: string, channelId: string): string =>
  `${topicId}::${channelId}`;

const isOptedOut = (topicId: string, channelId: string): boolean =>
  some(
    optOutRows,
    row => row.topic_id === topicId && row.channel_id === channelId
  );

const firstChannelId = channelRows[0].id;

/** An unlocked topic whose first channel is currently ON — a pair to turn OFF. */
const unlockedOnTopicId = (
  find(
    topicRows,
    row => row.can_opt_out && !isOptedOut(row.id, firstChannelId)
  ) ?? topicRows[0]
).id;

/** A SECOND unlocked-on topic, distinct from the first — the pair a second save turns off. */
const secondUnlockedOnTopicId = (
  find(
    topicRows,
    row =>
      row.can_opt_out &&
      row.id !== unlockedOnTopicId &&
      !isOptedOut(row.id, firstChannelId)
  ) ?? topicRows[0]
).id;

/** A topic whose EVERY channel is already opted out — the fully-off topic. */
const fullyOffTopicId = (
  find(topicRows, row =>
    every(channelRows, channel => isOptedOut(row.id, channel.id))
  ) ?? topicRows[0]
).id;

/** Every topic x channel pair key, in grid order. */
const ALL_PAIRS = flatMap(topicRows, topic =>
  map(channelRows, channel => key(topic.id, channel.id))
);

const lockedTopicId = (find(topicRows, row => !row.can_opt_out) ?? topicRows[0])
  .id;

const EDITOR = {
  /** The pair AC-3/AC-5 turn off: an unlocked topic x its first channel. */
  offPair: key(unlockedOnTopicId, firstChannelId),
  /** A second, distinct unlocked pair — the one a SECOND save turns off (AC-3). */
  secondOffPair: key(secondUnlockedOnTopicId, firstChannelId),
  /** A locked topic x its first channel — the opt-out the server refuses (AC-6/AC-7). */
  lockedPair: key(lockedTopicId, firstChannelId),
  /** The keys of the opt-outs the server already holds. */
  preExisting: map(optOutRows, row => key(row.topic_id, row.channel_id)),
  /** Every channel of the fully-off topic — AC-4 turns them all back on. */
  fullyOffPairs: map(channelRows, channel => key(fullyOffTopicId, channel.id)),
  /** A pair ON and untouched by any scenario — proves the grid stays present. */
  anOnPair: key(
    (
      find(
        topicRows,
        row =>
          row.can_opt_out &&
          row.id !== unlockedOnTopicId &&
          row.id !== secondUnlockedOnTopicId &&
          row.id !== fullyOffTopicId &&
          !isOptedOut(row.id, firstChannelId)
      ) ?? topicRows[0]
    ).id,
    firstChannelId
  )
} as const;

/**
 * The whole grid as the server holds it (every pair enabled unless already
 * opted out), with the given overrides applied — the draft a save writes back
 * in full. Building the WHOLE draft, not a partial, is how the consuming form
 * saves; a partial input would drop the opt-outs already held.
 */
const gridWith = (
  overrides: Record<string, boolean>
): Record<string, boolean> => ({
  ...fromPairs(
    map(ALL_PAIRS, pairKey => {
      const [topicId, channelId] = pairKey.split("::");
      return [pairKey, !isOptedOut(topicId, channelId)];
    })
  ),
  ...overrides
});

/** The preference-record projection asserting each of `pairs` holds `value`. */
const expects = (
  pairs: readonly string[],
  value: boolean
): Record<string, boolean> =>
  fromPairs(map(pairs, pairKey => [pairKey, value]));

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the composable settles on it. */
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

/** Boots the aggregate editor bare and waits for it to load the whole grid. */
async function openEditor(world: World): Promise<void> {
  await world.boot(CLIENT_NOTIFICATIONS_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
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
  // --- Background ------------------------------------------------------------

  Given(
    "I am an authenticated client managing my own notification preferences",
    world =>
      world.boot(CLIENT_NOTIFICATIONS_SCENARIO, {
        actor: ScopeActorTypes.SELF
      })
  );

  // --- Collection read preconditions -----------------------------------------

  Given("my whole notification grid is ready to read", world => open(world));
  Given("one of my topics is locked and another is not", world => open(world));
  Given("my notification preferences are ready to read", world => open(world));

  // --- Collection reads ------------------------------------------------------

  When("I open my notification preferences", world => open(world));
  When("I read my whole notification grid", world => open(world));
  When("I view my notification preferences", world => open(world));
  When("I wait for my notification preferences to be ready", world =>
    open(world)
  );
  When("I look for a way to filter or sort the grid", async () => {});

  Then("I see every notification topic offered to me", world =>
    settles(() => world.expectContext({ topics: ALL_TOPICS }))
  );
  Then("I see every channel my notifications can be delivered on", world =>
    settles(() => world.expectContext({ channels: ALL_CHANNELS }))
  );
  Then("my preferences are available to read without error", world =>
    settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );
  Then("I see every topic and every channel of my grid at once", world =>
    seesWholeGrid(world)
  );
  Then("I can see whether they are loading, errored, or ready", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );
  Then("they settle as ready without error", world =>
    settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );
  Then("the locked topic is shown as one I cannot opt out of", world =>
    settles(() =>
      world.expectContext({
        topics: [{ name: LOCKED_TOPIC, meta: { isMandatory: true } }]
      })
    )
  );
  Then("the other topic is shown as one I can", world =>
    settles(() =>
      world.expectContext({
        topics: [{ name: UNLOCKED_TOPIC, meta: { isMandatory: false } }]
      })
    )
  );
  Then(
    "my whole grid is present, so there is nothing a filter would reveal",
    world => seesWholeGrid(world)
  );

  // --- The aggregate EDITOR --------------------------------------------------

  Given("my preferences are open in the editor", world => openEditor(world));

  When("I turn one channel off for an unlocked topic and save", async world => {
    await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
      preferences: gridWith(expects([EDITOR.offPair], false))
    });
    await settles(() => world.expectMeta({ isDirty: true }));
    await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.update);
    await settles(() => world.expectMeta({ isProcessing: false }));
  });

  Then("that pair is recorded as off for me", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.offPair], false) }
      })
    )
  );

  Then("every opt-out I already had is still recorded", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects(EDITOR.preExisting, false) }
      })
    )
  );

  When(
    "I turn one channel off for an unlocked topic, save, and let it settle",
    async world => {
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
        preferences: gridWith(expects([EDITOR.offPair], false))
      });
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.update);
      await settles(() =>
        world.expectMeta({ isProcessing: false, isDirty: false })
      );
    }
  );

  Then("the pair I changed still reads as off", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.offPair], false) }
      })
    )
  );

  Then("my whole preference grid is still present, not emptied", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.anOnPair], true) }
      })
    )
  );

  When(
    "I turn every channel back on for a topic that was fully off and save",
    async world => {
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
        preferences: gridWith(expects(EDITOR.fullyOffPairs, true))
      });
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.update);
      await settles(() => world.expectMeta({ isProcessing: false }));
    }
  );

  Then("that topic reaches me on every channel", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects(EDITOR.fullyOffPairs, true) }
      })
    )
  );

  When(
    "I turn one channel off for an unlocked topic without saving, then revert",
    async world => {
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
        preferences: gridWith(expects([EDITOR.offPair], false))
      });
      await settles(() => world.expectMeta({ isDirty: true }));
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.revert);
    }
  );

  Then("the editor holds no unsaved change", world =>
    settles(() => world.expectMeta({ isDirty: false }))
  );

  When("I try to turn a locked topic's channel off", world =>
    world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
      preferences: gridWith(expects([EDITOR.lockedPair], false))
    })
  );

  Then(
    "the editor keeps that locked topic reaching me on that channel",
    world =>
      settles(() =>
        world.expectContext({
          model: { preferences: expects([EDITOR.lockedPair], true) }
        })
      )
  );

  Then(
    "it reports no unsaved change, because an essential topic cannot be opted out",
    world => settles(() => world.expectMeta({ isDirty: false }))
  );

  // --- AC-7: a save the server rejects ---------------------------------------

  Given("I have a change waiting to save", async world => {
    await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
      preferences: gridWith(expects([EDITOR.offPair], false))
    });
    await settles(() => world.expectMeta({ isDirty: true }));
  });

  When("my save of the aggregate is rejected by the server", world =>
    world
      .fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.update)
      .catch(() => undefined)
  );

  Then("I am told the save failed", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );

  Then("my change is still there to save again", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.offPair], false) }
      })
    )
  );

  // --- AC-3: a second save carries the whole current set ---------------------

  Given(
    "I have turned one channel off for an unlocked topic and saved",
    async world => {
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
        preferences: gridWith(expects([EDITOR.offPair], false))
      });
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.update);
      await settles(() =>
        world.expectMeta({ isProcessing: false, isDirty: false })
      );
    }
  );

  When(
    "I turn a different channel off for another unlocked topic and save again",
    async world => {
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
        preferences: gridWith(
          expects([EDITOR.offPair, EDITOR.secondOffPair], false)
        )
      });
      await settles(() => world.expectMeta({ isDirty: true }));
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.update);
      await settles(() => world.expectMeta({ isProcessing: false }));
    }
  );

  Then("the pair from my first save is still turned off", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.offPair], false) }
      })
    )
  );

  Then("the pair from my second save is turned off", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.secondOffPair], false) }
      })
    )
  );

  // --- AC-16: open before the session resolves, edit once it does -------------
  // The editor boots signed-out (unavailable). The replay tops the client
  // session up at the "session later resolves" step WITHOUT reopening the editor;
  // the live instance reacts and becomes editable.

  Given(
    "I open my notification preferences before my session has resolved who I am",
    async world => {
      await world.boot(CLIENT_NOTIFICATIONS_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await world
        .fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.isReady)
        .catch(() => undefined);
      await settles(() => world.expectMeta({ isAvailable: false }));
    }
  );

  When("my session later resolves my identity", async world => {
    await world
      .fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.isReady)
      .catch(() => undefined);
    await settles(() => world.expectMeta({ isAvailable: true }));
  });

  Then("I can change my preferences without reopening them", async world => {
    await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
      preferences: gridWith(expects([EDITOR.offPair], false))
    });
    await settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.offPair], false) }
      })
    );
  });

  // --- AC-8 / AC-10 / AC-18: the emailed link (booted with the link token) -----
  // `.as('client').withId(LINK_TOKEN)` → the module reads via `?token=`, no
  // bearer. The token is set by the replay from the scenario's own recording.

  Given(
    "I am a client who followed an emailed notification-preferences link",
    async () => {}
  );

  When("I open my preferences from that link to read the grid", async world => {
    await world.boot(CLIENT_NOTIFICATIONS_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      id: LINK_TOKEN
    });
    await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.isReady);
    await settles(() => world.expectMeta({ isAvailable: true }));
  });

  Then(
    "I see every notification topic and every channel a signed-in client sees",
    world => seesWholeGrid(world)
  );

  When(
    "I open my preferences from that link and save a change",
    async world => {
      await world.boot(CLIENT_NOTIFICATIONS_MANAGER_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        id: LINK_TOKEN
      });
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.isReady);
      await settles(() => world.expectMeta({ isAvailable: true }));
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.input, {
        preferences: gridWith(expects([EDITOR.offPair], false))
      });
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.update);
      await settles(() => world.expectMeta({ isProcessing: false }));
    }
  );

  Then("my change is recorded against the account the link addresses", world =>
    settles(() =>
      world.expectContext({
        model: { preferences: expects([EDITOR.offPair], false) }
      })
    )
  );

  Then("I am identified by the link alone", async () => {});

  When(
    "anything else on the page reads what this module publishes about me",
    async world => {
      await world.boot(CLIENT_NOTIFICATIONS_SCENARIO, {
        actor: ScopeActorTypes.CLIENT,
        id: LINK_TOKEN
      });
      await world.fire(CLIENT_NOTIFICATIONS_COVERED_ACTIONS.isReady);
      await settles(() => world.expectMeta({ isAvailable: true }));
    }
  );

  // The link token must appear NOWHERE in what the module publishes — every
  // context and meta value. `expectAbsent` serialises the whole published state
  // and fails if the token is a substring of any of it.
  Then("my link is never found anywhere in it", world =>
    settles(() =>
      world.expectAbsent!(LINK_TOKEN, CLIENT_NOTIFICATIONS_SCENARIO)
    )
  );
});

export default clientNotificationsSteps;
