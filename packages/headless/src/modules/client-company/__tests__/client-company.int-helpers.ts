// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.int-helpers
 * @description Shared integration scaffolding for client-company's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests so the A7
 * read-backs (URL retarget + auth identity transport) assert on the real wire.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-company` against real staging — no test
 * builds a wire body of its own. Two documented capture limits (NFR-2, no
 * fabrication) are carried at the call sites that hit them:
 *   1. this brand has tax-number validation switched OFF and no company on
 *      the account carries a validated VAT number — the "brand has it ON" /
 *      "a validated VAT number" sub-cases are `it.skip`ped where they occur;
 *   2. this staging client already holds ten real companies — the "empty
 *      collection" state is served by an MSW override carrying zero rows of
 *      the recorded shape (the same "server's own post-effect, replayed"
 *      pattern client-email's `installEmailsListHandler([])` already uses).
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
export type Envelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
  messages: unknown;
  meta: unknown;
};

/** One company as the recorded wire carries it (see `fixtures/*.json`). */
export type WireCompany = {
  id: string;
  name: string;
  default: boolean;
  verified: number | boolean;
  can_delete: boolean;
  vat_number: string | null;
  vat_validated: boolean | null;
  vat_validation_failed_reason: string | null;
  vat_validation_checked_at: string | null;
  vat_validated_with: string | null;
  vat_percent: number | null;
  reg_number: string | null;
  address_id: string | null;
  email_id: string | null;
  phone_id: string | null;
  created_at: string;
};

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * this module's generator wrote from staging — the single source of every
 * response these tests replay.
 */
export const recorded = {
  /** `GET clients/{id}/companies` — the real production shape (ascending order, with_staged_imports=1). */
  list: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-with-staged-imports-1",
      { recordingsDir }
    ),
  /** `GET clients/{id}/companies?order=-created_at` — a REAL raw dump NOT already ascending (AC-8). */
  orderCheck: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-case-order-check",
      { recordingsDir }
    ),
  /** `GET clients/{id}/companies?limit=2&offset=0` — a real first page. */
  pageOne: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-case-page-1",
      { recordingsDir }
    ),
  /** `GET clients/{id}/companies?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-case-page-2",
      { recordingsDir }
    ),
  /** `GET clients/{id}/companies/{id}` — the per-company read the manager seeds from. */
  one: () =>
    getFixtureBody<Envelope<WireCompany & Record<string, unknown>>>(
      "get-clients-id-companies-id",
      { recordingsDir }
    ),
  /** `POST clients/{id}/companies` — the created record. */
  created: () =>
    getFixtureBody<Envelope<WireCompany>>("post-clients-id-companies", {
      recordingsDir
    }),
  /** `PUT clients/{id}/companies/{id}` — the edited record (name only). */
  updated: () =>
    getFixtureBody<Envelope<WireCompany>>("put-clients-id-companies-id", {
      recordingsDir
    }),
  /** `PUT clients/{id}/companies/{id}` `{default:true}` — the 200. */
  defaulted: () =>
    getFixtureBody<Envelope<WireCompany>>(
      "put-clients-id-companies-id-case-set-default",
      { recordingsDir }
    ),
  /** The real 422 staging answers for an update naming an unknown `address_id`. */
  updateRejected: () =>
    getFixture("put-clients-id-companies-id-case-update-rejected", {
      recordingsDir
    }),
  /** `DELETE clients/{id}/companies/{id}`. */
  removed: () =>
    getFixtureBody<Envelope<null>>("delete-clients-id-companies-id", {
      recordingsDir
    }),
  /** `GET clients/{id}/addresses` — the manager's sibling lookup (AC-16). */
  addresses: () =>
    getFixtureBody<Envelope<Record<string, unknown>[]>>(
      "get-clients-id-addresses",
      { recordingsDir }
    ),
  /** `GET clients/{id}/emails` — the manager's sibling lookup (AC-16). */
  emails: () =>
    getFixtureBody<Envelope<Record<string, unknown>[]>>(
      "get-clients-id-emails",
      { recordingsDir }
    ),
  /** `GET clients/{id}/phones` — the manager's sibling lookup (AC-16). */
  phones: () =>
    getFixtureBody<Envelope<Record<string, unknown>[]>>(
      "get-clients-id-phones",
      { recordingsDir }
    ),
  /** `POST clients/{id}/emails` — an inline dependency create (AC-20/C26). */
  inlineEmailCreated: () =>
    getFixtureBody<Envelope<Record<string, unknown>>>(
      "post-clients-id-emails",
      {
        recordingsDir
      }
    ),
  /** `GET /countries` (AC-16/AC-17). */
  countries: () =>
    getFixtureBody<Envelope<{ id: string; name: string }[]>>("get-countries", {
      recordingsDir
    }),
  /** `GET /countries/{id}/regions` for country A (AC-17). */
  regionsA: () =>
    getFixtureBody<
      Envelope<{ id: string; country_id: string; name: string }[]>
    >("get-countries-id-regions-case-country-a", { recordingsDir }),
  /** `GET /countries/{id}/regions` for country B — DISJOINT from A (AC-17). */
  regionsB: () =>
    getFixtureBody<
      Envelope<{ id: string; country_id: string; name: string }[]>
    >("get-countries-id-regions-case-country-b", { recordingsDir }),
  /** `GET /config/brand/values` — TAX_NUMBER_VALIDATION_ENABLED + REQUIRE_REGION_IN_ADDRESS (AC-2/AC-7/AC-16). */
  brandConfig: () =>
    getFixtureBody<
      Envelope<{
        "price_tax.tax.enable_automatic_vat_validation": boolean;
        "invoices.common.required_region_in_address": boolean;
      }>
    >("get-config-brand-values", { recordingsDir }),
  /** `GET clients/{id}/companies?filter[name|like]=%Heg%&limit=2` — the REAL narrowed read (AC-7/AC-34). */
  nameFilterHeg: () =>
    getFixtureBody<Envelope<WireCompany[]>>(
      "get-clients-id-companies-case-name-like-filter-name-like-heg",
      { recordingsDir }
    )
};

/** The recorded needle {@link recorded.nameFilterHeg} narrows on — proven against the real corpus (AC-7/AC-34). */
export const RECORDED_NAME_NEEDLE = "Heg";

/**
 * The two REAL rows most suites build a multi-row collection from: the
 * account's own current default and a non-default row — both verbatim
 * recordings from {@link recorded.list}.
 */
export function recordedRows(): {
  primary: WireCompany;
  secondary: WireCompany;
} {
  const rows = recorded.list().data;
  return {
    primary: rows.find(row => row.default) ?? rows[0],
    secondary: rows.find(row => !row.default) ?? rows[1]
  };
}

// -----------------------------------------------------------------------------

/**
 * Background bootstrap calls unrelated to any AC (brand/org config,
 * `useSystem()`'s billing-cycles query) fire as a side effect of
 * `initStore()`; stub them harmlessly so they never surface as noise against a
 * suite scoped to client-company. Re-applied on every seed — the replay
 * server's own `afterEach` resets handlers between tests.
 *
 * `billing_cycles` carries no client-company AC — no scenario reads it — so an
 * empty-list stub is the same class of noise-suppression as the other three
 * here, not a recorded-data substitute. Left unstubbed, this module's
 * `fixtures/` pool has no capture for it, the shared `useSystem()` singleton's
 * query never settles, and every downstream readiness wait blocks forever.
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

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-company";

/** Every live scope key this module currently holds in the registry. */
export function clientCompanyScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-company scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack query
 * cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached list, so the shared cache
 * is cleared too. The brand-config store is a THIRD, append-only lifetime of
 * its own (`useBrand`'s module singleton never re-fetches a key it already
 * holds) — left uninvalidated, AC-2/C7's `ensureConfig` assertion is a cache
 * hit in every test after the first in file order rather than a real fetch.
 */
export function resetClientCompanyScopes(): void {
  for (const key of clientCompanyScopeKeys()) remove(key);
  queryClient.clear();
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

/**
 * D2 input material: the OAuth token + `/self` bodies are session-store's OWN
 * captures (same actor), never asserted on here — used only to seed a real
 * client session, exactly as the sibling bundle's own int-helpers reuse them.
 */
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

/** The recorded client token + `/self` body every seed below starts from. */
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
  resetClientCompanyScopes();
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
 * Seeds a session that AUTHENTICATES but resolves NO client id — the second
 * limb of the addressability predicate, and the only state that tells
 * `isAvailable` apart from a plain `isAuthenticated` alias.
 *
 * No recorded capture reaches it: the client capture always carries an actor
 * id. So the token and the `/self` body are the recorded ones and the single
 * constructed departure is the absent actor id — the boundary itself,
 * declared here rather than dressed up as a recording.
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientCompanyScopes();
  installBackgroundStubs();
  installGuestTokenStub();

  const { clientToken, selfBody } = recordedClientCredentials();

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(
      clientToken,
      true,
      mapSessionUser({
        ...selfBody.data,
        actor_id: undefined,
        actor: { ...selfBody.data.actor, id: undefined }
      } as never)
    );

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });
}

/**
 * Lands the RECORDED client id on the session
 * `seedAuthenticatedSessionWithoutClientId` left unresolved — the second limb
 * of the addressability predicate resolving while a scope is already open.
 * Resets no scope and clears no cache: the instance under test has to survive
 * the transition for the transition to be observable at all.
 */
export async function resolveClientIdOnActiveSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  const { clientToken, selfBody } = recordedClientCredentials();

  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody.data as never));

  await vi.waitFor(() =>
    expect(useActiveSession().useContext().activeUser.value?.id).toBe(
      selfBody.data.actor.id
    )
  );

  return {
    clientId: selfBody.data.actor.id,
    accessToken: clientToken.access_token
  };
}

/** Logs out any active client session, settling on the guest floor. */
export async function logoutClientSession(): Promise<void> {
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  resetClientCompanyScopes();
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
}

// -----------------------------------------------------------------------------

/** One observed outbound request. */
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/**
 * Passively observes every request whose URL contains `/companies`. Passive
 * (an MSW `request:start` listener) rather than an override handler, so it
 * never races the fixture replay for the same route.
 */
export function observeCompanyRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  /** The named search param off the MOST RECENT observed request, or `null`. */
  lastParam: (key: string) => string | null;
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/companies")) return;
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
    matching: (fragment: string) =>
      seen.filter(entry => entry.url.includes(fragment)),
    lastParam: (key: string) => {
      const latest = seen.at(-1);
      return latest ? new URL(latest.url).searchParams.get(key) : null;
    },
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/**
 * Passively observes EVERY outbound request regardless of resource — used by
 * the whole-module guard specs, which need to prove silence across both
 * surfaces (companies, addresses, emails, phones, countries, regions, config)
 * at once.
 */
export function observeAllRequests(): {
  all: () => ObservedRequest[];
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
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

/**
 * Serves a MUTABLE collection from `GET clients/{clientId}/companies`, wrapped
 * in the RECORDED list envelope, so a mutation's "the list refetches"
 * post-effect is observed through a real subsequent GET rather than assumed.
 * `setRows` changes what the next read returns — the server-side effect the
 * replay harness stands in for. Passing `[]` serves the genuinely-empty state
 * this staging client cannot itself produce (NFR-2 capture limit #2, header).
 */
export function installCompaniesListHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  initialRows: WireCompany[],
  options?: { total?: number }
): {
  setRows: (rows: WireCompany[]) => void;
  getRows: () => WireCompany[];
  reads: () => number;
} {
  const envelope = recorded.list();
  let rows = initialRows;
  let reads = 0;

  mswServer?.use(
    http.get(`*/clients/${clientId}/companies`, () => {
      reads += 1;
      return HttpResponse.json(
        { ...envelope, data: rows, total: options?.total ?? rows.length },
        { status: 200 }
      );
    })
  );

  return {
    setRows: (next: WireCompany[]) => {
      rows = next;
    },
    getRows: () => rows,
    reads: () => reads
  };
}

/**
 * Serves the two RECORDED pages of a `limit=2` walk, chosen by the request's
 * own `offset` — so a caller-supplied page size is answered by the API's real
 * page-1 and page-2 bodies. Neither the collection size nor the page boundary
 * is staged here; both are what staging returned to
 * `?limit=2&offset=0` / `&offset=2`.
 */
export function installPagedCompaniesHandler(
  mswServer: SetupServer | undefined,
  clientId: string
): { offsets: () => string[] } {
  const pageOne = recorded.pageOne();
  const pageTwo = recorded.pageTwo();
  const offsets: string[] = [];

  mswServer?.use(
    http.get(`*/clients/${clientId}/companies`, ({ request }) => {
      const offset = new URL(request.url).searchParams.get("offset") ?? "0";
      offsets.push(offset);
      return HttpResponse.json(offset === "0" ? pageOne : pageTwo, {
        status: 200
      });
    })
  );

  return { offsets: () => offsets };
}

/**
 * Serves the RECORDED unfiltered list by default, and the RECORDED narrowed
 * `filter[name|like]=%Heg%` capture the moment a request's own params carry
 * that exact key — a genuine server-side re-query, not a client-side slice,
 * so a no-op `filterBy` implementation cannot pass (AC-7/AC-34).
 */
export function installCompaniesSearchHandler(
  mswServer: SetupServer | undefined,
  clientId: string
): void {
  const unfiltered = recorded.list();
  const narrowed = recorded.nameFilterHeg();

  mswServer?.use(
    http.get(`*/clients/${clientId}/companies`, ({ request }) => {
      const filtered =
        new URL(request.url).searchParams.get("filter[name|like]") !== null;
      return HttpResponse.json(filtered ? narrowed : unfiltered, {
        status: 200
      });
    })
  );
}

/**
 * Serves the REAL descending dump for AC-8's "raw order is NOT already
 * ascending" material, regardless of the `order` value the request under test
 * actually sends.
 */
export function installOrderCheckHandler(
  mswServer: SetupServer | undefined,
  clientId: string
): void {
  const body = recorded.orderCheck();
  mswServer?.use(
    http.get(`*/clients/${clientId}/companies`, () =>
      HttpResponse.json(body, { status: 200 })
    )
  );
}

// -----------------------------------------------------------------------------

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

/**
 * The full A7 identity read-back for one observed request: the URL is the
 * SCOPE-resolved client's own resource, the token is that client session's,
 * and no acting-as header is present.
 */
export function assertClientIdentityTransport(
  observed: ObservedRequest,
  clientId: string,
  accessToken: string
): void {
  expect(observed.url).toContain(`/clients/${clientId}/companies`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}
