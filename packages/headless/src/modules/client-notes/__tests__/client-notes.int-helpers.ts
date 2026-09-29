// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.int-helpers
 * @description Scenario-replay scaffolding for client-notes (FE-3145, ADR 035).
 * Every module capability is proven by a DRIVEN `.feature` scenario replaying
 * its own per-step recording (`client-notes.replay.int.test.ts`); this file
 * carries only what that runner needs — a real authenticated client session
 * behind the owner modules' own boot recordings, and the scope/cache reset
 * between scenarios.
 *
 * Auth-token transport and request-identity read-backs are NOT proven here:
 * they belong to the `query` / `session-store` / `auth` modules that own them
 * (operator ruling 2026-09-24). Nothing in this module builds a wire body: a
 * request no armed step recorded is a capture gap the replay wall fails by name.
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
 * `basket`, `session-store`), never by a body written here. The vault's own
 * brand-gate flag and product-lookup reads belong to each scenario's step
 * recording, not here. Re-applied on every seed — the replay server resets
 * handlers between tests.
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

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-notes";

/** Every live scope key this module currently holds in the registry. */
export function clientNoteScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}`)
  );
}

/**
 * Evict every client-notes scope entry so each scenario starts from a fresh
 * instance. The registry entry and the TanStack query cache are separate
 * lifetimes, and the brand config query persists to localStorage
 * (`staleTime: "static"`), so all three are cleared.
 */
export function resetClientNoteScopes(): void {
  for (const key of clientNoteScopeKeys()) remove(key);
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
  resetClientNoteScopes();
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
 * Seeds a clean GUEST floor for a `@signed-out` scenario: the owner boot
 * recordings are armed and the store's guest session stands, but NO client is
 * signed in. `seedSessionFor` calls this for a scenario tagged `@signed-out`, so
 * the client×self vault has no one to act for — it reports itself unavailable
 * and the replay wall fails the scenario by name if it sends any request.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientNoteScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientNoteScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
