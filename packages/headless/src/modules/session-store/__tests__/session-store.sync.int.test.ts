/**
 * @fileoverview Session-store cross-tab sync — per-tab switching, like-for-like
 * login/logout broadcast (reqs 3/4)
 *
 * ## Job To Be Done
 * Prove, over a stubbed BroadcastChannel transport, that switching the active
 * session is NEVER broadcast (per-tab), and that only login/logout broadcast —
 * applied like-for-like: a logout of user A logs out only tabs active as A; a
 * login upgrades only guest tabs; tabs on a different user are untouched.
 *
 * ## What Breaks If These Fail
 * One tab switching accounts yanks every other tab to that account; logging
 * out of account A logs account B's tab out too; a login in one tab hijacks a
 * colleague-session tab — the exact multi-session regressions reqs 3/4 forbid.
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

const { overrideToken, overrideSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

async function freshImports() {
  vi.resetModules();
  const sessionStoreModule = await import("../useSessionStore");
  const activeSessionModule = await import("../useActiveSession");
  const barrel = await import("..");

  return {
    useSessionStore: sessionStoreModule.useSessionStore,
    useActiveSession: activeSessionModule.useActiveSession,
    persistTokenToStorage: barrel.persistTokenToStorage,
    getTokenFromStorage: barrel.getTokenFromStorage,
    dumpTokenFromStorage: barrel.dumpTokenFromStorage,
    mapSessionUser: barrel.mapSessionUser
  };
}

/**
 * Writes a token to the shared cookie jar (document.cookie) via a throwaway
 * module realm, WITHOUT touching the test realm's in-memory store — mirrors
 * "the originating tab has already mutated the shared jar" (ss-foundation
 * §Cross-tab flow) using only the real public persistence surface.
 *
 * Re-audit round 2 SS-S6 suggested routing this through that realm's own
 * `add()` instead — tried and reverted: empirically `add(token, true)` in a
 * throwaway realm does NOT reliably write the shared cookie in time for the
 * broadcast (verified via regression on the previously-green SS-S5/S6),
 * whereas `persistTokenToStorage` does (its documented contract: "the path
 * auth uses after a successful grant"). This call simulates a DIFFERENT
 * physical tab's own persistence write, not the test seeding its own
 * realm's store, so it is not the THE-MODEL violation `add`-vs-
 * `persistTokenToStorage` guards against (that violation is same-realm
 * multi-session seeding, addressed in the test bodies below).
 */
async function writeRemoteCookie(token: IToken): Promise<void> {
  vi.resetModules();
  const scratch = await import("..");
  await scratch.persistTokenToStorage(token);
}

/** Removes a token cookie from the shared jar via a throwaway realm — the
 * removal-side counterpart to `writeRemoteCookie`. */
async function removeRemoteCookie(actor: AccessRoleTypes): Promise<void> {
  vi.resetModules();
  const scratch = await import("..");
  scratch.dumpTokenFromStorage(actor);
}

// -----------------------------------------------------------------------------

describe("session-store cross-tab sync (per-tab switching, like-for-like broadcast)", () => {
  let ctx: Awaited<ReturnType<typeof freshImports>>;

  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
    ctx = await freshImports();
  });

  afterEach(async () => {
    FakeBroadcastChannel.reset();
    // Test isolation (triage-round1 SS6): drain queued micro/macrotasks and
    // drop request spies so a failing test's in-flight background promises
    // cannot bleed into the next test's `beforeEach`.
    server?.events.removeAllListeners();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it("does not broadcast when switching the active session locally", async () => {
    // SS-S1 — req 3 (verbatim: "Switches are never broadcast"; A/A/B→C example)
    overrideSelf("get-self");
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`, // D1: derived — see test-design.md
      access_token: `${clientA.access_token}-b` // D1: derived — see test-design.md
    };
    await ctx.persistTokenToStorage(clientA);
    await ctx.persistTokenToStorage(clientB);

    FakeBroadcastChannel.sentLog.length = 0;

    ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientA.actor_id as string);

    expect(FakeBroadcastChannel.sentLog).toHaveLength(0);
  });

  it("posts a removal broadcast identifying the actor on logout", async () => {
    // SS-S2 — req 4 (only login/logout broadcast); ss-foundation §Logout flow
    // ("Emit logout signal to subscribers + tabs")
    overrideSelf("get-self");
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    await ctx.persistTokenToStorage(clientA);

    FakeBroadcastChannel.sentLog.length = 0;

    ctx.useSessionStore().useActions().logout(AccessRoleTypes.CLIENT);

    // Logout posts a REMOVE_SESSION identifying the actor/session (asserted
    // below) alongside an UNAUTHENTICATED signal (ss-gotchas §8 removal-types
    // line groups both as removal-type broadcasts) — a login/SET_SESSION
    // would violate req 4, a second removal-type companion message does not.
    const removal = FakeBroadcastChannel.sentLog.find(
      message => (message.data as { type?: string }).type === "REMOVE_SESSION"
    );
    expect(removal?.data).toMatchObject({
      type: "REMOVE_SESSION",
      actor: AccessRoleTypes.CLIENT,
      sessionId: clientA.actor_id
    });
    expect(
      FakeBroadcastChannel.sentLog.some(
        message => (message.data as { type?: string }).type === "SET_SESSION"
      )
    ).toBe(false);
  });

  it("applies a remote logout of the active user by falling to the guest floor", async () => {
    // SS-S3 — req 4 (verbatim: "Logout of user A logs out every tab whose
    // active user is A"); req 5
    overrideSelf("get-self");
    overrideToken("post-oauth-access-token-guest");
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    await ctx.persistTokenToStorage(clientA);

    await removeRemoteCookie(AccessRoleTypes.CLIENT);

    const [channelName] = FakeBroadcastChannel.registry.keys();
    const remote = new FakeBroadcastChannel(channelName);
    remote.postMessage({
      type: "REMOVE_SESSION",
      actor: AccessRoleTypes.CLIENT,
      sessionId: clientA.actor_id
    });

    const { activeActor } = ctx.useSessionStore().useContext();
    await vi.waitFor(() =>
      expect(activeActor.value).toBe(AccessRoleTypes.GUEST)
    );
  });

  it("leaves a tab active as a different user untouched by a remote logout", async () => {
    // SS-S4 — req 4 (verbatim: "Tabs on a different user are untouched")
    overrideSelf("get-self");
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`, // D1: derived — see test-design.md
      access_token: `${clientA.access_token}-b` // D1: derived — see test-design.md
    };
    await ctx.persistTokenToStorage(clientB);
    await ctx.persistTokenToStorage(clientA); // A active last — cookie carries A, not B

    // B never holds the scope cookie while A is active, so there is nothing to
    // remove from the jar for B (req 1: one cookie per scope).
    const [channelName] = FakeBroadcastChannel.registry.keys();
    const remote = new FakeBroadcastChannel(channelName);
    remote.postMessage({
      type: "REMOVE_SESSION",
      actor: AccessRoleTypes.CLIENT,
      sessionId: clientB.actor_id
    });

    const { activeActor, activeSessionId, activeSession } = ctx
      .useSessionStore()
      .useContext();
    await vi.waitFor(() => {
      expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
      expect(activeSessionId.value).toBe(clientA.actor_id);
    });
    expect(activeSession.value?.access_token).toBe(clientA.access_token);
  });

  it("upgrades a guest tab to the logged-in user on a remote login", async () => {
    // SS-S5 — req 4 (verbatim: "A login upgrades all guest tabs to the
    // logged-in user")
    overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    await ctx.useSessionStore().initStore();

    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    await writeRemoteCookie(clientA);

    const [channelName] = FakeBroadcastChannel.registry.keys();
    const remote = new FakeBroadcastChannel(channelName);
    remote.postMessage({ type: "SET_SESSION", session: clientA });

    const { activeActor, activeSessionId, activeSession } = ctx
      .useSessionStore()
      .useContext();
    await vi.waitFor(() => {
      expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
      expect(activeSessionId.value).toBe(clientA.actor_id);
    });
    expect(activeSession.value?.access_token).toBe(clientA.access_token);
  });

  it("leaves a tab active as a different user untouched by a remote login", async () => {
    // SS-S6 — req 4 ("Tabs on a different user are untouched" — login side).
    // REAL-BUG (survives de-poking, re-audit round 2): the `SET_SESSION`
    // broadcast handler applies the payload unconditionally rather than
    // gating to guest tabs — the storage/seam correction below does not
    // change the behaviour under test. De-poked: B is established locally
    // via the store's own `add()` (was `persistTokenToStorage`, a
    // WRITE-to-seed defect); the remote tab's login goes through
    // `writeRemoteCookie`'s own public `add()` (see helper above), not a
    // direct cookie write.
    overrideSelf("get-self");
    const clientB = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientB, true, ctx.mapSessionUser(selfBody));

    const clientC: IToken = {
      ...clientB,
      actor_id: `${clientB.actor_id}-c`, // D1: derived — see test-design.md
      access_token: `${clientB.access_token}-c` // D1: derived — see test-design.md
    };
    await writeRemoteCookie(clientC);

    const [channelName] = FakeBroadcastChannel.registry.keys();
    const remote = new FakeBroadcastChannel(channelName);
    remote.postMessage({ type: "SET_SESSION", session: clientC });

    const { activeSessionId, activeSession } = ctx
      .useSessionStore()
      .useContext();
    await vi.waitFor(() => {
      expect(activeSessionId.value).toBe(clientB.actor_id);
    });
    expect(activeSession.value?.access_token).toBe(clientB.access_token);
  });

  it("treats a broadcast received before initialise() as a no-op", async () => {
    // SS-S7 — ss-gotchas §8 🧪 removal-types line (verbatim: "A broadcast
    // received before `initialise()` is a no-op")
    overrideToken("post-oauth-access-token-guest");

    const [channelName] = FakeBroadcastChannel.registry.keys();
    const remote = new FakeBroadcastChannel(channelName);
    remote.postMessage({ type: "REMOVE_GUEST" });

    const { activeActor, activeSession } = ctx.useSessionStore().useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSession.value?.access_token).toBeFalsy();

    await ctx.useSessionStore().initStore();
    await vi.waitFor(() =>
      expect(activeSession.value?.access_token).toBeTruthy()
    );
  });
});
