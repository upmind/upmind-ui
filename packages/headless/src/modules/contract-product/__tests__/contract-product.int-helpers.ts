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
import type { ICProdGroup, IToken } from "@upmind-automation/types";
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

/** The grouped-counts response envelope — the rows ride `total`, not `data` (AC-19). */
export type GroupedCountsEnvelope = Omit<
  ContractProductEnvelope<unknown[]>,
  "total"
> & {
  data: unknown[];
  total: ICProdGroup[];
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
  /** `GET clients/{id}/contracts/products` grouped counts — the rows on `total` (AC-19). */
  groupedCounts: () =>
    getFixtureBody<GroupedCountsEnvelope>("get-clients-id-contracts-products", {
      recordingsDir
    }),
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
    ),
  /** `POST contracts/{id}/cancel/request` — a real 200 (AC-6, R33). The hard
   * cancellation moved from `useContract` to this module; its recorded capture
   * still lives beside the contract read that first recorded it. */
  cancellationRequested: () =>
    getFixtureBody<ContractProductEnvelope<Record<string, unknown>>>(
      "post-contracts-id-cancel-request",
      { recordingsDir: contractRecordingsDir }
    ),
  /** `GET custom_fields?filter[object_type]=contract_request` — the brand's
   * CANCEL_REQUEST custom-field catalogue, recorded beside the contract read.
   * This brand defines none: the recorded `data` is empty. */
  cancelRequestCatalogue: () =>
    getFixtureBody<ContractProductEnvelope<Record<string, unknown>[]>>(
      "get-custom-fields-brand-id-filter-object-type-contract-request",
      { recordingsDir: contractRecordingsDir }
    ),
  /** `DELETE contracts/{id}/cancel/request` — the REAL 404 this sandbox
   * answers the withdraw with (AC-7, R33). */
  withdrawRejected: () =>
    getFixture("delete-contracts-id-cancel-request", {
      recordingsDir: contractRecordingsDir
    })
};

/** The sibling contract module's recordings — the hard cancel/request POST and
 * withdraw DELETE captures the writes R33 moved here were recorded against. */
export const contractRecordingsDir = join(
  import.meta.dirname,
  "../../contract/__tests__/fixtures"
);

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

/**
 * Passively observes EVERY outbound request.
 *
 * @remarks The caller MUST call `stop()` — there is no automatic cleanup. An
 * `afterEach(stop)` registered here would be inert: this helper is invoked
 * from inside a test BODY, and a hook registered during execution is not
 * collected for the running test. The earlier version of this function
 * registered one anyway, which advertised a safety net it did not provide.
 */
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
  const stop = (): void =>
    server?.events.removeListener("request:start", listener);

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

/**
 * Serves the RECORDED CANCEL_REQUEST custom-field catalogue for every
 * `GET custom_fields?filter[object_type]=contract_request` request, and counts
 * the catalogue reads.
 */
export function installCancelRequestCatalogueHandler(
  mswServer: SetupServer | undefined
): { reads: () => number } {
  const envelope = recorded.cancelRequestCatalogue();
  let reads = 0;
  mswServer?.use(
    http.get("*/custom_fields", ({ request }) => {
      const objectType = new URL(request.url).searchParams.get(
        "filter[object_type]"
      );
      if (objectType !== "contract_request") return undefined;
      reads += 1;
      return HttpResponse.json(envelope, { status: 200 });
    })
  );
  return { reads: () => reads };
}
