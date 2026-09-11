// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the bulk-toggle sentinel's
 * expansion through the form renderer's own write door (integration, AC-4/
 * AC-6, gap-closure 2026-09-01, round-3 finding B2)
 *
 * ## Job To Be Done
 * `expandSelectAllSentinels` (`client-notifications.mappers.ts`) has exactly
 * one call site: inside the debounced `input()` write door the generic form
 * renderer drives (AC-14). Every other test of the bulk affordance drives
 * `selectAll()`/`clearAll()` directly — `client-notifications.manager.bulk.
 * int.test.ts` — which never reaches `expandSelectAllSentinels` at all, and
 * `client-notifications.manager.input.int.test.ts` never drives a bulk
 * sentinel through `input()`. The whole bulk mechanism, through the real
 * door a client's browser actually uses, was unexercised.
 *
 * That gap is where a real defect (B1) hid: within the 350ms debounce, a
 * bulk clear followed by turning one channel back on silently discarded the
 * per-channel change — clear-all-then-keep-one, the primary way anyone uses
 * a bulk control, lost the exception. The fix: expansion now only overwrites
 * a channel key that has NOT itself changed from `previous`, so an explicit
 * per-channel change wins, with pending state tracked across the coalesced
 * debounce burst.
 *
 * ## What Breaks If These Fail
 * A client clears every channel of a topic, keeps just one channel on, and
 * that one channel is silently swept back off the moment the debounce
 * settles — an opt-out the client never asked for, on a channel they
 * explicitly kept.
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

/** Comfortably past the module's own 350ms `input()` debounce (`verify.md` observed margin). */
const PAST_DEBOUNCE_MS = 450;

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

/** The manager's own flat-record key format (`design.md` §D13, `preferenceKey`). */
function preferenceKey(topicId: string, channelId: string): string {
  return `${topicId}::${channelId}`;
}

/**
 * An opt-outable topic the recorded capture carries NO opt-out for — every
 * channel starts ON, so a bulk clear against it produces a real, non-trivial
 * transition (precedent: `client-notifications.manager.bulk.int.test.ts`).
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

/** A second opt-outable topic, distinct from the one already chosen, with no pre-existing opt-outs. */
function anotherTopicWithNoPreexistingOptOuts(excludeTopicId: string) {
  const topic = recorded
    .topics()
    .data.find(
      candidate =>
        candidate.id !== excludeTopicId &&
        candidate.can_opt_out &&
        !recorded.optOuts().data.some(row => row.topic_id === candidate.id)
    );
  if (!topic) {
    throw new Error(
      "No SECOND opt-outable topic with zero pre-existing opt-outs in the " +
        "recorded capture — re-record with `pnpm fixtures:generate client-notifications`."
    );
  }
  return topic;
}

// -----------------------------------------------------------------------------

describe("AC-4 — a per-channel change through input() survives a bulk clear, inside the debounce window", () => {
  it("clearing every channel of a topic then turning one back on, both inside the debounce window, keeps that one channel on and every other channel off", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;
    const keepChannel = channels[0];
    const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
    const keepKey = preferenceKey(topic.id, keepChannel.id);
    const before = manager.useContext().model.value.preferences;

    // The first call is the bulk-clear click; the FORM's own local widgets
    // (the individual per-channel checkboxes) reflect that click's intent
    // immediately, well before the debounced `input()` ever settles — so
    // the SECOND call's payload, exactly like a real renderer's, already
    // shows every channel of this topic unchecked EXCEPT the one the user
    // then explicitly re-checks.
    const everyOtherChannelCleared = Object.fromEntries(
      channels
        .filter(channel => channel.id !== keepChannel.id)
        .map(channel => [preferenceKey(topic.id, channel.id), false])
    );

    manager
      .useActions()
      .input({ preferences: { ...before, [sentinelKey]: false } });
    manager.useActions().input({
      preferences: {
        ...before,
        [sentinelKey]: false,
        ...everyOtherChannelCleared,
        [keepKey]: true
      }
    });

    await vi.waitFor(() => {
      expect(manager.useContext().isEnabled(topic.id, keepChannel.id)).toBe(
        true
      );
      for (const channel of channels) {
        if (channel.id === keepChannel.id) continue;
        expect(
          manager.useContext().isEnabled(topic.id, channel.id),
          `channel ${channel.id} should have been cleared by the bulk action, not left on`
        ).toBe(false);
      }
    });
  });
});

describe("AC-4 — the same per-channel-survives-a-bulk-clear result holds well outside the debounce window", () => {
  it("clearing every channel of a topic, letting it settle, then turning one channel back on keeps that one channel on and every other channel off", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;
    const keepChannel = channels[0];
    const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
    const keepKey = preferenceKey(topic.id, keepChannel.id);
    const before = manager.useContext().model.value.preferences;

    manager
      .useActions()
      .input({ preferences: { ...before, [sentinelKey]: false } });

    await vi.waitFor(() => {
      for (const channel of channels) {
        expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(
          false
        );
      }
    });
    await wait(PAST_DEBOUNCE_MS);

    const settled = manager.useContext().model.value.preferences;
    manager
      .useActions()
      .input({ preferences: { ...settled, [keepKey]: true } });

    await vi.waitFor(() =>
      expect(manager.useContext().isEnabled(topic.id, keepChannel.id)).toBe(
        true
      )
    );
    for (const channel of channels) {
      if (channel.id === keepChannel.id) continue;
      expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(false);
    }
  });
});

describe("AC-4 — a bulk select-all through input() turns on a channel a pre-existing opt-out had left off", () => {
  it("a bulk select-all reaches a channel the server already carried as opted out", async () => {
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;
    const preOptedChannel = channels[0];
    const preExistingRow = composeOptOutRow(
      topic.id,
      preOptedChannel.id,
      "bulk-select-all-preexisting"
    );
    const seed = [...recorded.optOuts().data, preExistingRow];
    installNotificationsReadWriteHandlersSeeded(server, seed);
    const manager = await openManager();

    expect(
      manager.useContext().isEnabled(topic.id, preOptedChannel.id),
      "the pre-existing opt-out was not seeded into the draft at open"
    ).toBe(false);

    const before = manager.useContext().model.value.preferences;
    const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
    manager
      .useActions()
      .input({ preferences: { ...before, [sentinelKey]: true } });

    await vi.waitFor(() => {
      for (const channel of channels) {
        expect(
          manager.useContext().isEnabled(topic.id, channel.id),
          `channel ${channel.id} should be enabled after the bulk select-all`
        ).toBe(true);
      }
    });
  });
});

describe("AC-4 — an ordinary single-channel change through input() never triggers bulk expansion", () => {
  it("turning off one channel through input() moves only that channel — no other channel of any topic changes state", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;
    const touchedChannel = channels[0];
    const touchedKey = preferenceKey(topic.id, touchedChannel.id);
    const before = { ...manager.useContext().model.value.preferences };

    manager
      .useActions()
      .input({ preferences: { ...before, [touchedKey]: false } });

    await vi.waitFor(() =>
      expect(manager.useContext().isEnabled(topic.id, touchedChannel.id)).toBe(
        false
      )
    );

    // Every REAL channel key besides the one written must be untouched. The
    // touched topic's OWN sentinel key is deliberately excluded from this
    // comparison: `isTopicFullySelected` recomputes it on every parse
    // (negative control 12, `parity.yaml` capability `editor-is-all-
    // selected`), so it legitimately flips here — that recomputation is a
    // proven capability, not the "other channel moving" this test guards
    // against.
    const topicSentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
    const after = manager.useContext().model.value.preferences;
    for (const key of Object.keys(before)) {
      if (key === touchedKey || key === topicSentinelKey) continue;
      expect(
        after[key],
        `key ${key} changed even though only ${touchedKey} was written`
      ).toBe(before[key]);
    }
  });
});

describe("the wire projection — the bulk affordance's own key never reaches the draft or the server through input()", () => {
  it("after a bulk clear through input() and a save, the draft and the PUT body carry one entry per real channel and never the bulk affordance's own sentinel key", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;
    const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
    const before = manager.useContext().model.value.preferences;

    manager
      .useActions()
      .input({ preferences: { ...before, [sentinelKey]: false } });

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
      "a wire row addressed the bulk affordance's own sentinel channel id through input()"
    ).toBe(false);
  });
});

describe("AC-4 — an explicit per-channel exception issued in the same input() call as a bulk instruction survives it", () => {
  it("a per-channel exception explicitly stated in the SAME input() call as a bulk instruction survives it, and every other channel follows the bulk", async () => {
    const topic = topicWithNoPreexistingOptOuts();
    const channels = recorded.channels().data;
    // The exception channel's BASELINE must stay untouched (still enabled)
    // so that explicitly turning it off in the combined call is a genuine
    // deviation from its own previous value — never merely "unspecified".
    // A DIFFERENT channel carries the seeded pre-existing opt-out, so the
    // topic opens with a genuinely mixed (not fully-selected) baseline.
    const exceptionChannel = channels[0];
    const seededOffChannel = channels[1];
    const preExistingRow = composeOptOutRow(
      topic.id,
      seededOffChannel.id,
      "same-call-exception"
    );
    const seed = [...recorded.optOuts().data, preExistingRow];
    installNotificationsReadWriteHandlersSeeded(server, seed);
    const manager = await openManager();

    expect(
      manager.useContext().isEnabled(topic.id, exceptionChannel.id),
      "the exception channel's baseline must start enabled, or turning it off in the combined call proves nothing"
    ).toBe(true);
    expect(
      manager.useContext().isEnabled(topic.id, seededOffChannel.id),
      "the seeded pre-existing opt-out was not seeded into the draft at open"
    ).toBe(false);

    const before = manager.useContext().model.value.preferences;
    const sentinelKey = preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID);
    const exceptionKey = preferenceKey(topic.id, exceptionChannel.id);

    // ONE input() call carries BOTH the bulk select-all instruction AND an
    // explicit, same-instant exception for one channel — the shape a form
    // renderer produces when its own local widget state already reflects
    // both edits before the debounce ever settles.
    manager.useActions().input({
      preferences: { ...before, [sentinelKey]: true, [exceptionKey]: false }
    });

    await vi.waitFor(() => {
      expect(
        manager.useContext().isEnabled(topic.id, exceptionChannel.id),
        "the explicit exception was swept into the bulk instruction"
      ).toBe(false);
      for (const channel of channels) {
        if (channel.id === exceptionChannel.id) continue;
        expect(manager.useContext().isEnabled(topic.id, channel.id)).toBe(true);
      }
    });
  });
});

describe("AC-6 — the locked-topic guard governs a bulk clear reaching update() through input()", () => {
  it("a bulk clear on a locked topic through input() is refused, and a pre-existing locked opt-out survives an unrelated legitimate bulk clear elsewhere", async () => {
    const locked = lockedTopic();
    // NEVER `.data[0]`: this recorded capture's topic/channel uuids COLLIDE
    // across the two resources (a fixture-provenance fact, never
    // hand-changed — `verify-cosplay.companion.md`).
    const preExistingChannel = recorded
      .channels()
      .data.find(c => c.id !== locked.id)!;
    const preExistingRow = composeOptOutRow(
      locked.id,
      preExistingChannel.id,
      "bulk-input-locked-preexisting"
    );
    const seed = [...recorded.optOuts().data, preExistingRow];
    const handlers = installNotificationsReadWriteHandlersSeeded(server, seed);
    const manager = await openManager();

    expect(
      manager.useContext().isEnabled(locked.id, preExistingChannel.id)
    ).toBe(false);

    const lockedSentinelKey = preferenceKey(locked.id, SELECT_ALL_CHANNEL_ID);
    const draftAtOpen = manager.useContext().model.value.preferences;
    manager
      .useActions()
      .input({ preferences: { ...draftAtOpen, [lockedSentinelKey]: false } });

    await wait(PAST_DEBOUNCE_MS);
    for (const channel of recorded.channels().data) {
      if (channel.id === preExistingChannel.id) continue;
      expect(
        manager.useContext().isEnabled(locked.id, channel.id),
        "a bulk clear reaching input() newly opted out a channel of a locked topic"
      ).toBe(true);
    }

    const legitTopic = anotherTopicWithNoPreexistingOptOuts(locked.id);
    const legitSentinelKey = preferenceKey(
      legitTopic.id,
      SELECT_ALL_CHANNEL_ID
    );
    const draftBeforeLegit = manager.useContext().model.value.preferences;
    manager.useActions().input({
      preferences: { ...draftBeforeLegit, [legitSentinelKey]: false }
    });

    await vi.waitFor(() => {
      for (const channel of recorded.channels().data) {
        expect(manager.useContext().isEnabled(legitTopic.id, channel.id)).toBe(
          false
        );
      }
    });
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    const lockedRows = body.opt_outs.filter(row => row.topic_id === locked.id);
    expect(
      lockedRows,
      "the locked topic's wire rows must be EXACTLY the one pre-existing row"
    ).toEqual([{ topic_id: locked.id, channel_id: preExistingChannel.id }]);
    for (const channel of recorded.channels().data) {
      expect(
        body.opt_outs.some(
          row => row.topic_id === legitTopic.id && row.channel_id === channel.id
        ),
        `the legitimate bulk clear's own row for channel ${channel.id} was missing`
      ).toBe(true);
    }
  });
});
