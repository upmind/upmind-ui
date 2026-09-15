// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the boolean-record -> wire-row
 * projection (`writeOptOuts`), the module's highest-risk code after T14
 * (integration, AC-3/AC-6, `design.md` §D13 "The wire projection")
 *
 * ## Job To Be Done
 * T14 moved the enabled/opt-out inversion out of consumer code and into
 * `writeOptOuts`'s boolean-record -> wire-row projection. Nothing proved that
 * projection round-trips before this file: a flipped direction there silently
 * flips every client's notifications. Prove it directly, both ways, through
 * the public door (`update()`), never by importing the projection function
 * itself:
 *
 *  1. a pair set `true` in `preferences` produces NO row in the PUT body;
 *  2. a pair set `false` produces EXACTLY one row, with the right
 *     `topic_id`/`channel_id` — not transposed;
 *  3. a recorded opt-out row read from the server arrives as `false` in
 *     `preferences`, and every OTHER pair as `true`;
 *  4. round-trip: read -> toggle one pair -> save -> the PUT body differs
 *     from the original recorded set by exactly that one row.
 *
 * This recorded capture carries a UUID COLLISION (never hand-changed —
 * `verify-cosplay.companion.md`): topic `system` and channel `template_mail`
 * share `3825d96e-763e-d091-3dc4-174825283406`, and topic `marketing` and
 * channel `template_websocket` share `24d03679-424d-0e71-04b3-153698d582e8`.
 * A transposed `topic_id`/`channel_id` can pass silently against either pair.
 * Assertion 2 below therefore uses `billing` (`85d085e6-…`) x
 * `template_websocket` (`24d03679-…`) — genuinely different ids on both
 * sides, and neither equal to the other's own id, so a swap produces a
 * detectably wrong pair rather than a coincidentally valid one.
 *
 * ## What Breaks If These Fail
 * The projection is inverted (an "off" pair reaches the wire as "on", or vice
 * versa) or transposed (a topic's row is written under the wrong channel),
 * and every account's saved preferences are silently wrong from the very
 * first save.
 */

import { beforeEach, describe, expect, it } from "vitest";
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

function byCode<T extends { code: string }>(rows: T[], code: string): T {
  const row = rows.find(candidate => candidate.code === code);
  if (!row) {
    throw new Error(
      `No recorded row carries code ${code} — re-record with ` +
        "`pnpm fixtures:generate client-notifications`."
    );
  }
  return row;
}

// -----------------------------------------------------------------------------

describe("the wire projection — a pair set true produces no row", () => {
  it("re-enabling a previously opted-out pair emits no row for it in the PUT body", async () => {
    const billing = byCode(recorded.topics().data, "billing");
    const templateMail = byCode(recorded.channels().data, "template_mail");
    const seed = [
      composeOptOutRow(billing.id, templateMail.id, "projection-true-seed")
    ];
    const handlers = installNotificationsReadWriteHandlersSeeded(server, seed);
    const manager = await openManager();

    expect(manager.useContext().isEnabled(billing.id, templateMail.id)).toBe(
      false
    );

    manager.useActions().toggle(billing.id, templateMail.id);
    await new Promise(resolve => setTimeout(resolve, 50));
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    expect(
      body.opt_outs.some(
        row => row.topic_id === billing.id && row.channel_id === templateMail.id
      ),
      "a pair re-enabled to true still emitted a wire row for it"
    ).toBe(false);
  });
});

describe("the wire projection — a pair set false produces exactly one row, not transposed", () => {
  it("produces exactly one row, with the right topic_id and channel_id (billing x template_websocket — non-colliding ids)", async () => {
    const billing = byCode(recorded.topics().data, "billing");
    const templateWebsocket = byCode(
      recorded.channels().data,
      "template_websocket"
    );
    // Empty seed: a clean, fully-enabled starting grid so the resulting PUT
    // carries exactly the one row this test creates.
    const handlers = installNotificationsReadWriteHandlersSeeded(server, []);
    const manager = await openManager();

    expect(
      manager.useContext().isEnabled(billing.id, templateWebsocket.id)
    ).toBe(true);

    manager.useActions().toggle(billing.id, templateWebsocket.id);
    await new Promise(resolve => setTimeout(resolve, 50));
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    expect(body.opt_outs).toHaveLength(1);
    expect(body.opt_outs[0]).toEqual({
      topic_id: billing.id,
      channel_id: templateWebsocket.id
    });
  });
});

describe("the wire projection — a recorded opt-out arrives as false, every other pair as true", () => {
  it("both recorded opt-out rows read false in preferences, and every other topic x channel pair reads true", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const preferences = manager.useContext().model.value.preferences;

    const optedOutKeys = new Set(
      recorded
        .optOuts()
        .data.map(row => preferenceKey(row.topic_id, row.channel_id))
    );
    expect(optedOutKeys.size).toBeGreaterThan(0);

    for (const key of optedOutKeys) {
      expect(
        preferences[key],
        `recorded opt-out row ${key} did not arrive as false in preferences`
      ).toBe(false);
    }

    let checkedAtLeastOneOther = false;
    for (const topic of recorded.topics().data) {
      for (const channel of recorded.channels().data) {
        const key = preferenceKey(topic.id, channel.id);
        if (optedOutKeys.has(key)) continue;
        checkedAtLeastOneOther = true;
        expect(
          preferences[key],
          `pair ${key} — absent from the recorded opt-out set — did not read true`
        ).toBe(true);
      }
    }
    expect(checkedAtLeastOneOther).toBe(true);
  });
});

describe("the wire projection — round trip", () => {
  it("read -> toggle one pair -> save -> the PUT body differs from the recorded set by exactly that one row", async () => {
    const handlers = installNotificationsReadWriteHandlers(server);
    const manager = await openManager();

    const optedOut = new Set(
      recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
    );
    let onPair: { topicId: string; channelId: string } | undefined;
    for (const topic of recorded.topics().data.filter(row => row.can_opt_out)) {
      const channel = recorded
        .channels()
        .data.find(candidate => !optedOut.has(`${topic.id}:${candidate.id}`));
      if (channel) {
        onPair = { topicId: topic.id, channelId: channel.id };
        break;
      }
    }
    if (!onPair) throw new Error("No ON pair left in the recorded capture.");

    manager.useActions().toggle(onPair.topicId, onPair.channelId);
    await new Promise(resolve => setTimeout(resolve, 50));
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    const body = handlers.bodies()[0] as {
      opt_outs: { topic_id: string; channel_id: string }[];
    };
    const sentPairs = new Set(
      body.opt_outs.map(row => `${row.topic_id}:${row.channel_id}`)
    );
    const originalPairs = new Set(
      recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
    );

    const added = [...sentPairs].filter(pair => !originalPairs.has(pair));
    const removed = [...originalPairs].filter(pair => !sentPairs.has(pair));

    expect(
      added,
      "the PUT body added a pair other than (or in addition to) the toggled one"
    ).toEqual([`${onPair.topicId}:${onPair.channelId}`]);
    expect(
      removed,
      "the PUT body dropped an original recorded row it should not have touched"
    ).toEqual([]);
  });
});
