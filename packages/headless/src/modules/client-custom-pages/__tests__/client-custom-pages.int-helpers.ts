// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/__tests__/client-custom-pages.int-helpers
 * @description Shared integration scaffolding for client-custom-pages'
 * `*.int.test.ts` files: expose the RECORDED wire bodies every handler
 * serves, seed/clear a session so AC-9's "no token, with or without a
 * session" claim is provable both ways, evict this module's scope-registry
 * entries between tests, and observe outbound requests so the AC-1/AC-9
 * read-backs assert on the real wire — mirrors
 * `client-email-history/__tests__/client-email-history.int-helpers.ts` (public
 * test-infrastructure, not this module's implementation source).
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-custom-pages` against real staging — no test
 * in this module builds a wire body of its own.
 */

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

/** One custom-page row exactly as the recorded wire carries it. */
export type WireCustomPage = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  title: string;
  title_translated?: string;
  menu_label: string;
  menu_label_translated?: string;
  show_on_menu: boolean;
};

/** The recorded bodies, by capture. */
export const recorded = {
  /** `GET api/custom_pages` — the bare, unparameterised list. One configured page (`total:1`). */
  list: () =>
    getFixtureBody<Envelope<WireCustomPage[]>>("get-custom-pages", {
      recordingsDir
    }),
  /** `GET api/custom_pages/custom-page` — the real 200 by-slug resolve (single-object body). */
  page: () =>
    getFixtureBody<Envelope<WireCustomPage>>("get-custom-pages-custom-page", {
      recordingsDir
    }),
  /** `GET api/custom_pages?filter[show_on_menu]=1` — the plain-form menu-filter probe. */
  menuFilterProbe: () =>
    getFixtureBody<Envelope<WireCustomPage[]>>(
      "get-custom-pages-case-menu-filter-probe-filter-show-on-menu-1",
      { recordingsDir }
    ),
  /** `GET api/custom_pages?filter[show_on_menu|eq]=1` — the EXACT operator form the module emits (O25). */
  menuFilterEqProbe: () =>
    getFixtureBody<Envelope<WireCustomPage[]>>(
      "get-custom-pages-case-menu-filter-eq-probe-filter-show-on-menu-eq-1",
      { recordingsDir }
    ),
  /** `GET api/custom_pages/no-such-page-xyz` — a real typed-absence 404 envelope. */
  notFound: () =>
    getFixtureBody<Envelope<null>>("get-custom-pages-no-such-page-xyz", {
      recordingsDir
    })
};

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
export const SCOPE_NAMESPACE = "client-custom-pages";

/** Every live scope key this module currently holds in the registry. */
export function clientCustomPagesScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-custom-pages scope entry so each test starts from a
 * fresh instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached list, so the shared cache
 * is cleared too.
 */
export function resetClientCustomPagesScopes(): void {
  for (const key of clientCustomPagesScopeKeys()) remove(key);
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

/** Boots the store to the guest floor — no client session is ever added. */
export async function bootUnauthenticated(): Promise<void> {
  resetClientCustomPagesScopes();
  installBackgroundStubs();
  installGuestTokenStub();
  await useSessionStore().initStore();
}

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientCustomPagesScopes();
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
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/**
 * Passively observes every request whose URL contains `/custom_pages`.
 * Passive (an MSW `request:start` listener) rather than an override handler,
 * so it never races the fixture replay for the same route.
 */
export function observeCustomPagesRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/custom_pages")) return;
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
