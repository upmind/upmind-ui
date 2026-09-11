// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — state that must survive a
 * settled save that SHRINKS the opt-out set (integration, AC-3/AC-4/AC-5)
 *
 * ## Job To Be Done
 * `client-notifications.manager.post-save.int.test.ts` only ever GROWS the
 * opt-out set across a save. Round 2's defect shrank it — `selectAll(topicId)`
 * followed by a save left the draft holding the empty set for 250ms, then it
 * silently re-grew, and a following save re-opted-out the topic the client had
 * just enabled. Prove the opposite direction: a save that SHRINKS the set,
 * whether by `selectAll()` or by a single OFF->ON `toggle()`, holds once
 * settled — it does not re-grow, and a following save does not resurrect what
 * was just cleared.
 *
 * ## What Breaks If These Fail
 * A client enables a topic (or a single channel) and saves; the notification
 * silently re-disables itself moments later, and the NEXT save writes the
 * re-disabled state back to the server — the client's own enable is lost
 * without ever seeing an error.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  installNotificationsReadWriteHandlers,
  recorded,
  seedClientSession,
  topicFullyOptedOut
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Past the machine's own settle transition (verify.md's observed +250ms margin). */
const PAST_SETTLE_MS = 250;

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

beforeEach(async () => {
  await seedClientSession();
});

async function openManager() {
  const manager = useClientNotificationsManager().as("client");
  await manager.useActions().isReady();
  return manager;
}

async function toggleAndSettle(
  manager: Awaited<ReturnType<typeof openManager>>,
  topicId: string,
  channelId: string
): Promise<void> {
  manager.useActions().toggle(topicId, channelId);
  await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
}

/** A recorded opt-outable topic + channel NOT already carried by the fixture's opt-out set. */
function findFreshOnPair(excludeTopicId: string): {
  topicId: string;
  channelId: string;
} {
  const optedOut = new Set(
    recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
  );
  for (const topic of recorded
    .topics()
    .data.filter(row => row.can_opt_out && row.id !== excludeTopicId)) {
    const channel = recorded
      .channels()
      .data.find(candidate => !optedOut.has(`${topic.id}:${candidate.id}`));
    if (channel) return { topicId: topic.id, channelId: channel.id };
  }
  throw new Error(
    "No fresh ON pair outside the excluded topic in the recorded capture — " +
      "re-record with `pnpm fixtures:generate client-notifications`."
  );
}

// -----------------------------------------------------------------------------

describe("AC-4 / AC-3 / AC-5 — a selectAll() shrink survives its own settle", () => {
  it("the draft holds the shrunk (emptied-for-that-topic) set once the save settles — it does not re-grow", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicFullyOptedOut(); // every channel starts OFF — real shrink material
    const channels = recorded.channels().data;

    manager.useActions().selectAll(topic.id);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    const preferences = manager.useContext().model.value.preferences;
    const falsePairsForTopic = Object.entries(preferences).filter(
      ([key, enabled]) => key.startsWith(`${topic.id}::`) && enabled === false
    );
    expect(
      falsePairsForTopic,
      "the shrunk topic's opt-out rows reappeared after the save settled"
    ).toHaveLength(0);
    for (const channel of channels) {
      expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(true);
    }
  });

  it("the topic reads all channels on once the save settles", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicFullyOptedOut();

    manager.useActions().selectAll(topic.id);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    expect(manager.useActions().isAllSelected(topic.id)).toBe(true);
  });
});

describe("AC-3 / AC-5 — a single OFF->ON toggle shrink survives its own settle", () => {
  it("the enabled pair still reads enabled once the save settles, and the topic's other opted-out pair is untouched", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicFullyOptedOut();
    const [firstOptOut, secondOptOut] = recorded
      .optOuts()
      .data.filter(row => row.topic_id === topic.id);
    expect(
      secondOptOut,
      "need two recorded opt-out rows on one topic to prove a partial shrink"
    ).toBeDefined();

    await toggleAndSettle(
      manager,
      firstOptOut.topic_id,
      firstOptOut.channel_id
    );
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    expect(
      manager
        .useContext()
        .isEnabled(firstOptOut.topic_id, firstOptOut.channel_id)
    ).toBe(true);
    expect(
      manager
        .useContext()
        .isEnabled(secondOptOut.topic_id, secondOptOut.channel_id),
      "the untouched, still-opted-out pair on the same topic was wiped by the shrink"
    ).toBe(false);
    expect(manager.useActions().isAllSelected(topic.id)).toBe(false);
  });
});

describe("AC-3 — a second save after a shrinking save never re-opts-out what was just enabled", () => {
  it("sends the current (shrunk) set first, then does not resurrect the cleared topic on the next save", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const shrunkTopic = topicFullyOptedOut();

    manager.useActions().selectAll(shrunkTopic.id);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    const firstBody = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    expect(
      firstBody.opt_outs.some(row => row.topic_id === shrunkTopic.id),
      "the shrinking save's own PUT still carried the just-cleared topic"
    ).toBe(false);

    const fresh = findFreshOnPair(shrunkTopic.id);
    await toggleAndSettle(manager, fresh.topicId, fresh.channelId);
    await manager.useActions().update();

    const bodies = handlers.bodies() as {
      opt_outs: { topic_id: string; channel_id: string }[];
    }[];
    expect(bodies).toHaveLength(2);
    const secondBody = bodies[1];

    expect(
      secondBody.opt_outs.some(row => row.topic_id === shrunkTopic.id),
      "the second save re-opted-out the topic the client had just enabled"
    ).toBe(false);
    expect(
      secondBody.opt_outs.some(
        row =>
          row.topic_id === fresh.topicId && row.channel_id === fresh.channelId
      ),
      "the second save's own toggle was missing from its own body"
    ).toBe(true);
  });
});

describe("AC-5 — revert() after a settled shrinking save restores the SAVED (shrunk) state", () => {
  it("restores the shrunk state, not the pre-save fully-opted-out state", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicFullyOptedOut();
    const channels = recorded.channels().data;

    manager.useActions().selectAll(topic.id);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    manager.useActions().revert();
    await wait(50);

    for (const channel of channels) {
      expect(
        manager.useContext().isEnabled(topic.id, channel.id),
        "revert() after a shrinking save restored the PRE-save opted-out state"
      ).toBe(true);
    }
    expect(manager.useMeta().isDirty.value).toBe(false);
  });
});
