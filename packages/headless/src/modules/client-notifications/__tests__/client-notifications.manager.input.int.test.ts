// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the `input()` write door the
 * generic form renderer drives (integration, AC-6/AC-14)
 *
 * ## Job To Be Done
 * `FormFlowSurface.vue` resolves `props.actions["set"] ?? props.actions["input"]`
 * and calls whichever exists to carry every edit a consumer makes through the
 * derived `schema`/`uischema` pair (AC-14, `design.md` §D13). Prove the door
 * this module now publishes actually writes the draft, that rapid successive
 * calls collapse to the LAST one rather than an earlier one winning (the
 * shared `dataManagerMachine` only accepts `SET` from its idle states, so an
 * undebounced burst risks the FIRST call landing and every later one in the
 * same tick being silently swallowed — the opposite failure to "stale"), that
 * a save issued immediately afterward carries what was actually typed rather
 * than a pre-debounce value, and that the SAME locked-topic guard `update(value)`
 * already carries (`client-notifications.manager.update-guard.int.test.ts`)
 * holds on this door too, both sides of it.
 *
 * ## What Breaks If These Fail
 * The playground page renders the grid but every edit is silently discarded
 * (the failure this capability exists to close) — or a caller reaching this
 * door directly writes an opt-out for an essential topic no actor may ever
 * refuse, or overcorrects and deletes a locked topic's pre-existing opt-out.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  composeOptOutRow,
  installNotificationsReadWriteHandlers,
  installNotificationsReadWriteHandlersSeeded,
  lockedTopic,
  recorded,
  seedClientSession
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

beforeEach(async () => {
  await seedClientSession();
});

async function openManager() {
  const manager = useClientNotificationsManager().as("client");
  await manager.useActions().isReady();
  return manager;
}

/** The manager's own flat-record key format (`design.md` §D13, `preferenceKey`). */
function preferenceKey(topicId: string, channelId: string): string {
  return `${topicId}::${channelId}`;
}

/** A channel + topic pair the recorded capture does NOT already carry as opted out. */
function findOnPair(): { topicId: string; channelId: string } {
  const optedOut = new Set(
    recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
  );
  for (const topic of recorded.topics().data.filter(row => row.can_opt_out)) {
    const channel = recorded
      .channels()
      .data.find(candidate => !optedOut.has(`${topic.id}:${candidate.id}`));
    if (channel) return { topicId: topic.id, channelId: channel.id };
  }
  throw new Error("No ON pair left in the recorded capture.");
}

/**
 * `count` DISTINCT ON pairs (distinct topics), each still enabled in the
 * recorded capture — used to prove a burst of `input()` calls collapses to
 * the LAST one, never an earlier one.
 */
function findOnPairs(count: number): { topicId: string; channelId: string }[] {
  const optedOut = new Set(
    recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
  );
  const pairs: { topicId: string; channelId: string }[] = [];
  for (const topic of recorded.topics().data.filter(row => row.can_opt_out)) {
    const channel = recorded
      .channels()
      .data.find(candidate => !optedOut.has(`${topic.id}:${candidate.id}`));
    if (channel) pairs.push({ topicId: topic.id, channelId: channel.id });
    if (pairs.length === count) break;
  }
  if (pairs.length < count) {
    throw new Error(
      `Only ${pairs.length} ON pairs available in the recorded capture, need ${count}.`
    );
  }
  return pairs;
}

// -----------------------------------------------------------------------------

describe("AC-14 — input() writes the draft through the form renderer's own write door", () => {
  it("a single change through input() reaches the draft and marks the editor dirty", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    const key = preferenceKey(topicId, channelId);
    const before = manager.useContext().model.value.preferences;

    manager.useActions().input({ preferences: { ...before, [key]: false } });

    await vi.waitFor(() =>
      expect(manager.useContext().model.value.preferences[key]).toBe(false)
    );
    expect(manager.useMeta().isDirty.value).toBe(true);
  });

  it("several rapid input() calls collapse to the LAST call's value, never an earlier one", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const [pairA, pairB, pairC] = findOnPairs(3);
    const keyA = preferenceKey(pairA.topicId, pairA.channelId);
    const keyB = preferenceKey(pairB.topicId, pairB.channelId);
    const keyC = preferenceKey(pairC.topicId, pairC.channelId);
    const before = manager.useContext().model.value.preferences;

    // Each call in this synchronous burst is STRICTLY more complete than the
    // last — the earlier-wins failure (an undebounced SET the machine's idle
    // states swallow while busy) leaves keyB/keyC at their untouched (`true`)
    // starting value; only a genuine last-call-wins collapse flips all three.
    manager.useActions().input({ preferences: { ...before, [keyA]: false } });
    manager.useActions().input({
      preferences: { ...before, [keyA]: false, [keyB]: false }
    });
    manager.useActions().input({
      preferences: { ...before, [keyA]: false, [keyB]: false, [keyC]: false }
    });

    await vi.waitFor(() => {
      expect(manager.useContext().model.value.preferences[keyC]).toBe(false);
    });
    expect(manager.useContext().model.value.preferences[keyA]).toBe(false);
    expect(manager.useContext().model.value.preferences[keyB]).toBe(false);
  });

  it("a save immediately after input() sends what was actually typed, never a stale pre-debounce value", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    const key = preferenceKey(topicId, channelId);
    const before = manager.useContext().model.value.preferences;

    // ONE actions handle for both calls — the flush `update()` runs internally
    // (`debouncedInput.flush()`) only has something to flush against the SAME
    // debouncer `input()` scheduled it on; a fresh `useActions()` call per verb
    // would mint a SECOND, independent debouncer with nothing pending, exactly
    // the shape `useClientPhoneManager.ts`'s own "ONE actions instance per
    // scope, not one per useActions() call" note exists to prevent.
    const actions = manager.useActions();
    actions.input({ preferences: { ...before, [key]: false } });
    await actions.update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    expect(
      body.opt_outs.some(
        row => row.topic_id === topicId && row.channel_id === channelId
      ),
      "the save reached the server BEFORE the debounced input had flushed into the draft"
    ).toBe(true);
  });
});

describe("AC-6 — input() refuses to newly opt a locked topic out", () => {
  it("input() refuses to newly opt a locked topic out — the draft holds, and a save afterward carries no row for it", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const locked = lockedTopic();
    // NEVER `.data[0]` — this recorded capture's topic/channel uuids COLLIDE
    // across the two resources (a fixture-provenance fact, never hand-changed).
    const lockedChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const { topicId: legitTopicId, channelId: legitChannelId } = findOnPair();
    const before = manager.useContext().model.value.preferences;

    manager.useActions().input({
      preferences: {
        ...before,
        [preferenceKey(legitTopicId, legitChannelId)]: false,
        [preferenceKey(locked.id, lockedChannel.id)]: false
      }
    });

    await vi.waitFor(() => {
      expect(manager.useContext().isEnabled(legitTopicId, legitChannelId)).toBe(
        false
      );
    });
    expect(manager.useContext().isEnabled(locked.id, lockedChannel.id)).toBe(
      true
    );

    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    expect(
      body.opt_outs.some(row => row.topic_id === locked.id),
      "a locked topic's row reached the server via input() — the same guard update(value) already carries was not run on this door"
    ).toBe(false);
    expect(
      body.opt_outs.some(
        row =>
          row.topic_id === legitTopicId && row.channel_id === legitChannelId
      )
    ).toBe(true);
  });
});

describe("AC-6 — a pre-existing locked-topic opt-out survives an unrelated input()", () => {
  it("a pre-existing locked-topic opt-out survives an unrelated input(), through to the wire", async () => {
    const locked = lockedTopic();
    const preExistingChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const preExistingRow = composeOptOutRow(
      locked.id,
      preExistingChannel.id,
      "locked-preexisting-input"
    );
    const seed = [...recorded.optOuts().data, preExistingRow];
    const handlers = installNotificationsReadWriteHandlersSeeded(server, seed);

    const manager = await openManager();
    const draftAtOpen = manager.useContext().model.value.preferences;
    expect(
      draftAtOpen[preferenceKey(locked.id, preExistingChannel.id)],
      "the pre-existing locked-topic opt-out was not seeded into the draft at open"
    ).toBe(false);

    const { topicId: legitTopicId, channelId: legitChannelId } = findOnPair();

    manager.useActions().input({
      preferences: {
        ...draftAtOpen,
        [preferenceKey(legitTopicId, legitChannelId)]: false
      }
    });

    await vi.waitFor(() => {
      expect(manager.useContext().isEnabled(legitTopicId, legitChannelId)).toBe(
        false
      );
    });
    expect(
      manager.useContext().isEnabled(locked.id, preExistingChannel.id),
      "a naive locked-topic filter dropped the pre-existing row from the draft itself"
    ).toBe(false);

    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    expect(
      body.opt_outs.some(
        row =>
          row.topic_id === locked.id && row.channel_id === preExistingChannel.id
      ),
      "a naive locked-topic filter dropped a PRE-EXISTING row carried through input() — data destroyed, not merely refused"
    ).toBe(true);
    expect(
      body.opt_outs.some(
        row =>
          row.topic_id === legitTopicId && row.channel_id === legitChannelId
      )
    ).toBe(true);
    expect(body.opt_outs).toHaveLength(seed.length + 1);
  });
});
