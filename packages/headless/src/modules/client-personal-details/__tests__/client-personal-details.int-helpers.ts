// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/client-personal-details.int-helpers
 * @description The scenario runner's scaffolding (operator ruling 2026-09-24,
 * ADR 035 + Amendment 1): seed a real authenticated client session behind the
 * OWNER modules' own boot recordings, and evict this module's scope-registry
 * entries between scenarios.
 *
 * Every capability is a driven `.feature` scenario replaying its own per-step
 * fixtures (`client-personal-details.replay.int.test.ts`); this file only stands
 * the session up and tears it down. No wire body is built here, no recorded rows
 * are filtered or merged. The read half's profile read is answered by each
 * scenario's own step recordings; the editor's boot lookups — the client custom
 * field DEFINITIONS and the brand's language list — are answered by the
 * recordings of the modules that OWN them (client-custom-fields, brand), matched
 * by identity (brand_id is masked to presence-only, so the owner capture's own
 * brand answers regardless of value; the profile read `clients/:id` is armed by
 * the scenario step LAST, so it wins over the custom-fields module's own
 * `clients/:id` capture).
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

/** The brand's own recordings — its boot reads plus the brand/settings language list. */
const BRAND_RECORDINGS = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);

/** The system module's own recordings — reference data a client sign-in touches. */
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
 * The client-custom-fields module's OWN recordings — the DEFINITIONS read the
 * editor's `loadLookups` makes (`custom_fields?filter[object_type]=client&...`).
 * Owned by that module, so answered by its capture, never re-derived here.
 */
const CUSTOM_FIELDS_RECORDINGS = join(
  import.meta.dirname,
  "../../client-custom-fields/__tests__/fixtures"
);

/**
 * The boot reads every signed-in scenario makes as a side effect of
 * `initStore()`, plus the editor's own lookups — answered by the RECORDINGS of
 * the modules that own them. Re-applied on every seed; the replay server's own
 * `afterEach` resets handlers between scenarios. Each scenario step arms its own
 * `clients/:id` profile read AFTER this, so it wins (server.use is LIFO).
 */
export function installBackgroundStubs(): void {
  replayStep(server, BRAND_RECORDINGS);
  replayStep(server, SYSTEM_RECORDINGS);
  replayStep(server, BASKET_RECORDINGS);
  replayStep(server, CUSTOM_FIELDS_RECORDINGS);
  replayStep(server, SESSION_STORE_RECORDINGS);
  installGuestTokenStub();
}

/**
 * The current scenario's step-01 (boot step) recording. AC-35's scenario
 * carries its own reduced brand language list arranged by the generator,
 * armed here BEFORE `initStore` reads the config, over the shared permissive
 * brand recordings, so the very first (and only) brand-config read `useBrand`
 * caches is the scenario's own — same mechanism as client-address AC-20/AC-21.
 */
let pendingBootStepDir: string | undefined;

/** Arms the given scenario step-01 dir over the next boot's config read. */
export function armBootStep(dir: string): void {
  pendingBootStepDir = dir;
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

/** This module's two registry namespaces — read half and editor. */
const SCOPE_NAMESPACES = [
  "client-personal-details",
  "client-personal-details-manager"
];

/** The namespace of the custom-fields collection the editor composes for its schema. */
const CONSUMED_NAMESPACES = ["client-custom-fields"];

/**
 * Evict every scope entry this module holds AND the custom-fields collection the
 * editor composes, so each scenario starts from a fresh instance. The registry
 * entry, the TanStack query cache and `useBrand`'s append-only config store are
 * separate lifetimes — all cleared so each scenario's boot reads are real.
 */
export function resetClientPersonalDetailsScopes(): void {
  for (const key of [...getRegistry().keys()].filter(key =>
    [...SCOPE_NAMESPACES, ...CONSUMED_NAMESPACES].some(namespace =>
      key.startsWith(`${namespace}:`)
    )
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
  installBackgroundStubs();
  const { clientToken, selfBody } = recordedClientCredentials();
  installGuestTokenStub();

  // Arm the scenario's own step-01 recording IN FRONT of the permissive brand
  // reads, and before the reset's brand refetch, so a gated scenario's (AC-35)
  // brand read is the recorded (language-reduced) one.
  if (pendingBootStepDir && existsSync(pendingBootStepDir))
    replayStep(server, pendingBootStepDir);
  resetClientPersonalDetailsScopes();
  // The brand's singleton reads outlive the cleared cache; re-read them over
  // this scenario's handlers.
  await useBrand().refresh();

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
 * Seeds the guest floor a `@signed-out` scenario boots against: the owner boot
 * recordings are armed and the store settles on a guest session with NO client
 * signed in, so the read half and the editor resolve `isAvailable:false` and any
 * profile request they make anyway is an unmatched request the replay wall
 * surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientPersonalDetailsScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientPersonalDetailsScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
