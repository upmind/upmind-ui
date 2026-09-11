// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — a rejected save can be
 * retried (integration, AC-7)
 *
 * ## Job To Be Done
 * The oracle's Save stays clickable and re-issues the PUT after a rejection
 * (`NotificationPreferences.vue:200-209`). AC-7's existing suite proved the
 * draft SURVIVES a rejected save — but surviving is pointless if the same
 * value can never be retried. Prove that calling `update()` again after a
 * rejection issues a SECOND PUT, carrying the SAME value as the first, and
 * that `isDirty` and the toggled value are still intact right before that
 * retry (AC-7 unregressed). Assert the PUT COUNT, not merely the absence of
 * a thrown error — a suite that only checks "no throw" would stay green even
 * if the retry silently no-ops.
 *
 * ## What Breaks If These Fail
 * A save the server rejects strands the client — the draft is kept, but
 * there is no way to try again except reloading the page and re-entering the
 * change from scratch.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  installNotificationsReadWriteHandlers,
  installOptOutsWriteRejectionHandler,
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

async function toggleAndSettle(
  manager: Awaited<ReturnType<typeof openManager>>,
  topicId: string,
  channelId: string
): Promise<void> {
  manager.useActions().toggle(topicId, channelId);
  await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
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

describe("AC-7 — a rejected save can be retried with the same change", () => {
  it("retrying update() after a rejected save issues a SECOND PUT carrying the same value", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    await toggleAndSettle(manager, topicId, channelId);

    const rejection = installOptOutsWriteRejectionHandler(server, 422);
    await manager
      .useActions()
      .update()
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(manager.useContext().error.value).toBeDefined();
    });
    expect(
      rejection.bodies(),
      "the first, rejected save did not even reach the server"
    ).toHaveLength(1);
    expect(manager.useMeta().isDirty.value).toBe(true);
    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(false);

    await manager
      .useActions()
      .update()
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(
        rejection.bodies().length,
        "PROBE D2 recorded 0 retry PUTs — retrying a rejected save must " +
          "issue a SECOND request, not silently no-op"
      ).toBe(2);
    });

    const bodies = rejection.bodies() as {
      opt_outs: { topic_id: string; channel_id: string }[];
    }[];
    expect(bodies[1].opt_outs).toEqual(bodies[0].opt_outs);
  });
});
