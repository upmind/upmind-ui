/**
 * @fileoverview Session-store integration — the guest pool is not a projection
 * of one cookie (FE-3087, operator ruling R8)
 *
 * ## Job To Be Done
 * Drive the REAL store against MSW-replayed grant fixtures for what R8 adds on
 * top of AC1-AC8: `guestSessions` holds EVERY guest session the way
 * `clientSessions`/`staffSessions` do, the single `upm_guest_session` cookie
 * backs only the ACTIVE guest, `activate(GUEST, sessionId)` selects a pooled
 * guest by id exactly as the client and staff arms do — projecting that guest's
 * token back to the cookie — and the singular public guest surface names the
 * live guest rather than an arbitrary pooled one.
 *
 * ## What Breaks If These Fail
 * A second tab minting its own guest silently evicts this tab's chosen guest
 * from the pool, so a deliberate guest view dies on the next store write; or
 * guest stays the one actor whose sessions cannot be switched between by id,
 * leaving "guest is a session like any other" false in the shipped store.
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
import {
  difference,
  first,
  forEach,
  has,
  includes,
  isObject,
  keys,
  times
} from "lodash-es";
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
  const syncModule = await import("../session-store.sync");
  const barrel = await import("..");

  return {
    useSessionStore: sessionStoreModule.useSessionStore,
    stopCookieSync: syncModule.stopCookieSync,
    getTokenFromStorage: barrel.getTokenFromStorage,
    mapSessionUser: barrel.mapSessionUser
  };
}

/**
 * The sessionStorage slot the store persists its whole state to, located by the
 * state shape rather than by a hard-coded key name.
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

/**
 * The guest pool's keys as the store itself persisted them — the shape a reload
 * restores from, read back off the store's own durable output.
 *
 * @returns One key per pooled guest session; empty before the first write.
 */
function persistedGuestKeys(): string[] {
  const slot = findPersistedKey();
  if (!slot) return [];
  const persisted = JSON.parse(sessionStorage.getItem(slot) ?? "{}") as {
    guestSessions?: Record<string, unknown>;
  };
  return keys(persisted.guestSessions ?? {});
}

/** Delivers another tab's guest mint over the stubbed transport. */
function deliverRemoteGuest(token: IToken): void {
  const channelName = first([...FakeBroadcastChannel.registry.keys()]);
  const remote = new FakeBroadcastChannel(channelName as string);
  remote.postMessage({ type: "SET_SESSION", session: token });
}

/** Delivers another tab's removal of one named guest session. */
function deliverRemoteGuestRemoval(sessionId: string): void {
  const channelName = first([...FakeBroadcastChannel.registry.keys()]);
  const remote = new FakeBroadcastChannel(channelName as string);
  remote.postMessage({
    type: "REMOVE_SESSION",
    actor: AccessRoleTypes.GUEST,
    sessionId
  });
}

/** Delivers another tab's guest-specific drop of one named guest session. */
function deliverRemoteGuestDrop(sessionId: string): void {
  const channelName = first([...FakeBroadcastChannel.registry.keys()]);
  const remote = new FakeBroadcastChannel(channelName as string);
  remote.postMessage({ type: "REMOVE_GUEST", sessionId });
}

// -----------------------------------------------------------------------------

describe("session-store integration (the guest pool holds more than the cookie)", () => {
  let ctx: Awaited<ReturnType<typeof freshImports>>;

  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
    ctx = await freshImports();
  });

  afterEach(async () => {
    FakeBroadcastChannel.reset();
    ctx?.stopCookieSync();
    server?.events.removeAllListeners();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  /**
   * Chooses guest in this tab, then delivers a second tab's own guest mint.
   *
   * The remote guest is deliberately NOT written to the cookie jar: one
   * `upm_guest_session` cookie exists and it backs this tab's ACTIVE guest, so
   * a second pooled guest is by construction the non-cookie-backed one.
   *
   * @returns The chosen guest's session id and the remote tab's guest token.
   */
  async function poolTwoGuests(): Promise<{
    chosenId: string;
    remote: IToken;
  }> {
    const guestFixture = overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const chosenId = ctx.useSessionStore().useContext().activeSessionId
      .value as string;
    expect(chosenId).toBeTruthy();

    // Derived, not recorded: the guest grant returns `actor_id: ""` and every
    // recorded token is PII-masked to the same `access_token`, so a SECOND
    // guest identity has to carry the client-synthesised id and a
    // distinguishable token no recording can supply. Same device as `clientB`
    // in session-store.sync.int.test.ts.
    const remote: IToken = {
      ...guestFixture,
      actor_id: crypto.randomUUID(),
      access_token: `${guestFixture.access_token}-remote-guest`
    };

    deliverRemoteGuest(remote);
    await vi.waitFor(() =>
      expect(persistedGuestKeys()).toContain(remote.actor_id as string)
    );

    return { chosenId, remote };
  }

  it("adds a remote tab's guest to the pool instead of overwriting the chosen one @AC-G10", async () => {
    const { chosenId, remote } = await poolTwoGuests();

    const { activeActor, activeSessionId } = ctx.useSessionStore().useContext();

    expect(persistedGuestKeys()).toEqual(
      expect.arrayContaining([chosenId, remote.actor_id])
    );
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
  });

  it("keeps a pooled guest that no cookie backs across a later store write @AC-G10", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    overrideSelf("get-self");
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, false, ctx.mapSessionUser(selfBody));

    const { activeActor, activeSessionId } = ctx.useSessionStore().useContext();

    // The write ran reconcile against a jar holding one guest cookie. A pool
    // rebuilt from that cookie keeps one key; a preserved pool keeps both.
    expect(persistedGuestKeys()).toEqual(
      expect.arrayContaining([chosenId, remote.actor_id])
    );
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
  });

  it("activates a pooled guest by id and projects its token to the guest cookie @AC-G11", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;

    const oauthRequests: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (includes(request.url, "/oauth/access_token")) {
        oauthRequests.push(request.url);
      }
    });

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST, remoteId);

    const { activeActor, activeSessionId, activeSession } = ctx
      .useSessionStore()
      .useContext();

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(remoteId);
    expect(activeSessionId.value).not.toBe(chosenId);
    expect(activeSession.value?.access_token).toBe(remote.access_token);
    expect(ctx.getTokenFromStorage(AccessRoleTypes.GUEST)?.access_token).toBe(
      remote.access_token
    );
    expect(oauthRequests).toHaveLength(0);
  });

  it("never leaves the pointer naming a guest id the pool does not hold @AC-G13", async () => {
    await poolTwoGuests();
    const unknownId = crypto.randomUUID();

    let settled = false;
    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST, unknownId)
      .catch(() => undefined)
      .finally(() => {
        settled = true;
      });

    const { activeSessionId } = ctx.useSessionStore().useContext();

    expect(settled).toBe(true);
    expect(activeSessionId.value).not.toBe(unknownId);
    expect(persistedGuestKeys()).not.toContain(unknownId);
  });

  it("publishes the guest pool beside the client pool and in allSessions @AC-G14", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    overrideSelf("get-self");
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const clientId = clientToken.actor_id as string;

    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, false, ctx.mapSessionUser(selfBody));

    const { guestSessions, allSessions } = ctx.useSessionStore().useContext();

    expect(keys(guestSessions.value)).toEqual(
      expect.arrayContaining([chosenId, remote.actor_id])
    );
    expect(guestSessions.value[chosenId]?.scope).toBe(AccessRoleTypes.GUEST);
    // Enumerating every session a consumer can switch to must reach the guests
    // too, or a pooled guest is unreachable from the published surface.
    expect(keys(allSessions.value)).toEqual(
      expect.arrayContaining([chosenId, remote.actor_id as string, clientId])
    );
  });

  it("removes one named guest and leaves the rest of the pool standing @AC-G15", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;

    ctx.useSessionStore().useActions().remove(AccessRoleTypes.GUEST, remoteId);

    const { guestSessions, activeActor, activeSessionId } = ctx
      .useSessionStore()
      .useContext();
    const { hasGuestSession } = ctx.useSessionStore().useMeta();

    expect(keys(guestSessions.value)).toEqual([chosenId]);
    expect(hasGuestSession.value).toBe(true);
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
  });

  it("drops only the guest another tab removed @AC-G16", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;

    deliverRemoteGuestRemoval(remoteId);

    const { guestSessions, activeSessionId } = ctx
      .useSessionStore()
      .useContext();

    await vi.waitFor(() =>
      expect(keys(guestSessions.value)).not.toContain(remoteId)
    );
    expect(keys(guestSessions.value)).toEqual([chosenId]);
    expect(activeSessionId.value).toBe(chosenId);
  });

  it("a remote REMOVE_GUEST removes only the guest it names @AC-G16", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;

    deliverRemoteGuestDrop(remoteId);

    const { guestSessions, activeActor, activeSessionId } = ctx
      .useSessionStore()
      .useContext();

    await vi.waitFor(() => expect(keys(guestSessions.value)).toHaveLength(1));

    // The chosen guest was materialised first, so a drop keyed on the pool's
    // first entry instead of the named one takes the guest being browsed and
    // leaves the one the message asked for.
    expect(keys(guestSessions.value)).toEqual([chosenId]);
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
  });

  it("adding a guest then choosing a client leaves the client active @AC-G35", async () => {
    await poolTwoGuests();
    overrideSelf("get-self");
    const client = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;
    const clientId = client.actor_id as string;

    await ctx
      .useSessionStore()
      .useActions()
      .add(client, false, ctx.mapSessionUser(selfBody));

    overrideToken("post-oauth-access-token-guest");

    const { activeActor, activeSessionId, guestSessions } = ctx
      .useSessionStore()
      .useContext();
    const pooledBefore = keys(guestSessions.value);

    const adding = ctx.useSessionStore().useActions().addGuest();
    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.CLIENT, clientId);

    // The mint has not landed yet, so the client really was chosen mid-flight —
    // without this the case could pass on ordering alone and never exercise the
    // guard it exists for.
    expect(keys(guestSessions.value)).toEqual(pooledBefore);
    expect(activeSessionId.value).toBe(clientId);

    await adding;

    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientId);
    // The minted guest is discarded as a CHOICE, not as a session: it stays
    // pooled and switchable, which is what separates a superseded activation
    // from a lost mint.
    expect(difference(keys(guestSessions.value), pooledBefore)).toHaveLength(1);
    expect(keys(guestSessions.value)).toEqual(
      expect.arrayContaining(pooledBefore)
    );
  });

  it("adds a NEW guest beside the pooled one and leaves the previous switchable @AC-G25", async () => {
    overrideToken("post-oauth-access-token-guest");
    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const { activeActor, activeSessionId, guestSession, guestSessions } = ctx
      .useSessionStore()
      .useContext();
    const firstId = activeSessionId.value as string;
    expect(firstId).toBeTruthy();

    const grants: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (includes(request.url, "/oauth/access_token"))
        grants.push(request.url);
    });

    await ctx.useSessionStore().useActions().addGuest();

    const secondId = activeSessionId.value as string;

    // Every recorded guest grant is masked to one `access_token`, so the
    // session's own id is the only thing that separates the two guests — which
    // is exactly what an "add" that inherited the cookie's id would collapse.
    expect(grants).toHaveLength(1);
    expect(secondId).toBeTruthy();
    expect(secondId).not.toBe(firstId);
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(keys(guestSessions.value)).toEqual(
      expect.arrayContaining([firstId, secondId])
    );
    expect(guestSession.value?.actor_id).toBe(secondId);
    expect(ctx.getTokenFromStorage(AccessRoleTypes.GUEST)?.actor_id).toBe(
      secondId
    );

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST, firstId);

    expect(activeSessionId.value).toBe(firstId);
    expect(grants).toHaveLength(1);
  });

  it("leaves a named active session where it is when its own actor is activated with no id @AC-S2", async () => {
    const { remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;
    const { activeActor, activeSessionId } = ctx.useSessionStore().useContext();

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST, remoteId);
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    // The remote guest is the LAST pooled, so a re-activation that fell back to
    // `first(keys())` would land on the chosen one instead of standing still.
    expect(activeSessionId.value).toBe(remoteId);

    overrideSelf("get-self");
    const clientA = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    // Derived, not recorded — the second client identity the suite's own
    // `clientB` device supplies (session-store.int.test.ts).
    const clientB: IToken = {
      ...clientA,
      actor_id: `${clientA.actor_id}-b`,
      access_token: `${clientA.access_token}-b`
    };
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    await ctx
      .useSessionStore()
      .useActions()
      .add(clientA, true, ctx.mapSessionUser(selfBody));
    await ctx
      .useSessionStore()
      .useActions()
      .add(clientB, true, ctx.mapSessionUser(selfBody));

    expect(activeSessionId.value).toBe(clientB.actor_id);

    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.CLIENT);

    expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(activeSessionId.value).toBe(clientB.actor_id);
  });

  it("names the live guest on the singular public guest surface, not the first pooled one @AC-G12", async () => {
    const { remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST, remoteId);

    const { guestSession } = ctx.useSessionStore().useContext();

    // The chosen guest was materialised first, so insertion order alone hands
    // back the wrong entry here.
    expect(guestSession.value?.access_token).toBe(remote.access_token);
    expect(
      ctx.useSessionStore().useActions().get(AccessRoleTypes.GUEST)
        ?.access_token
    ).toBe(remote.access_token);
  });

  it("a write taken while the guest pointer is unclaimed leaves the pooled guest standing @AC-G32", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;
    const { activeActor, activeSessionId, guestSessions } = ctx
      .useSessionStore()
      .useContext();

    ctx.useSessionStore().useActions().logout(AccessRoleTypes.GUEST);

    expect(keys(guestSessions.value)).toEqual([remoteId]);
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBeUndefined();

    overrideSelf("get-self");
    const client = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    // The pointer names nothing, so the drop rule has no entry of its own to
    // act on. A rule that reaches for the pool's first entry instead takes the
    // sibling here — on a write that had nothing to do with either guest.
    await ctx
      .useSessionStore()
      .useActions()
      .add(client, false, ctx.mapSessionUser(selfBody));

    expect(keys(guestSessions.value)).toEqual([remoteId]);
    expect(remoteId).not.toBe(chosenId);

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST, remoteId);

    expect(activeSessionId.value).toBe(remoteId);
  });

  it("a pooled guest survives its sibling's logout and the next write @AC-G32", async () => {
    const { chosenId, remote } = await poolTwoGuests();
    const remoteId = remote.actor_id as string;
    const { activeSessionId, guestSessions } = ctx
      .useSessionStore()
      .useContext();

    ctx.useSessionStore().useActions().logout(AccessRoleTypes.GUEST);

    expect(keys(guestSessions.value)).toEqual([remoteId]);

    overrideSelf("get-self");
    const client = getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir
    });
    const selfBody = getFixtureBody<{ data: ISelf }>("get-self", {
      recordingsDir
    }).data;

    await ctx
      .useSessionStore()
      .useActions()
      .add(client, true, ctx.mapSessionUser(selfBody));

    // The vanished cookie backed the guest that logged out, not this one. A
    // drop keyed on `first(keys())` instead of the vanished entry takes the
    // survivor here, one write after the logout that had nothing to do with it.
    expect(keys(guestSessions.value)).toEqual([remoteId]);
    expect(remoteId).not.toBe(chosenId);

    await ctx
      .useSessionStore()
      .useActions()
      .activate(AccessRoleTypes.GUEST, remoteId);

    expect(activeSessionId.value).toBe(remoteId);
  });
});
