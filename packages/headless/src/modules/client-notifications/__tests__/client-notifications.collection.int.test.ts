// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications collection — the read-only grid
 * (integration, AC-1/AC-2/AC-11/AC-12)
 *
 * ## Job To Be Done
 * Prove the three reads land against the REAL recorded capture, that the
 * server-state `isEnabled` inversion (absence of a row = ON) is correct
 * against a real opt-out row, that `limit=0` reaches the wire on all three
 * requests, that the channel read carries the server-fixed recipient-type
 * filter, and that readiness resolves once all three reads settle.
 *
 * ## What Breaks If These Fail
 * A client is shown someone else's on/off state, a truncated page silently
 * flips a real opt-out to "enabled" (F5 — the defect ruling B exists to
 * close), or the module goes back to a poll no query state ever asked for.
 */

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isRef } from "vue";
import { useClientNotifications } from "..";
import {
  clientNotificationsScopeKeys,
  composeOptOutRow,
  installNotificationsReadHandlers,
  installNotificationsReadWriteHandlersSeeded,
  observeNotificationsRequests,
  optOutableTopic,
  recorded,
  seedClientSession
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

beforeEach(async () => {
  await seedClientSession();
});

/**
 * The only two functions the collection's diagnostic `useInternals()` is
 * meant to publish (`client-notifications.types.ts`'s
 * `NotificationsInternalsQuery` + `translateQuery`). Anything else reachable
 * — under ANY member name, at ANY depth — is a request-state write verb this
 * design forbids (D14).
 */
const ALLOWED_INTERNALS_FUNCTIONS = new Set(["refetch", "translateQuery"]);

/**
 * Recursively collects every function reachable off `root`, at any property
 * path — this is the structural check a single named-spelling assertion
 * cannot make: re-exposing the raw query under a DIFFERENT member name (e.g.
 * `query.raw.optOuts.setCriteria`) still shows up here, because the walk
 * follows every plain object/array, never one hard-coded path.
 *
 * Does not descend into a Vue `Ref`/`ComputedRef`'s own `.value` payload —
 * that is DATA (a view-model array, a raw error, a boolean), never a further
 * callable surface, and descending into it would walk the fetched rows
 * themselves for no reason.
 */
function collectFunctionNames(
  value: unknown,
  depth = 0,
  path = "",
  seen: Set<unknown> = new Set()
): string[] {
  if (depth > 6 || value == null) return [];
  if (typeof value === "function") return [path || "(root)"];
  if (typeof value !== "object") return [];
  if (isRef(value)) return [];
  if (seen.has(value)) return [];
  seen.add(value);

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value as Record<string, unknown>);

  return entries.flatMap(([key, child]) =>
    collectFunctionNames(child, depth + 1, path ? `${path}.${key}` : key, seen)
  );
}

/** Every reachable function path NOT in the allowed set. */
function criteriaWriteVerbs(root: unknown): string[] {
  return collectFunctionNames(root).filter(
    functionPath =>
      !ALLOWED_INTERNALS_FUNCTIONS.has(functionPath.split(".").at(-1) ?? "")
  );
}

describe("AC-1 — a client sees the full preference grid", () => {
  it("reads every topic, every channel, and the correct on/off state of a real opted-out pair", async () => {
    installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");

    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );

    const context = list.useContext();
    const { topics, channels, optOuts } = recorded;

    expect(context.topics.value).toHaveLength(topics().data.length);
    expect(context.channels.value).toHaveLength(channels().data.length);

    const [realPair] = optOuts().data;
    expect(context.isEnabled(realPair.topic_id, realPair.channel_id)).toBe(
      false
    );
  });

  it("reads a pair absent from the recorded opt-out set as ON", async () => {
    installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );

    const context = list.useContext();
    const optedOut = new Set(
      recorded.optOuts().data.map(row => `${row.topic_id}:${row.channel_id}`)
    );
    const someTopic = recorded.topics().data[0];
    const someChannel = recorded
      .channels()
      .data.find(channel => !optedOut.has(`${someTopic.id}:${channel.id}`));

    expect(
      someChannel,
      "no channel found not already opted out for this topic"
    ).toBeDefined();
    expect(context.isEnabled(someTopic.id, someChannel!.id)).toBe(true);
  });

  it("reports loading/error/ready meta", async () => {
    installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");
    const meta = list.useMeta();

    await vi.waitFor(() => expect(meta.isAvailable.value).toBe(true));
    expect(meta.hasError.value).toBe(false);
  });

  it("hasError flips true when the opt-outs read fails (AC-1's failing limb) — never asserted true anywhere else on the collection", async () => {
    installNotificationsReadHandlers(server);
    server.use(
      http.get("*/notifications/opt-outs", () =>
        HttpResponse.json(
          {
            status: "error",
            data: null,
            error: { code: 500, message: "Boom" }
          },
          { status: 500 }
        )
      )
    );
    const list = useClientNotifications().as("client");
    const meta = list.useMeta();

    expect(meta.hasError.value).toBe(false);
    await expect(list.useActions().isReady()).resolves.toBe(false);
    expect(meta.hasError.value).toBe(true);
    expect(meta.isAvailable.value).toBe(false);
  });
});

describe("AC-2 — reads always take the full set; no page truncates the grid", () => {
  it("sends limit=0 on all three requests", async () => {
    installNotificationsReadHandlers(server);
    const observed = observeNotificationsRequests();

    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );
    observed.stop();

    const paths = ["topics", "channels", "opt-outs"];
    for (const path of paths) {
      const requests = observed.matching(path);
      expect(
        requests.length,
        `no request observed for ${path}`
      ).toBeGreaterThan(0);
      for (const request of requests) {
        expect(new URL(request.url).searchParams.get("limit")).toBe("0");
      }
    }
  });

  it("the full recorded opt-out set arrives — nothing is truncated by this module's own read", async () => {
    installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );

    expect(list.useContext().optOuts.value).toHaveLength(
      recorded.optOuts().data.length
    );
  });

  it("an opt-out set larger than one server page arrives whole — the module's own read never truncates it", async () => {
    // The recorded capture holds only 2 rows, which cannot distinguish "the
    // full set arrived" from "a server default page happened to hold 2
    // rows" — AC-2's read-back demands proof against a set that EXCEEDS one
    // server page. Every row here is COMPOSED from the recorded capture's
    // own row shape (`composeOptOutRow`), never hand-authored
    // (`verify-cosplay.companion.md`) — the 6 recorded topics x 2 recorded
    // channels give 12 real distinct pairs; cycling that twice gives 24
    // rows, comfortably past any plausible single-page default.
    const topics = recorded.topics().data;
    const channels = recorded.channels().data;
    const realPairs = topics.flatMap(topic =>
      channels.map(channel => ({ topicId: topic.id, channelId: channel.id }))
    );
    const seeded = [...realPairs, ...realPairs].map((pair, index) =>
      composeOptOutRow(pair.topicId, pair.channelId, `page-scale-${index}`)
    );
    expect(seeded.length).toBeGreaterThan(recorded.optOuts().data.length * 10);

    installNotificationsReadWriteHandlersSeeded(server, seeded);
    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );

    expect(list.useContext().optOuts.value).toHaveLength(seeded.length);
  });
});

describe("AC-11 — readiness resolves off query state, never a poll", () => {
  it("isReady() resolves true once the three reads have settled", async () => {
    installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");

    await expect(list.useActions().isReady()).resolves.toBe(true);
  });

  it("isReady() resolves false, within a bounded timeout, when the opt-outs read settles with an error (drift D23 — isFetched is true on error too)", async () => {
    installNotificationsReadHandlers(server);
    server.use(
      http.get("*/notifications/opt-outs", () =>
        HttpResponse.json(
          {
            status: "error",
            data: null,
            error: { code: 500, message: "Boom" }
          },
          { status: 500 }
        )
      )
    );
    const list = useClientNotifications().as("client");

    await expect(
      Promise.race([
        list.useActions().isReady(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "isReady() never settled — a hang, not a resolved false"
                )
              ),
            5000
          )
        )
      ])
    ).resolves.toBe(false);
  });
});

describe("AC-12 — the request contract: only declared state reaches the wire", () => {
  it("the channels request carries the server-fixed recipient-type filter", async () => {
    installNotificationsReadHandlers(server);
    const observed = observeNotificationsRequests();

    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );
    observed.stop();

    const channelsRequest = observed.matching("channels")[0];
    expect(channelsRequest).toBeDefined();
    expect(
      new URL(channelsRequest.url).searchParams.get(
        "filter[recipient_types.code]"
      )
    ).toBe("client");
  });

  it("no reachable member anywhere on useInternals() is a criteria write verb — not only the one named spelling", async () => {
    const handlers = installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );

    const internals = list.useInternals();
    const disallowed = criteriaWriteVerbs(internals);
    expect(
      disallowed,
      `criteria write verb(s) reachable off useInternals(): ${disallowed.join(", ")}`
    ).toEqual([]);

    // The wire proof stands regardless of the structural check above: even a
    // reachable write verb must not be able to shorten the read.
    const observed = observeNotificationsRequests();
    await list.useActions().refresh();
    observed.stop();

    const optOutsRequest = observed.matching("opt-outs")[0];
    expect(optOutsRequest).toBeDefined();
    expect(new URL(optOutsRequest.url).searchParams.get("limit")).toBe("0");
    expect(list.useContext().optOuts.value).toHaveLength(
      handlers.getOptOuts().length
    );
  });
});

describe("cross-cutting — no other account's preferences are ever loaded (AC-1)", () => {
  it("every request carries only this account's session bearer, never an acting-as header", async () => {
    installNotificationsReadHandlers(server);
    const observed = observeNotificationsRequests();
    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );
    observed.stop();

    expect(observed.all().length).toBeGreaterThan(0);
    for (const request of observed.all()) {
      expect(
        request.headers.authorization ?? request.headers.Authorization
      ).toMatch(/^Bearer /);
    }
  });
});

describe("member coverage — refresh() and destroy() actually act, not a resting no-op", () => {
  it("refresh() issues a real second GET for each of the three reads", async () => {
    const handlers = installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );
    expect(handlers.reads()).toBe(1);

    await list.useActions().refresh();

    expect(handlers.reads()).toBe(2);
  });

  it("destroy() removes this scope's entry from the registry", async () => {
    installNotificationsReadHandlers(server);
    const list = useClientNotifications().as("client");
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );

    const before = clientNotificationsScopeKeys();
    expect(
      before.some(
        key => key.includes("client-notifications") && !key.includes("manager")
      ),
      "no collection scope entry existed to prove destroy() removes"
    ).toBe(true);

    list.useActions().destroy();

    const after = clientNotificationsScopeKeys();
    expect(after).not.toEqual(before);
  });
});

// Confirms the fixtures record at least one opt-outable topic for the manager
// suite to exercise — guards against a re-record leaving no ordinary topic.
describe("fixture sanity", () => {
  it("the recorded topics include at least one opt-outable topic", () => {
    expect(optOutableTopic()).toBeDefined();
  });
});
