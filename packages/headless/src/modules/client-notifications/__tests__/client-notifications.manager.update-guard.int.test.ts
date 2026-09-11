// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the locked-topic guard on
 * `update(value)`, the door `toggle()`/`clearAll()` do not exercise
 * (integration, AC-6)
 *
 * ## Job To Be Done
 * `parity.yaml`'s `locked-topic-rule` reads "toggle / clearAll / update EACH
 * refuse a topic whose canOptOut is false." Prove BOTH halves of the rule
 * on the `update(value)` door, since that is the only door the rule's
 * server-side filter (`sanitizeLockedOptOuts`) runs on:
 *
 *  1. a NEWLY added locked-topic row passed to `update(value)` never reaches
 *     the server, even though the rest of the same payload does; and
 *  2. a PRE-EXISTING server-held opt-out on a topic that has since become
 *     locked, carried forward inside the SAME `update(value)` payload,
 *     survives — a guard that filters every locked-topic row indiscriminately
 *     would silently delete it.
 *
 * A third test proves the no-argument `update()` door separately: it forwards
 * whatever is already in the draft verbatim, because `sanitizeLockedOptOuts`
 * only runs when `update` is called WITH a value. It cannot flip red under a
 * mutation to that filter's clauses — it is proving a different door exists
 * and is not itself filtered, not proving the filter's own correctness.
 *
 * The pre-existing row is COMPOSED from the recorded capture's own opt-out
 * row shape (`composeOptOutRow`) — a real capture never carries a
 * `can_opt_out:false` topic already opted out, since the oracle refuses that
 * combination going forward, so the ONLY honest way to prove this half is by
 * building server state from the fixture's own shape, never a hand-authored
 * fixture file (`verify-cosplay.companion.md`).
 *
 * ## What Breaks If These Fail
 * A caller that skips the UI and calls `update(value)` directly writes an
 * opt-out for an essential topic no actor may ever refuse (test 1) — or the
 * fix for that overcorrects and deletes a locked topic's opt-out the server
 * already held before it became locked, silently re-enabling a notification
 * the account had turned off (test 2).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  composeOptOutRow,
  installNotificationsReadWriteHandlers,
  installNotificationsReadWriteHandlersSeeded,
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

// -----------------------------------------------------------------------------

describe("AC-6 — update(value) refuses to newly opt a locked topic out", () => {
  it("a NEW locked-topic row passed to update() never reaches the server, but the rest of the same save does", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const locked = recorded.topics().data.find(row => !row.can_opt_out);
    if (!locked) throw new Error("no locked topic in the recorded capture");
    // NEVER `.data[0]` here: this recorded capture's topic/channel uuids
    // COLLIDE across the two resources (a fixture-provenance fact, never
    // hand-changed) — a fixed-index channel can equal the locked topic's own
    // id, masking any topicId/channelId transposition bug.
    const lockedChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const { topicId: legitTopicId, channelId: legitChannelId } = findOnPair();

    const currentPreferences = manager.useContext().model.value.preferences;

    await manager.useActions().update({
      preferences: {
        ...currentPreferences,
        [preferenceKey(legitTopicId, legitChannelId)]: false,
        [preferenceKey(locked.id, lockedChannel.id)]: false
      }
    });

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };

    expect(
      body.opt_outs.some(row => row.topic_id === locked.id),
      "a locked topic's row reached the server via update(value) — the same " +
        "bug PROBE E recorded (PUT sizes=[3], locked row present)"
    ).toBe(false);
    expect(
      body.opt_outs.some(
        row =>
          row.topic_id === legitTopicId && row.channel_id === legitChannelId
      ),
      "the legitimate row in the SAME payload was also dropped — this must " +
        "be a selective refusal, not a wholesale one"
    ).toBe(true);
    expect(manager.useContext().isEnabled(locked.id, lockedChannel.id)).toBe(
      true
    );
  });
});

describe("AC-6 — a pre-existing locked-topic opt-out survives an unrelated update(value)", () => {
  it("a locked topic's row the server already held before it became locked is carried forward, unfiltered, inside a save that also adds a legitimate row", async () => {
    const locked = recorded.topics().data.find(row => !row.can_opt_out);
    if (!locked) throw new Error("no locked topic in the recorded capture");
    // See the fixture-id-collision note above.
    const preExistingChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const preExistingRow = composeOptOutRow(
      locked.id,
      preExistingChannel.id,
      "locked-preexisting"
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

    await manager.useActions().update({
      preferences: {
        ...draftAtOpen,
        [preferenceKey(legitTopicId, legitChannelId)]: false
      }
    });

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };

    expect(
      body.opt_outs.some(
        row =>
          row.topic_id === locked.id && row.channel_id === preExistingChannel.id
      ),
      "a naive locked-topic filter dropped a PRE-EXISTING row carried inside " +
        "update(value) — data destroyed, not merely refused"
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

describe("AC-6 — the no-argument update() door forwards the draft verbatim", () => {
  it("a locked topic's pre-existing row already in the draft is still sent when update() is called with no argument after an unrelated toggle", async () => {
    const locked = recorded.topics().data.find(row => !row.can_opt_out);
    if (!locked) throw new Error("no locked topic in the recorded capture");
    // See the fixture-id-collision note above.
    const preExistingChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const preExistingRow = composeOptOutRow(
      locked.id,
      preExistingChannel.id,
      "locked-preexisting-noarg"
    );
    const seed = [...recorded.optOuts().data, preExistingRow];
    const handlers = installNotificationsReadWriteHandlersSeeded(server, seed);

    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    manager.useActions().toggle(topicId, channelId);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
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
      "the no-argument update() door resent the current draft and dropped a " +
        "row already in it — this door does not run the locked-topic filter " +
        "at all, so this assertion does not exercise that filter's clauses"
    ).toBe(true);
    expect(
      body.opt_outs.some(
        row => row.topic_id === topicId && row.channel_id === channelId
      )
    ).toBe(true);
    expect(body.opt_outs).toHaveLength(seed.length + 1);
  });
});
