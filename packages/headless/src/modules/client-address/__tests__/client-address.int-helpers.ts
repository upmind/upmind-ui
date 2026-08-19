// -----------------------------------------------------------------------------
/**
 * @module client-address/__tests__/client-address.int-helpers
 * @description Shared integration scaffolding for client-address's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests so the A7
 * read-backs (URL retarget + auth identity transport) assert on the real wire.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-address` against real staging — no test
 * builds a wire body of its own. Three documented capture limits are carried
 * at the call sites that hit them, and repeated in `client-address.fixtures.ts`:
 *   1. the API never returns `state` (it returns `county`), so AC-31's
 *      description order is asserted over the six components the wire really
 *      carries;
 *   2. `verified: null` is rejected by the API (`must be an integer`), so
 *      AC-32's two real values are `0` (every existing row) and `2` (the row
 *      this module's generator creates);
 *   3. this brand's config is `allow_address_update: true` /
 *      `required_region_in_address: false` and a client credential cannot
 *      change either — {@link installBrandConfigHandler} serves the opposite
 *      config by flipping the boolean inside the RECORDED envelope, declared
 *      as a boundary construction rather than presented as a recording.
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

/** One address as the recorded wire carries it (see `fixtures/*.json`). */
export type WireAddress = {
  id: string;
  client_id: string;
  name: string | null;
  type: number | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  region_id?: string | null;
  country_id: string;
  region?: { id: string; name: string; country_id: string } | null;
  country?: { id: string; name: string; code: string } | null;
  default: boolean;
  verified: number | null;
  can_delete: boolean;
  created_at: string | null;
};

/** One country / region row, as `/countries` and `/countries/{id}/regions` carry them. */
export type WireCountry = { id: string; name: string; code: string };
export type WireRegion = { id: string; country_id: string; name: string };

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * this module's generator wrote from staging — the single source of every
 * response these tests replay.
 */
export const recorded = {
  /** `GET clients/{id}/addresses?with=region,country&limit=0` — the production list. */
  list: () =>
    getFixtureBody<Envelope<WireAddress[]>>("get-clients-id-addresses", {
      recordingsDir
    }),
  /** The same list as answered to a request carrying the free-text filter (AC-8). */
  filtered: () =>
    getFixtureBody<Envelope<WireAddress[]>>(
      "get-clients-id-addresses-case-query-filter",
      { recordingsDir }
    ),
  /** `?limit=2&offset=0` — a real first page. */
  pageOne: () =>
    getFixtureBody<Envelope<WireAddress[]>>(
      "get-clients-id-addresses-case-page-1",
      { recordingsDir }
    ),
  /** `?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireAddress[]>>(
      "get-clients-id-addresses-case-page-2",
      { recordingsDir }
    ),
  /** `GET clients/{id}/addresses/{id}` — the per-address read the manager seeds from. */
  one: () =>
    getFixtureBody<Envelope<WireAddress>>("get-clients-id-addresses-id", {
      recordingsDir
    }),
  /** `POST clients/{id}/addresses` — the created record (`type: 3`, `verified: 2`). */
  created: () =>
    getFixtureBody<Envelope<WireAddress>>("post-clients-id-addresses", {
      recordingsDir
    }),
  /** `PUT clients/{id}/addresses/{id}` — the edited record (city only). */
  updated: () =>
    getFixtureBody<Envelope<WireAddress>>("put-clients-id-addresses-id", {
      recordingsDir
    }),
  /** `PUT clients/{id}/addresses/{id}` `{default:true}` — the 200. */
  defaulted: () =>
    getFixtureBody<Envelope<WireAddress>>(
      "put-clients-id-addresses-id-case-set-default",
      { recordingsDir }
    ),
  /** The real 422 staging answers for a set-default naming an unknown address. */
  defaultRejected: () =>
    getFixture("put-clients-id-addresses-id-case-set-default-rejected", {
      recordingsDir
    }),
  /** `DELETE clients/{id}/addresses/{id}`. */
  removed: () =>
    getFixtureBody<Envelope<null>>("delete-clients-id-addresses-id", {
      recordingsDir
    }),
  /** The real 409 staging answers for deleting a row it refuses to delete. */
  removeRejected: () =>
    getFixture("delete-clients-id-addresses-id-case-remove-rejected", {
      recordingsDir
    }),
  /** `GET /countries` (AC-18). */
  countries: () =>
    getFixtureBody<Envelope<WireCountry[]>>("get-countries", { recordingsDir }),
  /** `GET /countries/{id}/regions` for country A (AC-19). */
  regionsA: () =>
    getFixtureBody<Envelope<WireRegion[]>>(
      "get-countries-id-regions-case-country-a",
      { recordingsDir }
    ),
  /** `GET /countries/{id}/regions` for country B — DISJOINT from A (AC-19). */
  regionsB: () =>
    getFixtureBody<Envelope<WireRegion[]>>(
      "get-countries-id-regions-case-country-b",
      { recordingsDir }
    ),
  /** `GET /config/brand/values` — REQUIRE_REGION_IN_ADDRESS + CLIENT_ALLOW_ADDRESS_UPDATE. */
  brandConfig: () =>
    getFixtureBody<Envelope<Record<string, boolean>>>(
      "get-config-brand-values",
      { recordingsDir }
    )
};

/**
 * The two REAL rows most suites build a multi-row collection from: the
 * account's own current default and a non-default row — both verbatim
 * recordings from {@link recorded.list}.
 */
export function recordedRows(): {
  primary: WireAddress;
  secondary: WireAddress;
} {
  const rows = recorded.list().data;
  return {
    primary: rows.find(row => row.default) ?? rows[0],
    secondary: rows.find(row => !row.default) ?? rows[1]
  };
}

/**
 * A recorded row carrying every description ingredient the wire really has —
 * both address lines, a city, a postcode, an expanded region AND an expanded
 * country. AC-31 reads its order back from this row rather than from whichever
 * row happens to be first.
 */
export function recordedRowWithFullAddress(): WireAddress {
  const found = recorded
    .list()
    .data.find(
      row =>
        row.address_1 &&
        row.address_2 &&
        row.city &&
        row.postcode &&
        row.region?.name &&
        row.country?.name
    );
  if (!found) {
    throw new Error(
      "No recorded address row carries both lines, a city, a postcode, a " +
        "region and a country — AC-31's ordering assertion has nothing real " +
        "to read back. Re-record with `pnpm fixtures:generate client-address`."
    );
  }
  return found;
}

// -----------------------------------------------------------------------------

/**
 * Background bootstrap calls unrelated to any AC (brand/org config,
 * `useSystem()`'s billing-cycles query) fire as a side effect of `initStore()`;
 * stub them harmlessly so they never surface as noise against a suite scoped to
 * client-address. Re-applied on every seed — the replay server's own
 * `afterEach` resets handlers between tests.
 *
 * `billing_cycles` carries no client-address AC — no scenario reads it — so an
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

/**
 * Every live scope key this module currently holds. Discovered from the
 * registry rather than asserted from a namespace constant: the key format is
 * `<name>:<actor>[:<context>:<id>][:fresh:N]` (`scope.utils.ts`), and both of
 * this module's composables are the only registrants that carry `address`.
 */
export function clientAddressScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => /address/i.test(key));
}

/**
 * Evict every client-address scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack query
 * cache are separate lifetimes — dropping the entry alone leaves a new instance
 * free to serve the PREVIOUS test's cached list, so the shared cache is cleared
 * too. The brand-config store is a THIRD, append-only lifetime of its own
 * (`useBrand`'s module singleton never re-fetches a key it already holds) —
 * left uninvalidated, the `ensureConfig` assertions are a cache hit in every
 * test after the first in file order rather than a real fetch.
 */
export function resetClientAddressScopes(): void {
  for (const key of clientAddressScopeKeys()) remove(key);
  queryClient.clear();
  useBrand().invalidate();
}

// -----------------------------------------------------------------------------

/**
 * The OAuth token + `/self` bodies are session-store's OWN captures (same
 * actor), never asserted on here — used only to seed a real client session,
 * exactly as the sibling modules' int-helpers reuse them.
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
  resetClientAddressScopes();
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
 * constructed departure is the absent actor id — the boundary itself, declared
 * here rather than dressed up as a recording.
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientAddressScopes();
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

/** Logs out any active client session, settling on the guest floor. */
export async function logoutClientSession(): Promise<void> {
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  resetClientAddressScopes();
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
}

/**
 * Moves the ACTIVE session onto a different client id mid-flight, without
 * tearing down any open scope — the identity change AC-30 asserts an
 * already-resolved scope survives. Resets no registry entry and clears no
 * cache: the instance under test has to outlive the transition for the
 * transition to be observable at all.
 *
 * The token and `/self` body are the recorded ones; the single constructed
 * departure is the actor id, which is the boundary itself. Declared here
 * rather than dressed up as a recording — no capture reaches it, because a
 * recording of this client always carries this client's id.
 */
export async function switchActiveClientId(clientId: string): Promise<void> {
  const { clientToken, selfBody } = recordedClientCredentials();

  await useSessionStore()
    .useActions()
    .add(
      clientToken,
      true,
      mapSessionUser({
        ...selfBody.data,
        actor_id: clientId,
        actor: { ...selfBody.data.actor, id: clientId }
      } as never)
    );

  await vi.waitFor(() =>
    expect(useActiveSession().useContext().activeUser.value?.id).toBe(clientId)
  );
}

// -----------------------------------------------------------------------------

/** One observed outbound request. */
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/**
 * Passively observes every request whose URL contains `/addresses`. Passive (an
 * MSW `request:start` listener) rather than an override handler, so it never
 * races the fixture replay for the same route.
 */
export function observeAddressRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
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
    matching: (fragment: string) =>
      seen.filter(entry => entry.url.includes(fragment)),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/**
 * Passively observes EVERY outbound request regardless of resource — used by
 * the guard specs, which need to prove silence across every surface at once
 * (addresses, countries, regions, config), not just the one they expect.
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

// -----------------------------------------------------------------------------

/**
 * Serves a MUTABLE collection from `GET clients/{clientId}/addresses`, wrapped
 * in the RECORDED list envelope, so a mutation's "the list refetches"
 * post-effect is observed through a real subsequent GET rather than assumed.
 * `setRows` changes what the next read returns — the server-side effect the
 * replay harness stands in for.
 */
export function installAddressesListHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  initialRows: WireAddress[],
  options?: { total?: number }
): {
  setRows: (rows: WireAddress[]) => void;
  getRows: () => WireAddress[];
  reads: () => number;
} {
  const envelope = recorded.list();
  let rows = initialRows;
  let reads = 0;

  mswServer?.use(
    http.get(`*/clients/${clientId}/addresses`, () => {
      reads += 1;
      return HttpResponse.json(
        { ...envelope, data: rows, total: options?.total ?? rows.length },
        { status: 200 }
      );
    })
  );

  return {
    setRows: (next: WireAddress[]) => {
      rows = next;
    },
    getRows: () => rows,
    reads: () => reads
  };
}

/**
 * Serves ONE chosen recorded row from `GET clients/{clientId}/addresses/{id}`,
 * wrapped in the RECORDED single-read envelope. The fixture pool's own matcher
 * answers every per-address read with the one capture on disk, so a test that
 * needs the manager seeded from a SPECIFIC row installs this.
 */
export function installAddressHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  row: WireAddress
): { reads: () => number } {
  const envelope = recorded.one();
  let reads = 0;

  mswServer?.use(
    http.get(`*/clients/${clientId}/addresses/${row.id}`, () => {
      reads += 1;
      return HttpResponse.json({ ...envelope, data: row }, { status: 200 });
    })
  );

  return { reads: () => reads };
}

/**
 * Serves the two RECORDED pages of a `limit=2` walk, chosen by the request's
 * own `offset` — so a caller-supplied page size is answered by the API's real
 * page-1 and page-2 bodies. Neither the collection size nor the page boundary
 * is staged here; both are what staging returned to `?limit=2&offset=0` /
 * `&offset=2`.
 */
export function installPagedAddressesHandler(
  mswServer: SetupServer | undefined,
  clientId: string
): { offsets: () => string[]; limits: () => string[] } {
  const pageOne = recorded.pageOne();
  const pageTwo = recorded.pageTwo();
  const offsets: string[] = [];
  const limits: string[] = [];

  mswServer?.use(
    http.get(`*/clients/${clientId}/addresses`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      offsets.push(params.get("offset") ?? "0");
      limits.push(params.get("limit") ?? "");
      return HttpResponse.json(
        (params.get("offset") ?? "0") === "0" ? pageOne : pageTwo,
        { status: 200 }
      );
    })
  );

  return { offsets: () => offsets, limits: () => limits };
}

/**
 * Serves `GET /config/brand/values` from the RECORDED envelope with the named
 * keys overridden.
 *
 * **Declared boundary construction, not a recording.** This brand answers
 * `allow_address_update: true` / `required_region_in_address: false`, and a
 * client credential cannot change either — so the opposite-config states
 * (AC-20's required region, AC-21's locked country) have no leg on staging
 * that can produce them. The envelope, its status and every other key stay
 * verbatim from the capture; only the named booleans are flipped, and the
 * flip is what the caller is asserting about. Same shape as
 * `client-company.int-helpers`' zero-row list override.
 */
export function installBrandConfigHandler(
  mswServer: SetupServer | undefined,
  overrides: Record<string, boolean>
): { keys: () => string[] } {
  const envelope = recorded.brandConfig();
  const keys: string[] = [];

  mswServer?.use(
    http.get("*/config/brand/values", ({ request }) => {
      const requested = new URL(request.url).searchParams.get("keys");
      if (requested) keys.push(...requested.split(","));
      return HttpResponse.json(
        { ...envelope, data: { ...envelope.data, ...overrides } },
        { status: 200 }
      );
    })
  );

  return { keys: () => keys };
}

/**
 * Serves the countries lookup plus BOTH recorded region sets, each answered for
 * its own country id, and reports which country ids were asked for — the
 * read-back AC-19's "changing the country fetches that country's regions" needs.
 */
export function installLookupHandlers(mswServer: SetupServer | undefined): {
  regionRequests: () => string[];
} {
  const countries = recorded.countries();
  const regionsA = recorded.regionsA();
  const regionsB = recorded.regionsB();
  const asked: string[] = [];

  mswServer?.use(
    http.get("*/countries", () =>
      HttpResponse.json(countries, { status: 200 })
    ),
    http.get("*/countries/:countryId/regions", ({ params }) => {
      const countryId = String(params.countryId);
      asked.push(countryId);
      return HttpResponse.json(
        countryId === regionCountryId(regionsB) ? regionsB : regionsA,
        { status: 200 }
      );
    })
  );

  return { regionRequests: () => asked };
}

/** The country a recorded region set belongs to — read from the rows themselves. */
export function regionCountryId(regions: Envelope<WireRegion[]>): string {
  const countryId = regions.data[0]?.country_id;
  if (!countryId) {
    throw new Error(
      "A recorded region capture carries no rows — AC-19 cannot tell the two " +
        "countries apart. Re-record with `pnpm fixtures:generate client-address`."
    );
  }
  return countryId;
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
  expect(observed.url).toContain(`/clients/${clientId}/addresses`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}
