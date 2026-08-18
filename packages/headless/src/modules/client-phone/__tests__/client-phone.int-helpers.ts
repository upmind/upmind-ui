// -----------------------------------------------------------------------------
/**
 * @module client-phone/__tests__/client-phone.int-helpers
 * @description Shared integration scaffolding for client-phone's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests so the read-back
 * discipline (`verify-reality-check.companion.md`) asserts on the real wire —
 * the request URL retarget and the auth identity transport, never the
 * response payload alone.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-phone` against real staging — no test builds
 * a wire body of its own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
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

/** One phone as the recorded wire carries it (see `fixtures/*.json`). */
export type WirePhone = {
  id: string;
  client_id: string;
  type: number;
  default: boolean;
  verified: boolean | number;
  phone: string;
  phone_code: string;
  phone_country_code: string;
  international_phone: string;
  full_phone: string;
  can_delete: boolean;
  staged_import?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * this module's generator wrote from staging — the single source of every
 * response these tests replay.
 */
export const recorded = {
  /** `GET clients/{id}/phones` — the account's real collection (12 rows). */
  list: () =>
    getFixtureBody<Envelope<WirePhone[]>>("get-clients-id-phones", {
      recordingsDir
    }),
  /** `GET clients/{id}/phones/{id}` — the manager's per-record read (loadOne). */
  one: () =>
    getFixtureBody<Envelope<WirePhone>>("get-clients-id-phones-id", {
      recordingsDir
    }),
  /** `GET clients/{id}/phones?limit=2&offset=0` — a real first page of the walk. */
  pageOne: () =>
    getFixtureBody<Envelope<WirePhone[]>>("get-clients-id-phones-case-page-1", {
      recordingsDir
    }),
  /** `GET clients/{id}/phones?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WirePhone[]>>("get-clients-id-phones-case-page-2", {
      recordingsDir
    }),
  /** `POST clients/{id}/phones` — the created record. */
  created: () =>
    getFixtureBody<Envelope<WirePhone>>("post-clients-id-phones", {
      recordingsDir
    }),
  /** `PUT clients/{id}/phones/{id}` — the edited record. */
  updated: () =>
    getFixtureBody<Envelope<WirePhone>>("put-clients-id-phones-id", {
      recordingsDir
    }),
  /** `PUT clients/{id}/phones/{id}` `{default:true}` — the 200. */
  defaulted: () =>
    getFixtureBody<Envelope<WirePhone>>(
      "put-clients-id-phones-id-case-set-default",
      { recordingsDir }
    ),
  /** The real 422 staging answers for a set-default against a non-existent phone id (AC-9). */
  defaultRejected: () =>
    getFixture("put-clients-id-phones-id-case-error", { recordingsDir }),
  /** `DELETE clients/{id}/phones/{id}`. */
  removed: () =>
    getFixtureBody<Envelope<null>>("delete-clients-id-phones-id", {
      recordingsDir
    }),
  /** `GET /countries` — `loadLookups`'s country resolution. */
  countries: () =>
    getFixtureBody<Envelope<Array<{ id: string; code: string; name: string }>>>(
      "get-countries",
      { recordingsDir }
    )
};

/**
 * The two REAL records these suites build a multi-row collection from: the
 * account's own default (row 0 of the recorded list) and the record the
 * capture run created and edited (the `one` capture). Both verbatim
 * recordings — see AC-2's literal default/non-deletable/unverified
 * combination note in `client-phone.mappers.test.ts`: this account's real
 * data holds no `can_delete:false` row, so that one field is built by
 * OVERRIDING a recorded row, never by hand-writing a wire body.
 */
export function recordedRows(): { primary: WirePhone; secondary: WirePhone } {
  return {
    primary: recorded.list().data[0],
    secondary: recorded.one().data
  };
}

// -----------------------------------------------------------------------------

/**
 * The manager's `loadLookups` reaches `useSystem().ensureCountries() ->
 * ensureBrandReady() -> useBrand().isReady()` before it ever fetches
 * `/countries`, so all FOUR of these must settle with a genuinely usable body
 * — an empty-object stub is not enough: `useSystem().getCountry()` reads
 * `brand/settings`'s `country_id` as its default-country fallback, and a
 * missing/unresolvable `country_id` throws inside `loadLookups`, landing the
 * machine in `unavailable` and hanging every `isReady()` caller (diagnosed
 * against this suite directly — see the Test-stage gate notes). Every body
 * below is the RECORDED response `pnpm fixtures:generate client-phone`
 * captured against real staging (`get-org-modules.json`,
 * `get-brand-settings.json`, `get-config-brand-values-*.json`,
 * `get-config-organisation-values-*.json`) — none is hand-authored.
 *
 * `brand/settings` is served UNMODIFIED — its real captured `country_id` is
 * this brand's actual default country, United Kingdom (`GB`). See
 * `countriesWithGb()` for why `/countries` needs a second capture to resolve
 * it.
 */
export function installBackgroundStubs(): void {
  const modules = getFixtureBody<Envelope<unknown>>("get-org-modules", {
    recordingsDir
  });
  const brandSettings = getFixtureBody<Envelope<{ country_id?: string }>>(
    "get-brand-settings",
    { recordingsDir }
  );
  const brandConfig = getFixtureBody<Envelope<unknown>>(
    "get-config-brand-values-keys-ui-basket-default-currency",
    { recordingsDir }
  );
  const organisationConfig = getFixtureBody<Envelope<unknown>>(
    "get-config-organisation-values-keys-package-enabled-features-product-provisioning",
    { recordingsDir }
  );

  server?.use(
    http.get("*/org/modules", () => HttpResponse.json(modules)),
    http.get("*/config/brand/values", () => HttpResponse.json(brandConfig)),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json(organisationConfig)
    ),
    http.get("*/brand/settings", () => HttpResponse.json(brandSettings)),
    http.get("*/countries", () => HttpResponse.json(countriesWithGb()))
  );
}

/**
 * `get-countries.json` (one of the 10 pre-existing, do-not-touch fixtures)
 * was itself captured without the `limit=0` production always sends, so it
 * holds only the API's default 10-row page (of 248 total, alphabetically
 * first — see its `total` field) — a capture-fidelity gap in that fixture,
 * not something this seat is authorised to fix by re-capturing it. This
 * brand's real default country is `GB` (see `installBackgroundStubs`'s
 * unmodified `brand/settings`), which the truncated page does not contain, so
 * `useSystem().getCountry()`'s default-country fallback cannot resolve it —
 * exactly the crash this suite hit before this fixture existed.
 *
 * `get-countries-filter-code-gb.json` is a SEPARATE, additively-captured
 * fixture (identity `GET countries?filter[code]=GB`, never matched by a real
 * `limit=0` production request — see its own capture note) holding the one
 * genuinely recorded row this replay is missing. This merges that recorded
 * row into the recorded 10-row list for the harness only; the original
 * `get-countries.json` file on disk is untouched, and no field is
 * hand-authored — both arrays merged here are real captures.
 */
export function countriesWithGb(): Envelope<
  Array<{ id: string; code: string; name: string }>
> {
  const base = recorded.countries();
  const gb = getFixtureBody<
    Envelope<Array<{ id: string; code: string; name: string }>>
  >("get-countries-filter-code-gb", { recordingsDir });

  return {
    ...base,
    data: [...base.data, ...gb.data],
    total: (base.total ?? base.data.length) + gb.data.length
  };
}

// -----------------------------------------------------------------------------

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-phone";

/** Every live scope key this module currently holds in the registry. */
export function clientPhoneScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-phone scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached list, so the shared cache
 * is cleared too.
 */
export function resetClientPhoneScopes(): void {
  for (const key of clientPhoneScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

/**
 * D2 input material: the OAuth token + `/self` bodies are session-store's OWN
 * captures (same actor), never asserted on here — used only to seed a real
 * client session, exactly as `client-email.int-helpers.ts` reuses them.
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
  resetClientPhoneScopes();
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
 * id, so the token and the `/self` body are the recorded ones and the single
 * constructed departure is the absent actor id — the boundary itself,
 * declared here rather than dressed up as a recording.
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientPhoneScopes();
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
 * of the addressability predicate resolving while a collection is already
 * open. Resets no scope and clears no cache: the instance under test has to
 * survive the transition for the transition to be observable at all.
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
  resetClientPhoneScopes();
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
 * Passively observes every request whose URL contains `/phones`. Passive (an
 * MSW `request:start` listener) rather than an override handler, so it never
 * races the fixture replay for the same route.
 */
export function observePhoneRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/phones")) return;
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
 * Serves a MUTABLE collection from `GET clients/{clientId}/phones`, wrapped in
 * the RECORDED list envelope, so a mutation's "the list refetches" post-effect
 * is observed through a real subsequent GET rather than assumed. `setRows`
 * changes what the next read returns — the server-side effect the replay
 * harness stands in for.
 */
export function installPhonesListHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  initialRows: WirePhone[],
  options?: { total?: number }
): {
  setRows: (rows: WirePhone[]) => void;
  getRows: () => WirePhone[];
  reads: () => number;
} {
  const envelope = recorded.list();
  let rows = initialRows;
  let reads = 0;

  mswServer?.use(
    http.get(`*/clients/${clientId}/phones`, () => {
      reads += 1;
      return HttpResponse.json(
        { ...envelope, data: rows, total: options?.total ?? rows.length },
        { status: 200 }
      );
    })
  );

  return {
    setRows: (next: WirePhone[]) => {
      rows = next;
    },
    getRows: () => rows,
    reads: () => reads
  };
}

/**
 * Serves the two RECORDED pages of a `limit=2` walk, chosen by the request's
 * own `offset` — so a caller-supplied page size is answered by the API's real
 * page-1 and page-2 bodies, `total: 12` included. Neither the collection size
 * nor the page boundary is staged here; both are what staging returned to
 * `?limit=2&offset=0` / `&offset=2`.
 */
export function installPagedPhonesHandler(
  mswServer: SetupServer | undefined,
  clientId: string
): { offsets: () => string[] } {
  const pageOne = recorded.pageOne();
  const pageTwo = recorded.pageTwo();
  const offsets: string[] = [];

  mswServer?.use(
    http.get(`*/clients/${clientId}/phones`, ({ request }) => {
      const offset = new URL(request.url).searchParams.get("offset") ?? "0";
      offsets.push(offset);
      return HttpResponse.json(offset === "0" ? pageOne : pageTwo, {
        status: 200
      });
    })
  );

  return { offsets: () => offsets };
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
 * The full identity read-back for one observed request
 * (`verify-reality-check.companion.md`): the URL is the SCOPE-resolved
 * client's own resource, the token is that client session's, and no
 * acting-as header is present. This module's only live cell is `client ×
 * self`, so this is the narrower, still-mandatory pair `requirements.md` §4
 * names — not a `.for('client', id)` retarget.
 */
export function assertClientIdentityTransport(
  observed: ObservedRequest,
  clientId: string,
  accessToken: string
): void {
  expect(observed.url).toContain(`/clients/${clientId}/phones`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}
