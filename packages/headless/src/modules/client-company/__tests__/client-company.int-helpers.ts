// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.int-helpers
 * @description The scenario runner's scaffolding (operator ruling 2026-09-24):
 * seed a real authenticated client session behind the OWNER modules' own boot
 * recordings, and evict this module's scope-registry entries between scenarios.
 *
 * Every capability is a driven `.feature` scenario replaying its own per-step
 * fixtures (`client-company.replay.int.test.ts`); this file only stands the
 * session up and tears it down. No wire body is built here, no recorded rows
 * are filtered or merged, and the module's boot reads are answered by the
 * recordings of the modules that own them (brand, system, basket,
 * session-store) — never by a body written here.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { AccessRoleTypes } from "@upmind-automation/types";
import { useBrand } from "../../brand";
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

/** The brand's own recordings — its boot reads (org modules, settings, config). */
const BRAND_RECORDINGS = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);

/** The system module's own recordings — billing cycles and the country list. */
const SYSTEM_RECORDINGS = join(
  import.meta.dirname,
  "../../system/__tests__/fixtures"
);

/** The basket's own recordings — the claim a client sign-in makes. */
const BASKET_RECORDINGS = join(
  import.meta.dirname,
  "../../basket/__tests__/fixtures"
);

/** Session-store's OWN OAuth token + `/self` captures (same actor). */
const SESSION_STORE_RECORDINGS = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/**
 * The boot reads every signed-in scenario makes as a side effect of
 * `initStore()` — the brand's settings and org config, the system's billing
 * cycles and country list, the basket's reference data — answered by the
 * RECORDINGS of the modules that own them. Re-applied on every seed; the replay
 * server's own `afterEach` resets handlers between scenarios.
 */
export function installBackgroundStubs(): void {
  replayStep(server, BRAND_RECORDINGS);
  replayStep(server, SYSTEM_RECORDINGS);
  replayStep(server, BASKET_RECORDINGS);
  replayStep(server, SESSION_STORE_RECORDINGS);
  installGuestTokenStub();
}

/** Answers `initStore()`'s guest-token bootstrap with session-store's capture. */
function installGuestTokenStub(): void {
  const guestFixture = getFixture("post-oauth-access-token-guest", {
    recordingsDir: SESSION_STORE_RECORDINGS
  });
  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guestFixture.response.body as object, {
        status: guestFixture.response.status
      })
    )
  );
}

// -----------------------------------------------------------------------------

/** The module's own registry namespace — both composables register under it. */
const SCOPE_NAMESPACE = "client-company";

/**
 * Evict every client-company scope entry so each scenario starts from a fresh
 * instance. The registry entry, the TanStack query cache and `useBrand`'s
 * append-only config store are three separate lifetimes — all cleared so each
 * scenario's boot reads are real, not a stale hit.
 */
export function resetClientCompanyScopes(): void {
  for (const key of [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  ))
    remove(key);
  queryClient.clear();
  useBrand().invalidate();
}

/** The recorded client token + `/self` body every seed starts from. */
function recordedClientCredentials(): {
  clientToken: IToken;
  selfBody: { data: { actor: { id: string } } };
} {
  return {
    clientToken: getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir: SESSION_STORE_RECORDINGS
    }),
    selfBody: getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
      recordingsDir: SESSION_STORE_RECORDINGS
    })
  };
}

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientCompanyScopes();
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
 * Seeds a clean GUEST floor for a `@signed-out` scenario: no client is on the
 * session, so the client×self module has no one to act for. `seedSessionFor`
 * skips the client seed for these scenarios but does not clear one a prior
 * scenario left on the session-store singleton, so this logs any active client
 * out and settles on the guest the boot recordings answer — leaving the module
 * to report itself unavailable and ask the server for nothing.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientCompanyScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientCompanyScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
