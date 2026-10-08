// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.int-helpers
 * @description Shared integration scaffolding for contract-product's replay:
 * seed a real authenticated client session (and a signed-out guest floor), and
 * evict this module's scope-registry entries between scenarios.
 *
 * Every boot read is answered by the RECORDINGS of the module that owns it
 * (`brand`, `system`, `basket`, `session-store`) through `replayStep`, never by
 * a body written here (ADR 035). Mirrors
 * `client-email/__tests__/client-email.int-helpers.ts` — a public
 * test-infrastructure pattern, not this module's implementation source.
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

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "contract-product";

/** Every live scope key this module currently holds in the registry. */
export function contractProductScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    /^contract-product:/.test(key)
  );
}

/**
 * The owner-module scopes the two composables compose. Each registers under
 * its own namespace, so it outlives its scenario unless evicted too: a stale
 * show-delegated preference sends the next scenario's first list read with the
 * previous scenario's choice.
 */
const CONSUMED_NAMESPACES = [
  "client-custom-fields",
  "client-personal-details",
  "client-address",
  "client-company",
  "invoices"
];

/**
 * Evict every contract-product scope entry, and every collection it composes,
 * so each scenario starts from a fresh instance against ITS OWN handlers. The
 * registry entry and the TanStack query cache are separate lifetimes, so the
 * shared cache is cleared too, and the brand singleton is invalidated so its
 * boot read re-runs against the scenario.
 */
export function resetContractProductScopes(): void {
  const consumed = [...getRegistry().keys()].filter(key =>
    CONSUMED_NAMESPACES.some(namespace => key.startsWith(`${namespace}:`))
  );
  for (const key of [...contractProductScopeKeys(), ...consumed]) remove(key);
  queryClient.clear();
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

/** The scenario's own step-01 folder, armed ahead of the seed (see {@link armBootStep}). */
let pendingBootStepDir: string | undefined;

/**
 * Names the scenario's step-01 folder so the next seed answers its boot reads
 * — `brand/settings`, and the session's `/self` when step 01 recorded one — in
 * front of the owner recordings.
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

/**
 * Arms the owner boot recordings, then the scenario's step-01 recording in
 * front of them, and re-reads the brand over those handlers. `refresh()`
 * resolves before the re-read settles, so the seed waits on `isReady()` —
 * else a scenario boots on the previous scenario's brand settings.
 */
async function armBoot(): Promise<void> {
  installBackgroundStubs();
  if (pendingBootStepDir && existsSync(pendingBootStepDir))
    replayStep(server, pendingBootStepDir);
  await useBrand().refresh();
  await useBrand().isReady();
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
  resetContractProductScopes();
  await armBoot();

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
 * Seeds the guest floor a `@signed-out` scenario boots against: the module's
 * own boot recordings are armed and the store settles on a guest session with
 * NO client signed in, so both composables resolve `isAvailable:false` and any
 * product request one makes anyway is an unmatched request the wall surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetContractProductScopes();
  await armBoot();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetContractProductScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
