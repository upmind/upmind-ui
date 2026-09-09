// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/__tests__/client-billing-settings.int-helpers
 * @description Shared integration scaffolding for this module's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's TWO scope-registry namespaces between tests
 * (`client-billing-settings` and `client-billing-settings-manager`), expose
 * the RECORDED wire bodies every handler serves, and capture outbound
 * requests so the A7 read-backs (URL retarget + auth identity transport)
 * assert on the real wire.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-billing-settings` against real staging, or
 * (for the session bootstrap only) from `session-store`'s own captures — no
 * test in this module builds a wire body of its own.
 *
 * This module's ONE resolving actor is `ScopeActorTypes.CLIENT` (design.md
 * §4.2 — `SELF` is `null as never` here, unlike `client-personal-details`).
 * `.as(ScopeActorTypes.CLIENT)` with no `.for()` resolves to the session's
 * OWN client id via the `resolveClientId` seam (design.md §5.1).
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
import type { IClient, IToken } from "@upmind-automation/types";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

export type Envelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
  messages: unknown;
  meta: unknown;
};

export type BrandValuesEnvelope = Envelope<{
  "invoices.consolidation.restrict_to_staff": boolean;
}>;

export type BrandGatesEnvelope = Envelope<{
  "invoices.consolidation.restrict_to_staff"?: boolean;
  "billing.payment_currencies.enable_different_currency_payment"?: boolean;
}>;

export type Currency = { id: string; code: string; name: string };
export type Account = {
  id: string;
  currency_id: string;
  preferred_payment_currency_id: string | null;
  currency: Currency;
};

/** The recorded bodies, by capture — the single source of every replayed response. */
export const recorded = {
  /** `GET clients/{id}?with=custom_fields,custom_fields.field` — the untouched baseline. */
  settings: () =>
    getFixtureBody<Envelope<IClient>>("get-clients-id", { recordingsDir }),
  /** `PUT clients/{id}?case=enabled-on` — `invoice_consolidation_enabled: 1`. */
  enabledOn: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-enabled-on", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=enabled-off` — the literal zero (AC3/AC18). */
  enabledOff: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-enabled-off", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=enabled-inherit` — `invoice_consolidation_enabled: 2`. */
  enabledInherit: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-enabled-inherit", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=base-rule-set` — `"day_of_week"`. */
  baseRuleSet: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-base-rule-set", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=base-rule-clear` — explicit `null`. */
  baseRuleClear: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-base-rule-clear", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=day-of-week-set` — `"monday"`. */
  dayOfWeekSet: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-day-of-week-set", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=day-of-week-clear` — explicit `null`. */
  dayOfWeekClear: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-day-of-week-clear", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=day-of-month-set` — `15`. */
  dayOfMonthSet: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-day-of-month-set", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=day-of-month-clear` — explicit `null`. */
  dayOfMonthClear: () =>
    getFixtureBody<Envelope<IClient>>(
      "put-clients-id-case-day-of-month-clear",
      { recordingsDir }
    ),
  /** `PUT clients/{id}?case=due-date-day-set` — `7`. */
  dueDateDaySet: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-due-date-day-set", {
      recordingsDir
    }),
  /** `PUT clients/{id}?case=due-date-day-clear` — explicit `null`. */
  dueDateDayClear: () =>
    getFixtureBody<Envelope<IClient>>(
      "put-clients-id-case-due-date-day-clear",
      { recordingsDir }
    ),
  /** `PUT clients/{id}?case=diff-only` — a real two-field diff (AC12). */
  diffOnly: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-diff-only", {
      recordingsDir
    }),
  /** `GET config/brand/values?keys=invoices.consolidation.restrict_to_staff` (O8/AC17). */
  restrictToStaff: () =>
    getFixture(
      "get-config-brand-values-keys-invoices-consolidation-restrict-to-staff",
      { recordingsDir }
    ),
  /**
   * `GET config/brand/values?keys=invoices.consolidation.restrict_to_staff,
   * billing.payment_currencies.enable_different_currency_payment` — the
   * WIDENED two-key call `design.md` §15.6 makes in ONE `ensureConfig()`
   * (T23). Real recorded values on this brand: `restrict_to_staff: false`
   * (consolidation opted in — AC17 stays green) and
   * `enable_different_currency_payment: false` (the payment-currency choice
   * is NOT opted in on this brand — AC23's own "false" case IS this brand's
   * real, unmodified state).
   */
  brandGates: () =>
    getFixture<BrandGatesEnvelope>("get-config-brand-values-9346eb8e", {
      recordingsDir
    }),
  /** `GET brand/settings` — a REAL `currencies` array (AC24), this module's own capture (T24). */
  brandSettings: () =>
    getFixtureBody<Envelope<{ currencies: Currency[] }>>("get-brand-settings", {
      recordingsDir
    }),
  /** `PUT accounts/{accountId}?case=currency-set` — a REAL success envelope, `currency_id` alone (AC22). */
  accountCurrencySet: () =>
    getFixtureBody<Envelope<Account>>("put-accounts-id-case-currency-set", {
      recordingsDir
    }),
  /** `PUT accounts/{accountId}?case=preferred-clear` — a REAL success envelope, explicit `null` (AC21). */
  accountPreferredClear: () =>
    getFixtureBody<Envelope<Account>>("put-accounts-id-case-preferred-clear", {
      recordingsDir
    }),
  /**
   * `PUT accounts/{accountId}?case=restore` — the account's fully-restored
   * baseline envelope (real `currency_id`, `preferred_payment_currency_id:
   * null`). Used as the stable BASE for `installAccountPutEchoHandler` across
   * every account-write test case, exactly as `installSettingsPutEchoHandler`
   * uses `recorded.settings()` as its base for the client-record writes.
   */
  accountBaseline: () =>
    getFixtureBody<Envelope<Account>>("put-accounts-id-case-restore", {
      recordingsDir
    }),
  /**
   * `PUT accounts/{accountId}?case=preferred-set` — the REAL `409` this
   * staging brand's closed B6 gate returns for a non-null
   * `preferred_payment_currency_id` (T24). Genuine evidence of server-side
   * enforcement; NOT used as a 200 stand-in anywhere — the success shape
   * AC21/AC22/AC26 need is derived from `accountBaseline()` via the echo
   * handler below, never from this rejection.
   */
  accountPreferredSetRejected: () =>
    getFixture<Envelope<unknown>>("put-accounts-id-case-preferred-set", {
      recordingsDir
    })
};

// -----------------------------------------------------------------------------

export function installBackgroundStubs(): void {
  server?.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    // Harmless defaults for a sibling module's own dependencies (AC-19 mounts
    // `usePersonalDetails` alongside this module) — never asserted on here,
    // present only so a sibling composable's own unrelated reads settle.
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: { languages: [] } })
    ),
    http.get("*/custom_fields*", () =>
      HttpResponse.json({ status: "ok", data: [], total: 0 })
    )
  );
  installBrandGatesHandler(server);
}

/**
 * Answers `GET config/brand/values?keys=...` with the REAL recorded TWO-KEY
 * envelope (T23 — `design.md` §15.6 widens the single `ensureConfig()` call
 * to carry BOTH row O8's `restrict_to_staff` and row B6's
 * `enable_different_currency_payment`). Renamed from
 * `installRestrictToStaffHandler` — that name would now be a lie about what
 * it answers. `bodyOverride` lets a test substitute a labelled envelope with
 * ONE (or both) key(s) overridden — never a fabricated body, the same
 * single-flag-override technique the exemplar uses for its own
 * `required: true` case. `server.use()` is LIFO, so calling this again after
 * `seedClientSession()` overrides the default registration. The MSW route
 * itself is UNCHANGED — already a wildcard.
 */
export function installBrandGatesHandler(
  mswServer: SetupServer | undefined,
  bodyOverride?: unknown
): void {
  mswServer?.use(
    http.get("*/config/brand/values*", () =>
      HttpResponse.json(bodyOverride ?? recorded.brandGates().response.body, {
        status: 200
      })
    )
  );
}

/** Answers `GET brand/settings` with the REAL recorded `currencies` array (AC24). */
export function installBrandSettingsHandler(
  mswServer: SetupServer | undefined,
  bodyOverride?: unknown
): void {
  mswServer?.use(
    http.get("*/brand/settings", () =>
      HttpResponse.json(bodyOverride ?? recorded.brandSettings(), {
        status: 200
      })
    )
  );
}

// -----------------------------------------------------------------------------

/** This module's two registry namespaces — both composables register under them. */
export const SCOPE_NAMESPACES = [
  "client-billing-settings",
  "client-billing-settings-manager"
];

export function clientBillingSettingsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    SCOPE_NAMESPACES.some(namespace => key.startsWith(`${namespace}:`))
  );
}

/**
 * Evict every client-billing-settings scope entry (both namespaces) so each
 * test starts from a fresh instance against ITS OWN handlers and ITS OWN
 * fixture mutations — never a still-cached instance an earlier test in the
 * same file left behind. The registry entry and the TanStack query cache are
 * separate lifetimes, so the shared cache is cleared too.
 */
export function resetClientBillingSettingsScopes(): void {
  for (const key of clientBillingSettingsScopeKeys()) {
    remove(key);
  }
  queryClient.clear();
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
  resetClientBillingSettingsScopes();
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
 * limb of the addressability predicate. Mirrors
 * `client-personal-details.int-helpers.ts`'s own documented departure: no
 * recorded capture reaches this state, so the token and `/self` body are the
 * recorded ones and the single constructed departure is the absent actor id
 * — the boundary itself, declared rather than dressed up as a recording.
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientBillingSettingsScopes();
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
 * of the addressability predicate resolving while a composable is already
 * constructed. Resets no scope and clears no cache: the instance under test
 * has to survive the transition for the transition to be observable at all.
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

// -----------------------------------------------------------------------------

export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
};

/** Passively observes every request whose URL contains `/clients/`. */
export function observeClientRequests(): {
  all: () => ObservedRequest[];
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/clients/")) return;
    const clone = request.clone();
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
    clone
      .json()
      .then(body => {
        const entry = seen[seen.length - 1];
        if (entry) entry.body = body;
      })
      .catch(() => undefined);
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
  expect(observed.url).toContain(`/clients/${clientId}`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}

/** Installs a mutable `GET clients/{id}` handler that serves the given body. */
export function installSettingsGetHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  body: Envelope<IClient>
): { reads: () => number } {
  let reads = 0;
  mswServer?.use(
    http.get(`*/clients/${clientId}`, () => {
      reads += 1;
      return HttpResponse.json(body, { status: 200 });
    })
  );
  return { reads: () => reads };
}

/** Installs a mutable `PUT clients/{id}` handler that serves the given body. */
export function installSettingsPutHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  body: Envelope<IClient>
): void {
  mswServer?.use(
    http.put(`*/clients/${clientId}`, () =>
      HttpResponse.json(body, { status: 200 })
    )
  );
}

/**
 * Installs a `PUT clients/{id}` handler that captures every outbound body
 * (for the write read-backs' request-body assertions) and answers with the
 * SAME merge behaviour the real API performs — `baseFixture`'s recorded data
 * with the real outbound diff folded in — never a fabricated shape. Returns
 * the captured bodies so a test can assert on exactly what THIS call sent.
 */
export function installSettingsPutEchoHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  baseFixture: Envelope<IClient>
): { bodies: () => Record<string, unknown>[] } {
  const bodies: Record<string, unknown>[] = [];
  mswServer?.use(
    http.put(`*/clients/${clientId}`, async ({ request }) => {
      const body = (await request.clone().json()) as Record<string, unknown>;
      bodies.push(body);
      return HttpResponse.json(
        { ...baseFixture, data: { ...baseFixture.data, ...body } },
        { status: 200 }
      );
    })
  );
  return { bodies: () => bodies };
}

// -----------------------------------------------------------------------------
// Account-currency slice (T23/T24/T33) — rows B1-B9, X4-X7; AC20-AC26.
// -----------------------------------------------------------------------------

/**
 * Installs a `PUT accounts/{accountId}` handler that captures every outbound
 * body and answers with the SAME merge behaviour the real API performs —
 * `recorded.accountBaseline()`'s real envelope with the outbound diff folded
 * in — mirroring `installSettingsPutEchoHandler` exactly. This is the base
 * every AC21/AC22 write case answers from; the response echo is never the
 * proof (A7) — only the CAPTURED outbound body is asserted on.
 */
export function installAccountPutEchoHandler(
  mswServer: SetupServer | undefined,
  accountId: string
): { bodies: () => Record<string, unknown>[] } {
  const bodies: Record<string, unknown>[] = [];
  const baseFixture = recorded.accountBaseline();
  mswServer?.use(
    http.put(`*/accounts/${accountId}`, async ({ request }) => {
      const body = (await request.clone().json()) as Record<string, unknown>;
      bodies.push(body);
      return HttpResponse.json(
        { ...baseFixture, data: { ...baseFixture.data, ...body } },
        { status: 200 }
      );
    })
  );
  return { bodies: () => bodies };
}

/** Passively observes every request whose URL contains `/accounts/` (AC20/AC25's zero-extra-request assertions). */
export function observeAccountRequests(): {
  all: () => ObservedRequest[];
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/accounts/")) return;
    const clone = request.clone();
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
    clone
      .json()
      .then(body => {
        const entry = seen[seen.length - 1];
        if (entry) entry.body = body;
      })
      .catch(() => undefined);
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
 * The full A7 identity read-back for one observed `/accounts/` request: the
 * URL is the session-resolved account's OWN resource, and the token is that
 * client session's — mirroring `assertClientIdentityTransport`.
 */
export function assertAccountIdentityTransport(
  observed: ObservedRequest,
  accountId: string,
  accessToken: string
): void {
  expect(observed.url).toContain(`/accounts/${accountId}`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}

/**
 * Seeds a real authenticated client session whose account carries a
 * PREFERRED-CURRENCY-IS-SET state — AC20's "a preference IS set" case and
 * AC26's post-write read-back. `preferred_payment_currency_id` set to a
 * non-null value cannot be RECORDED against this staging brand: the real API
 * rejects it with a genuine `409` because
 * `billing.payment_currencies.enable_different_currency_payment` is
 * genuinely `false` here (`recorded.accountPreferredSetRejected()` — a REAL
 * captured rejection, not fabricated evidence of anything). Per `design.md`
 * §15.10's own anticipated risk and `tasks.md` T24 action 4, this state is
 * therefore DERIVED — a single-field override of the session's OWN real,
 * recorded `accounts[0]`, never presented as a recording. The override value
 * is itself sourced from a REAL, committed fixture
 * (`recorded.brandSettings()`'s own `currencies` array) — never a
 * hand-invented id.
 */
export async function seedClientSessionWithPreferredCurrencySet(): Promise<{
  clientId: string;
  accessToken: string;
  accountId: string;
  preferredCurrencyId: string;
}> {
  resetClientBillingSettingsScopes();
  installBackgroundStubs();

  const { clientToken, selfBody } = recordedClientCredentials();
  installGuestTokenStub();

  const account = (selfBody.data as unknown as { accounts: Account[] })
    .accounts[0];
  const brandCurrencies = recorded.brandSettings().data.currencies;
  const preferredCurrencyId = brandCurrencies.find(
    currency => currency.id !== account.currency_id
  )?.id;
  if (!preferredCurrencyId) {
    throw new Error(
      "No REAL currency distinct from the account's own baseline currency " +
        "— cannot derive the preference-is-set session state."
    );
  }

  const derivedSelf = {
    ...selfBody,
    data: {
      ...selfBody.data,
      accounts: [
        { ...account, preferred_payment_currency_id: preferredCurrencyId }
      ]
    }
  };

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(derivedSelf.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  return {
    clientId: selfBody.data.actor.id,
    accessToken: clientToken.access_token,
    accountId: account.id,
    preferredCurrencyId
  };
}

/**
 * A `brand/settings` envelope with the SESSION account's OWN currency
 * OMITTED from `currencies` — AC24's second half (row B3): a client whose
 * account bills in a currency the brand's list doesn't carry must still see
 * (and keep) that currency. Filters ONE real entry out of the REAL recorded
 * list — never a fabricated list — so the append behaviour under test is
 * exercised against genuine currency data throughout.
 */
export function brandSettingsOmittingAccountCurrency(
  accountCurrencyId: string
): Envelope<{ currencies: Currency[] }> {
  const fixture = recorded.brandSettings();
  return {
    ...fixture,
    data: {
      ...fixture.data,
      currencies: fixture.data.currencies.filter(
        currency => currency.id !== accountCurrencyId
      )
    }
  };
}
