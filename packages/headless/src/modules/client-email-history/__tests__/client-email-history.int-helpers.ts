// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.int-helpers
 * @description Shared integration scaffolding for client-email-history's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests so the A7
 * read-backs (URL + auth identity transport) assert on the real wire —
 * mirrors `client-email/__tests__/client-email.int-helpers.ts`, the sibling
 * module's own equivalent (public test-infrastructure, not this module's
 * implementation source).
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-email-history` against real staging — no
 * test in this module builds a wire body of its own.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { server, recordingsDir } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";

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

/**
 * One email row exactly as the recorded wire carries it (see `fixtures/*.json`).
 * The full body lives at the NESTED `data.body` — the `with=data` relation the
 * single-read endpoint requests; the row has no top-level `body` field.
 */
export type WireEmail = {
  id: string;
  sent: boolean;
  bounced: boolean;
  error_id: string | null;
  subject: string;
  data?: { body?: string };
  from: string;
  to: string | string[];
  created_at: string;
  bounced_at: string | null;
  recipient?: {
    fullname?: string;
    email?: string;
    image?: { full_url?: string };
  };
};

/**
 * The recorded bodies, by capture — every file `client-email-history.fixtures.ts`
 * wrote from real staging (NFR-2). ONE real capture limitation is recorded
 * here rather than silently worked around (see that generator's fileoverview
 * for the full disclosure): this account's history has ZERO bounced rows —
 * no "bounced" capture exists below. The single-read body DOES capture real
 * content, at the row's nested `data.body`.
 *
 * Every list capture below carries its REAL `total` inline, on the SAME
 * response every other field arrives on — the query platform's split-count
 * side-channel (`withSplitCount` / `skip_count=1` / the separate
 * `?limit=count` request) was withdrawn; there is exactly ONE request per
 * list read. Exact filename stems are used (never a bare partial-match
 * prefix) because every capture shares the `get-self-email-history` prefix —
 * a loose partial match would resolve ambiguously across them.
 */
export const recorded = {
  /** `GET self/email_history?order=-created_at` default list — real rows, real `total` inline. */
  list: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-case-default",
      {
        recordingsDir
      }
    ),
  /** `GET self/email_history` page 1 of the real 2860-row history, real `total` inline. */
  pageOne: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-case-page-1",
      {
        recordingsDir
      }
    ),
  /** `GET self/email_history` page 2, real `total` inline. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-case-page-2",
      {
        recordingsDir
      }
    ),
  /** `GET self/email_history?filter[bounced]=true` — the REAL empty result, genuine `total:0` inline. */
  empty: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-filter-bounced-true",
      { recordingsDir }
    ),
  /** `GET self/email_history?filter[error_id|neq]=null` — REAL error rows. */
  errorRows: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-filter-error-id-neq-null",
      { recordingsDir }
    ),
  /** `GET self/email_history?filter[sent]=true` — the ONE real sent row. */
  sentRow: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-filter-sent-true",
      { recordingsDir }
    ),
  /** `GET self/email_history?filter[error_id]=null` — REAL sending + sent rows. */
  noErrorRows: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-filter-error-id-null",
      { recordingsDir }
    ),
  /** `GET self/email_history?order=-subject` — REAL subject-sorted rows. */
  sortedBySubject: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-case-subject-sort",
      { recordingsDir }
    ),
  /** `GET self/email_history?query=invoice` — REAL free-text search response. */
  queried: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-query-invoice",
      {
        recordingsDir
      }
    ),
  /** `GET self/email_history?query=invoice&subject=Invoice` — REAL combined search. */
  queriedAndSubject: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-query-invoice-subject-invoice",
      { recordingsDir }
    ),
  /** `GET emails/{id}` — the one real single-read capture (populated nested `data.body`). */
  one: () =>
    getFixtureBody<Envelope<WireEmail>>("get-emails-id", { recordingsDir })
};

/**
 * Serves the module's endpoints from the RECORDED bodies above. The main list
 * body is overridable per test (`setListBody`) so a test can point the
 * collection at a different real capture without hand-building a response.
 * There is exactly ONE request per list read — the query platform's
 * split-count side-channel was withdrawn, so `total` is served inline on this
 * same body, never via a second request.
 */
export function installEmailHistoryHandlers(): {
  setListBody: (body: Envelope<WireEmail[]>) => void;
  setOneBody: (body: Envelope<WireEmail>) => void;
} {
  let listBody = recorded.list();
  let oneBody = recorded.one();

  server?.use(
    http.get("*/self/email_history", () => HttpResponse.json(listBody)),
    http.get("*/emails/:id", () => HttpResponse.json(oneBody))
  );

  return {
    setListBody: (body: Envelope<WireEmail[]>) => {
      listBody = body;
    },
    setOneBody: (body: Envelope<WireEmail>) => {
      oneBody = body;
    }
  };
}

/**
 * Background bootstrap calls unrelated to any AC (brand/org config) fire as a
 * side effect of `initStore()`; stub them harmlessly so they never surface as
 * noise. Re-applied on every seed — the replay server resets handlers between
 * tests.
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
export const SCOPE_NAMESPACE = "client-email-history";

/** Every live scope key this module currently holds in the registry. */
export function clientEmailHistoryScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-email-history scope entry so each test starts from a
 * fresh instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached list, so the shared cache
 * is cleared too.
 */
export function resetClientEmailHistoryScopes(): void {
  for (const key of clientEmailHistoryScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

/** session-store's OWN captures (same actor) — seed material only, never asserted on here. */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

function installGuestTokenStub(): void {
  const guestBody = getFixtureBody("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () => HttpResponse.json(guestBody))
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
  resetClientEmailHistoryScopes();
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

/** Boots the store to the guest floor — no client session is ever added. */
export async function bootUnauthenticated(): Promise<void> {
  resetClientEmailHistoryScopes();
  installBackgroundStubs();
  installGuestTokenStub();
  await useSessionStore().initStore();
}

/**
 * Signs a real client session onto an ALREADY-BOOTED store — the production
 * mid-life sign-in transition (AC-16) — via the same `useActions().add(...)`
 * call `seedClientSession` makes, but deliberately WITHOUT
 * `resetClientEmailHistoryScopes()` or a second `initStore()`. Evicting the
 * scope registry or re-initing the store is what a real sign-in never does to
 * an already-constructed instance; either would kill the instance's
 * `effectScope` out from under it rather than exercise its reactivity. Call
 * only after `bootUnauthenticated()` has already booted the guest floor.
 */
export async function signInClientSessionMidLife(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  const { clientToken, selfBody } = recordedClientCredentials();

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

/** Logs out any active client session, settling on the guest floor. */
export async function logoutClientSession(): Promise<void> {
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  resetClientEmailHistoryScopes();
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
 * Passively observes every request whose URL contains `/email_history` or
 * `/emails/`. Passive (an MSW `request:start` listener) rather than an
 * override handler, so it never races the fixture replay for the same route.
 */
export function observeEmailHistoryRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (
      !request.url.includes("/email_history") &&
      !request.url.includes("/emails/")
    )
      return;
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
 * The full A7 identity read-back for one observed request: the token is the
 * scope-resolved client session's own, and no acting-as header is present.
 * The URL retarget half of A7 has no path segment to assert against here
 * (design D1's documented divergence — the collection URL is `self/email_history`
 * regardless of the resolved client, by design) so this asserts the auth
 * identity transport, the half A7 actually turns on for this module.
 */
export function assertClientIdentityTransport(
  observed: ObservedRequest,
  accessToken: string
): void {
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}

/** Module files whose CODE (not prose) mentions `token` — comments excluded. */
export function moduleFilesReferencing(token: string): string[] {
  const moduleDir = join(import.meta.dirname, "..");
  return readdirSync(moduleDir)
    .filter(entry => entry.endsWith(".ts") && !entry.includes(".test."))
    .filter(file =>
      readFileSync(join(moduleDir, file), "utf-8")
        .split("\n")
        .some(line => {
          const trimmed = line.trim();
          const isComment =
            trimmed.startsWith("//") ||
            trimmed.startsWith("*") ||
            trimmed.startsWith("/*");
          return !isComment && line.includes(token);
        })
    );
}
