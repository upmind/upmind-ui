// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.int-helpers
 * @description The scaffolding the scenario runner (`contract.replay.int.test.ts`)
 * needs: seed a real authenticated client session, or the guest floor, behind
 * the OWNING modules' boot recordings, and evict this module's scope-registry
 * entries between scenarios. Every capability is proven by a driven
 * `contract.feature` scenario replaying its own per-step recordings (FE-3145,
 * ADR 035 Am.1), so this file carries no per-test handler, observer or body
 * reader.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
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
import { filter, forEach, startsWith } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** The owning modules whose recordings answer a signed-in boot's reads. */
const OWNER_RECORDINGS = [
  join(import.meta.dirname, "../../brand/__tests__/fixtures"),
  join(import.meta.dirname, "../../system/__tests__/fixtures"),
  join(import.meta.dirname, "../../basket/__tests__/fixtures")
];

const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/**
 * The boot reads a session makes as a side effect of `initStore()` — brand,
 * system, basket and session-store's own — answered by the RECORDINGS of the
 * modules that own them (ADR 035). Re-applied on every seed; the replay server
 * resets handlers between tests.
 */
function installBackgroundRecordings(): void {
  forEach(OWNER_RECORDINGS, dir => replayStep(server, dir));
  replayStep(server, sessionStoreRecordingsDir);

  const guestBody = getFixtureBody("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () => HttpResponse.json(guestBody))
  );
}

// -----------------------------------------------------------------------------

/**
 * Evicts every `contract:` scope entry (never `contract-product:`) and the
 * shared query cache, so each scenario starts on a fresh instance against its
 * own recording.
 */
export function resetContractScopes(): void {
  forEach(
    filter([...getRegistry().keys()], key => startsWith(key, "contract:")),
    key => remove(key)
  );
  queryClient.clear();
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

/** Seeds the recorded authenticated client session. */
export async function seedClientSession(): Promise<void> {
  resetContractScopes();
  installBackgroundRecordings();

  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionStoreRecordingsDir
  });
  const selfBody = getFixtureBody<{ data: unknown }>("get-self", {
    recordingsDir: sessionStoreRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });
}

/**
 * Seeds the guest floor a `@signed-out` scenario boots against: the store
 * settles on a guest session with no client signed in, so any contract request
 * the module makes anyway reaches the replay wall and fails by name.
 */
export async function seedGuestSession(): Promise<void> {
  resetContractScopes();
  installBackgroundRecordings();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetContractScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}
