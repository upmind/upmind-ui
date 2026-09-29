// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.int-helpers
 * @description Shared integration scaffolding for this module's ONE integration
 * test (`client-email-history.replay.int.test.ts`): seed a real authenticated
 * client session whose boot reads are answered by the RECORDINGS of the modules
 * that own them (brand, system, basket, session-store), and evict this module's
 * scope-registry entries between scenarios. Mirrors
 * `client-email/__tests__/client-email.int-helpers.ts` (the canary).
 *
 * No response body is written here — the collection's own answers come from the
 * per-step scenario recordings the replay arms (FE-3145, ADR 035).
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

/** The brand's own recordings — its boot reads included. */
const BRAND_RECORDINGS = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);

/** The system module's own recordings — the basket's reference data. */
const SYSTEM_RECORDINGS = join(
  import.meta.dirname,
  "../../system/__tests__/fixtures"
);

/** The basket's own recordings — the claim a client sign-in makes. */
const BASKET_RECORDINGS = join(
  import.meta.dirname,
  "../../basket/__tests__/fixtures"
);

/** session-store's OWN captures (same actor) — seed material only. */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/**
 * The boot reads every signed-in test makes as a side effect of `initStore()` —
 * answered by the RECORDINGS of the modules that own them, never by a body
 * written here (FE-3145, ADR 035). Re-applied on every seed — the replay
 * server's own `afterEach` resets handlers between tests.
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
export const SCOPE_NAMESPACE = "client-email-history";

/** Every live scope key this module currently holds in the registry. */
export function clientEmailHistoryScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-email-history scope entry so each scenario starts from a
 * fresh instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS scenario's cached list, so the shared
 * cache is cleared too.
 */
export function resetClientEmailHistoryScopes(): void {
  for (const key of clientEmailHistoryScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

/** Answers `initStore()`'s guest-token bootstrap with session-store's capture. */
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

/** The recorded client token + `/self` body every seed below starts from. */
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
  resetClientEmailHistoryScopes();
  installBackgroundStubs();

  const { clientToken, selfBody } = recordedClientCredentials();
  installGuestTokenStub();

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
 * Seeds the guest floor a `@signed-out` scenario boots against: the module's own
 * boot recordings are armed and the store settles on a guest session with NO
 * client signed in, so the collection resolves `isAvailable:false` and any
 * history request it makes anyway is an unmatched request the replay wall
 * surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientEmailHistoryScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientEmailHistoryScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
