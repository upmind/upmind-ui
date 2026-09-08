// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/invoices.int-helpers
 * @description Shared integration scaffolding for invoices' `*.int.test.ts`
 * files: seed a real authenticated client session, evict this module's scope
 * registry entries between tests, expose the RECORDED wire bodies every
 * handler serves, and capture outbound requests so the A7 read-backs (URL +
 * auth identity transport) assert on the real wire — mirrors
 * `client-email-history/__tests__/client-email-history.int-helpers.ts` and
 * `client-address/__tests__/client-address.int-helpers.ts`, this module's
 * sibling equivalents (public test-infrastructure, not this module's
 * implementation source).
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate invoices` against real staging — no test in this
 * module builds a wire body of its own, except where a REAL recorded row has
 * exactly one field toggled to construct a condition this staging account's
 * real history does not contain (disclosed at each call site — see
 * `invoices.fixtures.ts`'s own disclosure and the AC-5/6/7/13 test files).
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
 * One invoice row exactly as the recorded wire carries it (see
 * `fixtures/*.json`). Loosely typed — this file is test scaffolding, not the
 * module's `Invoice` VM, and the recorded rows carry many more fields than
 * are named here; only the fields this module's tests read are declared.
 */
export type WireInvoice = {
  id: string;
  status?: { code?: string } | null;
  is_consolidation: boolean;
  consolidation_invoice_id: string | null;
  consolidation_status: number;
  credit_invoice_id: string | null;
  partial_amount_to_credit_converted: number;
  partial_amount_to_credit_formatted: string;
  partial_amount_credited: number;
  to_be_credited: boolean;
  products_count: number;
  products: Array<{
    id: string;
    contract_id: string | null;
    contracts_product_id: string | null;
  }>;
  category: { id: string; name: string; slug: string };
  delegate_related: boolean;
  client: {
    id: string;
    parent_client_config?: { parent_client_id: string } | null;
  };
  next_charge_date?: string | null;
  balance: number;
  balance_formatted: string;
  unpaid_amount: number;
  unpaid_amount_converted: number;
  unpaid_amount_formatted: string;
  currency_id: string;
  currency: { id: string; code: string };
  payments: Array<{
    id: string;
    pending: boolean;
    gateway?: { type?: number } | null;
    created_at: string;
  }>;
  payment_details_id: string | null;
};

// -----------------------------------------------------------------------------

/**
 * The recorded bodies, by capture — every file `invoices.fixtures.ts` wrote
 * from real staging (NFR-2). This account's real history carries NO
 * consolidation invoice, NO credit note, NO bundle over the large-bundle
 * threshold, and NO delegated/sub-account row — `invoices.fixtures.ts`'s own
 * disclosure log confirms this at capture time. Tests that need one of those
 * conditions construct it from `recorded.unpaid()` with ONE (or a small,
 * individually-labelled set of) field(s) toggled — the accepted precedent in
 * `client-email-history.mappers.test.ts`.
 */
export const recorded = {
  /** `GET /invoices` broad real list — 25 real rows, full list include set. */
  list: () =>
    getFixtureBody<Envelope<WireInvoice[]>>("get-invoices-case-default", {
      recordingsDir
    }),
  /** `GET /invoices/{id}` — a real PAID invoice, full loadOne include set. */
  paid: () =>
    getFixtureBody<Envelope<WireInvoice>>("get-invoices-id-case-first", {
      recordingsDir
    }).data,
  /**
   * `GET /invoices/{id}` — a real UNPAID/OVERDUE invoice with 4 REAL pending
   * payments, every one on a gateway whose `type` is
   * {@link GatewayTypes.AWAITING_CLIENT} (`10`) — genuinely reachable from
   * this staging account, not constructed (AC-8).
   */
  unpaid: () =>
    getFixtureBody<Envelope<WireInvoice>>("get-invoices-id-case-unpaid", {
      recordingsDir
    }).data,
  /** `GET /invoices/unpaid_amount/{id}` — real 200, real currency_id. */
  unpaidAmount: () =>
    getFixtureBody<{
      status: string;
      data: { unpaid_amount: number; unpaid_amount_formatted: string };
    }>("get-invoices-unpaid-amount-id-currency-id", { recordingsDir }),
  /** `GET /invoices/unpaid_amount/{id}` — real 422, missing currency. */
  unpaidAmountMissingCurrency: () =>
    getFixtureBody<{ status: string; error: { code: number } }>(
      "get-invoices-unpaid-amount-id-case-missing-currency",
      { recordingsDir }
    ),
  /** `GET /invoices/{id}` — real 404, control response (unknown id). */
  notFound: () =>
    getFixtureBody<{
      status: string;
      data: null;
      error: { code: number; message: string } | null;
    }>("get-invoices-id-case-not-found", { recordingsDir })
};

/**
 * Serves the module's collection/single-read endpoints from the RECORDED
 * bodies above. Bodies are overridable per test (`setListBody`/`setOneBody`)
 * so a test can point the collection/single-read at a different real (or
 * real-plus-one-toggle) body without hand-building a response from scratch.
 */
export function installInvoiceHandlers(): {
  setListBody: (body: Envelope<WireInvoice[]>) => void;
  setOneBody: (body: Envelope<WireInvoice>) => void;
  setUnpaidAmountBody: (body: unknown, status?: number) => void;
  setPaymentDetailsAck: (status?: number) => void;
} {
  let listBody = recorded.list();
  let oneBody: Envelope<WireInvoice> = {
    status: "ok",
    data: recorded.paid(),
    total: null,
    error: null,
    messages: null,
    meta: null
  };
  let unpaidAmountBody: unknown = recorded.unpaidAmount();
  let unpaidAmountStatus = 200;
  let paymentDetailsStatus = 200;

  server?.use(
    http.get("*/invoices/unpaid_amount/:id", () =>
      HttpResponse.json(unpaidAmountBody as Record<string, unknown>, {
        status: unpaidAmountStatus
      })
    ),
    http.get("*/invoices/:id", () => HttpResponse.json(oneBody)),
    http.get("*/invoices", () => HttpResponse.json(listBody)),
    http.patch("*/invoices/:id/payment_details", () =>
      HttpResponse.json(
        { status: "ok", data: null, error: null },
        { status: paymentDetailsStatus }
      )
    )
  );

  return {
    setListBody: (body: Envelope<WireInvoice[]>) => {
      listBody = body;
    },
    setOneBody: (body: Envelope<WireInvoice>) => {
      oneBody = body;
    },
    setUnpaidAmountBody: (body: unknown, status = 200) => {
      unpaidAmountBody = body;
      unpaidAmountStatus = status;
    },
    setPaymentDetailsAck: (status = 200) => {
      paymentDetailsStatus = status;
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

/** Every live scope key this module currently holds in the registry. */
export function invoiceScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => key.startsWith("invoice"));
}

/**
 * Evict every invoices/invoice scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached data, so the shared cache
 * is cleared too.
 */
export function resetInvoiceScopes(): void {
  for (const key of invoiceScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

const sessionStoreRecordingsDir = join(
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
  resetInvoiceScopes();
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
 * Boots the store to the guest floor — no client session is ever added. Logs
 * out any session a PRIOR test in the same file left active first: the
 * session store is a singleton, so skipping this leaks a previous test's
 * `activeUser` into a test that means to assert the signed-out floor.
 */
export async function bootUnauthenticated(): Promise<void> {
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  resetInvoiceScopes();
  installBackgroundStubs();
  installGuestTokenStub();
  await useSessionStore().initStore();
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
  body: unknown;
};

/**
 * Passively observes every request whose URL contains `/invoices`. Passive
 * (an MSW `request:start` listener) rather than an override handler, so it
 * never races the fixture replay for the same route. The request is cloned
 * before its body is read so the real handler downstream still sees an
 * unconsumed stream.
 */
export function observeInvoiceRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  last: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/invoices")) return;
    const entry: ObservedRequest = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: undefined
    };
    seen.push(entry);
    if (request.method !== "GET" && request.method !== "HEAD") {
      request
        .clone()
        .text()
        .then(text => {
          entry.body = text ? JSON.parse(text) : undefined;
        })
        .catch(() => undefined);
    }
  };
  server?.events.on("request:start", listener);

  return {
    all: () => seen,
    first: () => seen[0],
    last: () => seen[seen.length - 1],
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
 * The `client x client` retarget for this module is a declared `client_id`
 * FILTER COLUMN, never a path segment (design D-notes) — so the URL half of
 * A7 is asserted by the caller against the query string, not this helper.
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
