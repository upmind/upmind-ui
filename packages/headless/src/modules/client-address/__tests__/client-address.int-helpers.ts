// -----------------------------------------------------------------------------
/**
 * @module client-address/__tests__/client-address.int-helpers
 * @description Session scaffolding for the co-located scenario replay
 * (`client-address.replay.int.test.ts`, FE-3145 / ADR 035): seed a real
 * authenticated client session behind the owner modules' boot recordings, and
 * evict this module's scope entries between scenarios.
 *
 * The module's capabilities are proven by the DRIVEN `client-address.feature`
 * scenarios, each replaying its own per-step recordings — there are no separate
 * capability `*.int.test.ts` files, and this file holds no fixture-serving fakes.
 * Every response comes from a recording captured by
 * `pnpm fixtures:generate client-address` (scenarios) or the owner modules'
 * generators (brand/system/basket/session-store).
 */

import { existsSync } from "node:fs";
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

/** The brand's own recordings — its boot reads (and the address key list). */
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

/**
 * The OAuth token + `/self` bodies are session-store's OWN captures (same
 * actor), never asserted on here — used only to seed a real client session.
 */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/**
 * The boot reads every signed-in scenario makes as a side effect of
 * `initStore()` — the brand's settings and config (including the address
 * editor's key list), the basket's reference data — answered by the RECORDINGS
 * of the modules that own them, never by a body written here (FE-3145, ADR 035).
 */
export function installBackgroundStubs(): void {
  replayStep(server, BRAND_RECORDINGS);
  replayStep(server, SYSTEM_RECORDINGS);
  replayStep(server, BASKET_RECORDINGS);
  replayStep(server, sessionStoreRecordingsDir);
  installGuestTokenStub();
}

// -----------------------------------------------------------------------------

/** Every live scope key this module currently holds in the registry. */
export function clientAddressScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => /address/i.test(key));
}

/**
 * Evict every client-address scope entry so each scenario starts from a fresh
 * instance behind ITS OWN step recordings; clear the TanStack cache and the
 * append-only brand-config store the editor reads.
 */
export function resetClientAddressScopes(): void {
  for (const key of clientAddressScopeKeys()) remove(key);
  queryClient.clear();
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

/**
 * The current scenario's step-01 (boot step) recording. A gated scenario
 * (AC-20 region-required, AC-21 country-locked) carries the forbidding
 * brand-config read the staff administrator arranged there, alongside that
 * step's own list read. Set before `seedClientSession`, it is armed OVER the
 * permissive Background reads BEFORE `initStore` reads the config, so the very
 * first (and only) brand-config read the module caches is the recorded one —
 * no per-scenario re-read is assumed of the module.
 */
let pendingBootStepDir: string | undefined;

/** Arms the given scenario step-01 dir over the next boot's config read. */
export function armBootStep(dir: string): void {
  pendingBootStepDir = dir;
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

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientAddressScopes();
  installBackgroundStubs();

  const { clientToken, selfBody } = recordedClientCredentials();
  installGuestTokenStub();

  // Arm the scenario's own step-01 recording IN FRONT of the permissive brand
  // reads before initStore, so a gated scenario's config read is the recorded
  // (forbidding) one.
  if (pendingBootStepDir && existsSync(pendingBootStepDir))
    replayStep(server, pendingBootStepDir);

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
 * Seeds the guest floor a `@signed-out` scenario boots against: the owner
 * modules' boot recordings are armed and the store settles on a guest session
 * with NO client signed in, so the collection and the editor resolve
 * `isAvailable:false` and any address request they make anyway is an unmatched
 * request the replay wall surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientAddressScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientAddressScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
