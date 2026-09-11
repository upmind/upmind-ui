// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications token cell — the same grid, reached by
 * an emailed link (integration, AC-8/AC-10)
 *
 * ## Job To Be Done
 * The A7 read-back for a client who follows an emailed notification-preferences
 * link WITHOUT signing in: prove the outbound opt-outs request goes out
 * identified by the link token ALONE — `?token=<t>` in the URL, NO
 * `Authorization` header — and that topics/channels ride the ambient session
 * bearer unchanged (AC-10, `design.md` §D9).
 *
 * NO recorded oracle exists for a real link token, and nothing in this repo
 * can mint one. Every assertion below is REQUEST-SIDE (the URL, the token, the
 * header set) — never a response-payload assertion for the token case. The
 * response body served is the SAME recorded `client x self` capture (the
 * inherited shape), declared here, never presented as a token recording of
 * its own.
 *
 * ## What Breaks If These Fail
 * A link authenticates as a signed-in account (identity confusion), or the
 * opt-outs request leaks a bearer the link case must never carry.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotifications, useClientNotificationsManager } from "..";
import {
  assertNoActingAsHeaders,
  installNotificationsReadWriteHandlers,
  observeNotificationsRequests,
  seedGuestFloor
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const TOKEN = "notifications-link-token";

beforeEach(async () => {
  await seedGuestFloor();
});

describe("AC-8 — a client following an emailed link reads and saves the same grid", () => {
  it("the opt-outs GET carries ?token=<t> and NO Authorization header", async () => {
    installNotificationsReadWriteHandlers(server);
    const observed = observeNotificationsRequests();

    const list = useClientNotifications().as("client").withId(TOKEN);
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );
    observed.stop();

    const optOutsRequest = observed.matching("opt-outs")[0];
    expect(optOutsRequest).toBeDefined();
    expect(new URL(optOutsRequest.url).searchParams.get("token")).toBe(TOKEN);
    expect(
      optOutsRequest.headers.authorization ??
        optOutsRequest.headers.Authorization
    ).toBeUndefined();
    assertNoActingAsHeaders(optOutsRequest.headers);
  });

  it("the opt-outs PUT (save) carries ?token=<t> and NO Authorization header", async () => {
    installNotificationsReadWriteHandlers(server);
    const observed = observeNotificationsRequests();

    const manager = useClientNotificationsManager().as("client").withId(TOKEN);
    await manager.useActions().isReady();

    const context = manager.useContext();
    const anyTopicId = context.lookups.value.topics.find(t => t.canOptOut)!.id;
    const anyChannelId = context.lookups.value.channels[0].id;
    manager.useActions().toggle(anyTopicId, anyChannelId);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();

    const putRequest = observed
      .matching("opt-outs")
      .find(request => request.method === "PUT");
    expect(putRequest).toBeDefined();
    expect(new URL(putRequest!.url).searchParams.get("token")).toBe(TOKEN);
    expect(
      putRequest!.headers.authorization ?? putRequest!.headers.Authorization
    ).toBeUndefined();
    assertNoActingAsHeaders(putRequest!.headers);
    observed.stop();
  });
});

describe("AC-10 — for a client following the link, topics and channels ride the ambient session bearer", () => {
  it("topics and channels carry Authorization: Bearer <session access_token>, and no token= param", async () => {
    const session = await seedGuestFloor();
    installNotificationsReadWriteHandlers(server);
    const observed = observeNotificationsRequests();

    const list = useClientNotifications().as("client").withId(TOKEN);
    await vi.waitFor(() =>
      expect(list.useActions().isReady()).resolves.toBe(true)
    );
    observed.stop();

    for (const fragment of ["topics", "channels"]) {
      const request = observed.matching(fragment)[0];
      expect(request, `no request observed for ${fragment}`).toBeDefined();
      expect(
        request.headers.authorization ?? request.headers.Authorization
      ).toBe(`Bearer ${session.accessToken}`);
      expect(new URL(request.url).searchParams.get("token")).toBeNull();
    }
  });
});

// AC-13's compile-time proof ("no actor is offered an account to act on
// behalf of, on either half" — `.for()` rejected at build time) lives in
// `client-notifications.surface.test.ts`'s `compileProbe` specs.
