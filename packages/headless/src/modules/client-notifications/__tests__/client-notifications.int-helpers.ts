// -----------------------------------------------------------------------------
/**
 * @module client-notifications/__tests__/client-notifications.int-helpers
 * @description Scenario-replay scaffolding for client-notifications (FE-3145,
 * ADR 035). Every module capability is proven by a DRIVEN `.feature` scenario
 * replaying its own per-step recording (`client-notifications.replay.int.test.ts`),
 * or is a recorded `@todo` with a named blocker; this file carries only what the
 * replay runner needs — a real authenticated client session behind the owner
 * modules' own boot recordings, and the scope/cache reset between scenarios.
 *
 * Auth-token transport and request-identity read-backs are NOT proven here:
 * they belong to the `query` / `session-store` / `auth` modules that own them.
 * Nothing in this module builds a wire body, filters recorded rows, or keeps a
 * collection it changes itself: a request no armed step recorded is a capture
 * gap the replay wall fails by name.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { AccessRoleTypes } from "@upmind-automation/types";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { server } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** The `__tests__` dir this module's recordings live under. */
const UNITS_DIR = import.meta.dirname;

/** The owner modules' own recordings — the boot reads a signed-in test makes. */
const BRAND_RECORDINGS = join(UNITS_DIR, "../../brand/__tests__/fixtures");
const SYSTEM_RECORDINGS = join(UNITS_DIR, "../../system/__tests__/fixtures");
const BASKET_RECORDINGS = join(UNITS_DIR, "../../basket/__tests__/fixtures");

/** D2 input material: session-store's OWN captures (same actor), reused. */
export const sessionStoreRecordingsDir = join(
  UNITS_DIR,
  "../../session-store/__tests__/fixtures"
);

/**
 * The boot reads every signed-in test makes as a side effect of `initStore()` —
 * the brand's settings and config, the system reference data, the session —
 * answered by the RECORDINGS of the modules that own them (`brand`, `system`,
 * `basket`, `session-store`), never by a body written here. Re-applied on every
 * seed — the replay server resets handlers between tests.
 */
export function installBackgroundStubs(): void {
  replayStep(server, BRAND_RECORDINGS);
  replayStep(server, SYSTEM_RECORDINGS);
  replayStep(server, BASKET_RECORDINGS);
  replayStep(server, sessionStoreRecordingsDir);
  // Last, so it answers first: every token grant shares one url and differs
  // only by its body, so the grant a boot mints — the guest's — is named.
  installGuestTokenStub();
}

// -----------------------------------------------------------------------------

/** Every live scope key this module currently holds in the registry. */
export function clientNotificationsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => /notification/i.test(key));
}

/**
 * Evict every client-notifications scope entry so each scenario starts from a
 * fresh instance. The registry entry and the TanStack query cache are separate
 * lifetimes; the brand config query also persists to localStorage, so all three
 * are cleared.
 */
export function resetClientNotificationsScopes(): void {
  for (const key of clientNotificationsScopeKeys()) remove(key);
  queryClient.clear();
  if (typeof localStorage !== "undefined") localStorage.clear();
}

// -----------------------------------------------------------------------------

function installGuestTokenStub(): void {
  const guestFixture = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guestFixture.response.body as object, {
        status: guestFixture.response.status
      })
    )
  );
}

function recordedClientCredentials(): {
  clientToken: IToken;
  selfBody: { data: { actor: { id: string } } };
} {
  return {
    clientToken: getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir: sessionStoreRecordingsDir
    }),
    selfBody: getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
      recordingsDir: sessionStoreRecordingsDir
    })
  };
}

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientNotificationsScopes();
  installBackgroundStubs();

  const { clientToken, selfBody } = recordedClientCredentials();

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  return {
    clientId: selfBody.data.actor.id,
    accessToken: clientToken.access_token
  };
}

/**
 * Tops up a client session onto an ALREADY-BOOTED, signed-out module WITHOUT
 * evicting its scope instances — AC-16's whole point is that the same composable
 * becomes usable once the session resolves, "without reopening". So this only
 * ADDs the session to the store (no `resetClientNotificationsScopes`,
 * no re-`initStore`), leaving the live instance to react.
 */
export async function topUpClientSession(): Promise<string> {
  const { clientToken, selfBody } = recordedClientCredentials();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody.data as never));
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });
  return selfBody.data.actor.id;
}

/**
 * Seeds a clean GUEST floor for a `@signed-out` scenario: the owner boot
 * recordings are armed and the store's guest session stands, but NO client is
 * signed in. `seedSessionFor` calls this for a scenario tagged `@signed-out` —
 * the collection/editor has no signed-in client to read for (AC-16 before its
 * session resolves; AC-8/10/18 read via the emailed `?token=` link instead).
 */
export async function seedGuestSession(): Promise<void> {
  resetClientNotificationsScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientNotificationsScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
