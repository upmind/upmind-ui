// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/__tests__/client-billing-settings.int-helpers
 * @description Shared integration scaffolding for this module's ONE integration
 * test (`client-billing-settings.replay.int.test.ts`): seed a real
 * authenticated client session from the OWNER modules' own recordings, and
 * evict this module's TWO scope-registry namespaces between scenarios.
 *
 * Every boot read a signed-in client makes as a side effect of `initStore()` —
 * the brand's settings and config, the system reference data, the basket claim,
 * the session token and `/self` — is answered by the RECORDINGS of the modules
 * that OWN them (`brand`, `system`, `basket`, `session-store`), never by a body
 * written here (FE-3145, ADR 035). This module's OWN reads (`clients/{id}`, its
 * `config/brand/values` gate call) are answered by each scenario's step
 * recordings, armed in front of these by the replay.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
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

/** The brand's own recordings — its boot reads (settings, config batches) included. */
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

/** Session-store's own captures — the OAuth token + `/self` bodies each seed starts from. */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/**
 * Arms every OWNER module's boot recordings in front of the scenario wall.
 * Re-applied on every seed — the replay server's own `afterEach` resets
 * handlers between tests. Exported so the labs forced-surface harness can
 * re-arm the owner reads after it resets handlers to swap in a preset, the same
 * way client-notes / invoices / client-notifications expose it.
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

/** The recorded client token + `/self` body every seed starts from. */
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

// -----------------------------------------------------------------------------

/** This module's two registry namespaces — both composables register under them. */
export const SCOPE_NAMESPACES = [
  "client-billing-settings",
  "client-billing-settings-manager"
];

/** Every live scope key this module currently holds in the registry. */
export function clientBillingSettingsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    SCOPE_NAMESPACES.some(namespace => key.startsWith(`${namespace}:`))
  );
}

/**
 * Evict every client-billing-settings scope entry (both namespaces) so each
 * scenario starts from a fresh instance against ITS OWN recordings. The
 * registry entry and the TanStack query cache are separate lifetimes, so the
 * shared cache is cleared too.
 */
export function resetClientBillingSettingsScopes(): void {
  for (const key of clientBillingSettingsScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientBillingSettingsScopes();
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
