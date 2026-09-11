/**
 * @fileoverview Auth integration — the guest arm reads the session store
 * (FE-3087, operator ruling R10 §6)
 *
 * ## Job To Be Done
 * A guest-scoped auth instance settles its session probe against the guest
 * POOL the session store publishes — the same source the client and staff arms
 * read `clientSessions`/`staffSessions` from — so the store's scope filter
 * reaches guest too. Auth also owns the guest MINT (operator ruling R12): an
 * explicitly fresh guest goes straight to its grant while a fresh client still
 * waits on the sign-in form, and a SELF probe falls all the way to a guest when
 * that is the only session held (§21 item 3). Driven against the recorded guest
 * grant over MSW.
 *
 * ## What Breaks If These Fail
 * An app that bars guest still boots a guest-authenticated auth instance,
 * because the arm read the raw cookie the store had already filtered out; guest
 * stays the one actor whose session bypasses the store's own gate. Or the
 * new-guest routing loses its actor test — every fresh instance posts a grant,
 * so asking for a new client session mints one silently instead of asking for
 * credentials. Or a device holding only a guest reads as signed out to anyone
 * acting as themselves.
 */

import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../__tests__/int-test-helpers";
import { ScopeActorTypes } from "../../scope";
import { persistTokenToStorage, useSessionStore } from "../../session-store";
import { useAuth } from "../useAuth";
import { server } from "./setup.integration";
import { includes, keys, size } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

const { overrideToken } = makeFixtureOverrides(server, recordingsDir);

/**
 * Records every grant the replay server sees from the moment it is called.
 *
 * @returns The grant request urls, in the order they were posted.
 */
function grantsFromNow(): string[] {
  const grants: string[] = [];
  server?.events.on("request:start", ({ request }) => {
    if (includes(request.url, "/oauth/access_token")) grants.push(request.url);
  });
  return grants;
}

/**
 * Boots the store with every scope allowed and one guest session pooled.
 *
 * The store is a module singleton: a case running after one that narrowed
 * `allowedScopes` inherits that narrowing, and `clear()` is what floors the
 * pointer back to guest and triggers the mint the reset needs.
 *
 * @returns The recorded guest token the mint landed.
 */
async function bootWithGuest(): Promise<IToken> {
  const guestToken = overrideToken("post-oauth-access-token-guest");
  await useSessionStore().initStore({
    allowedScopes: [
      AccessRoleTypes.GUEST,
      AccessRoleTypes.CLIENT,
      AccessRoleTypes.STAFF
    ]
  });
  useSessionStore().useActions().clear();
  await useSessionStore().useActions().isReady();
  return guestToken;
}

// -----------------------------------------------------------------------------

describe("auth integration (the guest arm reads the session store)", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    useAuth().as(ScopeActorTypes.GUEST).useActions().destroy();
    useAuth().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useAuth().as(ScopeActorTypes.SELF).useActions().destroy();
  });

  afterEach(() => {
    server?.events.removeAllListeners("request:start");
    useAuth().as(ScopeActorTypes.GUEST).useActions().destroy();
    useAuth().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useAuth().as(ScopeActorTypes.SELF).useActions().destroy();
  });

  it(
    "settles authenticated on the guest session the store pools @AC-G17",
    { timeout: 30000 },
    async () => {
      overrideToken("post-oauth-access-token-guest");
      await useSessionStore().initStore();

      const auth = useAuth().as(ScopeActorTypes.GUEST);
      await auth.useActions().isReady();

      expect(useSessionStore().useMeta().hasGuestSession.value).toBe(true);
      expect(auth.useMeta().isAuthenticated.value).toBe(true);
    }
  );

  it("finds no session for a guest the store's scope filter hides @AC-G17", async () => {
    overrideToken("post-oauth-access-token-guest");
    await persistTokenToStorage(
      getFixtureBody<IToken>("post-oauth-access-token-guest", {
        recordingsDir
      })
    );
    await useSessionStore().initStore({
      allowedScopes: [AccessRoleTypes.CLIENT]
    });

    const auth = useAuth().as(ScopeActorTypes.GUEST);
    await auth.useActions().isReady();

    // The cookie the seed wrote is still in the jar, so an arm reading it
    // directly answers authenticated here; only one reading the store's own
    // scope-filtered guest surface does not.
    expect(useSessionStore().useContext().guestSession.value).toBeUndefined();
    expect(auth.useMeta().isAuthenticated.value).toBe(false);
  });

  it(
    "takes an explicitly fresh guest straight to its own grant and leaves a fresh client on the form @AC-G29 @AC-G30",
    { timeout: 30000 },
    async () => {
      await bootWithGuest();

      const { guestSessions } = useSessionStore().useContext();
      const pooledBefore = size(keys(guestSessions.value));
      const grants = grantsFromNow();

      const guest = useAuth().as(ScopeActorTypes.GUEST).fresh();
      await guest.useActions().isReady();

      expect(grants).toHaveLength(1);
      await vi.waitFor(() => {
        expect(guest.useMeta().isAuthenticated.value).toBe(true);
        expect(size(keys(guestSessions.value))).toBe(pooledBefore + 1);
      });
      expect(guest.useMeta().isIdle.value).toBe(false);
      expect(guest.useMeta().showLoginForm.value).toBe(false);

      const client = useAuth().as(ScopeActorTypes.CLIENT).fresh();
      await client.useActions().isReady();

      // Same `fresh()` intent, different actor: a guard that tested the intent
      // alone and not the actor would post a second grant here and hand back a
      // client session nobody signed in to.
      expect(grants).toHaveLength(1);
      expect(client.useMeta().isIdle.value).toBe(true);
      expect(client.useMeta().isAuthenticated.value).toBe(false);

      guest.useActions().destroy();
      client.useActions().destroy();
    }
  );

  it("resolves a probe made as myself onto the guest when it is the only session held @AC-G31", async () => {
    await bootWithGuest();

    const store = useSessionStore();
    expect(store.useMeta().hasClientSession.value).toBe(false);
    expect(store.useMeta().hasStaffSession.value).toBe(false);

    const auth = useAuth().as(ScopeActorTypes.SELF);
    await auth.useActions().isReady();

    expect(auth.useMeta().isAuthenticated.value).toBe(true);

    auth.useActions().destroy();

    // Same device, same pooled guest, guest no longer an allowed scope: the
    // probe has nothing left to resolve onto. Without this leg "authenticated"
    // above could have come from anywhere; with it, it came from the guest.
    await store.initStore({ allowedScopes: [AccessRoleTypes.CLIENT] });

    const barred = useAuth().as(ScopeActorTypes.SELF);
    await barred.useActions().isReady();

    expect(barred.useMeta().isAuthenticated.value).toBe(false);

    barred.useActions().destroy();
  });
});
