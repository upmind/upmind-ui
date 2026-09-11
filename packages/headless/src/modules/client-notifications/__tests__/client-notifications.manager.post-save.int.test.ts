// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — state that must survive a
 * settled save (integration, AC-3/AC-5)
 *
 * ## Job To Be Done
 * The shipped suite asserted the editor's post-save state only at the
 * instant `update()` resolves — before the machine's own settle transition.
 * Prove the draft, the toggled pair, the dirty flag and a SECOND save all
 * survive PAST that settle, never at the instant the PUT resolves.
 *
 * ## What Breaks If These Fail
 * A save destroys its own draft moments after it succeeds: the model
 * empties, the pair just turned off reads enabled again, and a following
 * save PUTs an empty opt-out set — silently re-enabling every notification
 * on the account.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  installNotificationsReadWriteHandlers,
  recorded,
  seedClientSession
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Past the machine's own settle transition (verify.md's observed +200ms margin). */
const PAST_SETTLE_MS = 250;

/** The manager's own per-topic bulk-toggle sentinel channel id (`design.md` gap-closure). */
const SELECT_ALL_CHANNEL_ID = "__all";

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

beforeEach(async () => {
  await seedClientSession();
});

/** A channel + topic pair the recorded capture does NOT already carry as opted out. */
function findOnPair(exclude?: { topicId: string; channelId: string }): {
  topicId: string;
  channelId: string;
} {
  const optedOut = new Set(
    recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
  );
  if (exclude) optedOut.add(`${exclude.topicId}:${exclude.channelId}`);

  for (const topic of recorded.topics().data.filter(row => row.can_opt_out)) {
    const channel = recorded
      .channels()
      .data.find(candidate => !optedOut.has(`${topic.id}:${candidate.id}`));
    if (channel) return { topicId: topic.id, channelId: channel.id };
  }
  throw new Error(
    "No ON pair left in the recorded capture to prove a second, independent " +
      "toggle — re-record with `pnpm fixtures:generate client-notifications`."
  );
}

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

// -----------------------------------------------------------------------------

describe("AC-3 / AC-5 — the draft that survives a settled save", () => {
  it("still holds the saved set once the save settles — it does not empty", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    const preferences = manager.useContext().model.value.preferences;
    // Excludes the per-topic bulk-toggle sentinel entries (`::__all`) — they
    // address no real channel, so counting them as opted-out pairs inflates
    // this count by one per topic, off by exactly the sentinel count.
    const falsePairs = Object.entries(preferences).filter(
      ([key, enabled]) =>
        enabled === false && !key.endsWith(`::${SELECT_ALL_CHANNEL_ID}`)
    );
    expect(falsePairs).toHaveLength(recorded.optOuts().data.length + 1);
  });

  it("the pair just turned off still reads disabled once the save settles", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(false);
  });

  it("isDirty clears once a successful save settles", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    expect(manager.useMeta().isDirty.value).toBe(false);
  });

  it("a second, independent save after the first settles sends the CURRENT FULL set — never empty, never a diff", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const first = findOnPair();

    await toggleAndSettle(manager, first.topicId, first.channelId);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    const second = findOnPair(first);
    await toggleAndSettle(manager, second.topicId, second.channelId);
    await manager.useActions().update();

    const bodies = handlers.bodies() as {
      opt_outs: { topic_id: string; channel_id: string }[];
    }[];
    expect(bodies).toHaveLength(2);

    const secondBody = bodies[1];
    expect(
      secondBody.opt_outs.length,
      "the second save sent an EMPTY opt-out set — every notification on the account would be re-enabled"
    ).toBeGreaterThan(0);

    for (const row of recorded.optOuts().data) {
      expect(
        secondBody.opt_outs.some(
          sent =>
            sent.topic_id === row.topic_id && sent.channel_id === row.channel_id
        ),
        `prior opt-out ${row.topic_id}:${row.channel_id} was dropped from the second save`
      ).toBe(true);
    }
    expect(
      secondBody.opt_outs.some(
        sent =>
          sent.topic_id === first.topicId && sent.channel_id === first.channelId
      ),
      "the FIRST save's toggle was dropped from the second save's body"
    ).toBe(true);
    expect(
      secondBody.opt_outs.some(
        sent =>
          sent.topic_id === second.topicId &&
          sent.channel_id === second.channelId
      ),
      "the SECOND toggle was missing from its own save's body"
    ).toBe(true);
  });

  it("revert() after a settled save restores the SAVED state, not the pre-save state", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(true);

    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    manager.useActions().revert();
    await wait(50);

    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(false);
  });
});
