// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.int-helpers
 * @description Shared integration scaffolding for contract's `*.int.test.ts`
 * files: seed a real authenticated client session, evict this module's
 * scope-registry entries between tests, expose the RECORDED wire bodies every
 * handler serves, and capture outbound requests.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate contract` against real staging — no test builds a
 * wire body of its own. `recorded.withdrawRejected()` is the real 404 this
 * sandbox answers `DELETE .../cancel/request` with (`contract.fixtures.ts`
 * fileoverview limit 2) — shipped as the capture under test, not forced to a
 * fabricated 200.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { useBrand } from "../../brand";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { recordingsDir, server } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

/** The Upmind response envelope, as the recorded fixtures carry it. */
export type ContractEnvelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
  messages: unknown;
  meta: unknown;
};

/** The recorded bodies, by capture — the single source of every replay body. */
export const recorded = {
  /** `GET contracts?pagination[limit]=10` — the production list. */
  list: () =>
    getFixtureBody<ContractEnvelope<{ id: string }[]>>(
      "get-contracts-pagination-limit-10",
      { recordingsDir }
    ),
  /** `GET contracts/{id}` — the 12-member client read (AC-3). */
  one: () =>
    getFixtureBody<ContractEnvelope<Record<string, unknown> & { id: string }>>(
      "get-contracts-id-with-staged-imports-1",
      { recordingsDir }
    ),
  /** `PATCH contracts/{id}/payment_details` — a real 200 (AC-8). */
  paymentMethodSet: () =>
    getFixtureBody<ContractEnvelope<Record<string, unknown>>>(
      "patch-contracts-id-payment-details",
      { recordingsDir }
    ),
  /** `POST contracts/{id}/cancel/request` — a real 200 (AC-6). */
  cancellationRequested: () =>
    getFixtureBody<ContractEnvelope<Record<string, unknown>>>(
      "post-contracts-id-cancel-request",
      { recordingsDir }
    ),
  /** `DELETE contracts/{id}/cancel/request` — the REAL 404 this sandbox answers. */
  withdrawRejected: () =>
    getFixture("delete-contracts-id-cancel-request", { recordingsDir })
};

// -----------------------------------------------------------------------------

/**
 * Background bootstrap calls unrelated to any AC fire as a side effect of
 * `initStore()`; stub them harmlessly so they never surface as noise against
 * a suite scoped to contract.
 */
export function installBackgroundStubs(): void {
  server?.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/billing_cycles", () =>
      HttpResponse.json({ status: "ok", data: [] })
    )
  );
}

// -----------------------------------------------------------------------------

/** Every live scope key this module currently holds — `contract:` only, never `contract-product:`. */
export function contractScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => /^contract:/.test(key));
}

/**
 * Evict every contract scope entry so each test starts from a fresh instance
 * against ITS OWN handlers.
 */
export function resetContractScopes(): void {
  for (const key of contractScopeKeys()) remove(key);
  queryClient.clear();
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

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
  resetContractScopes();
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

// -----------------------------------------------------------------------------

/** One observed outbound request. */
export type ContractObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/** Passively observes EVERY outbound request. */
export function observeAllRequests(): {
  all: () => ContractObservedRequest[];
  matching: (fragment: string) => ContractObservedRequest[];
  stop: () => void;
} {
  const seen: ContractObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
  };
  server?.events.on("request:start", listener);
  const stop = (): void =>
    server?.events.removeListener("request:start", listener);
  afterEach(stop);

  return {
    all: () => seen,
    matching: (fragment: string) =>
      seen.filter(entry => entry.url.includes(fragment)),
    stop
  };
}

const ACTING_AS_HEADER_KEYS = [
  "x-acting-as",
  "x-impersonate",
  "x-on-behalf-of",
  "x-staff-id",
  "x-admin-id",
  "impersonation"
];

/** Every header key the identity-transport read-back must NOT carry (A7). */
export function assertNoActingAsHeaders(headers: Record<string, string>): void {
  const keys = Object.keys(headers).map(key => key.toLowerCase());
  for (const bannedKey of ACTING_AS_HEADER_KEYS) {
    expect(keys).not.toContain(bannedKey);
  }
}

/** The full A7 identity read-back for one observed request against a contract URL. */
export function assertClientIdentityTransport(
  observed: ContractObservedRequest,
  accessToken: string
): void {
  expect(observed.url).toContain("/contracts/");
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}

/**
 * Serves the RECORDED single-contract read for every `GET contracts/{id}`
 * request. An optional `row` override (a REAL row, e.g. {@link recorded.one}
 * assembled with a real `cancellation_request`) is served in its place —
 * never a hand-typed body.
 */
export function installContractHandler(
  mswServer: SetupServer | undefined,
  row?: Record<string, unknown> & { id: string }
): { reads: () => number } {
  const envelope = recorded.one();
  const served = row ?? envelope.data;
  let reads = 0;
  mswServer?.use(
    http.get("*/contracts/:id", ({ params }) => {
      if (String(params.id) !== served.id) return undefined;
      reads += 1;
      return HttpResponse.json({ ...envelope, data: served }, { status: 200 });
    })
  );
  return { reads: () => reads };
}
