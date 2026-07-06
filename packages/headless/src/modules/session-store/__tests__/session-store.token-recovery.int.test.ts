/**
 * @fileoverview Session-store integration — tampered / expired token recovery
 *
 * ## Job To Be Done
 * Drive the REAL store against MSW-replayed grant/profile fixtures for the
 * token-integrity scenarios a live client session can hit: boot-time tampered /
 * expired / dead tokens (A–C), and LIVE external cookie tampers (D–K). The live
 * tests drive the app's REAL detection trigger — the 2s cookie poll, advanced
 * via interval-only fake timers, with a silent CookieStore stub matching real
 * Chromium where devtools cookie edits fire NO change event — never
 * hydrateFromStorage() directly (which green-washes a detector that never runs).
 * Each encodes the SAFE contract: the cookie is the source of truth — a bad
 * cookie must NOT leave the user authenticated as a client (drop to guest floor
 * / refresh via the cookie's own refresh token), and the clean in-memory /
 * sessionStorage copy must NEVER be written back over an externally-changed
 * cookie.
 *
 * ## What Breaks If These Fail
 * A tampered or dead token that survives boot leaves a user "logged in" behind a
 * bearer that 401s every API call (blank dashboard, silent failures); a failed
 * refresh that does not log out strands the user in the same broken state; and a
 * hydrate that blindly adopts an externally-tampered cookie would let a cookie
 * edit hijack the in-memory session. These are the auth-integrity guarantees the
 * running apps (cart/velia/hosting) depend on.
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
import type { IToken, ISelf } from "@upmind-automation/types";

// See session-store.int.test.ts for why the real cross-realm BroadcastChannel is
// stubbed with the deterministic transport — this file asserts nothing about
// broadcasts itself.
vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type SelfEnvelope = { data: { actor: { email: string } } };

const { overrideToken, overrideSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

async function freshImports() {
  vi.resetModules();
  const sessionStoreModule = await import("../useSessionStore");
  const activeSessionModule = await import("../useActiveSession");
  const syncModule = await import("../session-store.sync");
  const storeModule = await import("../session-store.store");
  const barrel = await import("..");

  return {
    useSessionStore: sessionStoreModule.useSessionStore,
    useActiveSession: activeSessionModule.useActiveSession,
    stopCookieSync: syncModule.stopCookieSync,
    // Internal (intra-module) import: scenario D drives the cookie-change sync
    // path directly rather than waiting on the 2s poll interval.
    hydrateFromStorage: storeModule.hydrateFromStorage,
    persistTokenToStorage: barrel.persistTokenToStorage,
    getTokenFromStorage: barrel.getTokenFromStorage,
    mapSessionUser: barrel.mapSessionUser
  };
}

// -----------------------------------------------------------------------------

describe("session-store integration (tampered / expired token recovery)", () => {
  let ctx: Awaited<ReturnType<typeof freshImports>>;

  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
    ctx = await freshImports();
  });

  afterEach(async () => {
    // Stop this realm's cookie-sync interval (see session-store.int.test.ts
    // afterEach) BEFORE restoring timers so a fake interval is cleared by the
    // fake clock, then drain queued micro/macrotasks and drop request spies.
    ctx?.stopCookieSync();
    vi.useRealTimers();
    delete (window as unknown as { cookieStore?: object }).cookieStore;
    server?.events.removeAllListeners();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  /**
   * Arms the LIVE-tamper environment: interval-only fake timers so the 2s
   * cookie poll can be advanced deterministically (all other timers, promises
   * and MSW stay real), plus — for the Chromium variant — a CookieStore stub
   * that exists but never emits, matching real Chrome where a manual devtools
   * cookie edit fires NO change event and only the poll can catch the tamper.
   * Must run BEFORE initStore(): that is when initCookieSync() wires both the
   * change listener and the poll interval.
   */
  function armLiveCookieTamperEnv(opts?: { chromium?: boolean }): void {
    if (opts?.chromium) {
      (window as unknown as { cookieStore?: object }).cookieStore = {
        addEventListener: (): void => {},
        removeEventListener: (): void => {}
      };
    }
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  }

  it("A — drops a tampered (garbage) client cookie at boot and floors to guest", async () => {
    // SS-R1 (scenario A): reproduces the user's real repro — a client-session
    // cookie whose access_token AND refresh_token are garbage (a valid token
    // prefixed with "XXX"). /self 401s that token; the boot dead-token drop must
    // remove the client session so the store never boots "authenticated" behind
    // a token that 401s every request. What breaks if this fails: a tampered
    // cookie boots the app as a logged-in client with a dead bearer.
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const tampered: IToken = {
      ...clientToken,
      access_token: `XXX${clientToken.access_token}`, // tampered — prefix garbage
      refresh_token: `XXX${clientToken.refresh_token}` // tampered — prefix garbage
    };

    await ctx.persistTokenToStorage(tampered);
    ctx = await freshImports();

    overrideSelf("get-self-case-invalid-token");
    overrideToken("post-oauth-access-token-guest");

    await ctx.useSessionStore().initStore();

    const { activeActor, allSessions } = ctx.useSessionStore().useContext();
    expect(allSessions.value[clientToken.actor_id as string]).toBeUndefined();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(document.cookie).not.toMatch(/upm_client_session=/);

    const { isAuthenticated } = ctx.useActiveSession().useMeta();
    expect(isAuthenticated.value).toBe(false);
  });

  it("B — recovers an expired access token via a successful refresh, persisting the new token", async () => {
    // SS-R2 (scenario B): an expired access token + a valid refresh token. The
    // reactive retry path (useQuery → refreshToken) fires on the boot /self 401,
    // the oauth refresh POST SUCCEEDS, and the NEW token replaces the expired one
    // in the store/cookie. Asserting the actual new access_token (not just
    // "authenticated") is the point — a refresh that keeps the stale token would
    // pass a presence-only check yet still 401. What breaks if this fails: token
    // refresh silently no-ops and the session dies on the next request.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    });
    const invalidBody = getFixture("get-self-case-invalid-token", {
      recordingsDir
    }).response.body as object;
    const selfEnvelope = getFixture("get-self", { recordingsDir }).response
      .body as object;

    // Seed an EXPIRED client cookie whose access_token differs from the refresh
    // result, so "new token replaced expired token" is a real, distinct assertion.
    const expired: IToken = {
      ...clientFixture,
      access_token: "expired-access_token", // distinct from the refreshed token
      created_at: Date.now() - 7200_000, // 2h ago
      expires_in: 3600 // → expired 1h ago
    };
    await ctx.persistTokenToStorage(expired);
    ctx = await freshImports();

    // Refresh returns the client fixture (access_token "mock-access_token").
    overrideToken("post-oauth-access-token-client");
    // /self: 401 for the expired bearer, 200 for the refreshed bearer. Proves the
    // retry re-issued /self with the NEW token.
    server?.use(
      http.get("*/self", ({ request }) => {
        const auth = request.headers.get("Authorization") ?? "";
        if (auth.includes("expired-access_token"))
          return HttpResponse.json(invalidBody, { status: 401 });
        return HttpResponse.json(selfEnvelope, { status: 200 });
      })
    );

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSession, activeUser } = ctx
      .useSessionStore()
      .useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSession.value?.access_token).toBe(clientFixture.access_token);
    expect(activeSession.value?.access_token).not.toBe("expired-access_token");
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      clientFixture.access_token
    );

    const { isAuthenticated } = ctx.useActiveSession().useMeta();
    expect(isAuthenticated.value).toBe(true);
    await vi.waitFor(() =>
      expect(activeUser.value?.email).toBe(selfBody.data.actor.email)
    );
  });

  it("C — logs out cleanly to the guest floor when the refresh token is also dead", async () => {
    // SS-R3 (scenario C): expired access token AND a refresh POST that 401s
    // (dead/invalid refresh). The recovery chain (refreshToken.catch →
    // dumpTokenFromStorage + logout) must remove the client session and drop to a
    // freshly minted guest. What breaks if this fails: a user with a fully dead
    // session stays "logged in" and every request 401s with no recovery.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const guestFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-guest",
      { recordingsDir }
    );
    // A recorded 401 error-envelope stands in for the oauth refresh rejection —
    // only its 401 status drives the recovery branch.
    const oauth401Body = getFixture("get-self-case-invalid-token", {
      recordingsDir
    }).response.body as object;

    const expired: IToken = {
      ...clientFixture,
      access_token: "expired-access_token",
      created_at: Date.now() - 7200_000,
      expires_in: 3600
    };
    await ctx.persistTokenToStorage(expired);
    ctx = await freshImports();

    overrideSelf("get-self-case-invalid-token");
    // One oauth endpoint, two grants: the refresh grant 401s (dead refresh
    // token); the guest grant succeeds so the recovered guest floor is minted.
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        const body = await request.text();
        if (body.includes(GrantTypes.REFRESH_TOKEN))
          return HttpResponse.json(oauth401Body, { status: 401 });
        return HttpResponse.json(guestFixture as object, { status: 200 });
      })
    );

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    expect(allSessions.value[clientFixture.actor_id as string]).toBeUndefined();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(document.cookie).not.toMatch(/upm_client_session=/);

    const { isAuthenticated } = ctx.useActiveSession().useMeta();
    expect(isAuthenticated.value).toBe(false);

    // The recovery settles on a clean, freshly-minted guest floor.
    await vi.waitFor(() =>
      expect(activeSession.value?.access_token).toBe(guestFixture.access_token)
    );
  });

  it("C(meta) — canRefresh is false once the refresh token's own expiry has passed", async () => {
    // SS-R4 (scenario C, focused unit): covers the untested false branch at
    // useSession.meta.ts:81-82 — canRefresh compares created_at +
    // refresh_expires_in*1000 against now. Asserted both ways so it proves the
    // date comparison, not an always-false. What breaks if this fails: UI offers
    // a "stay signed in" refresh with a refresh token the server will reject.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();

    const deadRefresh: IToken = {
      ...clientFixture,
      created_at: Date.now() - 100_000_000, // long past
      refresh_expires_in: 36000 // 10h → refresh window ended ~64,000s ago
    };
    await ctx
      .useSessionStore()
      .useActions()
      .add(deadRefresh, true, ctx.mapSessionUser(selfBody));
    expect(ctx.useActiveSession().useMeta().canRefresh.value).toBe(false);

    const liveRefresh: IToken = {
      ...clientFixture,
      created_at: Date.now(),
      refresh_expires_in: 36000 // 10h ahead → still refreshable
    };
    await ctx
      .useSessionStore()
      .useActions()
      .add(liveRefresh, true, ctx.mapSessionUser(selfBody));
    expect(ctx.useActiveSession().useMeta().canRefresh.value).toBe(true);
  });

  it("D — characterises hydrate when the cookie is tampered externally mid-session", async () => {
    // SS-R5 (scenario D): the in-memory store holds a CLEAN client token; an
    // external actor (other tab / devtools edit) rewrites the cookie to a
    // tampered token; the cookie-change sync fires hydrateFromStorage(). This
    // asserts what the store ACTUALLY does — adopt the tampered cookie or revert
    // to the clean in-memory token — and documents whether that is safe.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const cleanToken = clientFixture.access_token as string;
    const tamperedToken = `XXX${cleanToken}`;

    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientFixture, true, ctx.mapSessionUser(selfBody));

    const { activeSession } = ctx.useSessionStore().useContext();
    expect(activeSession.value?.access_token).toBe(cleanToken); // clean in-memory

    // External cookie tamper — cookie ONLY, no store mutation (sync:false).
    const tampered: IToken = { ...clientFixture, access_token: tamperedToken };
    await ctx.persistTokenToStorage(tampered, { sync: false });

    await ctx.hydrateFromStorage();

    // Hydrate reconciles the maps to the live cookies with cookie-as-truth
    // (session-store.store.ts reconcileToCookies), so it ADOPTS the tampered
    // cookie token into the active session; it is then rejected lazily — the
    // next API call 401s into the refresh/logout chain (tests E/F/J).
    // isAuthenticated stays true here because the flag is presence-based, not
    // validity-based (useSession.meta.ts). The write gate never re-projects the
    // clean in-memory token back over the cookie (test K).
    expect(activeSession.value?.access_token).toBe(tamperedToken);
    expect(ctx.useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });

  it("E (contract 1) — a mangled access_token with a VALID refresh_token FIRES the oauth refresh POST and swaps the mangled token for the refreshed one", async () => {
    // Contract 1: the boot access_token is mangled (a valid JWT prefixed with
    // "XX_") but the refresh_token is VALID. The boot /self 401s the mangled
    // bearer; the reactive retry (useQuery → canRetryAuthorization →
    // refreshToken) MUST fire a real oauth refresh POST carrying
    // grant_type=refresh_token + the valid refresh token. Because the refresh
    // token is good the POST succeeds and the NEW access_token replaces the
    // mangled one in the store/cookie. We assert on the OUTGOING refresh request
    // (recorded by the MSW handler), not just the resulting state — proving the
    // network call actually happened. What breaks if this fails: a mangled
    // access token never triggers recovery and every request 401s.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    });
    const invalidBody = getFixture("get-self-case-invalid-token", {
      recordingsDir
    }).response.body as object;
    const selfEnvelope = getFixture("get-self", { recordingsDir }).response
      .body as object;

    const mangledAccessToken = `XX_${clientFixture.access_token}`;
    const validRefreshToken = clientFixture.refresh_token as string;
    const mangled: IToken = {
      ...clientFixture,
      access_token: mangledAccessToken // tampered — 401s; refresh_token left VALID
    };
    await ctx.persistTokenToStorage(mangled);
    ctx = await freshImports();

    // Record every oauth POST so we can prove the refresh network call fired with
    // the right grant + valid refresh token. The refresh returns the clean client
    // fixture (access_token "mock-access_token"). /self: 401 for the mangled
    // bearer, 200 for the refreshed bearer — proving the retry re-issued /self.
    const oauthRequests: string[] = [];
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        oauthRequests.push(await request.text());
        return HttpResponse.json(clientFixture as object, { status: 200 });
      }),
      http.get("*/self", ({ request }) => {
        const auth = request.headers.get("Authorization") ?? "";
        if (auth.includes(mangledAccessToken))
          return HttpResponse.json(invalidBody, { status: 401 });
        return HttpResponse.json(selfEnvelope, { status: 200 });
      })
    );

    await ctx.useSessionStore().initStore();

    // The refresh network call FIRED: a POST with grant_type=refresh_token that
    // carried the VALID refresh token.
    const refreshCalls = oauthRequests.filter(body =>
      body.includes(GrantTypes.REFRESH_TOKEN)
    );
    expect(refreshCalls.length).toBeGreaterThanOrEqual(1);
    expect(refreshCalls.some(body => body.includes(validRefreshToken))).toBe(
      true
    );

    // The refreshed token replaced the mangled one in store + cookie.
    const { activeActor, activeSession, activeUser } = ctx
      .useSessionStore()
      .useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSession.value?.access_token).toBe(clientFixture.access_token);
    expect(activeSession.value?.access_token).not.toBe(mangledAccessToken);
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      clientFixture.access_token
    );

    const { isAuthenticated } = ctx.useActiveSession().useMeta();
    expect(isAuthenticated.value).toBe(true);
    await vi.waitFor(() =>
      expect(activeUser.value?.email).toBe(selfBody.data.actor.email)
    );
  });

  it("F (contract 2) — a mangled refresh_token FAILS the refresh and drops the user to the guest floor (NOT logged in)", async () => {
    // Contract 2: BOTH tokens are mangled ("XX_"-prefixed). The boot /self 401s
    // the mangled access token; the reactive retry fires the oauth refresh POST,
    // which 401s because the refresh token is bad. The recovery chain
    // (refreshToken.catch → dumpTokenFromStorage + logout) MUST drop the client
    // session and floor to a freshly minted guest — the user ends NOT logged in.
    // We assert the refresh POST fired carrying the mangled refresh token AND the
    // teardown outcome, so the whole refresh-fail → dump → logout → guest chain
    // is proven. What breaks if this fails: a fully dead session stays "logged
    // in" behind a dead bearer that 401s every request.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const guestFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-guest",
      { recordingsDir }
    );
    // A recorded 401 error-envelope stands in for the oauth refresh rejection —
    // only its 401 status drives the recovery branch.
    const oauth401Body = getFixture("get-self-case-invalid-token", {
      recordingsDir
    }).response.body as object;

    const mangledAccessToken = `XX_${clientFixture.access_token}`;
    const mangledRefreshToken = `XX_${clientFixture.refresh_token}`;
    const mangled: IToken = {
      ...clientFixture,
      access_token: mangledAccessToken,
      refresh_token: mangledRefreshToken
    };
    await ctx.persistTokenToStorage(mangled);
    ctx = await freshImports();

    overrideSelf("get-self-case-invalid-token");
    // Record oauth POSTs. Refresh grant (mangled token) 401s; guest grant mints
    // the recovered floor.
    const oauthRequests: string[] = [];
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        const body = await request.text();
        oauthRequests.push(body);
        if (body.includes(GrantTypes.REFRESH_TOKEN))
          return HttpResponse.json(oauth401Body, { status: 401 });
        return HttpResponse.json(guestFixture as object, { status: 200 });
      })
    );

    await ctx.useSessionStore().initStore();

    // The refresh POST FIRED and carried the mangled refresh token.
    const refreshCalls = oauthRequests.filter(body =>
      body.includes(GrantTypes.REFRESH_TOKEN)
    );
    expect(refreshCalls.length).toBeGreaterThanOrEqual(1);
    expect(refreshCalls.some(body => body.includes(mangledRefreshToken))).toBe(
      true
    );

    // Teardown ran: client session dumped, cookie cleared, floored to guest.
    const { activeActor, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    expect(allSessions.value[clientFixture.actor_id as string]).toBeUndefined();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(document.cookie).not.toMatch(/upm_client_session=/);

    const { isAuthenticated } = ctx.useActiveSession().useMeta();
    expect(isAuthenticated.value).toBe(false);

    // The recovery settles on a clean, freshly-minted guest floor.
    await vi.waitFor(() =>
      expect(activeSession.value?.access_token).toBe(guestFixture.access_token)
    );
  });

  it("G (contract 3) — cookie is source of truth: a mangled cookie must NOT be healed from the clean sessionStorage copy", async () => {
    // Documented contract (useSessionStore.actions.ts:362 "dumpTokenFromStorage
    // is source of truth"; session-store.store.ts reconcileToCookies "cookie =
    // truth"): THE COOKIE IS THE SOURCE OF TRUTH. Reproduces the real browser
    // case where sessionStorage (upm_session_store) still holds a CLEAN client
    // token while the upm_client_session cookie has been mangled ("XX_"-prefixed
    // access). On boot the store MUST act on the mangled COOKIE — the mangled
    // access token drives the /self → refresh path — and MUST NOT silently
    // resurrect the clean sessionStorage token over it. Here the mangled access
    // token keeps a VALID refresh token, so the cookie-driven end state is a
    // successful refresh to a NEW token. If the code heals the cookie from
    // sessionStorage, the clean token is used, /self never 401s, NO refresh
    // fires, and activeSession keeps the clean value — this test then FAILS,
    // documenting the bug. What breaks if this fails: a stale/clean sessionStorage
    // snapshot overrides a mangled cookie, masking tamper behind a dead bearer.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    });
    const selfUser = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const invalidBody = getFixture("get-self-case-invalid-token", {
      recordingsDir
    }).response.body as object;
    const selfEnvelope = getFixture("get-self", { recordingsDir }).response
      .body as object;

    // Distinct sentinels so the CLEAN sessionStorage value ("clean-access_token")
    // is provably different from the REFRESHED value ("mock-access_token"): a
    // resurrection is therefore detectable, not masked by a coincidental match.
    const cleanAccessToken = "clean-access_token";
    const cleanRefreshToken = "clean-refresh_token";
    const cleanClient: IToken = {
      ...clientFixture,
      access_token: cleanAccessToken,
      refresh_token: cleanRefreshToken
    };
    const mangledAccessToken = `XX_${cleanAccessToken}`;

    // --- Seed a GENUINELY logged-in client: clean token in BOTH the cookie AND
    //     the sessionStorage persisted state. add() writes the scope cookie and
    //     the store subscription auto-persists the state to sessionStorage.
    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(cleanClient, true, ctx.mapSessionUser(selfUser));
    expect(
      ctx.useSessionStore().useContext().activeSession.value?.access_token
    ).toBe(cleanAccessToken);

    // --- MANGLE ONLY THE COOKIE (sync:false = cookie only, no store mutation),
    //     leaving the clean token in sessionStorage. The real browser tamper.
    ctx.stopCookieSync();
    const mangledCookie: IToken = {
      ...cleanClient,
      access_token: mangledAccessToken // access mangled; refresh_token left VALID
    };
    await ctx.persistTokenToStorage(mangledCookie, { sync: false });

    // Premise: cookie is mangled (read decoded — cookies are base64), while
    // sessionStorage (plain JSON) still holds the clean token.
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      mangledAccessToken
    );
    const persisted = sessionStorage.getItem("upm_session_store") ?? "";
    expect(persisted).toContain(cleanAccessToken);
    expect(persisted).not.toContain(mangledAccessToken);

    // --- Simulate a fresh page load: wipe in-memory modules, keep cookie +
    //     sessionStorage, re-boot the store so buildInitialState re-reads both.
    ctx = await freshImports();

    const oauthRequests: string[] = [];
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        oauthRequests.push(await request.text());
        return HttpResponse.json(clientFixture as object, { status: 200 });
      }),
      http.get("*/self", ({ request }) => {
        const auth = request.headers.get("Authorization") ?? "";
        if (auth.includes(mangledAccessToken))
          return HttpResponse.json(invalidBody, { status: 401 });
        return HttpResponse.json(selfEnvelope, { status: 200 });
      })
    );

    await ctx.useSessionStore().initStore();

    // CONTRACT: the mangled COOKIE drove the flow — a refresh POST fired carrying
    // the COOKIE'S valid refresh token. If the clean sessionStorage token were
    // healed in, the clean access token would never 401 and NO refresh would fire.
    const refreshCalls = oauthRequests.filter(body =>
      body.includes(GrantTypes.REFRESH_TOKEN)
    );
    expect(refreshCalls.length).toBeGreaterThanOrEqual(1);
    expect(refreshCalls.some(body => body.includes(cleanRefreshToken))).toBe(
      true
    );

    const { activeActor, activeSession, activeUser } = ctx
      .useSessionStore()
      .useContext();

    // CONTRACT: end state follows from the COOKIE (mangled access + valid refresh
    // ⇒ refreshed to the NEW token). The clean sessionStorage token is NOT
    // resurrected as the active token.
    expect(activeSession.value?.access_token).toBe(clientFixture.access_token);
    expect(activeSession.value?.access_token).not.toBe(cleanAccessToken);
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      clientFixture.access_token
    );
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(ctx.useActiveSession().useMeta().isAuthenticated.value).toBe(true);
    await vi.waitFor(() =>
      expect(activeUser.value?.email).toBe(selfBody.data.actor.email)
    );
  });

  it("H (contract 4) — an UNDECODABLE cookie invalidates the client session and must NOT heal from the sessionStorage copy", async () => {
    // Contract (cookie = source of truth) for the user's REAL repro: the
    // upm_client_session cookie is HAND-EDITED so its base64 no longer decodes.
    // An undecodable cookie is NOT a valid client credential —
    // getTokenFromStorage returns null for it (useCookies.get swallows the
    // atob/JSON.parse throw). On boot the store must therefore NOT come back
    // authenticated by resurrecting the clean token still sitting in
    // sessionStorage (upm_session_store); it must drop to the guest floor. Unlike
    // G — which mangles via the encoder so the cookie still DECODES and the
    // overlay wins — here the cookie cannot decode at all, so buildInitialState's
    // cookie overlay is SKIPPED (session-store.store.ts:255 guards on
    // clientToken?.access_token): the exact place a stale sessionStorage token can
    // slip through. What breaks if this fails: a garbage cookie leaves the user
    // silently "logged in" from a stale sessionStorage snapshot behind a
    // credential the server never issued.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfUser = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    const cleanAccessToken = "clean-access_token";
    const cleanClient: IToken = {
      ...clientFixture,
      access_token: cleanAccessToken,
      refresh_token: "clean-refresh_token"
    };

    // --- Seed a GENUINELY logged-in client: clean token in BOTH the cookie AND
    //     sessionStorage (add() writes the scope cookie + auto-persists state).
    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(cleanClient, true, ctx.mapSessionUser(selfUser));
    expect(
      ctx.useSessionStore().useContext().activeSession.value?.access_token
    ).toBe(cleanAccessToken);
    // The clean cookie is present and decodes (confirms what we then corrupt).
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      cleanAccessToken
    );

    // --- HAND-EDIT the RAW cookie so it can no longer decode: prefix the real
    //     encoded value with "XX_" via a low-level document.cookie write (NOT
    //     persistTokenToStorage, which would re-encode cleanly). sessionStorage is
    //     left untouched, still holding the clean token.
    ctx.stopCookieSync();
    const rawEncoded =
      document.cookie
        .split(";")
        .map(part => part.trim())
        .find(part => part.startsWith("upm_client_session="))
        ?.slice("upm_client_session=".length) ?? "";
    document.cookie = `upm_client_session=XX_${rawEncoded}; path=/`;

    // Premise: the cookie no longer decodes (no valid client credential), while
    // sessionStorage still holds the clean token.
    expect(
      ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token
    ).toBeFalsy();
    const persisted = sessionStorage.getItem("upm_session_store") ?? "";
    expect(persisted).toContain(cleanAccessToken);

    // --- Simulate a fresh page load: wipe in-memory modules, keep cookie +
    //     sessionStorage, re-boot the store.
    ctx = await freshImports();
    overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();

    // CONTRACT: an undecodable cookie is not a valid credential — the clean
    // sessionStorage token must NOT be resurrected as the active session, and the
    // store must floor to guest (NOT authenticated).
    expect(activeSession.value?.access_token).not.toBe(cleanAccessToken);
    expect(allSessions.value[clientFixture.actor_id as string]).toBeUndefined();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(ctx.useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });

  it("I (contract 5) — a LIVE devtools cookie tamper on Chromium is caught by the 2s poll and logs the user out, with no heal", async () => {
    // Contract (cookie = source of truth), LIVE-tab variant on CHROMIUM: the
    // store is booted and authenticated as a client; an external actor then
    // HAND-EDITS the upm_client_session cookie so it no longer decodes — WITHOUT
    // a page reload. Real Chrome fires NO CookieStore change event for a manual
    // devtools edit (stubbed silent here), so the 2s cookie poll is the ONLY
    // detector: advancing it must invalidate the session — a broken
    // source-of-truth cookie logs the user out. It must NOT keep the in-memory
    // client token nor re-project the clean token back over the corrupted
    // cookie. What breaks if this fails: on Chromium the poll never starts (the
    // change-listener branch swallows it), a live cookie tamper is detected by
    // NOTHING, and the user stays authenticated behind a credential the cookie
    // no longer holds.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfUser = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    const cleanAccessToken = "clean-access_token";
    const cleanClient: IToken = {
      ...clientFixture,
      access_token: cleanAccessToken,
      refresh_token: "clean-refresh_token"
    };

    // --- Boot a GENUINELY logged-in, LIVE client on Chromium (silent
    //     CookieStore + fake poll interval armed BEFORE initStore wires the
    //     sync) — NO freshImports, the in-memory store stays alive (the
    //     live-tab scenario, not a reload).
    armLiveCookieTamperEnv({ chromium: true });
    overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(cleanClient, true, ctx.mapSessionUser(selfUser));

    const { activeActor, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    expect(activeSession.value?.access_token).toBe(cleanAccessToken);
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(ctx.useActiveSession().useMeta().isAuthenticated.value).toBe(true);

    // Let one poll tick snapshot the LOGGED-IN cookie state. In a real browser
    // the poll ticks continuously, so its last snapshot always holds the clean
    // token before a tamper; with interval-only fake timers no tick has run
    // since login, and an undecodable tamper reads as undefined — identical to
    // the pre-login snapshot — which would mask the change.
    await vi.advanceTimersByTimeAsync(2000);

    // --- LIVE tamper: hand-edit the RAW cookie so it no longer decodes (a
    //     low-level document.cookie write, NOT persistTokenToStorage which
    //     re-encodes cleanly). sessionStorage keeps the clean token and the
    //     in-memory store still holds the clean client. No CookieStore change
    //     event fires — exactly like a devtools edit in real Chrome.
    const rawEncoded =
      document.cookie
        .split(";")
        .map(part => part.trim())
        .find(part => part.startsWith("upm_client_session="))
        ?.slice("upm_client_session=".length) ?? "";
    document.cookie = `upm_client_session=XX_${rawEncoded}; path=/`;
    expect(
      ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token
    ).toBeFalsy();

    // --- The REAL trigger: advance the 2s cookie poll — the only detector that
    //     can catch a devtools edit on Chromium.
    await vi.advanceTimersByTimeAsync(2000);
    await new Promise(resolve => setTimeout(resolve, 0));

    // CONTRACT: the broken cookie logs the user out LIVE — session invalidated,
    // clean token neither kept active nor re-projected back to the cookie.
    expect(activeSession.value?.access_token).not.toBe(cleanAccessToken);
    expect(allSessions.value[clientFixture.actor_id as string]).toBeUndefined();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(ctx.useActiveSession().useMeta().isAuthenticated.value).toBe(false);
    expect(
      ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token
    ).toBeFalsy();
  });

  it("J (contract 6) — a LIVE access-token tamper on Chromium (valid refresh) is caught by the poll and re-fires the oauth refresh", async () => {
    // Contract (cookie = source of truth), LIVE-tab variant on CHROMIUM,
    // access-token only: the store is booted and authenticated as a client; an
    // external actor then edits the upm_client_session cookie so its ACCESS
    // token is mangled ("XX_"-prefixed, still decodable) while the refresh token
    // stays VALID and the in-memory store still holds the CLEAN token. No
    // CookieStore change event fires (devtools edit); the 2s poll must detect
    // the tamper, the store must adopt the COOKIE'S mangled access token (source
    // of truth, not the healed in-memory copy): it 401s, the reactive retry
    // fires a real oauth refresh POST carrying the valid refresh token, a NEW
    // access token replaces the mangled one, and the user stays authenticated on
    // the refreshed token. We assert the OUTGOING refresh request (recorded), so
    // a "heal from the in-memory clean copy WITHOUT a refresh network call"
    // makes this FAIL. What breaks if this fails: a live access-token tamper is
    // never detected (poll dead on Chromium) or silently papered over from
    // memory, and the true cookie state is never reconciled with the server.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    });
    const selfUser = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const invalidBody = getFixture("get-self-case-invalid-token", {
      recordingsDir
    }).response.body as object;
    const selfEnvelope = getFixture("get-self", { recordingsDir }).response
      .body as object;

    const cleanAccessToken = "clean-access_token";
    const cleanRefreshToken = "clean-refresh_token";
    const cleanClient: IToken = {
      ...clientFixture,
      access_token: cleanAccessToken,
      refresh_token: cleanRefreshToken
    };
    const mangledAccessToken = `XX_${cleanAccessToken}`;

    // --- Boot a GENUINELY logged-in, LIVE client on Chromium (silent
    //     CookieStore + fake poll interval) — NO freshImports.
    armLiveCookieTamperEnv({ chromium: true });
    overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(cleanClient, true, ctx.mapSessionUser(selfUser));
    expect(
      ctx.useSessionStore().useContext().activeSession.value?.access_token
    ).toBe(cleanAccessToken);
    expect(ctx.useActiveSession().useMeta().isAuthenticated.value).toBe(true);

    // --- LIVE tamper of ONLY the access token: rewrite the cookie so its active
    //     access token is mangled (still decodable) with a VALID refresh token,
    //     WITHOUT mutating the store (sync:false). The cookie now disagrees with
    //     the clean in-memory copy — the next request must trust the cookie.
    const mangledCookie: IToken = {
      ...cleanClient,
      access_token: mangledAccessToken
    };
    await ctx.persistTokenToStorage(mangledCookie, { sync: false });
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      mangledAccessToken
    );

    // Record every oauth POST to prove the refresh network call fires. The
    // refresh returns the clean client fixture (access_token "mock-access_token").
    // /self: 401 for the mangled bearer, 200 for the refreshed bearer.
    const oauthRequests: string[] = [];
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        oauthRequests.push(await request.text());
        return HttpResponse.json(clientFixture as object, { status: 200 });
      }),
      http.get("*/self", ({ request }) => {
        const auth = request.headers.get("Authorization") ?? "";
        if (auth.includes(mangledAccessToken))
          return HttpResponse.json(invalidBody, { status: 401 });
        return HttpResponse.json(selfEnvelope, { status: 200 });
      })
    );

    // --- The REAL trigger: advance the 2s cookie poll, which detects the edit,
    //     adopts the cookie's mangled token, and fires the next protected /self
    //     request on it.
    await vi.advanceTimersByTimeAsync(2000);

    // CONTRACT: the refresh network call FIRED carrying the VALID refresh token.
    await vi.waitFor(() => {
      const refreshCalls = oauthRequests.filter(body =>
        body.includes(GrantTypes.REFRESH_TOKEN)
      );
      expect(refreshCalls.length).toBeGreaterThanOrEqual(1);
      expect(refreshCalls.some(body => body.includes(cleanRefreshToken))).toBe(
        true
      );
    });

    const { activeActor, activeSession, activeUser } = ctx
      .useSessionStore()
      .useContext();

    // CONTRACT: the NEW access token replaced the mangled one in store + cookie,
    // and the user stays authenticated on the refreshed token.
    await vi.waitFor(() =>
      expect(activeSession.value?.access_token).toBe(clientFixture.access_token)
    );
    expect(activeSession.value?.access_token).not.toBe(mangledAccessToken);
    expect(activeSession.value?.access_token).not.toBe(cleanAccessToken);
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      clientFixture.access_token
    );
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(ctx.useActiveSession().useMeta().isAuthenticated.value).toBe(true);
    await vi.waitFor(() =>
      expect(activeUser.value?.email).toBe(selfBody.data.actor.email)
    );
  });

  it("K (contract 7) — a LIVE cookie replaced with a FOREIGN actor's token is never overwritten by the write gate's projection", async () => {
    // Contract (cookie = source of truth), the exact write-back defect: while a
    // client is active, the upm_client_session cookie is externally replaced
    // with a DECODABLE token belonging to a DIFFERENT actor_id. The write gate's
    // active-session projection (session-store.store.ts) sees cookie.actor_id ≠
    // activeSessionId — and must NOT resolve that mismatch by re-projecting the
    // clean in-memory token over the cookie: the pointer did not move, so the
    // mismatch means the cookie changed externally and the cookie wins. The
    // clean session may stay CACHED (multi-session cache) and the tab's active
    // pointer may keep it per-tab, but the cookie must keep the foreign value
    // through the poll-triggered hydrate AND any later gate write. What breaks
    // if this fails: the store silently "heals" a tampered/foreign cookie from
    // its secondary in-memory/sessionStorage copy — the observed devtools-tamper
    // revert, and one tab stomping another tab's freshly-written login cookie.
    const clientFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfUser = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    const cleanAccessToken = "clean-access_token";
    const cleanClient: IToken = {
      ...clientFixture,
      access_token: cleanAccessToken,
      refresh_token: "clean-refresh_token"
    };
    const foreignAccessToken = "foreign-access_token";
    const foreignClient: IToken = {
      ...clientFixture,
      actor_id: "tampered-actor-id",
      access_token: foreignAccessToken,
      refresh_token: "foreign-refresh_token"
    };

    // --- Boot a GENUINELY logged-in, LIVE client (fallback poll path — the
    //     write-back defect is browser-agnostic, so no CookieStore stub here).
    armLiveCookieTamperEnv();
    overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(cleanClient, true, ctx.mapSessionUser(selfUser));

    const { activeSession, allSessions } = ctx.useSessionStore().useContext();
    expect(activeSession.value?.access_token).toBe(cleanAccessToken);

    // --- LIVE tamper: replace ONLY the cookie with the foreign actor's token
    //     (sync:false = cookie only). Memory + sessionStorage keep the clean
    //     token — the exact precondition for a heal.
    await ctx.persistTokenToStorage(foreignClient, { sync: false });
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      foreignAccessToken
    );

    // --- The REAL trigger: advance the 2s cookie poll.
    await vi.advanceTimersByTimeAsync(2000);
    await new Promise(resolve => setTimeout(resolve, 0));

    // CONTRACT: the cookie still holds the FOREIGN token — the clean in-memory
    // copy was NOT projected back over it by the poll-triggered gate write.
    const cookieAfterPoll = ctx.getTokenFromStorage(AccessRoleTypes.CLIENT);
    expect(cookieAfterPoll?.access_token).toBe(foreignAccessToken);
    expect(cookieAfterPoll?.actor_id).toBe("tampered-actor-id");

    // The tab's per-tab active pointer and the multi-session cache are intact
    // (the clean session is CACHED, not written to the cookie).
    expect(activeSession.value?.access_token).toBe(cleanAccessToken);
    expect(allSessions.value[clientFixture.actor_id as string]).toBeDefined();

    // CONTRACT holds through ANY later gate write, not just the detecting one.
    await ctx.hydrateFromStorage();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token).toBe(
      foreignAccessToken
    );
  });
});
