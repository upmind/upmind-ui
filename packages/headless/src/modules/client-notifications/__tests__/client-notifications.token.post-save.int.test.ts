// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications token cell — post-save state (integration, AC-8)
 *
 * ## Job To Be Done
 * Prove, for a client identified only by the emailed link token: the draft
 * survives a settled save, `isDirty` clears, and a second save carries the
 * CURRENT full set, still identified by `?token=` with NO `Authorization`
 * header (A7 — identity transport asserted on the request that went out,
 * never the response body).
 *
 * The response shape served here is the SAME recorded `client x self` capture
 * (via `installNotificationsReadWriteHandlers`, the sanctioned inherited-shape
 * precedent) — never a hand-authored fixture presented as recorded.
 *
 * ## What Breaks If These Fail
 * The link case's post-save behaviour past the instant a save resolves — the
 * blind spot that let both prior rounds' draft corruption ship.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  installNotificationsReadWriteHandlers,
  observeNotificationsRequests,
  seedGuestFloor
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const TOKEN = "notifications-link-token-post-save";

/** Past the machine's own settle transition (verify.md's observed +250ms margin). */
const PAST_SETTLE_MS = 250;

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

beforeEach(async () => {
  await seedGuestFloor();
});

async function openLinkManager() {
  const manager = useClientNotificationsManager().as("client").withId(TOKEN);
  await manager.useActions().isReady();
  return manager;
}

async function toggleAndSettle(
  manager: Awaited<ReturnType<typeof openLinkManager>>,
  topicId: string,
  channelId: string
): Promise<void> {
  manager.useActions().toggle(topicId, channelId);
  await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
}

// -----------------------------------------------------------------------------

describe("AC-8 — a link-following client's saved preferences survive the save settling", () => {
  it("the toggled pair still reads as saved, and isDirty clears, once the save settles", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openLinkManager();
    const lookups = manager.useContext().lookups.value;
    const topic = lookups.topics.find(t => t.canOptOut)!;
    const channel = lookups.channels[0];

    await toggleAndSettle(manager, topic.id, channel.id);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(false);
    expect(manager.useMeta().isDirty.value).toBe(false);
    expect(
      manager.useContext().model.value.preferences[
        `${topic.id}::${channel.id}`
      ],
      "the draft lost the pair it had just saved once the save settled"
    ).toBe(false);
  });
});

describe("AC-8 — a second save from a link-following client never wipes what was already saved", () => {
  it("carries the current full set, and stays identified by the link token with NO Authorization header", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const observed = observeNotificationsRequests();
    const manager = await openLinkManager();
    const lookups = manager.useContext().lookups.value;
    const topic = lookups.topics.find(t => t.canOptOut)!;
    const [firstChannel, secondChannel] = lookups.channels;
    expect(
      secondChannel,
      "need two recorded channels to prove a SECOND, independent toggle"
    ).toBeDefined();

    await toggleAndSettle(manager, topic.id, firstChannel.id);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    await toggleAndSettle(manager, topic.id, secondChannel.id);
    await manager.useActions().update();
    observed.stop();

    const bodies = handlers.bodies() as {
      opt_outs: { topic_id: string; channel_id: string }[];
    }[];
    expect(bodies).toHaveLength(2);
    const secondBody = bodies[1];

    expect(
      secondBody.opt_outs.some(
        row => row.topic_id === topic.id && row.channel_id === firstChannel.id
      ),
      "the SECOND save dropped the FIRST save's opt-out"
    ).toBe(true);
    expect(
      secondBody.opt_outs.some(
        row => row.topic_id === topic.id && row.channel_id === secondChannel.id
      ),
      "the SECOND save is missing its own toggle"
    ).toBe(true);

    const putRequests = observed
      .matching("opt-outs")
      .filter(request => request.method === "PUT");
    expect(putRequests).toHaveLength(2);
    for (const request of putRequests) {
      expect(new URL(request.url).searchParams.get("token")).toBe(TOKEN);
      expect(
        request.headers.authorization ?? request.headers.Authorization
      ).toBeUndefined();
    }
  });
});
