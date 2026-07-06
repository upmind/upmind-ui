/**
 * @fileoverview Session-store integration — boot, identity floor, multi-session
 * switching (reqs 1/2/5)
 *
 * ## Job To Be Done
 * Drive the REAL store against MSW-replayed grant/profile fixtures: guest-floor
 * boot, fatal mint failure, cookie-of-record reconciliation, per-scope single
 * cookie, session-long sessionStorage cache with zero-round-trip switching,
 * logout fallback, scope restriction, impersonation restore, and expiry flags.
 *
 * ## What Breaks If These Fail
 * Visitors boot without a bearer (every API call 401s); logout strands users
 * with no identity; switching accounts re-hits the API or activates the wrong
 * user's token; a storefront activates a staff session; token expiry misreads
 * log everyone out.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../__tests__/int-test-helpers";
import { FakeBroadcastChannel } from "./fake-broadcast-channel";
import { server } from "./setup.integration";
import type { IToken, ISelf } from "@upmind-automation/types";

// `add()` broadcasts SET_SESSION on every call. The real BroadcastChannel
// delivers cross-realm messages asynchronously and late enough to reach a
// freshly re-imported module's listener (this file's `freshImports()`
// simulates a reload), stomping its just-restored active session. Stubbed
// with the sync suite's deterministic transport — this file asserts nothing
// about broadcasts itself.
vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type SelfEnvelope = { data: { actor: { email: string } } };

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
    // Stops the 2s cookie-sync interval this realm started (see afterEach).
    stopCookieSync: syncModule.stopCookieSync,
    persistTokenToStorage: barrel.persistTokenToStorage,
    getTokenFromStorage: barrel.getTokenFromStorage,
    mapSessionUser: barrel.mapSessionUser
  };
}

// -----------------------------------------------------------------------------

describe("session-store integration (boot, identity, switching)", () => {
  let ctx: Awaited<ReturnType<typeof freshImports>>;

  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
    ctx = await freshImports();
  });

  afterEach(async () => {
    // Test isolation: `session-store.store` calls `initCookieSync()` on load, so
    // every `freshImports()` (vi.resetModules → new realm) starts a fresh 2s
    // storage-poll interval. resetModules can't clear the previous realm's
    // interval, so without this stop they accumulate across the file and, on a
    // slow CI runner, the leaked timers/promises bleed into the next test's
    // `beforeEach` and blow the hook timeout. Stop this realm's interval here,
    // then drain queued micro/macrotasks and drop request spies.
    ctx?.stopCookieSync();
    server?.events.removeAllListeners();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it("boots with no cookies by minting and persisting a guest identity", async () => {
    // SS-I1 — ss-gotchas §1/§2 🧪; req 5 guest-floor framing; ss-foundation
    // §Boot flow
    overrideToken("post-oauth-access-token-guest");
    const guestFixture = getFixtureBody<IToken>(
      "post-oauth-access-token-guest",
      { recordingsDir }
    );

    const preInit = ctx.useSessionStore().useContext();
    expect(preInit.activeSession.value?.access_token).toBeFalsy();

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSession } = ctx.useSessionStore().useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
    expect(document.cookie).toMatch(/upm_guest_session=/);
  });

  it("treats a guest mint that fails every retry as a fatal-but-settled boot error", async () => {
    // SS-I2 — ss-gotchas §2 🧪 ("error state … does not hang") + §3 🧪;
    // ss-foundation §Failure modes row 3; D4 network-failure stub.
    // Doc/API gap (triage-round1 SS7): ss-foundation promises a surfaced
    // boot-error state, but no `error`/`hasErrors` accessor is documented on
    // the public useContext()/useMeta() surface — so this test asserts the
    // strongest citeable claims only: boot settles (no hang) and no
    // unauthorised token is present.
    server?.use(http.post("*/oauth/access_token", () => HttpResponse.error())); // D4

    let settled = false;
    await ctx
      .useSessionStore()
      .initStore()
      .catch(() => undefined)
      .finally(() => {
        settled = true;
      });

    expect(settled).toBe(true);

    const { activeSession } = ctx.useSessionStore().useContext();
    expect(activeSession.value?.access_token).toBeFalsy();
  });

  it("boots with a client cookie by restoring the client and loading its profile", async () => {
    // SS-I3 ⛳ — ss-foundation §Boot flow ("restore previous active");
    // ss-usage §useMeta
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    await ctx.persistTokenToStorage(clientToken);
    ctx = await freshImports();

    await ctx.useSessionStore().initStore();

    const { activeActor } = ctx.useSessionStore().useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);

    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    });
    const { activeUser } = ctx.useSessionStore().useContext();
    await vi.waitFor(() =>
      expect(activeUser.value?.email).toBe(selfBody.data.actor.email)
    );

    const { isAuthenticated } = ctx.useActiveSession().useMeta();
    expect(isAuthenticated.value).toBe(true);
  });

  it("falls through to the guest floor when the client token is invalid", async () => {
    // SS-I4 — ss-gotchas §4 🧪 (invalid token 401 → fall through … or the
    // guest floor); ss-foundation §Failure modes row 1. De-poked (re-audit
    // round 2 SS-I4): the round-1 body seeded a hand-forged bogus
    // `access_token` via `persistTokenToStorage` (a WRITE-to-seed defect).
    // Seed a REAL client session via the store's own `add()`, then reload via
    // a module re-import + `initStore()` (the store re-reads the cookie it
    // wrote) and let the `/self` 401 fixture — not a forged token — drive the
    // invalidity.
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, true, ctx.mapSessionUser(selfBody));
    ctx = await freshImports();

    overrideSelf("get-self-case-invalid-token");
    overrideToken("post-oauth-access-token-guest");

    await ctx.useSessionStore().initStore();

    const { activeActor } = ctx.useSessionStore().useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
  });

  it("degrades softly on a wrong-actor 403 without promotion or boot failure", async () => {
    // SS-I5 — ss-gotchas §4 🧪 ("must not be promoted to staff");
    // ss-foundation §Failure modes rows 2+4
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const staffToken: IToken = {
      ...clientToken,
      actor_type: AccessRoleTypes.STAFF, // D1: derived — see test-design.md
      actor_id: `${clientToken.actor_id}-staff`, // D1: derived — see test-design.md
      access_token: `${clientToken.access_token}-staff` // D1: derived — see test-design.md
    };

    await ctx.persistTokenToStorage(clientToken);
    ctx = await freshImports();

    overrideAdminSelf("get-admin-self-case-wrong-actor");

    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().add(staffToken);

    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    });
    const { allSessions } = ctx.useSessionStore().useContext();

    await vi.waitFor(() => {
      expect(
        allSessions.value[clientToken.actor_id as string]?.user?.email
      ).toBe(selfBody.data.actor.email);
    });
    expect(
      allSessions.value[staffToken.actor_id as string]?.user
    ).toBeUndefined();
  });

  it("keeps exactly one cookie per scope holding only the active user's token", async () => {
    // SS-I6 ⛳ — req 1 (verbatim: "exactly ONE cookie per scope; it holds only
    // the ACTIVE user's token"); ss-usage §useContext (`allSessions` keyed by
    // actor_id). De-poked (re-audit round 2 SS-I6, dissolves the round-1
    // "eviction" finding): the round-1 body seeded via `persistTokenToStorage`
    // ×2 — a WRITE-to-seed defect, since `persistTokenToStorage` only writes
    // the single cookie and does NOT populate the multi-session store (THE
    // MODEL) — and asserted via `getTokenFromStorage` (a READ-to-assert
    // defect). Seed via the store's own `add()` (accumulates both sessions);
    // observe via the public reactive surface only.
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`, // D1: derived — see test-design.md
      access_token: `${clientA.access_token}-b` // D1: derived — see test-design.md
    };
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    await ctx.useSessionStore().initStore();
    const { allSessions, activeSession } = ctx.useSessionStore().useContext();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientA, true, ctx.mapSessionUser(selfBody));
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientB, false, ctx.mapSessionUser(selfBody));

    expect(allSessions.value[clientA.actor_id as string]).toBeDefined();
    expect(allSessions.value[clientB.actor_id as string]).toBeDefined();
    expect(activeSession.value?.access_token).toBe(clientA.access_token);

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientB.actor_id as string);
    expect(activeSession.value?.access_token).toBe(clientB.access_token);

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientA.actor_id as string);
    expect(activeSession.value?.access_token).toBe(clientA.access_token);
  });

  it("switches between cached users instantly with zero server round trips", async () => {
    // SS-I7 ⛳ — req 2 (verbatim: "instant — zero server round trips"; "cached
    // in sessionStorage for the entire browsing session"). De-poked (re-audit
    // round 2 SS-I7 — same root as SS-I6): seed via `add()` ×2 instead of
    // `persistTokenToStorage` ×2; the cache-hit is observed as "zero new
    // requests" via the MSW request spy, not by reading the raw sessionStorage
    // payload.
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`, // D1: derived — see test-design.md
      access_token: `${clientA.access_token}-b` // D1: derived — see test-design.md
    };
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientA, true, ctx.mapSessionUser(selfBody));
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientB, false, ctx.mapSessionUser(selfBody));

    const { activeSession } = ctx.useSessionStore().useContext();
    const spy = vi.fn();
    server?.events.on("request:start", spy);

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientA.actor_id as string);
    expect(activeSession.value?.access_token).toBe(clientA.access_token);

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientB.actor_id as string);
    expect(activeSession.value?.access_token).toBe(clientB.access_token);

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientA.actor_id as string);
    expect(activeSession.value?.access_token).toBe(clientA.access_token);

    expect(spy).not.toHaveBeenCalled();
    server?.events.removeListener("request:start", spy);
  });

  it("keeps the switched-to client active across a reload", async () => {
    // Reproduces the manual labs-nuxt report at the store layer: with
    // multiple cached sessions, switching the active user then refreshing
    // the page must restore the SWITCHED-TO user, not the previous one.
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`,
      access_token: `${clientA.access_token}-b`
    };
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientA, true, ctx.mapSessionUser(selfBody));
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientB, false, ctx.mapSessionUser(selfBody));

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientB.actor_id as string);

    const { activeSession } = ctx.useSessionStore().useContext();
    expect(activeSession.value?.access_token).toBe(clientB.access_token);

    // --- "refresh": fresh module graph re-booting from the same storage
    ctx = await freshImports();
    await ctx.useSessionStore().initStore();

    const reloaded = ctx.useSessionStore().useContext();
    expect(reloaded.activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(reloaded.activeSession.value?.access_token).toBe(
      clientB.access_token
    );
  });

  it("logout removes the cookie and falls to the guest floor; remove keeps the cookie", async () => {
    // SS-I8 — req 5; ss-gotchas §5 🧪 (remove vs logout, verbatim cookie
    // assertions); ss-foundation §Logout flow
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    overrideSelf("get-self");
    overrideToken("post-oauth-access-token-guest");

    // (a) logout removes the cookie and falls to guest
    await ctx.persistTokenToStorage(clientToken);
    ctx.useSessionStore().useActions().logout(AccessRoleTypes.CLIENT);
    expect(document.cookie).not.toMatch(/upm_client_session=/);
    const { activeActor } = ctx.useSessionStore().useContext();
    await vi.waitFor(() =>
      expect(activeActor.value).toBe(AccessRoleTypes.GUEST)
    );

    // (b) fresh setup: remove keeps the cookie; refresh re-hydrates.
    // Same-realm re-seed (triage-round1 SS6): a mid-test freshImports() after
    // a logout deadlocks vi.resetModules() against in-flight background
    // promises. The public surface expresses the same fresh state — clear the
    // jar, re-persist — with identical cited assertions.
    clearSessionCookies();
    sessionStorage.clear();
    await ctx.persistTokenToStorage(clientToken);
    ctx
      .useSessionStore()
      .useActions()
      .remove(AccessRoleTypes.CLIENT, clientToken.actor_id as string);
    expect(document.cookie).toMatch(/upm_client_session=/);

    ctx.useSessionStore().useActions().refresh();
    const { activeActor: restoredActor } = ctx.useSessionStore().useContext();
    await vi.waitFor(() =>
      expect(restoredActor.value).toBe(AccessRoleTypes.CLIENT)
    );
  });

  it("isAuthenticated() rejects for a guest session and resolves the user for a client session", async () => {
    // SS-I9 ⛳ — ss-usage §useActions 🧪 (verbatim both halves). Timeout raised
    // past the file default: ss-usage §useActions documents the guest-reject
    // path as racing a 60s timeout before rejecting. REAL-BUG (survives
    // de-poking, re-audit round 2): the guest-reject half is already
    // public-only (no storage involved) and hangs to 65s regardless of the
    // seam used below — reported to the owner. The second half's seed is
    // de-poked from `persistTokenToStorage` to the store's own `add()`, a
    // minor fix independent of the bug.
    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await expect(
      ctx.useActiveSession().useActions().isAuthenticated()
    ).rejects.toBeDefined();

    clearSessionCookies();
    sessionStorage.clear();
    ctx = await freshImports();
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    overrideSelf("get-self");
    await ctx.useSessionStore().useActions().add(clientToken, true);

    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    });
    const user = await ctx.useActiveSession().useActions().isAuthenticated();
    expect(user.email).toBe(selfBody.data.actor.email);
  }, 65000);

  it("never activates a disallowed actor scope", async () => {
    // SS-I10 ⛳ — ss-gotchas §11 🧪 (verbatim); ss-usage §initStore 🧪
    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore({
      allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST]
    });

    const { activeActor } = ctx.useSessionStore().useContext();
    const before = activeActor.value;

    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const staffToken: IToken = {
      ...clientToken,
      actor_type: AccessRoleTypes.STAFF, // D1: derived — see test-design.md
      actor_id: `${clientToken.actor_id}-staff`, // D1: derived — see test-design.md
      access_token: `${clientToken.access_token}-staff` // D1: derived — see test-design.md
    };

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.STAFF, staffToken.actor_id as string);
    expect(activeActor.value).toBe(before);

    await ctx.useSessionStore().useActions().add(staffToken);
    expect(activeActor.value).toBe(before);

    const { isScopeAllowed } = ctx.useSessionStore().useMeta();
    expect(isScopeAllowed(AccessRoleTypes.STAFF)).toBe(false);
  });

  it("restores the parent identity when an impersonated session ends", async () => {
    // SS-I11 ⛳ — ss-usage §Impersonation 🧪 + §useActions
    // (`registerImpersonation` "call before `add`"); ss-gotchas §10 🧪
    // (parent-alive branch). De-poked (re-audit round 2 SS-I11): the parent
    // session was seeded via `persistTokenToStorage` (a WRITE-to-seed
    // defect) — seed via the store's own `add()` instead, same as the
    // impersonated session already correctly did.
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientA, true, ctx.mapSessionUser(selfBody));

    const impersonated: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-imp`, // D1: derived — see test-design.md
      access_token: `${clientA.access_token}-imp` // D1: derived — see test-design.md
    };

    ctx
      .useSessionStore()
      .useActions()
      .registerImpersonation(impersonated.actor_id as string);
    await ctx
      .useSessionStore()
      .useActions()
      .add(impersonated, true, ctx.mapSessionUser(selfBody));

    const { isImpersonated } = ctx.useActiveSession().useMeta();
    expect(isImpersonated.value).toBe(true);

    ctx.useSessionStore().useActions().logout();

    const { activeSessionId } = ctx.useSessionStore().useContext();
    expect(activeSessionId.value).toBe(clientA.actor_id);
    expect(ctx.useActiveSession().useMeta().isImpersonated.value).toBe(false);
  });

  it("derives expiry flags from the active token's timestamps", async () => {
    // SS-I12 ⛳ — ss-gotchas §9 (all three rules, incl. "last 5 minutes" and
    // the canRefresh fallback); code-test-unit.md §Good example. De-poked
    // (re-audit round 2 SS-I12): seeded via `persistTokenToStorage` ×3 (a
    // WRITE-to-seed defect) — seed via the store's own `add()` instead. The
    // underlying expiry defect itself is proven storage-free by SS-U2.
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const base = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    await ctx.useSessionStore().initStore();

    const expired: IToken = {
      ...base,
      created_at: Date.now() - 7200_000, // D1: derived — see test-design.md
      expires_in: 3600 // D1: derived — see test-design.md
    };
    await ctx
      .useSessionStore()
      .useActions()
      .add(expired, true, ctx.mapSessionUser(selfBody));
    let meta = ctx.useActiveSession().useMeta();
    expect(meta.isExpired.value).toBe(true);
    expect(meta.isAboutToExpire.value).toBe(false);

    const aboutToExpire: IToken = {
      ...base,
      created_at: Date.now() - 3360_000, // D1: derived — see test-design.md
      expires_in: 3600 // D1: derived — see test-design.md
    };
    await ctx
      .useSessionStore()
      .useActions()
      .add(aboutToExpire, true, ctx.mapSessionUser(selfBody));
    meta = ctx.useActiveSession().useMeta();
    expect(meta.isAboutToExpire.value).toBe(true);
    expect(meta.isExpired.value).toBe(false);

    const noTimestamps = {
      ...base,
      created_at: undefined, // D1: derived — see test-design.md
      refresh_expires_in: undefined // D1: derived — see test-design.md
    } as unknown as IToken;
    await ctx
      .useSessionStore()
      .useActions()
      .add(noTimestamps, true, ctx.mapSessionUser(selfBody));
    meta = ctx.useActiveSession().useMeta();
    expect(meta.canRefresh.value).toBe(true);
  });

  it("drops a dead cached session on boot without evicting the active session's cookie", async () => {
    // SS-I13 (Bug 1 regression) — the per-scope cookie is held by the ACTIVE
    // session, so the boot dead-token drop must dump it ONLY when the dead
    // session is the cookie-backed one. Seed active client A (cookie-backed) +
    // cached client B (non-cookie) via add(); on reload B's token is dead. A
    // must stay active + authenticated, B dropped, A's cookie intact.
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`, // D1: derived — see test-design.md
      access_token: `${clientA.access_token}-b` // D1: derived — see test-design.md
    };
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const invalidBody = getFixture("get-self-case-invalid-token", {
      recordingsDir
    }).response.body as object;
    const selfEnvelope = getFixture("get-self", { recordingsDir }).response
      .body as object;

    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientA, true, ctx.mapSessionUser(selfBody));
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientB, false, ctx.mapSessionUser(selfBody));

    // Reload: only A is cookie-backed (add projects the ACTIVE token). B's
    // token is dead. B's /self 401s; on that 401 the query layer refreshes and
    // re-issues /self borrowing A's cookie bearer, so to keep B dead we 401
    // every bearer-A read AFTER the one genuine boot read (which resolves A).
    // A's read fires immediately; B's retry is strictly later (after an oauth
    // round-trip), so the first bearer-A hit is always A's real profile load.
    ctx = await freshImports();
    let liveReadServed = false;
    server?.use(
      http.get("*/self", ({ request }) => {
        const auth = request.headers.get("Authorization") ?? "";
        if (auth.includes(clientB.access_token as string))
          return HttpResponse.json(invalidBody, { status: 401 });
        if (!liveReadServed) {
          liveReadServed = true;
          return HttpResponse.json(selfEnvelope, { status: 200 });
        }
        return HttpResponse.json(invalidBody, { status: 401 });
      })
    );

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientA.actor_id);
    expect(activeSession.value?.access_token).toBe(clientA.access_token);
    expect(allSessions.value[clientB.actor_id as string]).toBeUndefined();
    expect(document.cookie).toMatch(/upm_client_session=/);

    const { isAuthenticated } = ctx.useActiveSession().useMeta();
    expect(isAuthenticated.value).toBe(true);
  });

  it("projects an auto-promoted session's cookie so it survives the next write", async () => {
    // SS-I14 (Bug 2 regression) — logging out the cookie-backed active session
    // auto-promotes a cached sibling; the gate must project that sibling's token
    // to the scope cookie or the next reconcile drops it to the guest floor
    // (logging out one of two would lose both). Seed clients A active + B cached;
    // logout(CLIENT) → B promoted AND cookie holds B; a further write keeps B.
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`, // D1: derived — see test-design.md
      access_token: `${clientA.access_token}-b` // D1: derived — see test-design.md
    };
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientA, true, ctx.mapSessionUser(selfBody));
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientB, false, ctx.mapSessionUser(selfBody));

    const { activeSessionId, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    expect(activeSessionId.value).toBe(clientA.actor_id);

    ctx.useSessionStore().useActions().logout(AccessRoleTypes.CLIENT);

    // B promoted to active, and the gate projected its token to the scope cookie
    // (reading the cookie to assert projection is the documented exception).
    expect(activeSessionId.value).toBe(clientB.actor_id);
    expect(activeSession.value?.access_token).toBe(clientB.access_token);
    expect(ctx.getTokenFromStorage(AccessRoleTypes.CLIENT)?.actor_id).toBe(
      clientB.actor_id
    );

    // A further write reconciles against the cookie — B must survive, not fall
    // to the guest floor.
    ctx
      .useSessionStore()
      .useActions()
      .updateUser(
        AccessRoleTypes.CLIENT,
        clientB.actor_id as string,
        ctx.mapSessionUser(selfBody)
      );
    expect(activeSessionId.value).toBe(clientB.actor_id);
    expect(activeSession.value?.access_token).toBe(clientB.access_token);
    expect(allSessions.value[clientB.actor_id as string]).toBeDefined();
  });
});
