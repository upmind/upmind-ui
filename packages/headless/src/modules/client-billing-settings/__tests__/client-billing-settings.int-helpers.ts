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
    )
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
  installRestrictToStaffHandler(server);
}

/**
 * Answers `GET config/brand/values?keys=invoices.consolidation.restrict_to_staff`
 * with the REAL recorded value (`false` on this brand — the surface is
 * opted-in). `bodyOverride` lets a test substitute a labelled envelope with
 * ONLY that one key overridden (absent / `true`) — never a fabricated body,
 * the same single-flag-override technique the exemplar uses for its own
 * `required: true` case. `server.use()` is LIFO, so calling this again after
 * `seedClientSession()` overrides the default registration.
 */
export function installRestrictToStaffHandler(
  mswServer: SetupServer | undefined,
  bodyOverride?: unknown
): void {
  mswServer?.use(
    http.get("*/config/brand/values*", () =>
      HttpResponse.json(
        bodyOverride ?? recorded.restrictToStaff().response.body,
        {
          status: 200
        }
      )
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
