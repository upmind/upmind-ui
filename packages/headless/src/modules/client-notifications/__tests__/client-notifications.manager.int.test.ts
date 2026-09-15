// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the draft editor
 * (integration, AC-3/AC-4/AC-5/AC-6/AC-7)
 *
 * ## Job To Be Done
 * Prove the editor's full lifecycle against the REAL recorded capture: one
 * toggle saves the WHOLE opt-out set (never a diff), select-all/clear-all act
 * over the full channels list from the first tick, dirty/revert/refuse-a-
 * pointless-save, the locked-topic guard refuses the WRITE at the action
 * (not merely a template `:disabled`), and a rejected save surfaces on the
 * module's own feedback surface while the draft survives.
 *
 * Every draft mutation goes through `vi.waitFor` before being read back — the
 * machine's context is a reactive snapshot the interpreter updates on its own
 * tick, never assumed synchronous with the action call (the same discipline
 * `client-phone.manager.int.test.ts`'s debounced-`input()` specs already use).
 *
 * ## What Breaks If These Fail
 * A save silently drops another agent's concurrent opt-out (a diff PUT
 * instead of a full-set one), a locked topic's row reaches the server because
 * only the UI refused it, or a failed save is swallowed with no feedback and
 * no chance to retry (oracle defect F3, NOT ported here).
 */

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotifications, useClientNotificationsManager } from "..";
import {
  clientNotificationsScopeKeys,
  installNotificationsReadWriteHandlers,
  installOptOutsWriteRejectionHandler,
  lockedTopic,
  optOutableTopic,
  recorded,
  seedClientSession,
  topicFullyOptedOut
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";
import type { NotificationsModel } from "../client-notifications.types";

// -----------------------------------------------------------------------------

/** The manager's own per-topic bulk-toggle sentinel channel id (`design.md` gap-closure). */
const SELECT_ALL_CHANNEL_ID = "__all";

beforeEach(async () => {
  await seedClientSession();
});

/** A channel + topic pair the recorded capture does NOT already carry as opted out. */
function findOnPair(): { topicId: string; channelId: string } {
  const optedOut = new Set(
    recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
  );
  const topic = optOutableTopic();
  const channel = recorded
    .channels()
    .data.find(candidate => !optedOut.has(`${topic.id}:${candidate.id}`));
  if (!channel) {
    throw new Error(
      "Every channel for this topic is already opted out in the recorded " +
        "capture — nothing real to toggle off."
    );
  }
  return { topicId: topic.id, channelId: channel.id };
}

async function openManager() {
  const manager = useClientNotificationsManager().as("client");
  await manager.useActions().isReady();
  return manager;
}

/** Toggles a pair and waits for the draft's dirty flag to actually flip. */
async function toggleAndSettle(
  manager: Awaited<ReturnType<typeof openManager>>,
  topicId: string,
  channelId: string
): Promise<void> {
  manager.useActions().toggle(topicId, channelId);
  await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
}

// -----------------------------------------------------------------------------

describe("AC-3 — a client turns a channel off for a topic and saves", () => {
  it("writes the WHOLE opt-out set — every prior opt-out plus the new one, never a diff", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    const sentPairs = new Set(
      body.opt_outs.map(row => `${row.topic_id}:${row.channel_id}`)
    );

    for (const priorRow of recorded.optOuts().data) {
      expect(
        sentPairs.has(`${priorRow.topic_id}:${priorRow.channel_id}`),
        "a prior opt-out was dropped from the full-set PUT"
      ).toBe(true);
    }
    expect(sentPairs.has(`${topicId}:${channelId}`)).toBe(true);
    expect(body.opt_outs).toHaveLength(recorded.optOuts().data.length + 1);
  });

  it("reads isEnabled(T, C) as false immediately after the save settles", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();

    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(false);
  });

  it("the collection's grid reflects the change without reopening it", async () => {
    installNotificationsReadWriteHandlers(server);
    const collection = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(collection.useActions().isReady()).resolves.toBe(true)
    );

    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    await toggleAndSettle(manager, topicId, channelId);
    await manager.useActions().update();

    await vi.waitFor(() =>
      expect(collection.useContext().isEnabled(topicId, channelId)).toBe(false)
    );
  });
});

describe("AC-4 — select-all and clear-all act over the whole channel list", () => {
  it("selectAll(T) turns every channel on and clears T's opt-out rows from the draft", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicFullyOptedOut(); // every channel starts OFF — a real transition
    const channels = recorded.channels().data;

    manager.useActions().selectAll(topic.id);

    await vi.waitFor(() => {
      for (const channel of channels) {
        expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(true);
      }
    });
    expect(manager.useActions().isAllSelected(topic.id)).toBe(true);
  });

  it("clearAll(T) turns every channel off and the model carries exactly n rows for T", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId } = findOnPair(); // starts with every channel ON — a real transition
    const channels = recorded.channels().data;

    manager.useActions().clearAll(topicId);

    await vi.waitFor(() => {
      for (const channel of channels) {
        expect(manager.useContext().isEnabled(topicId, channel.id)).toBe(false);
      }
    });
    expect(manager.useActions().isAllSelected(topicId)).toBe(false);

    const preferences = manager.useContext().model.value.preferences;
    // The per-topic bulk-toggle sentinel (`${topicId}::__all`) also starts
    // with the topic's own prefix and also reads `false` once clearAll()
    // makes the topic no-longer-fully-selected — excluded here because it
    // addresses no real channel, never counted as an opted-out pair.
    const falsePairsForTopic = Object.entries(preferences).filter(
      ([key, enabled]) =>
        key.startsWith(`${topicId}::`) &&
        !key.endsWith(`::${SELECT_ALL_CHANNEL_ID}`) &&
        enabled === false
    );
    expect(falsePairsForTopic).toHaveLength(channels.length);
  });

  it("acts over the FULL channel list the moment the editor opens — before any manual await beyond isReady()", async () => {
    // Driven by clearAll(), never selectAll(): selectAll() only REMOVES rows
    // from the draft and never reads `lookups.channels` at all, so it cannot
    // prove the ordering half — it would pass even against a channels list
    // fetched lazily beside the machine instead of through `loadLookups`
    // (`design.md` §D3, AC-4's own read-back). clearAll() must WRITE a false
    // entry per channel, which requires the full channel list to already be
    // resolved.
    installNotificationsReadWriteHandlers(server);
    const manager = useClientNotificationsManager().as("client");
    await manager.useActions().isReady();

    // A topic with ZERO pre-existing opt-outs (every recorded opt-out sits on
    // "security") — every channel starts ON, a real transition for clearAll().
    const topic = recorded
      .topics()
      .data.find(
        candidate =>
          candidate.can_opt_out &&
          !recorded.optOuts().data.some(row => row.topic_id === candidate.id)
      );
    if (!topic) {
      throw new Error(
        "No opt-outable topic with zero pre-existing opt-outs in the " +
          "recorded capture — re-record with " +
          "`pnpm fixtures:generate client-notifications`."
      );
    }
    manager.useActions().clearAll(topic.id);

    const channels = recorded.channels().data;
    await vi.waitFor(() => {
      for (const channel of channels) {
        expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(
          false
        );
      }
    });
  });
});

describe("AC-5 — dirty state and revert", () => {
  it("is not dirty on open, becomes dirty after a toggle, and clears on revert", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    expect(manager.useMeta().isDirty.value).toBe(false);
    const draftBeforeToggle = manager.useContext().model.value.preferences;
    const snapshotBeforeToggle = JSON.stringify(draftBeforeToggle);

    await toggleAndSettle(manager, topicId, channelId);

    manager.useActions().revert();
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(false));
    // A revert() that wiped the draft empty must FAIL this read-back — the
    // whole draft is compared, not merely the one toggled pair (AC-5).
    const draftAfterRevert = manager.useContext().model.value.preferences;
    expect(
      JSON.stringify(draftAfterRevert),
      "revert() did not restore the full pre-toggle draft"
    ).toBe(snapshotBeforeToggle);
    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(true);
  });

  it("refuses a save when nothing is dirty — no outbound request", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();

    await manager
      .useActions()
      .update()
      .catch(() => undefined);

    expect(handlers.bodies()).toHaveLength(0);
  });
});

describe("AC-6 — a locked topic is unwritable at the action", () => {
  it("toggle() on a locked topic leaves the pair ON and raises no dirty flag", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const locked = lockedTopic();
    // NEVER `.data[0]` here: this recorded capture's topic/channel uuids
    // COLLIDE across the two resources (a fixture-provenance fact, not a
    // fixture defect — never hand-changed), so a channel picked by fixed
    // index can equal the locked topic's own id, and an assertion built on
    // that pair could never detect a topicId/channelId transposition bug.
    const channel = recorded.channels().data.find(c => c.id !== locked.id)!;

    manager.useActions().toggle(locked.id, channel.id);
    // No settle wait: the guard's whole point is that dirty NEVER flips.
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(manager.useContext().isEnabled(locked.id, channel.id)).toBe(true);
    expect(manager.useMeta().isDirty.value).toBe(false);
  });

  it("clearAll() on a locked topic changes nothing", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const locked = lockedTopic();

    manager.useActions().clearAll(locked.id);
    await new Promise(resolve => setTimeout(resolve, 20));

    for (const channel of recorded.channels().data) {
      expect(manager.useContext().isEnabled(locked.id, channel.id)).toBe(true);
    }
    expect(manager.useMeta().isDirty.value).toBe(false);
  });

  it("a later save of a legitimate change carries NO row for the locked topic", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const locked = lockedTopic();
    // See the fixture-id-collision note above: a fixed-index channel can
    // share the locked topic's own uuid in this recorded capture.
    const lockedChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const { topicId, channelId } = findOnPair();

    manager.useActions().toggle(locked.id, lockedChannel.id); // refused
    await toggleAndSettle(manager, topicId, channelId); // legitimate
    await manager.useActions().update();

    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    expect(body.opt_outs.some(row => row.topic_id === locked.id)).toBe(false);
  });

  it("publishes isTopicLocked so a caller can also disable in the UI", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const locked = lockedTopic();
    const unlocked = optOutableTopic();

    expect(manager.useContext().isTopicLocked(locked.id)).toBe(true);
    expect(manager.useContext().isTopicLocked(unlocked.id)).toBe(false);
  });
});

describe("AC-3 — know that a save is in progress", () => {
  it("isProcessing flips false -> true -> false around the save, and onDone() resolves only once it settles", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    await toggleAndSettle(manager, topicId, channelId);

    let releasePut!: () => void;
    const putGate = new Promise<void>(resolve => {
      releasePut = resolve;
    });
    const writeFixture = recorded.optOutsWrite();
    server.use(
      http.put("*/notifications/opt-outs", async ({ request }) => {
        await request.clone().json();
        await putGate;
        return HttpResponse.json(writeFixture.response.body as object, {
          status: 200
        });
      })
    );

    expect(manager.useMeta().isProcessing.value).toBe(false);
    let doneSettled = false;
    const done = manager
      .useActions()
      .onDone()
      .then(value => {
        doneSettled = true;
        return value;
      });
    const updatePromise = manager.useActions().update();

    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(true)
    );
    expect(
      doneSettled,
      "onDone() settled before the save even reached the server"
    ).toBe(false);

    releasePut();
    await updatePromise;

    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(false)
    );
    await vi.waitFor(() => expect(doneSettled).toBe(true));
    await expect(done).resolves.toBe(true);
  });
});

describe("member coverage — onError() reflects the machine's actual failure state, not a resting stub", () => {
  it("onError() resolves true only once the machine actually captures the save's rejection", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    await toggleAndSettle(manager, topicId, channelId);

    let releaseReject!: () => void;
    const rejectGate = new Promise<void>(resolve => {
      releaseReject = resolve;
    });
    server.use(
      http.put("*/notifications/opt-outs", async ({ request }) => {
        await request.clone().json();
        await rejectGate;
        return HttpResponse.json(
          {
            status: "error",
            data: null,
            error: { code: 422, message: "Rejected" }
          },
          { status: 422 }
        );
      })
    );

    let errorSettled = false;
    const errored = manager
      .useActions()
      .onError()
      .then(value => {
        errorSettled = true;
        return value;
      });
    const updatePromise = manager
      .useActions()
      .update()
      .catch(() => undefined);

    await new Promise(resolve => setTimeout(resolve, 30));
    expect(
      errorSettled,
      "onError() settled before the rejection was ever dispatched"
    ).toBe(false);

    releaseReject();
    await updatePromise;

    await vi.waitFor(() => expect(errorSettled).toBe(true));
    await expect(errored).resolves.toBe(true);
  });
});

describe("member coverage — isLoading reflects the machine's own settlement, not a resting value", () => {
  it("reads true before the manager settles and false once ready", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = useClientNotificationsManager().as("client");
    const meta = manager.useMeta();

    expect(meta.isLoading.value).toBe(true);
    await manager.useActions().isReady();
    expect(meta.isLoading.value).toBe(false);
  });
});

describe("member coverage — isValid and validationErrors reflect real schema validation, not a resting value", () => {
  it("isValid flips true -> false when a malformed draft fails schema validation, and validationErrors is populated", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();
    const key = `${topicId}::${channelId}`;
    const current = manager.useContext().model.value.preferences;

    expect(manager.useMeta().isValid.value).toBe(true);
    expect(manager.useContext().validationErrors.value ?? []).toHaveLength(0);

    // A non-boolean value on a KNOWN (derived-from-lookups) property — the
    // schema's own declared `"type": "boolean"` per pair (`design.md` §D13)
    // fails this regardless of whether the schema also declares
    // `additionalProperties`, unlike an unknown-key probe which would not.
    const malformed = {
      preferences: { ...current, [key]: "not-a-boolean" }
    } as unknown as NotificationsModel;

    await manager
      .useActions()
      .update(malformed)
      .catch(() => undefined);

    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(false));
    expect(
      manager.useContext().validationErrors.value?.length ?? 0
    ).toBeGreaterThan(0);
  });
});

describe("member coverage — stop() and destroy() actually tear the instance down, not a resting no-op", () => {
  it("stop() halts the underlying machine — a toggle sent afterward never reaches the draft", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    manager.useActions().stop();
    manager.useActions().toggle(topicId, channelId);
    await new Promise(resolve => setTimeout(resolve, 30));

    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(true);
    expect(manager.useMeta().isDirty.value).toBe(false);
  });

  it("destroy() removes this scope's entry from the registry", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();

    const before = clientNotificationsScopeKeys();
    expect(
      before.some(key => key.includes("client-notifications-manager")),
      "no manager scope entry existed to prove destroy() removes"
    ).toBe(true);

    manager.useActions().destroy();

    const after = clientNotificationsScopeKeys();
    expect(after).not.toEqual(before);
  });
});

describe("AC-7 — a failed save surfaces, and the draft survives", () => {
  it("puts the rejection on error, keeps isDirty true, and keeps the toggled value", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { topicId, channelId } = findOnPair();

    // `error` and `hasError` pinned at their PRE-rejection value first — a
    // constant substitute for either (the audited hollow-member finding)
    // reads the same both before and after, so `toBeDefined()`/`true` alone
    // after the rejection cannot tell a real transition from a resting
    // truthy stub.
    expect(manager.useContext().error.value).toBeUndefined();
    expect(manager.useMeta().hasError.value).toBe(false);

    await toggleAndSettle(manager, topicId, channelId);

    installOptOutsWriteRejectionHandler(server, 422);
    await manager
      .useActions()
      .update()
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(manager.useContext().error.value).toBeDefined();
    });
    expect(manager.useMeta().hasError.value).toBe(true);
    expect(manager.useMeta().isDirty.value).toBe(true);
    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(false);
  });
});
