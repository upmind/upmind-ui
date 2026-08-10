// -----------------------------------------------------------------------------
/**
 * @module __tests__/criteria-int-kit
 * @description The scaffolding every criteria-migrated module's integration
 * suite needs and none of them owns: seed a real authenticated client session
 * from session-store's OWN captures, silence the bootstrap calls that fire as a
 * side effect of `initStore()`, and observe the outbound wire.
 *
 * It serves NO response body of its own. Each module's `*.int-helpers.ts` reads
 * its own co-located recordings and installs its own param-branching handler —
 * so provenance stays with the module that captured it.
 */

import { join } from "node:path";
import { isCancelledError } from "@tanstack/vue-query";
import { http, HttpResponse, delay } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { queryClient } from "../modules/query/client";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../modules/session-store";
import { isFunction } from "lodash-es";
import type { IToken } from "@upmind-automation/types";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

/**
 * The cold-cache reset below destroys reads the previous test left retrying
 * against handlers `resetHandlers()` has already torn down, and TanStack rejects
 * the read promise the composable fired and forgot. That CancelledError is this
 * kit's own teardown artifact, so this kit owns it — and ONLY it: every other
 * unhandled rejection still surfaces and fails the run.
 */
process.on("unhandledRejection", reason => {
  if (isCancelledError(reason)) return;
  throw reason;
});

/** The Upmind response envelope, as every recorded list fixture carries it. */
export type Envelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
  messages: unknown;
  meta: unknown;
};

/**
 * Session-store's own captures (same actor) — input material for seeding a real
 * session, never asserted on here.
 */
const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../modules/session-store/__tests__/fixtures"
);

/**
 * Bootstrap calls unrelated to any collection (brand/org config, the guest
 * token) fire from `initStore()`. Stubbed harmlessly so they never surface as
 * an unmatched-request failure against a module-scoped replay dir.
 *
 * `withBrandConfig: false` leaves brand/org config to the module's OWN
 * recordings — a collection whose `enabled` gate depends on the basket machine
 * cannot boot on an empty brand.
 */
export function installBootstrapStubs(
  server: SetupServer | undefined,
  options?: { withBrandConfig?: boolean }
): void {
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
  if (options?.withBrandConfig === false) return;

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

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(
  server: SetupServer | undefined,
  options?: { withBrandConfig?: boolean }
): Promise<{ clientId: string; accessToken: string }> {
  queryClient.clear();
  installBootstrapStubs(server, options);

  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionStoreRecordingsDir
  });
  const selfBody = getFixtureBody<{ data: { actor: { id: string } } }>(
    "get-self",
    { recordingsDir: sessionStoreRecordingsDir }
  );

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
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/** Passively observes every request whose URL contains `fragment`. */
export function observeRequests(
  server: SetupServer | undefined,
  fragment: string
): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  latestParams: () => URLSearchParams;
  lastParam: (key: string) => string | undefined;
  filterKeys: () => string[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes(fragment)) return;
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
  };
  server?.events.on("request:start", listener);

  const latestParams = (): URLSearchParams =>
    new URL(seen.at(-1)?.url ?? "http://localhost").searchParams;

  return {
    all: () => seen,
    first: () => seen[0],
    latestParams,
    lastParam: (key: string) =>
      seen
        .map(entry => new URL(entry.url).searchParams.get(key))
        .filter((value): value is string => value !== null)
        .at(-1),
    filterKeys: () =>
      [...latestParams().keys()].filter(key => key.startsWith("filter[")),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

// -----------------------------------------------------------------------------

/**
 * How long a handler holds a response before serving it. A cache read-back is a
 * claim about the window BEFORE a response lands, so that window needs length.
 */
export type ResponseTiming = {
  delayMs?: number | ((params: URLSearchParams) => number);
};

export async function heldFor(
  params: URLSearchParams,
  options?: ResponseTiming
): Promise<void> {
  const ms = isFunction(options?.delayMs)
    ? options.delayMs(params)
    : options?.delayMs;
  if (ms) await delay(ms);
}

/**
 * Narrow a recorded corpus by the request's own `filter[col|like]` param,
 * matching the needle inside the `%…%` the translator wraps. Case-insensitive,
 * because the API's own LIKE is.
 */
export function narrowByLike<TRow>(
  rows: TRow[],
  params: URLSearchParams,
  column: string,
  read: (row: TRow) => string | null | undefined
): TRow[] {
  const like = params.get(`filter[${column}|like]`);
  if (!like) return rows;
  const needle = like.replace(/%/g, "").toLowerCase();
  return rows.filter(row => (read(row) ?? "").toLowerCase().includes(needle));
}

/** Narrow a recorded corpus by a `filter[col|eq]` boolean, wired as `1`/`0`. */
export function narrowByBoolean<TRow>(
  rows: TRow[],
  params: URLSearchParams,
  column: string,
  read: (row: TRow) => boolean | undefined
): TRow[] {
  const value = params.get(`filter[${column}|eq]`);
  if (value === "1") return rows.filter(row => read(row) === true);
  if (value === "0") return rows.filter(row => read(row) === false);
  return rows;
}

/** The window `?limit=&offset=` asks for; `limit=0` means the whole corpus. */
export function windowOf<TRow>(rows: TRow[], params: URLSearchParams): TRow[] {
  const limit = Number(params.get("limit") ?? 0);
  const offset = Number(params.get("offset") ?? 0);
  return limit > 0 ? rows.slice(offset, offset + limit) : rows.slice(offset);
}

/**
 * The distinct wire combinations a run produced — the cache law's denominator.
 * Two requests carrying the same criteria are the SAME combination however far
 * apart they fired; a request count above this is a cache that did not hold.
 */
export function distinctCombinations(requests: ObservedRequest[]): string[] {
  const keys = requests.map(request => {
    const params = [...new URL(request.url).searchParams.entries()]
      .filter(([key]) => key !== "case")
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    return `${new URL(request.url).pathname}?${params}`;
  });
  return [...new Set(keys)];
}
