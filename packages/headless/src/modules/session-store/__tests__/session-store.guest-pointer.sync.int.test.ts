/**
 * @fileoverview Session-store cross-tab sync — chosen vs fallen-back guest
 * (FE-3087 AC6, AC7)
 *
 * ## Job To Be Done
 * Prove, over the stubbed BroadcastChannel transport, that a remote login
 * discriminates by CHOICE: a tab sitting on a guest it fell back to upgrades
 * to the logged-in user, and a tab sitting on a guest the user chose does not.
 * Both hold across the guest's own token refresh — driven through
 * `persistTokenToStorage`, the seam the refresh path calls with sync enabled
 * after a successful `grant_type=refresh_token` — fed the RECORDED guest
 * refresh grant.
 *
 * ## What Breaks If These Fail
 * A colleague logging in elsewhere silently yanks a deliberately-chosen guest
 * view back to an account (the FE-2824 shape: green suite, capability gone);
 * or, inverted, a default guest tab stops upgrading and the user appears
 * logged out in every other tab.
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
import { first } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

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
    persistTokenToStorage: barrel.persistTokenToStorage
  };
}

/**
 * Writes a token to the shared cookie jar through a throwaway module realm —
 * "the originating tab has already persisted its own login". See the same
 * helper in session-store.sync.int.test.ts for why this uses
 * `persistTokenToStorage` rather than that realm's `add()`.
 */
async function writeRemoteCookie(token: IToken): Promise<void> {
  vi.resetModules();
  const scratch = await import("..");
  await scratch.persistTokenToStorage(token);
}

/** Delivers a remote tab's login over the stubbed transport. */
function deliverRemoteLogin(token: IToken): void {
  const channelName = first([...FakeBroadcastChannel.registry.keys()]);
  const remote = new FakeBroadcastChannel(channelName as string);
  remote.postMessage({ type: "SET_SESSION", session: token });
}

/**
 * The recorded guest refresh grant, made distinguishable from the recorded
 * guest grant it refreshes.
 *
 * The fixture sanitiser masks every `access_token` to the same constant
 * (`tests/fixtures/fixture-naming.mjs` — `access_token` is a sensitive key), so
 * the two recordings are byte-identical and no re-record can separate them. An
 * assertion that the refresh LANDED therefore has to name a value only the
 * refresh carries; the body is otherwise the recorded one. Same device as
 * `clientB` in session-store.sync.int.test.ts.
 *
 * @returns The recorded refresh body with a token value unique to it.
 */
function refreshedGuestToken(): IToken {
  const recorded = getFixtureBody<IToken>(
    "post-oauth-access-token-case-refresh-guest-guest",
    { recordingsDir }
  );
  return { ...recorded, access_token: `${recorded.access_token}-refreshed` };
}

// -----------------------------------------------------------------------------

describe("session-store cross-tab sync (chosen vs fallen-back guest)", () => {
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

  it("leaves an explicitly chosen guest tab untouched by a remote login @AC-G6", async () => {
    // The pre-existing "upgrades a guest tab to the
    // logged-in user on a remote login" holds the fallen-back arm.
    const guestFixture = overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const clientId = clientToken.actor_id as string;

    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const { activeActor, activeSessionId, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    const chosenId = activeSessionId.value;
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(chosenId).toBeTruthy();

    await writeRemoteCookie(clientToken);
    deliverRemoteLogin(clientToken);

    // The remote session landing in the pool is the proof the broadcast was
    // APPLIED — without it, "still guest" could just mean "not arrived yet".
    await vi.waitFor(() => expect(allSessions.value[clientId]).toBeDefined());

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
    expect(activeSession.value?.access_token).toBe(guestFixture.access_token);
  });

  it("keeps a fallen-back guest upgradeable after its own token refreshes @AC-G23", async () => {
    overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    const refreshedGuest = refreshedGuestToken();
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const clientId = clientToken.actor_id as string;

    await ctx.useSessionStore().initStore();

    const { activeActor, activeSessionId, activeSession } = ctx
      .useSessionStore()
      .useContext();
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBeUndefined();

    await ctx.persistTokenToStorage(refreshedGuest);

    // Still the floor: a refresh must not promote a guest nobody chose.
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBeUndefined();
    expect(activeSession.value?.access_token).toBe(refreshedGuest.access_token);

    await writeRemoteCookie(clientToken);
    deliverRemoteLogin(clientToken);

    await vi.waitFor(() => {
      expect(activeActor.value).toBe(AccessRoleTypes.CLIENT);
      expect(activeSessionId.value).toBe(clientId);
    });
    expect(activeSession.value?.access_token).toBe(clientToken.access_token);
  });

  it("keeps an explicitly chosen guest untouched by a remote login after its own token refreshes @AC-G7", async () => {
    // The R4 key-survival proof rides here: a reconcile that rebuilt the
    // guest entry under a fresh key would drop the choice on the next refresh.
    overrideToken("post-oauth-access-token-guest");
    overrideSelf("get-self");
    const refreshedGuest = refreshedGuestToken();
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const clientId = clientToken.actor_id as string;

    await ctx.useSessionStore().initStore();
    await ctx.useSessionStore().useActions().activate(AccessRoleTypes.GUEST);

    const { activeActor, activeSessionId, activeSession, allSessions } = ctx
      .useSessionStore()
      .useContext();
    const chosenId = activeSessionId.value;
    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(chosenId).toBeTruthy();

    await ctx.persistTokenToStorage(refreshedGuest);

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
    // The refresh landed ON the chosen entry rather than beside it: same key,
    // new token.
    expect(activeSession.value?.access_token).toBe(refreshedGuest.access_token);

    await writeRemoteCookie(clientToken);
    deliverRemoteLogin(clientToken);

    await vi.waitFor(() => expect(allSessions.value[clientId]).toBeDefined());

    expect(activeActor.value).toBe(AccessRoleTypes.GUEST);
    expect(activeSessionId.value).toBe(chosenId);
    expect(activeSession.value?.access_token).toBe(refreshedGuest.access_token);
  });
});
