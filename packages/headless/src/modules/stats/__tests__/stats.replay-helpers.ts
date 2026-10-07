// -----------------------------------------------------------------------------
/**
 * @module stats/__tests__/stats.replay-helpers
 * @description Scenario-replay scaffolding for `stats.replay.int.test.ts` (ONE
 * scenario, ONE recording — FE-3145, ADR 035 Am.1): seed a real authenticated
 * client session (and a signed-out guest floor), and evict this module's
 * scope-registry entries between scenarios.
 *
 * Every boot read is answered by the RECORDINGS of the module that owns it
 * (`brand`, `system`, `basket`, `session-store`) through `replayStep`, never by a
 * body written here (ADR 035). Mirrors
 * `legacy-invoices/__tests__/legacy-invoices.replay-helpers.ts` — a public
 * test-infrastructure pattern, not this module's implementation source.
 *
 * This is the module's ONLY integration scaffolding: the pre-conversion
 * capability `*.int.test.ts` files and `stats.int-helpers.ts` were retired once
 * every capability became a driven `.feature` scenario (ADR 035 Am.1 §2).
 */

import { existsSync, readdirSync } from "node:fs";
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

/** The owning modules' recordings that answer a signed-in boot's reads. */
const OWNER_RECORDINGS = ["brand", "system", "basket"].map(module =>
  join(import.meta.dirname, `../../${module}/__tests__/fixtures`)
);

export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

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

/**
 * Boot reads unrelated to any AC (brand, system, basket, self) are answered by
 * the RECORDINGS of the modules that own them, never by a body written here
 * (ADR 035). Re-applied on every seed; the replay server resets handlers.
 */
export function installBackgroundStubs(): void {
  for (const dir of OWNER_RECORDINGS) replayStep(server, dir);
  replayStep(server, sessionStoreRecordingsDir);
  // Last, so it answers first: every token grant shares one url and differs
  // only by body, so the grant a boot mints — the guest's — is named.
  installGuestTokenStub();
}

// -----------------------------------------------------------------------------

/** Every live scope key this module currently holds in the registry. */
export function statsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => key.startsWith("stats:"));
}

/**
 * Evict every stats scope entry so each scenario starts from a fresh instance
 * against ITS OWN handlers. The registry entry and the TanStack query cache are
 * separate lifetimes, so the shared cache is cleared too.
 */
export function resetStatsScopes(): void {
  for (const key of statsScopeKeys()) remove(key);
  queryClient.clear();
  // The brand singleton caches config across scenarios; AC-7 arranges a distinct
  // support-system flag, so its config must be re-fetched per scenario, not
  // reused from a prior one (the invoices-replay precedent).
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

/** The scenario's own step-01 folder, armed ahead of the seed. */
let pendingBootStepDir: string | undefined;

/**
 * Names the scenario's step-01 folder so the next seed answers any boot read it
 * recorded (the session's own `/self`, when a scenario arranged a distinct one)
 * in front of the owner recordings.
 */
export function armBootStep(dir: string): void {
  pendingBootStepDir = dir;
}

/** Whether the armed step-01 folder recorded the session's own `/self`. */
function bootStepRecordsSelf(): boolean {
  return (
    !!pendingBootStepDir &&
    existsSync(pendingBootStepDir) &&
    readdirSync(pendingBootStepDir).some(file => file.startsWith("get-self"))
  );
}

/** Arms the owner boot recordings, then the scenario's step-01 recording over them. */
function armBoot(): void {
  installBackgroundStubs();
  if (pendingBootStepDir && existsSync(pendingBootStepDir))
    replayStep(server, pendingBootStepDir);
}

/**
 * The recorded client token, and the `/self` body the seed starts from: the
 * scenario's own step-01 capture when it recorded one, else session-store's.
 */
function recordedClientCredentials(): {
  clientToken: IToken;
  selfBody: { data: { actor: { id: string } } };
} {
  return {
    clientToken: getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir: sessionStoreRecordingsDir
    }),
    selfBody: getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
      recordingsDir: bootStepRecordsSelf()
        ? pendingBootStepDir
        : sessionStoreRecordingsDir
    })
  };
}

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetStatsScopes();
  armBoot();

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

  // The brand singleton memoises its config across scenarios, so a prior
  // scenario's support-system value would persist into this one. `invalidate`
  // (in resetStatsScopes) marks it stale; this forces the re-fetch, now against
  // THIS scenario's armed boot recording — so AC-7's arranged flag is read, not a
  // neighbour's default.
  await useBrand().refresh();

  return {
    clientId: selfBody.data.actor.id,
    accessToken: clientToken.access_token
  };
}

/**
 * Seeds the guest floor a `@signed-out` scenario boots against: the module's own
 * boot recordings are armed and the store settles on a guest session with NO
 * client signed in, so the composable resolves `isAvailable:false` and any stats
 * request it makes anyway is an unmatched request the wall surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetStatsScopes();
  armBoot();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetStatsScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
