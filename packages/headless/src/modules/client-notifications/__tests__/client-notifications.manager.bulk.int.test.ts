// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the per-topic bulk-toggle
 * sentinel (integration, AC-4/AC-6, gap-closure 2026-09-01)
 *
 * ## Job To Be Done
 * Per-topic bulk toggling carries one sentinel entry per topic in the model,
 * `preferenceKey(topicId, "__all")` (`SELECT_ALL_CHANNEL_ID = "__all"`,
 * `client-notifications.mappers.ts`), so a bulk control can reflect
 * `isAllSelected` at a glance. The sentinel is deliberately IN the model
 * (so the control has something to bind to) and deliberately NEVER on the
 * wire (`toOptOutRequestRows` skips it unconditionally, first).
 *
 * Three capabilities, none proven by the existing selectAll()/clearAll()
 * specs:
 *  1. the control tells the truth after an ORDINARY single-channel toggle,
 *     not only after its own bulk action — a control that only updates on
 *     its own trigger is a momentary flash, not a state;
 *  2. the SAME two-sided locked-topic rule toggle/update/input already carry
 *     holds on the bulk door too — refusal AND preservation of a pre-existing
 *     locked row, proven through a save that also legitimately bulk-clears a
 *     DIFFERENT topic. (Empirically, `clearAll()`'s own per-topic guard is
 *     what refuses it — the shared `sanitizeLockedPreferences` mutants
 *     (negative controls 08/09) do not redden this test, so this file makes
 *     no claim about which function enforces it, only that the behaviour
 *     holds; control 11 independently proves this assertion is not a
 *     tautology.)
 *  3. the sentinel itself never reaches the server as a bogus opt-out row —
 *     `splitPreferenceKey` on it yields a real, syntactically valid
 *     `{ topicId, channelId: "__all" }` pair, which is exactly the shape a
 *     regression would leak onto the wire.
 *
 * ## What Breaks If These Fail
 * The bulk affordance renders "all on" after the user has already turned one
 * channel back off (test 1); a bulk clear either writes an essential topic's
 * opt-out the server must never accept, or silently re-enables a locked
 * topic's pre-existing opt-out the moment an unrelated bulk action saves
 * (test 2); or the server receives a `channel_id: "__all"` row — a row no
 * real channel corresponds to, and the receiving end cannot even reject as
 * clearly malformed (test 3).
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

/** The manager's own per-topic bulk-toggle sentinel channel id (`design.md` gap-closure). */
const SELECT_ALL_CHANNEL_ID = "__all";

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

/**
 * An opt-outable topic the recorded capture carries NO opt-out for — every
 * one of its channels starts ON, so a bulk clear against it produces exactly
 * `channels.length` new rows, and a single toggle against it produces exactly
 * one, both real transitions rather than trivially-true starting states.
 */
function topicWithNoPreexistingOptOuts() {
  const topic = recorded
    .topics()
    .data.find(
      candidate =>
        candidate.can_opt_out &&
        !recorded.optOuts().data.some(row => row.topic_id === candidate.id)
    );
  if (!topic) {
    throw new Error(
      "No opt-outable topic with zero pre-existing opt-outs in the recorded " +
        "capture — re-record with `pnpm fixtures:generate client-notifications`."
    );
  }
  return topic;
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

// -----------------------------------------------------------------------------

describe("AC-4 — the bulk affordance's own state reflects the real channels, not a frozen trigger", () => {
  it("the bulk affordance's own state flips off the moment a single channel is turned off, and back on once every channel is again enabled", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;
    const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);

    expect(manager.useActions().isAllSelected(topic.id)).toBe(true);
    expect(manager.useContext().model.value.preferences[sentinelKey]).toBe(
      true
    );

    manager.useActions().toggle(topic.id, channels[0].id);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));

    expect(
      manager.useActions().isAllSelected(topic.id),
      "isAllSelected() still reported true after one channel was turned off"
    ).toBe(false);
    expect(
      manager.useContext().model.value.preferences[sentinelKey],
      "the sentinel entry in the draft itself still read true — a momentary trigger, never recomputed to reflect the real state"
    ).toBe(false);

    manager.useActions().toggle(topic.id, channels[0].id);
    await vi.waitFor(() =>
      expect(manager.useContext().isEnabled(topic.id, channels[0].id)).toBe(
        true
      )
    );

    expect(manager.useActions().isAllSelected(topic.id)).toBe(true);
    expect(manager.useContext().model.value.preferences[sentinelKey]).toBe(
      true
    );
  });
});

describe("AC-6 — a bulk clear on a locked topic is refused, and a pre-existing locked opt-out survives an unrelated bulk clear", () => {
  it("clearAll() on a locked topic changes nothing, and a pre-existing opt-out on that locked topic survives a legitimate clearAll() elsewhere, through to the wire", async () => {
    const locked = lockedTopic();
    // NEVER `.data[0]`: this recorded capture's topic/channel uuids COLLIDE
    // across the two resources (a fixture-provenance fact, never hand-changed
    // — `verify-cosplay.companion.md`), so a fixed-index channel can equal the
    // locked topic's own id.
    const preExistingChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const preExistingRow = composeOptOutRow(
      locked.id,
      preExistingChannel.id,
      "bulk-clear-preexisting"
    );
    const seed = [...recorded.optOuts().data, preExistingRow];
    const handlers = installNotificationsReadWriteHandlersSeeded(server, seed);
    const manager = await openManager();

    expect(
      manager.useContext().isEnabled(locked.id, preExistingChannel.id),
      "the pre-existing locked-topic opt-out was not seeded into the draft at open"
    ).toBe(false);

    manager.useActions().clearAll(locked.id);
    await new Promise(resolve => setTimeout(resolve, 20));

    for (const channel of recorded.channels().data) {
      if (channel.id === preExistingChannel.id) continue;
      expect(manager.useContext().isEnabled(locked.id, channel.id)).toBe(true);
    }
    expect(manager.useMeta().isDirty.value).toBe(false);

    const { topicId: legitTopicId } = findOnPair();
    const legitTopic = recorded
      .topics()
      .data.find(row => row.id === legitTopicId)!;
    expect(legitTopic.can_opt_out).toBe(true);

    manager.useActions().clearAll(legitTopicId);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };

    const lockedRows = body.opt_outs.filter(row => row.topic_id === locked.id);
    expect(
      lockedRows,
      "the locked topic's rows on the wire must be EXACTLY the one pre-existing row — no fewer (dropped), no more (the refused clearAll leaked through)"
    ).toEqual([{ topic_id: locked.id, channel_id: preExistingChannel.id }]);
    for (const channel of recorded.channels().data) {
      expect(
        body.opt_outs.some(
          row => row.topic_id === legitTopicId && row.channel_id === channel.id
        ),
        `the legitimate bulk clear's own row for channel ${channel.id} was missing`
      ).toBe(true);
    }
  });
});

describe("the wire projection — the bulk affordance's own key never reaches the server", () => {
  it("after a bulk clear and a save, the PUT body carries one row per real channel and never a row for the bulk affordance's own sentinel key", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;

    manager.useActions().clearAll(topic.id);
    await vi.waitFor(() => {
      for (const channel of channels) {
        expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(
          false
        );
      }
    });
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    const thisTopicRows = body.opt_outs.filter(
      row => row.topic_id === topic.id
    );

    expect(
      thisTopicRows,
      "the bulk-cleared topic did not produce exactly one wire row per real channel"
    ).toHaveLength(channels.length);
    expect(
      body.opt_outs.some(row => row.channel_id === SELECT_ALL_CHANNEL_ID),
      "a wire row addressed the bulk affordance's own sentinel channel id — a real, bogus opt-out row no real channel corresponds to"
    ).toBe(false);
    expect(
      body.opt_outs.every(row =>
        channels.some(channel => channel.id === row.channel_id)
      ),
      "every wire row's channel_id must resolve to a real recorded channel"
    ).toBe(true);
  });
});
