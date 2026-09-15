// -----------------------------------------------------------------------------
/**
 * @module tickets/__tests__/tickets.int-helpers
 * @description Shared integration scaffolding for tickets' `*.int.test.ts`
 * files: seed a real authenticated client session, evict this module's
 * scope-registry entries between tests, expose the RECORDED wire bodies every
 * handler serves, and observe outbound requests so the path-law and A7
 * read-backs assert on the real wire. Mirrors
 * `client-email-history/__tests__/client-email-history.int-helpers.ts` (public
 * test-infrastructure pattern, not this module's implementation source).
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate tickets` against real staging — no test in this
 * module builds a wire body of its own.
 */

import { http, HttpResponse } from "msw";
import { expect } from "vitest";
import { vi } from "vitest";
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

/** The recorded bodies, by capture — every file `tickets.fixtures.ts` wrote. */
export const recorded = {
  activeList: () =>
    getFixtureBody("get-tickets-with-staged-imports-1", { recordingsDir }),
  closedList: () =>
    getFixtureBody("get-tickets-case-closed-filter-status-code-ticket-closed", {
      recordingsDir
    }),
  pageOne: () =>
    getFixtureBody("get-tickets-case-page-1-with-staged-imports-1", {
      recordingsDir
    }),
  pageTwo: () =>
    getFixtureBody("get-tickets-case-page-2-with-staged-imports-1", {
      recordingsDir
    }),
  sortedBySubject: () =>
    getFixtureBody("get-tickets-case-sort-subject-with-staged-imports-1", {
      recordingsDir
    }),
  filteredByReference: () =>
    getFixtureBody(
      "get-tickets-case-filter-reference-filter-reference-xgd-235-12434",
      { recordingsDir }
    ),
  searched: () =>
    getFixtureBody("get-tickets-case-search-query-test-with-staged-imports-1", {
      recordingsDir
    }),
  recent: () => getFixtureBody("get-tickets-case-recent", { recordingsDir }),
  one: () => getFixtureBody("get-tickets-id", { recordingsDir }),
  messages: () =>
    getFixtureBody("get-tickets-id-messages-filter-is-log-0", {
      recordingsDir
    }),
  messagesAfterWithdraw: () =>
    getFixtureBody(
      "get-tickets-id-messages-case-after-withdraw-filter-is-log-0",
      {
        recordingsDir
      }
    ),
  oneMessage: () =>
    getFixtureBody("get-tickets-id-messages-id", { recordingsDir }),
  created: () => getFixtureBody("post-tickets", { recordingsDir }),
  reply: () => getFixtureBody("post-tickets-id-replies", { recordingsDir }),
  editedReply: () =>
    getFixtureBody("put-tickets-id-replies-id", { recordingsDir }),
  deletedReply: () =>
    getFixtureBody(
      "delete-tickets-id-messages-id-reason-recorded-withdrawal-for-fe-3226",
      { recordingsDir }
    ),
  closedStatus: () =>
    getFixtureBody("put-tickets-id-status", { recordingsDir }),
  reopenedStatus: () =>
    getFixtureBody("put-tickets-id-status-case-reopen", { recordingsDir }),
  renamed: () => getFixtureBody("put-tickets-id", { recordingsDir }),
  brandDepartments: () =>
    getFixtureBody("get-brand-tickets-departments", { recordingsDir }),
  departments: () =>
    getFixtureBody("get-tickets-departments", { recordingsDir }),
  statuses: () =>
    getFixtureBody("get-statuses-filter-object-type-ticket", { recordingsDir }),
  clientPrefsBefore: () => getFixtureBody("get-clients-id", { recordingsDir }),
  clientPrefsAfter: () => getFixtureBody("put-clients-id", { recordingsDir }),
  contractProductsLookup: () =>
    getFixtureBody("get-contract-products-case-lookup", { recordingsDir }),
  linkedProduct: () =>
    getFixtureBody("put-tickets-id-case-link-product", { recordingsDir }),
  oneLinked: () =>
    getFixtureBody("get-tickets-id-case-linked", { recordingsDir }),
  changedProduct: () =>
    getFixtureBody("put-tickets-id-case-change-product", { recordingsDir }),
  oneChanged: () =>
    getFixtureBody("get-tickets-id-case-changed", { recordingsDir }),
  unlinkedProduct: () =>
    getFixtureBody("put-tickets-id-case-unlink-product", { recordingsDir }),
  oneUnlinked: () =>
    getFixtureBody("get-tickets-id-case-unlinked", { recordingsDir }),
  productScopedList: () =>
    getFixtureBody(
      "get-tickets-case-product-scoped-filter-contract-product-id-with-staged-imports-1",
      { recordingsDir }
    ),
  delegatedInList: () =>
    getFixtureBody("get-tickets-case-delegated-in-with-staged-imports-1", {
      recordingsDir
    }),
  delegatedInOne: () =>
    getFixtureBody("get-tickets-id-case-delegated-in", { recordingsDir }),
  uploadedFile: () =>
    getFixtureBody("post-ticket-messages-files-case-upload", { recordingsDir }),
  replyWithFile: () =>
    getFixtureBody("post-tickets-id-replies-case-with-file", { recordingsDir }),
  downloadedFile: () =>
    getFixtureBody("get-ticket-messages-files-id-download", { recordingsDir }),
  deletedAttachment: () =>
    getFixtureBody("delete-tickets-id-messages-id-files-id", { recordingsDir })
};

/**
 * The real ticket id / message ids the write-cycle fixtures were captured
 * against (`tickets.fixtures.ts`'s throwaway ticket). Real values, read off
 * the fixture bodies — never invented.
 */
export const RECORDED_TICKET_ID = (recorded.one() as Envelope<{ id: string }>)
  .data.id;

// -----------------------------------------------------------------------------

/**
 * Serves the module's endpoints from the RECORDED bodies above. Every handler
 * is overridable per test (`set*`) so a test can point a read at a different
 * real capture without hand-building a response.
 */
export function installTicketsHandlers(): {
  setListBody: (body: unknown) => void;
  setOneBody: (body: unknown) => void;
  setMessagesBody: (body: unknown) => void;
} {
  let listBody = recorded.activeList();
  let oneBody = recorded.one();
  let messagesBody = recorded.messages();

  server?.use(
    http.get("*/api/tickets", () => HttpResponse.json(listBody)),
    http.get("*/api/tickets/:id/messages", () =>
      HttpResponse.json(messagesBody)
    ),
    http.get("*/api/tickets/:id/messages/:msgId", () =>
      HttpResponse.json(recorded.oneMessage())
    ),
    http.get("*/api/tickets/:id", () => HttpResponse.json(oneBody)),
    http.post("*/api/tickets/:id/replies", () =>
      HttpResponse.json(recorded.reply())
    ),
    http.put("*/api/tickets/:id/replies/:replyId", () =>
      HttpResponse.json(recorded.editedReply())
    ),
    http.delete("*/api/tickets/:id/messages/:msgId", () =>
      HttpResponse.json(recorded.deletedReply())
    ),
    http.put("*/api/tickets/:id/status", () =>
      HttpResponse.json(recorded.closedStatus())
    ),
    http.put("*/api/tickets/:id", () => HttpResponse.json(recorded.renamed())),
    http.post("*/api/tickets", () => HttpResponse.json(recorded.created())),
    http.get("*/api/brand/tickets/departments", () =>
      HttpResponse.json(recorded.brandDepartments())
    ),
    http.get("*/api/tickets/departments", () =>
      HttpResponse.json(recorded.departments())
    ),
    http.get("*/api/statuses", () => HttpResponse.json(recorded.statuses())),
    http.get("*/api/hooks/logs/client/:clientId", () =>
      HttpResponse.json(
        getFixtureBody("get-hooks-logs-client-id", {
          recordingsDir
        })
      )
    ),
    http.get("*/api/clients/:id", () =>
      HttpResponse.json(recorded.clientPrefsBefore())
    ),
    http.put("*/api/clients/:id", () =>
      HttpResponse.json(recorded.clientPrefsAfter())
    )
  );

  return {
    setListBody: (body: unknown) => {
      listBody = body as never;
    },
    setOneBody: (body: unknown) => {
      oneBody = body as never;
    },
    setMessagesBody: (body: unknown) => {
      messagesBody = body as never;
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
export const SCOPE_NAMESPACE = "tickets";

/** Every live scope key this module currently holds in the registry. */
export function ticketsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(
    key => key.startsWith(`${SCOPE_NAMESPACE}:`) || key.includes(":tickets:")
  );
}

/** Evict every tickets scope entry so each test starts from a fresh instance. */
export function resetTicketsScopes(): void {
  for (const key of ticketsScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

export const sessionStoreRecordingsDir = `${import.meta.dirname}/../../session-store/__tests__/fixtures`;

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
  resetTicketsScopes();
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
 * Passively observes every request whose URL contains `/tickets`, `/clients/`
 * or `/statuses`. Passive (an MSW `request:start` listener) rather than an
 * override handler, so it never races the fixture replay for the same route.
 */
export function observeTicketsRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (
      !request.url.includes("/tickets") &&
      !request.url.includes("/clients/") &&
      !request.url.includes("/statuses")
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

/** The path-law guard (design.md "Path law, asserted not assumed"). */
export function assertNoAdminPath(requests: ObservedRequest[]): void {
  for (const request of requests) {
    expect(request.url).not.toContain("/admin/");
  }
}
