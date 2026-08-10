// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.int-helpers
 * @description Shared integration scaffolding for client-email's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests so the A7
 * read-backs (URL retarget + auth identity transport) assert on the real wire.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-email` against real staging — no test builds
 * a wire body of its own.
 */

import { join } from "node:path";
import { delay, http, HttpResponse } from "msw";
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
import { isFunction } from "lodash-es";
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

/** One email as the recorded wire carries it (see `fixtures/*.json`). */
export type WireEmail = {
  id: string;
  client_id: string;
  type: number;
  email: string;
  default: boolean;
  verified: boolean;
  bounced: boolean;
  bounced_at: string | null;
  can_delete: boolean;
};

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * this module's generator wrote from staging — the single source of every
 * response these tests replay.
 */
export const recorded = {
  /** `GET clients/{id}/emails` — the account's real collection. */
  list: () =>
    getFixtureBody<Envelope<WireEmail[]>>("get-clients-id-emails", {
      recordingsDir
    }),
  /** `GET clients/{id}/emails/{id}` — the per-email read the manager seeds from. */
  one: () =>
    getFixtureBody<Envelope<WireEmail>>("get-clients-id-emails-id", {
      recordingsDir
    }),
  /** `GET clients/{id}/emails?limit=2&offset=0` — a real first page of three. */
  pageOne: () =>
    getFixtureBody<Envelope<WireEmail[]>>("get-clients-id-emails-case-page-1", {
      recordingsDir
    }),
  /** `GET clients/{id}/emails?limit=2&offset=2` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireEmail[]>>("get-clients-id-emails-case-page-2", {
      recordingsDir
    }),
  /** `POST clients/{id}/emails` — the created record. */
  created: () =>
    getFixtureBody<Envelope<WireEmail>>("post-clients-id-emails", {
      recordingsDir
    }),
  /** `PUT clients/{id}/emails/{id}` — the edited record. */
  updated: () =>
    getFixtureBody<Envelope<WireEmail>>("put-clients-id-emails-id", {
      recordingsDir
    }),
  /** `PUT clients/{id}/emails/{id}` `{default:true}` — the 200. */
  defaulted: () =>
    getFixtureBody<Envelope<WireEmail>>(
      "put-clients-id-emails-id-case-set-default",
      { recordingsDir }
    ),
  /** The real 409 staging answers when the target address is unverified. */
  defaultRejected: () =>
    getFixture("put-clients-id-emails-id-case-set-default-unverified", {
      recordingsDir
    }),
  /** `PATCH clients/{id}/emails/{id}/send_verify`. */
  verified: () =>
    getFixtureBody<Envelope<null>>("patch-clients-id-emails-id-send-verify", {
      recordingsDir
    }),
  /** `DELETE clients/{id}/emails/{id}`. */
  removed: () =>
    getFixtureBody<Envelope<null>>("delete-clients-id-emails-id", {
      recordingsDir
    })
};

/**
 * The two REAL records these suites build a multi-row collection from: the
 * account's own default (verified, non-deletable) and the address the capture
 * run created (non-default, unverified, deletable). Both verbatim recordings.
 */
export function recordedRows(): { primary: WireEmail; secondary: WireEmail } {
  return {
    primary: recorded.list().data[0],
    secondary: recorded.one().data
  };
}

// -----------------------------------------------------------------------------

/**
 * Background bootstrap calls unrelated to any AC (brand/org config) fire as a
 * side effect of `initStore()`; stub them harmlessly so they never surface as
 * noise against a suite scoped to client-email. Re-applied on every seed —
 * the replay server's own `afterEach` resets handlers between tests.
 */
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
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: {} })
    )
  );
}

// -----------------------------------------------------------------------------

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-email";

/** Every live scope key this module currently holds in the registry. */
export function clientEmailScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-email scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack query
 * cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached list, so the shared cache
 * is cleared too.
 */
export function resetClientEmailScopes(): void {
  for (const key of clientEmailScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

/**
 * D2 input material: the OAuth token + `/self` bodies are session-store's OWN
 * captures (same actor), never asserted on here — used only to seed a real
 * client session, exactly as `account.int.test.ts` reuses them.
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
  resetClientEmailScopes();
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
 * id, and the only non-client `/self` capture in the tree is a 403 body, not a
 * session. So the token and the `/self` body are the recorded ones and the
 * single constructed departure is the absent actor id — the boundary itself,
 * declared here rather than dressed up as a recording.
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientEmailScopes();
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
  resetClientEmailScopes();
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
 * Passively observes every request whose URL contains `/emails`. Passive (an
 * MSW `request:start` listener) rather than an override handler, so it never
 * races the fixture replay for the same route.
 */
export function observeEmailRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/emails")) return;
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
 * Serves a MUTABLE collection from `GET clients/{clientId}/emails`, wrapped in
 * the RECORDED list envelope, so a mutation's "the list refetches" post-effect
 * is observed through a real subsequent GET rather than assumed. `setRows`
 * changes what the next read returns — the server-side effect the replay
 * harness stands in for.
 */
export function installEmailsListHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  initialRows: WireEmail[],
  options?: { total?: number }
): {
  setRows: (rows: WireEmail[]) => void;
  getRows: () => WireEmail[];
  reads: () => number;
} {
  const envelope = recorded.list();
  let rows = initialRows;
  let reads = 0;

  mswServer?.use(
    http.get(`*/clients/${clientId}/emails`, () => {
      reads += 1;
      return HttpResponse.json(
        { ...envelope, data: rows, total: options?.total ?? rows.length },
        { status: 200 }
      );
    })
  );

  return {
    setRows: (next: WireEmail[]) => {
      rows = next;
    },
    getRows: () => rows,
    reads: () => reads
  };
}

/**
 * Serves the two RECORDED pages of a `limit=2` walk, chosen by the request's
 * own `offset` — so a caller-supplied page size is answered by the API's real
 * page-1 (2 of 3) and page-2 (the third) bodies, `total: 3` included. Neither
 * the collection size nor the page boundary is staged here; both are what
 * staging returned to `?limit=2&offset=0` / `&offset=2`.
 */
export function installPagedEmailsHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  options?: ResponseTiming
): { offsets: () => string[] } {
  const pageOne = recorded.pageOne();
  const pageTwo = recorded.pageTwo();
  const offsets: string[] = [];

  mswServer?.use(
    http.get(`*/clients/${clientId}/emails`, async ({ request }) => {
      const params = new URL(request.url).searchParams;
      const offset = params.get("offset") ?? "0";
      offsets.push(offset);
      await heldFor(params, options);
      return HttpResponse.json(offset === "0" ? pageOne : pageTwo, {
        status: 200
      });
    })
  );

  return { offsets: () => offsets };
}

/**
 * How long a handler holds a response before serving it. A cache read-back is
 * a claim about the window BEFORE a response lands, so that window has to have
 * a length; the bodies served are the recorded ones either way.
 */
export type ResponseTiming = {
  delayMs?: number | ((params: URLSearchParams) => number);
};

async function heldFor(
  params: URLSearchParams,
  options?: ResponseTiming
): Promise<void> {
  const ms = isFunction(options?.delayMs)
    ? options.delayMs(params)
    : options?.delayMs;
  if (ms) await delay(ms);
}

/**
 * Serves the RECORDED 3-row corpus (page-1's two rows + page-2's one) narrowed
 * by the request's own `filter[col|op]=` params — so a `filterBy` re-query is
 * answered by the real subset the server would return, never a client-side
 * slice. Boolean columns match `1`/`0`; `email|like` matches the needle inside
 * the `%…%` the translator wraps. The row bodies are verbatim recordings; only
 * WHICH recorded rows are returned varies, which is what a param-branching
 * handler must do (design §1.7 — the shipped `installEmailsListHandler` ignores
 * the url and makes any narrowing assertion vacuous).
 */
export function installFilteredEmailsHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.pageOne();
  const corpus = [...recorded.pageOne().data, ...recorded.pageTwo().data];
  let reads = 0;

  mswServer?.use(
    http.get(`*/clients/${clientId}/emails`, async ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;
      let rows = corpus;

      for (const column of ["verified", "bounced", "default"] as const) {
        const value = params.get(`filter[${column}|eq]`);
        if (value === "1") rows = rows.filter(row => row[column] === true);
        else if (value === "0")
          rows = rows.filter(row => row[column] === false);
      }

      const like = params.get("filter[email|like]");
      if (like) {
        const needle = like.replace(/%/g, "").toLowerCase();
        rows = rows.filter(row => row.email.toLowerCase().includes(needle));
      }

      await heldFor(params, options);

      return HttpResponse.json(
        { ...envelope, data: rows, total: rows.length },
        { status: 200 }
      );
    })
  );

  return { reads: () => reads };
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
  expect(observed.url).toContain(`/clients/${clientId}/emails`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}
