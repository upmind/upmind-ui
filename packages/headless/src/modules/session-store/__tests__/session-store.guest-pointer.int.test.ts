/**
 * @fileoverview Session-store integration — guest as a real, chosen session
 * (FE-3087 AC1-AC4, AC8, and the activation-branch edge cases)
 *
 * ## Job To Be Done
 * Drive the REAL store against MSW-replayed grant/profile fixtures for the
 * capability FE-3087 adds: a signed-in user can CHOOSE to browse as a guest.
 * Proves the choice lands on the public active pointer, survives the write
 * gate, mints its own grant at the moment it is chosen, destroys neither the
 * client nor the staff session, and is distinguishable from a guest nobody
 * chose — using the public context alone. Also pins what choosing guest must
 * NOT do: mint a second identity when this device already holds one, and
 * outlive a deliberate sign-in on this same tab.
 *
 * ## What Breaks If These Fail
 * "Continue as guest" is a no-op for anyone signed in (the shipped bug); or it
 * "works" by discarding the signed-in sessions, so returning to your account
 * needs a fresh login; or a failed guest grant strands the tab with no
 * identity; or it hands back a fresh anonymous identity on every press, or
 * outstays a real login and makes signing in look like it did nothing.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes, GrantTypes } from "@upmind-automation/types";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../__tests__/int-test-helpers";
import { FakeBroadcastChannel } from "./fake-broadcast-channel";
import { server } from "./setup.integration";
import {
  filter,
  first,
  forEach,
  has,
  includes,
  isObject,
  keys,
  map,
  times
} from "lodash-es";
import type { IToken, ISelf } from "@upmind-automation/types";

// See session-store.int.test.ts for why the real cross-realm BroadcastChannel
// is stubbed with the deterministic transport — this file asserts nothing
// about broadcasts itself.
vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

const { overrideToken, overrideSelf, overrideAdminSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

async function freshImports() {
  vi.resetModules();
  const sessionStoreModule = await import("../useSessionStore");
  const syncModule = await import("../session-store.sync");
  const barrel = await import("..");

  return {
    useSessionStore: sessionStoreModule.useSessionStore,
    stopCookieSync: syncModule.stopCookieSync,
    persistTokenToStorage: barrel.persistTokenToStorage,
    mapSessionUser: barrel.mapSessionUser
  };
}

/**
 * Reads the OAuth grant type out of each captured request body.
 *
 * @param bodies - Raw request bodies captured off the replay server.
 * @returns One grant type per body; `""` when the body carries none.
 */
function grantTypesOf(bodies: string[]): string[] {
  return map(bodies, body => {
    try {
      return (JSON.parse(body) as { grant_type?: string }).grant_type ?? "";
    } catch {
      return new URLSearchParams(body).get("grant_type") ?? "";
    }
  });
}

/**
 * Starts counting `/oauth/access_token` calls off the replay server.
 *
 * @returns The live array of grant URLs, appended to as requests fire.
 */
function captureGuestGrants(): string[] {
  const grants: string[] = [];
  server?.events.on("request:start", ({ request }) => {
    if (includes(request.url, "/oauth/access_token")) grants.push(request.url);
  });
  return grants;
}

/**
 * The sessionStorage slot the store persists its whole state to, located by
 * the state shape rather than by a hard-coded key name.
 *
 * @returns The storage key, or undefined before the first persisted write.
 */
function findPersistedKey(): string | undefined {
  let found: string | undefined;
  forEach(times(sessionStorage.length), index => {
    const key = sessionStorage.key(index);
    if (!key || found) return;
    try {
      const parsed = JSON.parse(sessionStorage.getItem(key) ?? "");
      if (isObject(parsed) && has(parsed, "activeActor")) found = key;
    } catch {
      /* not the store's slot */
    }
  });
  return found;
}

// -----------------------------------------------------------------------------

describe("session-store integration (guest as a real, chosen session)", () => {
  let ctx: Awaited<ReturnType<typeof freshImports>>;

  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
    ctx = await freshImports();
  });

  afterEach(async () => {
    // Test isolation: see session-store.int.test.ts afterEach — stop this
    // realm's 2s cookie-sync interval, then drain queued tasks and spies.
    ctx?.stopCookieSync();
    server?.events.removeAllListeners();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it("activating guest records a guest session id on the active pointer @AC-G1", async () => {
    const guestFixture = overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId, activeSession } = ctx
      .useSessionStore()
      .useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBeUndefined();

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBeTruthy();
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
  });

  it("keeps an explicitly chosen guest active with a client session in the pool @AC-G2", async () => {
    const guestFixture = overrideToken("post-oauth-access-token-guest");
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const clientId = clientToken.actor_id as string;

    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, true, ctx.mapSessionUser(selfBody));

    const { activeActor, activeSessionId, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    const chosenId = activeSessionId.value;
    expect(chosenId).toBeTruthy();
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);

    // A further unrelated write re-runs the gate over the chosen pointer.
    ctx
      .useSessionStore()
      .useActions()
      .updateUser(
        AccessRoleTypes.CLIENT,
        clientId,
        ctx.mapSessionUser(selfBody)
      );

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
    expect(allSessions.value[clientId]).toBeDefined();
  });

  it("mints a guest token when guest is the session being activated with a client signed in @AC-G3", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const guestFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-guest",
      { recordingsDir }
    );
    overrideSelf("get-self");
    await ctx.persistTokenToStorage(clientToken);
    ctx = await freshImports();

    const oauthRequests: string[] = [];
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        oauthRequests.push(await request.text());
        return HttpResponse.json(guestFixture as object, { status: 200 });
      })
    );

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSession } = ctx.useSessionStore().useContext();
    const { hasGuestSession } = ctx.useSessionStore().useMeta();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(hasGuestSession.value).toBe(false);
    expect(oauthRequests).toHaveLength(0);

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    expect(
      filter(grantTypesOf(oauthRequests), type => type === GrantTypes.GUEST)
    ).toHaveLength(1);
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
    expect(hasGuestSession.value).toBe(true);
  });

  it("leaves client and staff sessions switchable after guest is activated @AC-G4 @AC-T1", async () => {
    const guestFixture = overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    overrideAdminSelf("get-admin-self");
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const staffToken = getFixtureBody<IToken>("post-oauth-access-token-user", {
      recordingsDir
    });
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const adminSelfBody = getFixtureBody<{ data: ISelf }>("get-admin-self", {
      recordingsDir
    }).data;
    const clientId = clientToken.actor_id as string;
    const staffId = staffToken.actor_id as string;

    expect(staffToken.actor_type).toBe(AccessRoleTypes.STAFF);
    expect(staffId).not.toBe(clientId);

    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, true, ctx.mapSessionUser(selfBody));
    await ctx
      .useSessionStore()
      .useActions()
      .add(staffToken, false, ctx.mapSessionUser(adminSelfBody));

    const { activeActor, activeSessionId, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
    expect(allSessions.value[clientId]).toBeDefined();
    expect(allSessions.value[staffId]).toBeDefined();

    const spy = vi.fn();
    server?.events.on("request:start", spy);

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientId);
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientId);
    expect(activeSession.value?.access_token).toBe(clientToken.access_token);

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.STAFF, staffId);
    expect(activeActor.value).toBe(AccessRoleTypes.STAFF);
    expect(activeSessionId.value).toBe(staffId);
    expect(activeSession.value?.access_token).toBe(staffToken.access_token);

    expect(spy).not.toHaveBeenCalled();
    server?.events.removeListener("request:start", spy);
  });

  it("distinguishes a chosen guest from a defaulted guest on the public context @AC-G8", async () => {
    // the assertion the colocated
    // `session-store.guest-pointer.int.must-fail.patch` must flip RED.
    const guestFixture = overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId, activeSession, guestSession } = ctx
      .useSessionStore()
      .useContext();

    // Defaulted: the resolver fell to guest and claimed no pointer.
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
    expect(activeSessionId.value).toBeUndefined();

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    // Chosen: same actor, same token, but the pointer now names the session.
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
    expect(activeSessionId.value).toEqual(expect.any(String));
    expect(activeSessionId.value).not.toBe("");

    // W2 — the recorded grant carries `actor_id: ""`, so the pointer matches
    // the public guest token only because the session's own id was written
    // into that token the way client and staff tokens carry theirs.
    expect(guestSession.value?.actor_id).toBe(activeSessionId.value);
  });

  it("mints a chosen guest on an origin without crypto.randomUUID @AC-G21", async () => {
    // `crypto.randomUUID` is secure-context-only and undefined on the e2e
    // origin, where the first-visit guest mint threw.
    overrideToken("post-oauth-access-token-guest");
    const { randomUUID } = globalThis.crypto;
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: undefined
    });

    await ctx
      .useSessionStore()
      .initStore()
      .then(() =>
        ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST)
      )
      .then(() => {
        const { activeActor, activeSessionId, guestSession } = ctx
          .useSessionStore()
          .useContext();

        expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
        expect(activeSessionId.value).toEqual(expect.any(String));
        expect(activeSessionId.value).not.toBe("");
        expect(guestSession.value?.actor_id).toBe(activeSessionId.value);
      })
      .finally(() => {
        Object.defineProperty(globalThis.crypto, "randomUUID", {
          configurable: true,
          value: randomUUID
        });
      });
  });

  it("resolves without moving the pointer when the guest mint fails every retry @AC-G22", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    overrideSelf("get-self");
    await ctx.persistTokenToStorage(clientToken);
    ctx = await freshImports();
    overrideToken("post-oauth-access-token-client");
    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId } = ctx.useSessionStore().useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientToken.actor_id);

    const attempts: string[] = [];
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        attempts.push(await request.text());
        return HttpResponse.error();
      })
    );

    let settled = false;
    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST)
      .catch(() => undefined)
      .finally(() => {
        settled = true;
      });

    // Without this the case passes vacuously: an `activate` that never even
    // tries to mint also leaves the pointer where it was.
    expect(
      filter(grantTypesOf(attempts), type => type === GrantTypes.GUEST).length
    ).toBeGreaterThan(0);
    expect(settled).toBe(true);
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientToken.actor_id);
  });

  it("resolves without moving the pointer when the guest grant is rejected 401 @AC-G22", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const rejected = getFixture("post-oauth-access-token-case-rejected-grant", {
      recordingsDir
    }).response;
    overrideSelf("get-self");
    await ctx.persistTokenToStorage(clientToken);
    ctx = await freshImports();
    overrideToken("post-oauth-access-token-client");
    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId } = ctx.useSessionStore().useContext();
    const { hasGuestSession } = ctx.useSessionStore().useMeta();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);

    const attempts: string[] = [];
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        attempts.push(await request.text());
        return HttpResponse.json(rejected.body as Record<string, unknown>, {
          status: rejected.status
        });
      })
    );

    let settled = false;
    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST)
      .catch(() => undefined)
      .finally(() => {
        settled = true;
      });

    expect(rejected.status).toBe(401);
    expect(
      filter(grantTypesOf(attempts), type => type === GrantTypes.GUEST).length
    ).toBeGreaterThan(0);
    expect(settled).toBe(true);
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientToken.actor_id);
    expect(hasGuestSession.value).toBe(false);
  });

  it("reloads a chosen guest under the same session id without re-minting @AC-G24", async () => {
    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const chosenId = ctx.useSessionStore().useContext().activeSessionId.value;
    expect(chosenId).toBeTruthy();

    ctx = await freshImports();
    const oauthRequests: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (includes(request.url, "/oauth/access_token")) {
        oauthRequests.push(request.url);
      }
    });

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId } = ctx.useSessionStore().useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    // A reconcile that re-keyed the entry, or a boot that dropped the pointer,
    // would land on the floor with a different (or absent) id.
    expect(activeSessionId.value).toBe(chosenId);
    expect(oauthRequests).toHaveLength(0);
  });

  it("restores a guest session persisted under the pre-FE-3087 shape @AC-G9", async () => {
    const guestFixture = overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();

    // Rewrite the store's OWN persisted blob back to the shape it wrote before
    // this change — a single `guestSession` token and no pointer — so boot
    // reads exactly what a tab that reloads across the deploy carries.
    const key = findPersistedKey() as string;
    const persisted = JSON.parse(sessionStorage.getItem(key) as string);
    delete persisted.guestSessions;
    delete persisted.activeSessionId;
    persisted.guestSession = guestFixture;
    sessionStorage.setItem(key, JSON.stringify(persisted));

    ctx = await freshImports();
    const oauthRequests: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (includes(request.url, "/oauth/access_token")) {
        oauthRequests.push(request.url);
      }
    });

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSession, guestSessions } = ctx
      .useSessionStore()
      .useContext();
    const { hasGuestSession } = ctx.useSessionStore().useMeta();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
    expect(hasGuestSession.value).toBe(true);
    expect(oauthRequests).toHaveLength(0);

    // A blob written before this change names no `guestSessions`, so a hydrate
    // that only spread it leaves the published pool undefined — the type lie
    // every consumer enumerating guests would trip over.
    expect(keys(guestSessions.value)).toHaveLength(1);
  });

  it("mints no guest and moves no pointer when the app bars guests @AC-D1", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    overrideSelf("get-self");
    await ctx.persistTokenToStorage(clientToken);
    ctx = await freshImports();
    overrideToken("post-oauth-access-token-client");
    await ctx.useSessionStore().initStore({
      allowedScopes: [AccessRoleTypes.CLIENT]
    });

    const oauthRequests: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (includes(request.url, "/oauth/access_token")) {
        oauthRequests.push(request.url);
      }
    });

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const { activeActor, activeSessionId, guestSession, guestSessions } = ctx
      .useSessionStore()
      .useContext();
    const { hasGuestSession, isScopeAllowed } = ctx.useSessionStore().useMeta();

    expect(isScopeAllowed(AccessRoleTypes.GUEST)).toBe(false);
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientToken.actor_id);
    // The new activation branch mints on demand, so a barred guest has to be
    // refused BEFORE the grant fires, not merely dropped after it lands.
    expect(oauthRequests).toHaveLength(0);
    expect(keys(guestSessions.value)).toHaveLength(0);
    expect(hasGuestSession.value).toBe(false);
    expect(guestSession.value).toBeUndefined();
  });

  it("adopts the guest this device already holds instead of minting another @AC-G28", async () => {
    overrideToken("post-oauth-access-token-guest");
    const grants = captureGuestGrants();
    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId, guestSessions } = ctx
      .useSessionStore()
      .useContext();
    const heldId = first(keys(guestSessions.value)) as string;
    expect(activeSessionId.value).toBeUndefined();
    expect(heldId).toBeTruthy();
    // The boot mint is the counter's own liveness proof: without it, the
    // "no further grant" assertions below would hold for a dead listener too.
    expect(grants).toHaveLength(1);

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    // Every recorded guest grant is masked to the same `access_token`, so a
    // mint-on-every-activate is invisible in the token and visible only here:
    // it would claim a second key and spend a second grant, silently handing
    // the user a different anonymous identity than the one they were on.
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(heldId);
    expect(keys(guestSessions.value)).toEqual([heldId]);
    expect(grants).toHaveLength(1);
  });

  it("leaves a second choice of guest on the guest already chosen @AC-G27", async () => {
    overrideToken("post-oauth-access-token-guest");
    const grants = captureGuestGrants();
    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const { activeActor, activeSessionId, guestSessions } = ctx
      .useSessionStore()
      .useContext();
    const chosenId = activeSessionId.value as string;
    expect(chosenId).toBeTruthy();
    expect(grants).toHaveLength(1);

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
    expect(keys(guestSessions.value)).toEqual([chosenId]);
    expect(grants).toHaveLength(1);
  });

  it("hands a chosen guest back to a client who signs in on this tab @AC-G26", async () => {
    overrideToken("post-oauth-access-token-guest");
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const clientId = clientToken.actor_id as string;

    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const { activeActor, activeSessionId, activeSession, guestSessions } = ctx
      .useSessionStore()
      .useContext();
    const chosenId = activeSessionId.value as string;
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(chosenId).toBeTruthy();

    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, true, ctx.mapSessionUser(selfBody));

    // The chosen guest pointer is sticky against every other write (AC-G2,
    // AC-G6). A deliberate sign-in on this tab is the one thing that must beat
    // it, or logging in looks like it did nothing.
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientId);
    expect(activeSession.value?.access_token).toBe(clientToken.access_token);
    // And it must beat it without spending the guest: the user can go back.
    expect(keys(guestSessions.value)).toContain(chosenId);
  });
});
