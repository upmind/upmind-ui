/**
 * @fileoverview Delegated-ids surface on the session (integration)
 *
 * ## Job To Be Done
 * Drive the REAL session store and the REAL `useActiveSession()` entry point
 * against MSW-replayed `/self` and `/admin/self` fixtures: the `delegatedIds`
 * exposure, the day-cache-defeating refresh, and the staff and guest rows that
 * must neither request nor expose delegated access.
 *
 * ## What Breaks If These Fail
 * A client sees no delegated access despite having some (DG1); a new grant
 * stays invisible for a day because the identity profile is served from the
 * day cache (DG4); staff gains delegated access it was never granted, or the
 * admin identity request starts asking for it (DG5); a guest boot throws on
 * the delegate surface (DG6).
 */

import { join } from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../__tests__/int-test-helpers";
import { FakeBroadcastChannel } from "./fake-broadcast-channel";
import { server } from "./setup.integration";
import type { IToken, ISelf } from "@upmind-automation/types";

vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type SelfEnvelope = { data: ISelf };

const { overrideToken, overrideSelf, overrideAdminSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

async function freshImports() {
  vi.resetModules();
  const sessionStoreModule = await import("../useSessionStore");
  const activeSessionModule = await import("../useActiveSession");
  const syncModule = await import("../session-store.sync");
  const barrel = await import("..");

  return {
    useSessionStore: sessionStoreModule.useSessionStore,
    useActiveSession: activeSessionModule.useActiveSession,
    stopCookieSync: syncModule.stopCookieSync,
    mapSessionUser: barrel.mapSessionUser
  };
}

function requestUrlsOn(
  eventName: "request:start",
  predicate: (url: string) => boolean
) {
  const urls: string[] = [];
  const headers: string[] = [];
  const listener = ({ request }: { request: Request }) => {
    if (predicate(request.url)) {
      urls.push(request.url);
      headers.push(request.headers.get("Authorization") ?? "");
    }
  };
  server?.events.on(eventName, listener);
  return {
    urls,
    headers,
    stop: () => server?.events.removeListener(eventName, listener)
  };
}

// -----------------------------------------------------------------------------

describe("session-store delegated-ids surface (integration)", () => {
  let ctx: Awaited<ReturnType<typeof freshImports>>;

  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
    ctx = await freshImports();
  });

  afterEach(async () => {
    ctx?.stopCookieSync();
    server?.events.removeAllListeners();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it("reads an empty delegated-ids map for a client with no delegated access @AC-DG1", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    }).data;
    overrideSelf("get-self");

    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, true, ctx.mapSessionUser(selfBody));

    const session = ctx.useActiveSession().useContext();
    await vi.waitFor(() => expect(session.activeUser.value).toBeDefined());
    expect(session.delegatedIds.value).toEqual({});

    // The mapper's own `?? {}` defence, read off the RAW mapped user — the
    // store context's `activeUser` carries no additional fallback of its own,
    // so a mapper that stops defending against the wire's `null` is only
    // visible at this read, not through the context computed (which has its
    // own independent `?? {}`).
    const { activeUser: rawUser } = ctx.useSessionStore().useContext();
    expect(rawUser.value?.delegatedIds).toEqual({});
  });

  it("refreshing the session fires a second identity-profile request as that same client, defeating the day cache @AC-DG4", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    }).data;
    overrideSelf("get-self");

    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, true, ctx.mapSessionUser(selfBody));

    const session = ctx.useActiveSession().useContext();
    await vi.waitFor(() => expect(session.activeUser.value).toBeDefined());

    const spy = requestUrlsOn(
      "request:start",
      url => url.includes("/self") && !url.includes("/admin/self")
    );

    ctx.useSessionStore().useActions().refresh();

    await vi.waitFor(() => expect(spy.urls.length).toBeGreaterThan(0));
    expect(
      spy.headers.some(header =>
        header.includes(clientToken.access_token as string)
      )
    ).toBe(true);
    spy.stop();
  });

  it("a staff session neither requests nor exposes delegated access @AC-DG5", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const staffToken: IToken = {
      ...clientToken,
      actor_type: AccessRoleTypes.STAFF,
      actor_id: `${clientToken.actor_id}-staff`,
      access_token: `${clientToken.access_token}-staff`
    };
    overrideAdminSelf("get-admin-self-case-wrong-actor");

    const spy = requestUrlsOn("request:start", url =>
      url.includes("/admin/self")
    );

    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().add(staffToken);

    await vi.waitFor(() => expect(spy.urls.length).toBeGreaterThan(0));
    expect(spy.urls.every(url => !url.includes("delegated_ids"))).toBe(true);
    spy.stop();

    const staffSession = ctx.useActiveSession().useContext();
    expect(staffSession.delegatedIds.value).toEqual({});
  });

  it("a guest visitor boots unaffected by the delegate surface @AC-DG6", async () => {
    overrideToken("post-oauth-access-token-guest");

    await ctx.useSessionStore().initStore();

    const guestSession = ctx.useActiveSession().useContext();
    expect(guestSession.activeUser.value).toBeNull();
    expect(guestSession.delegatedIds.value).toEqual({});
  });
});
