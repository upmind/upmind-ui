// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — a clean `isDirty` must mean the
 * draft equals the server (integration, AC-5)
 *
 * ## Job To Be Done
 * Round 2's defect reported `isDirty: false` while the draft held a different
 * opt-out set than the one the server had just accepted (`draft=0 rows,
 * server=0 rows` momentarily, then the draft alone re-grew to 2 while the
 * server stayed at 0 — `isDirty` never flipped back to `true` to say so). A
 * test that only reads `isDirty` cannot catch that: it must compare the
 * draft's actual CONTENT against what the server holds, for BOTH directions —
 * a save that grows the set and a save that shrinks it.
 *
 * The per-topic bulk-toggle sentinel (`preferenceKey(topicId, "__all")`,
 * `client-notifications.mappers.ts`) lives in the model so the bulk control
 * can reflect `isAllSelected`, but it never addresses a real topic x channel
 * pair — the CONTENT comparison below is over real pairs only, sentinels
 * stripped from both sides, never widened to tolerate the extra count. The
 * raw-model comparison keeps the sentinels IN, to prove `isDirty` stays
 * honest with them present too, not merely on the filtered view.
 *
 * ## What Breaks If These Fail
 * The editor tells the client "nothing to save" while quietly disagreeing
 * with the server about which notifications are on — a corrupted account
 * state with no visible signal that anything is wrong.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  installNotificationsReadWriteHandlers,
  recorded,
  seedClientSession,
  topicFullyOptedOut,
  type WireOptOut
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Past the machine's own settle transition (verify.md's observed +250ms margin). */
const PAST_SETTLE_MS = 250;

/** The manager's own per-topic bulk-toggle sentinel channel id (`design.md` gap-closure). */
const SELECT_ALL_CHANNEL_ID = "__all";

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

function pairKey(topicId: string, channelId: string): string {
  return `${topicId}:${channelId}`;
}

/**
 * Real (non-sentinel) opted-out pairs the draft carries. The sentinel key's
 * channel segment is always `SELECT_ALL_CHANNEL_ID`, never a real channel id,
 * so it is excluded here rather than counted as a bogus opt-out row.
 */
function draftPairs(
  manager: Awaited<ReturnType<typeof openManager>>
): Set<string> {
  const preferences = manager.useContext().model.value.preferences;
  return new Set(
    Object.entries(preferences)
      .filter(([, enabled]) => enabled === false)
      .map(([key]) => key.split("::"))
      .filter(([, channelId]) => channelId !== SELECT_ALL_CHANNEL_ID)
      .map(([topicId, channelId]) => pairKey(topicId, channelId))
  );
}

function serverPairs(rows: WireOptOut[]): Set<string> {
  return new Set(rows.map(row => pairKey(row.topic_id, row.channel_id)));
}

/**
 * The raw machine context (sentinels INCLUDED), read off `useInternals()`
 * rather than the published `useContext()` — `baseModel` is deliberately not
 * on the public surface (`design.md` §D6), so this is the only door onto it.
 */
function rawModelAndBase(manager: Awaited<ReturnType<typeof openManager>>): {
  model: unknown;
  baseModel: unknown;
} {
  const context = manager.useInternals().state.value.context as {
    model: unknown;
    baseModel: unknown;
  };
  return { model: context.model, baseModel: context.baseModel };
}

// -----------------------------------------------------------------------------

describe("AC-5 — a clean isDirty means the draft equals the server (growing save)", () => {
  it("after a save that GROWS the opt-out set settles, the draft's content equals the server's", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    expect(manager.useMeta().isDirty.value).toBe(false);
    expect(
      draftPairs(manager),
      "isDirty read clean, but the draft's content diverges from what the server holds"
    ).toEqual(serverPairs(handlers.getOptOuts()));

    const { model, baseModel } = rawModelAndBase(manager);
    expect(
      model,
      "isDirty read clean, but the RAW model (bulk-toggle sentinels included) diverges from baseModel — the sentinel itself is not honestly tracked"
    ).toEqual(baseModel);
  });
});

describe("AC-5 — a clean isDirty means the draft equals the server (shrinking save)", () => {
  it("after a save that SHRINKS the opt-out set settles, the draft's content equals the server's", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicFullyOptedOut();

    manager.useActions().selectAll(topic.id);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();
    await wait(PAST_SETTLE_MS);

    expect(manager.useMeta().isDirty.value).toBe(false);
    expect(
      draftPairs(manager),
      "isDirty read clean, but the draft re-grew relative to what the server holds"
    ).toEqual(serverPairs(handlers.getOptOuts()));

    const { model, baseModel } = rawModelAndBase(manager);
    expect(
      model,
      "isDirty read clean, but the RAW model (bulk-toggle sentinels included) diverges from baseModel — the sentinel itself is not honestly tracked"
    ).toEqual(baseModel);
  });
});
