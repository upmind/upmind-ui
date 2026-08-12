// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/client-personal-details.int-helpers
 * @description Shared integration scaffolding for this module's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's TWO scope-registry namespaces between tests
 * (`client-personal-details` and `client-personal-details-manager`), expose
 * the RECORDED wire bodies every handler serves, and capture outbound
 * requests so the A7 read-backs (URL retarget + auth identity transport)
 * assert on the real wire.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-personal-details` against real staging, or
 * (for the session bootstrap only) from `session-store`'s own captures — no
 * test in this module builds a wire body of its own.
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

/** The recorded bodies, by capture — the single source of every replayed response. */
export const recorded = {
  /** `GET clients/{id}?with=custom_fields,custom_fields.field`. */
  profile: () =>
    getFixtureBody<Envelope<IClient>>("get-clients-id", { recordingsDir }),
  /** `PUT clients/{id} ?case=change-firstname`. */
  changedFirstname: () =>
    getFixtureBody<Envelope<IClient>>("put-clients-id-case-change-firstname", {
      recordingsDir
    }),
  /** `PUT clients/{id} ?case=clear-custom-field` — clears the real 'age' field. */
  clearedCustomField: () =>
    getFixture("put-clients-id-case-clear-custom-field", { recordingsDir }),
  /** `PUT clients/{id} ?case=native-falsy` — `public_name` set to `""`. */
  nativeFalsy: () =>
    getFixture("put-clients-id-case-native-falsy", { recordingsDir }),
  /** `GET brand/settings` — the real 28-language list (AC-34/AC-35). */
  brandSettings: () =>
    getFixtureBody<
      Envelope<{
        languages: Array<{ id: string; language: string; code: string }>;
      }>
    >("get-brand-settings", { recordingsDir })
};

// -----------------------------------------------------------------------------

/**
 * Answers A's OWN `GET custom_fields?filter[object_type]=client&...`
 * definitions read — the manager's `loadLookups` (T-B3) awaits A's
 * readiness INSIDE the XState service, so every manager test needs this
 * endpoint answered or the machine never leaves `loading`. Built from the
 * embedded `field` objects already present in THIS module's own
 * `get-clients-id` capture (`custom_fields[].field`) — real recorded field
 * shapes, never hand-authored, just reassembled into the definitions-list
 * envelope A's own endpoint would have served them in. A's OWN fixtures
 * (captured separately by A's prover) are a different module's write lane
 * and are not read here.
 */
export function installCustomFieldDefinitionsHandler(
  mswServer: SetupServer | undefined,
  /**
   * Override definitions (e.g. a field with `required` flipped) — MUST be
   * the SAME field objects a test's own `installProfileGetHandler` embeds
   * on `custom_fields[].field`, or the manager's validation schema (built
   * from THIS endpoint, not from B's own profile embed) silently diverges
   * from what a test mutated. `server.use()` is LIFO, so calling this AGAIN
   * after `seedClientSession()` overrides its default registration.
   */
  definitionsOverride?: unknown[]
): void {
  const definitions =
    definitionsOverride ??
    (recorded.profile().data.custom_fields ?? []).map(row => row.field);
  mswServer?.use(
    http.get("*/custom_fields*", () =>
      HttpResponse.json(
        {
          status: "ok",
          data: definitions,
          total: definitions.length,
          error: null,
          messages: [],
          meta: null
        },
        { status: 200 }
      )
    )
  );
}

/**
 * Answers `GET brand/settings` with the REAL recorded 28-language list
 * (AC-34/AC-35). `bodyOverride` lets a test substitute a labelled
 * CONSTRUCTED body (e.g. a client whose current language id is absent from
 * the list) — `server.use()` is LIFO, so calling this again after
 * `seedClientSession()` overrides the default registration.
 */
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

export function installBackgroundStubs(): void {
  server?.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/brand/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    )
  );
  installBrandSettingsHandler(server);
  // The manager's loadLookups awaits A's OWN definitions readiness inside
  // the XState service (T-B3) — every seeded session answers it too, or the
  // machine never leaves `loading` in any manager test.
  installCustomFieldDefinitionsHandler(server);
}

// -----------------------------------------------------------------------------

/** This module's two registry namespaces — both composables register under them. */
export const SCOPE_NAMESPACES = [
  "client-personal-details",
  "client-personal-details-manager"
];

/**
 * The namespace of A's collection this module's manager COMPOSES
 * (`usePersonalDetailsManager.machine.ts`'s `loadLookups` reads A's
 * `useClientCustomFields()` for the validation schema, not the embedded
 * `custom_fields[].field` on B's own profile read). Evicted alongside this
 * module's own namespaces so a per-test fixture mutation to a custom field's
 * definition (e.g. flipping `required`) actually reaches the schema the
 * NEXT test's manager builds, instead of reading A's still-cached instance
 * from an earlier test in the same file. Not `client-personal-details`'s own
 * namespace — kept a separate constant so `clientPersonalDetailsScopeKeys()`
 * still answers "this module's own live scopes" accurately for anything
 * that counts by it.
 */
const CONSUMED_NAMESPACES = ["client-custom-fields"];

export function clientPersonalDetailsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    SCOPE_NAMESPACES.some(namespace => key.startsWith(`${namespace}:`))
  );
}

function consumedScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    CONSUMED_NAMESPACES.some(namespace => key.startsWith(`${namespace}:`))
  );
}

/**
 * Evict every client-personal-details scope entry (both namespaces) AND
 * every A (`client-custom-fields`) scope entry this module's manager
 * composes, so each test starts from a fresh instance against ITS OWN
 * handlers and ITS OWN fixture mutations — never a still-cached collection
 * instance an earlier test in the same file left behind. The registry entry
 * and the TanStack query cache are separate lifetimes, so the shared cache
 * is cleared too.
 */
export function resetClientPersonalDetailsScopes(): void {
  for (const key of [
    ...clientPersonalDetailsScopeKeys(),
    ...consumedScopeKeys()
  ]) {
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
  resetClientPersonalDetailsScopes();
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
 * `client-email.int-helpers.ts`'s own documented departure: no recorded
 * capture reaches this state, so the token and `/self` body are the recorded
 * ones and the single constructed departure is the absent actor id — the
 * boundary itself, declared rather than dressed up as a recording.
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientPersonalDetailsScopes();
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
 * `seedAuthenticatedSessionWithoutClientId` left unresolved — the second
 * limb of the addressability predicate resolving while a composable is
 * already constructed. Resets no scope and clears no cache: the instance
 * under test has to survive the transition for the transition to be
 * observable at all (`client-email.int-helpers.ts`'s own
 * `resolveClientIdOnActiveSession` is the precedent).
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

export async function logoutClientSession(): Promise<void> {
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  resetClientPersonalDetailsScopes();
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
}

// -----------------------------------------------------------------------------

export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
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

/**
 * The full A7 identity read-back for one observed request: the URL is the
 * SCOPE-resolved profile's own resource, the token is that client session's,
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
export function installProfileGetHandler(
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
