// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.int-helpers
 * @description Shared integration scaffolding for contract-product's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate contract-product` against real staging — no test
 * builds a wire body of its own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
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
export type ContractProductEnvelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
  messages: unknown;
  meta: unknown;
};

/** The recorded bodies, by capture — the single source of every replay body. */
export const recorded = {
  /** `GET contracts_products?split_count=1&limit=10` — the production list. */
  list: () =>
    getFixtureBody<ContractProductEnvelope<{ id: string }[]>>(
      "get-contracts-products-split-count-1",
      { recordingsDir }
    ),
  /** `GET contract_products/{id}` — the 35-member client read (AC-4/AC-15). */
  one: () =>
    getFixtureBody<
      ContractProductEnvelope<Record<string, unknown> & { id: string }>
    >("get-contract-products-id", { recordingsDir }),
  /** `PUT .../modify_renew {renew:false}` — a real 200 (AC-5). */
  softCancelled: () =>
    getFixtureBody<ContractProductEnvelope<Record<string, unknown>>>(
      "put-contracts-id-products-id-modify-renew-case-stop",
      { recordingsDir }
    ),
  /** `PUT .../modify_renew {renew:true}` — a real 200 (AC-5). */
  softCancelAborted: () =>
    getFixtureBody<ContractProductEnvelope<Record<string, unknown>>>(
      "put-contracts-id-products-id-modify-renew-case-resume",
      { recordingsDir }
    ),
  /** `PUT .../properties` — a real 200 (AC-9). */
  consolidationSet: () =>
    getFixtureBody<ContractProductEnvelope<Record<string, unknown>>>(
      "put-contracts-id-products-id-properties",
      { recordingsDir }
    ),
  /** `PUT .../schedule-cancel` — a real 200 (AC-22). */
  cancellationScheduled: () =>
    getFixtureBody<ContractProductEnvelope<Record<string, unknown>>>(
      "put-contracts-id-products-id-schedule-cancel",
      { recordingsDir }
    ),
  /** `PUT .../schedule-cancel-revoke` — a real 200 (AC-23). */
  cancellationRevoked: () =>
    getFixtureBody<ContractProductEnvelope<Record<string, unknown>>>(
      "put-contracts-id-products-id-schedule-cancel-revoke",
      { recordingsDir }
    )
};

// -----------------------------------------------------------------------------

/**
 * Background bootstrap calls unrelated to any AC fire as a side effect of
 * `initStore()`; stub them harmlessly so they never surface as noise against
 * a suite scoped to contract-product.
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
    ),
    http.get("*/config/brand/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    )
  );
}

// -----------------------------------------------------------------------------

/** Every live scope key this module currently holds — `contract-product:` only. */
export function contractProductScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    /^contract-product:/.test(key)
  );
}

/**
 * Evict every contract-product scope entry so each test starts from a fresh
 * instance against ITS OWN handlers.
 */
export function resetContractProductScopes(): void {
  for (const key of contractProductScopeKeys()) remove(key);
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
  resetContractProductScopes();
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
export type ContractProductObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/** Passively observes EVERY outbound request. */
export function observeAllRequests(): {
  all: () => ContractProductObservedRequest[];
  matching: (fragment: string) => ContractProductObservedRequest[];
  stop: () => void;
} {
  const seen: ContractProductObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
  };
  server?.events.on("request:start", listener);

  return {
    all: () => seen,
    matching: (fragment: string) =>
      seen.filter(entry => entry.url.includes(fragment)),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/** Every header key the identity-transport read-back must NOT carry (A7). */
export function assertNoActingAsHeaders(headers: Record<string, string>): void {
  const keys = Object.keys(headers).map(key => key.toLowerCase());
  expect(keys).toEqual(
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

/** The full A7 identity read-back for one observed request against a contract-product URL. */
export function assertClientIdentityTransport(
  observed: ContractProductObservedRequest,
  accessToken: string
): void {
  expect(observed.url).toContain("/contracts/");
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}

/**
 * Serves the RECORDED single-product read for every `GET contract_products/{id}`
 * request. An optional `row` override (a REAL row) is served in its place —
 * never a hand-typed body.
 */
export function installProductHandler(
  mswServer: SetupServer | undefined,
  row?: Record<string, unknown> & { id: string }
): { reads: () => number } {
  const envelope = recorded.one();
  const served = row ?? envelope.data;
  let reads = 0;
  mswServer?.use(
    http.get("*/contract_products/:id", ({ params }) => {
      if (String(params.id) !== served.id) return undefined;
      reads += 1;
      return HttpResponse.json({ ...envelope, data: served }, { status: 200 });
    })
  );
  return { reads: () => reads };
}
