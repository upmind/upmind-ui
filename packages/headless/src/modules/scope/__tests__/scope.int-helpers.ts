// -----------------------------------------------------------------------------
/**
 * @module scope/__tests__/scope.int-helpers
 * @description Boot scaffolding for scope's wire-level identity proof. Seeds a
 * real authenticated client session behind the owner modules' boot recordings
 * (brand/system/basket/session-store), arms the vehicle module's address
 * recordings, and passively observes outbound `/addresses` requests so the proof
 * reads identity off the REAL wire (URL + auth transport), never off a resolved
 * value or a response payload.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-address` (the vehicle) or the owner modules'
 * generators — no test builds a wire body of its own (FE-3145, ADR 035).
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { queryClient } from "../../query/client";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { getRegistry, remove } from "../scope.registry";
import { server } from "./setup.integration";
import { filter, map } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const OWNER_FIXTURES = (module: string): string =>
  join(import.meta.dirname, `../../${module}/__tests__/fixtures`);

const BRAND_RECORDINGS = OWNER_FIXTURES("brand");
const BASKET_RECORDINGS = OWNER_FIXTURES("basket");
const SYSTEM_RECORDINGS = OWNER_FIXTURES("system");

/** The OAuth token + `/self` bodies are session-store's OWN captures. */
export const sessionStoreRecordingsDir = OWNER_FIXTURES("session-store");

/** Scope's own recordings — the address list, set-default and remove requests. */
const ADDRESS_RECORDINGS = join(import.meta.dirname, "fixtures");

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

/**
 * Arms the boot reads a signed-in session makes, each answered by the RECORDINGS
 * of the module that owns it. The address reads and writes the proof drives are
 * answered by scope's OWN co-located recordings (the server's initial handlers).
 */
function installBackgroundStubs(): void {
  replayStep(server, BRAND_RECORDINGS);
  replayStep(server, SYSTEM_RECORDINGS);
  replayStep(server, BASKET_RECORDINGS);
  replayStep(server, sessionStoreRecordingsDir);
  installGuestTokenStub();
}

// -----------------------------------------------------------------------------

/** Evict every scope entry the vehicle registered, and clear the query cache. */
export function resetScopes(): void {
  for (const key of filter([...getRegistry().keys()], key =>
    /address/i.test(key)
  ))
    remove(key);
  queryClient.clear();
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

/** Seeds a real authenticated client session; returns the id the SESSION holds. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetScopes();
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

/** The first address id the recorded collection returned — a real recorded id. */
export function recordedAddressId(): string {
  const body = getFixtureBody<{ data: Array<{ id: string }> }>(
    "get-clients-id-addresses",
    { recordingsDir: ADDRESS_RECORDINGS }
  );
  const id = body.data[0]?.id;
  if (!id)
    throw new Error(
      "The recorded address collection is empty — re-record with " +
        "`pnpm fixtures:generate client-address`."
    );
  return id;
}

// -----------------------------------------------------------------------------

/** One observed outbound request. */
type Observed = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/**
 * Passively observes every request whose URL contains `/addresses`. An MSW
 * `request:start` listener rather than a handler, so it never races the fixture
 * replay for the same route — the read-only observer that carries the wire
 * read-back (url + auth transport).
 */
export function observeAddressRequests(): {
  all: () => Observed[];
  first: () => Observed;
  byMethod: (method: string) => Observed[];
  stop: () => void;
} {
  const seen: Observed[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/addresses")) return;
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
  };
  server?.events.on("request:start", listener);

  return {
    all: () => seen,
    first: () => seen[0],
    byMethod: method => filter(seen, entry => entry.method === method),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

// -----------------------------------------------------------------------------

/** Every header the identity transport must NOT carry — an acting-as / impersonation seam. */
export function assertNoActingAsHeaders(headers: Record<string, string>): void {
  expect(map(Object.keys(headers), key => key.toLowerCase())).toEqual(
    expect.not.arrayContaining([
      "x-acting-as",
      "x-impersonate",
      "x-on-behalf-of",
      "x-staff-id",
      "x-admin-id",
      "impersonation"
    ])
  );
}

/** The auth transport for one observed request: the session's own bearer token. */
export function assertBearerToken(
  observed: Observed,
  accessToken: string
): void {
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
}
