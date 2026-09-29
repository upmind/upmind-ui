// -----------------------------------------------------------------------------
/**
 * @module client-phone/__tests__/client-phone.int-helpers
 * @description The scaffolding the scenario runner (`client-phone.replay.int.test.ts`)
 * needs: seed a real authenticated client session behind the OWNING modules'
 * boot recordings, and evict this module's scope-registry entries between
 * scenarios. Every module capability is proven by a driven `.feature` scenario
 * replaying its own per-step recordings (FE-3145, ADR 035; operator ruling), so
 * this file carries no per-test handlers, no observers and no flat-body readers.
 *
 * Every response a seeded session replays comes from a fixture captured against
 * real staging — the owning modules' own recordings and the module's own
 * `pnpm fixtures:generate client-phone` scenario captures. No test builds a wire
 * body of its own.
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

/** The brand's own recordings — its boot reads (settings, config, modules). */
const BRAND_RECORDINGS = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);

/** The system module's own recordings — the country list the editor resolves. */
const SYSTEM_RECORDINGS = join(
  import.meta.dirname,
  "../../system/__tests__/fixtures"
);

/** The basket's own recordings — the claim a client sign-in makes. */
const BASKET_RECORDINGS = join(
  import.meta.dirname,
  "../../basket/__tests__/fixtures"
);

/**
 * D2 input material: the OAuth token + `/self` bodies are session-store's OWN
 * captures (same actor), never asserted on here — used only to seed a real
 * client session, exactly as `client-email.int-helpers.ts` reuses them.
 */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/**
 * The boot reads every signed-in scenario makes as a side effect of
 * `initStore()` — the brand's settings and config, the system's country list,
 * the basket's claim — answered by the RECORDINGS of the modules that OWN them
 * (`brand`, `system`, `basket`), never by a body written here (FE-3145, ADR
 * 035). The system module's own `get-countries` capture carries all 248
 * countries (`?limit=0`), the client's default `GB` included. Re-applied on
 * every seed — the replay server's own `afterEach` resets handlers between tests.
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

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-phone";

/** Every live scope key this module currently holds in the registry. */
export function clientPhoneScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-phone scope entry so each scenario starts from a fresh
 * instance. The registry entry and the TanStack query cache are separate
 * lifetimes — dropping the entry alone leaves a new instance free to serve the
 * PREVIOUS scenario's cached list, so the shared cache is cleared too.
 */
export function resetClientPhoneScopes(): void {
  for (const key of clientPhoneScopeKeys()) remove(key);
  queryClient.clear();
}

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientPhoneScopes();
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
 * Seeds the guest floor a `@signed-out` scenario boots against: the owning
 * modules' boot recordings are armed and the store settles on a guest session
 * with NO client signed in, so the collection and the editor resolve
 * `isAvailable:false` and any phone request they make anyway is an unmatched
 * request the replay wall surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientPhoneScopes();
  installBackgroundStubs();

  // `initStore` mints the guest floor; no client was seeded for a signed-out
  // scenario, so there is nothing to log out.
  await useSessionStore().initStore();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
