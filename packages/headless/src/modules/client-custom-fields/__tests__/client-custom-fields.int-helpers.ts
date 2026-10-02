// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.int-helpers
 * @description Shared integration scaffolding for the module's ONE integration
 * test (`client-custom-fields.replay.int.test.ts`): seed a real authenticated
 * client session whose boot reads are answered by the OWNER modules' own
 * recordings, and evict this module's scope-registry entries between scenarios.
 *
 * Every response body served here comes from a fixture captured against real
 * staging — the module's own `scenarios/` recordings and the brand / system /
 * basket / session-store modules' own `fixtures/` — no test builds a wire body
 * of its own (FE-3145, ADR 035).
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

/** The basket's own recordings — the claim a client sign-in makes. */
const BASKET_RECORDINGS = join(
  import.meta.dirname,
  "../../basket/__tests__/fixtures"
);

/** The system module's own recordings — the basket's reference data. */
const SYSTEM_RECORDINGS = join(
  import.meta.dirname,
  "../../system/__tests__/fixtures"
);

/** Session-store's own OAuth token + `/self` captures — the seed material. */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/**
 * The boot reads every signed-in test makes as a side effect of `initStore()`
 * — answered by the RECORDINGS of the modules that own them, never by a body
 * written here (FE-3145, ADR 035). Re-applied on every seed; the replay
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
export const SCOPE_NAMESPACE = "client-custom-fields";

/** Every live scope key this module currently holds in the registry. */
export function clientCustomFieldsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-custom-fields scope entry so each scenario starts from a
 * fresh instance against ITS OWN recordings, and clear the shared query cache —
 * the registry entry and the TanStack cache are separate lifetimes.
 */
export function resetClientCustomFieldsScopes(): void {
  for (const key of clientCustomFieldsScopeKeys()) remove(key);
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
  selfBody: { data: { actor: { id: string; brand_id: string } } };
} {
  return {
    clientToken: getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir: sessionStoreRecordingsDir
    }),
    selfBody: getFixtureBody<{
      data: { actor: { id: string; brand_id: string } };
    }>("get-self", { recordingsDir: sessionStoreRecordingsDir })
  };
}

/** Seeds a real authenticated client session; returns its resolved ids. */
export async function seedClientSession(): Promise<{
  clientId: string;
  brandId: string;
  accessToken: string;
}> {
  resetClientCustomFieldsScopes();
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
    brandId: selfBody.data.actor.brand_id,
    accessToken: clientToken.access_token
  };
}

/**
 * Seeds a clean GUEST floor for a `@signed-out` scenario: the owner boot
 * recordings are armed and the store's guest session stands, but NO client is
 * signed in. `seedSessionFor` calls this for a scenario tagged `@signed-out`, so
 * the client×self module has no one to act for — it reports itself unavailable
 * and the replay wall fails the scenario by name if it sends any request.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientCustomFieldsScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientCustomFieldsScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}

/** Logs out any active client session, settling on the guest floor. */
export async function logoutClientSession(): Promise<void> {
  // Intentionally discarded: logout may fail if no session exists.
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientCustomFieldsScopes();
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  // A logout re-mints the guest in the background. Awaited here, while this
  // test's recordings still answer it: left in flight, it lands after the
  // server closes and leaves the process for the real API.
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
