// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices integration — proving useInvoice against recorded fixtures
 *
 * ## Job To Be Done
 * Prove the invoices module reads a real invoice across the HTTP + auth-guard
 * seam: an authenticated client loads and parses a recorded invoice, the guard
 * denies an unauthenticated caller before any request, a 404 surfaces as an
 * error, and refresh / invalidate re-read the record.
 *
 * ## Scenarios proven (from invoices.feature):
 * - @INV-read: authenticated client loads + parses a paid and an unpaid invoice
 * - @INV-guest-denied: no session → guard blocks the fetch, invoice unavailable
 * - @INV-state-error: unknown id → 404 surfaces as an error state
 * - @INV-refresh: refetch() re-reads the invoice from the platform
 * - @INV-invalidate: invalidate() resolves without error
 *
 * ## Provenance
 * Every body replayed here was captured by `pnpm fixtures:generate invoices`
 * into this module's own `fixtures/` dir. No body is authored in this file.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  installBackgroundStubs,
  recordingsDir,
  server
} from "./setup.integration";

// -----------------------------------------------------------------------------

type Case = "paid" | "unpaid" | "not-found";

function recordedIds(): { paidId: string; unpaidId: string } {
  const paid = getFixture("get-invoices-id-case-paid", { recordingsDir });
  const unpaid = getFixture("get-invoices-id-case-unpaid", { recordingsDir });
  const rx = /\/api\/invoices\/([0-9a-f-]{36})/;
  const paidId = rx.exec(paid.request.path)?.[1];
  const unpaidId = rx.exec(unpaid.request.path)?.[1];

  if (!paidId || !unpaidId) {
    throw new Error(
      "The recorded invoice fixtures do not carry an invoice id. " +
        "Re-run `pnpm fixtures:generate invoices`."
    );
  }
  return { paidId, unpaidId };
}

const { paidId, unpaidId } = recordedIds();

const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);

function installGuestTokenStub(): void {
  const guest = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionRecordingsDir
  });
  server.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guest.response.body as object, {
        status: guest.response.status
      })
    )
  );
}

async function seedClientSession(): Promise<void> {
  const { queryClient } = await import("../../query/client");
  queryClient.clear();
  installBackgroundStubs();
  installGuestTokenStub();

  const { useSessionStore, useActiveSession } =
    await import("../../session-store");
  const { mapSessionUser } =
    await import("../../session-store/session-store.mappers");

  const token = getFixtureBody<{ access_token: string }>(
    "post-oauth-access-token-client",
    { recordingsDir: sessionRecordingsDir }
  );
  const self = getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
    recordingsDir: sessionRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token as never, true, mapSessionUser(self.data as never));

  await vi.waitFor(() => {
    const session = useActiveSession();
    expect(session.useMeta().isAuthenticated.value).toBe(true);
    expect(session.useContext().activeUser.value?.id).toBeTruthy();
  });
}

async function logoutSession(): Promise<void> {
  const { queryClient } = await import("../../query/client");
  const { useSessionStore, useActiveSession } =
    await import("../../session-store");
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  queryClient.clear();
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
}

/**
 * Serves `GET /api/invoices/{id}` from the chosen recorded case, mutable via
 * `setCase` so a re-read after a state change is observed through a real
 * subsequent GET rather than assumed. Counts every read.
 */
function serveInvoice(initial: Case): {
  setCase: (c: Case) => void;
  reads: () => number;
} {
  let current = initial;
  let reads = 0;
  server.use(
    http.get("*/api/invoices/:id", () => {
      const fixture = getFixture(`get-invoices-id-case-${current}`, {
        recordingsDir
      });
      reads += 1;
      return HttpResponse.json(
        fixture.response.body as Record<string, unknown>,
        { status: fixture.response.status }
      );
    })
  );
  return { setCase: c => void (current = c), reads: () => reads };
}

function observeInvoiceRequests(): { count: () => number; stop: () => void } {
  let count = 0;
  const listener = ({ request }: { request: Request }): void => {
    if (/\/api\/invoices\//.test(request.url)) count += 1;
  };
  server.events.on("request:start", listener);
  return {
    count: () => count,
    stop: () => server.events.removeListener("request:start", listener)
  };
}

const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------

describe("invoices integration — @INV-read (authenticated load)", () => {
  beforeEach(async () => {
    clearSessionCookies();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("loads and parses a paid invoice, deriving a paid state (@INV-read, @INV-state-paid)", async () => {
    serveInvoice("paid");
    const { useInvoice } = await import("../useInvoice");
    const invoice = useInvoice(paidId);

    await vi.waitFor(() => expect(invoice.data.value?.id).toBe(paidId), {
      timeout: 5000
    });

    expect(invoice.data.value?.summary.unpaidAmount).toBe(0);
    expect(invoice.data.value?.summary.paidAmount).toBe(4);
    expect(invoice.meta.value.isPaid).toBe(true);
  });

  it("loads an unpaid invoice, deriving a first-payment-pending state (@INV-read, @INV-state-pending)", async () => {
    serveInvoice("unpaid");
    const { useInvoice } = await import("../useInvoice");
    const invoice = useInvoice(unpaidId);

    await vi.waitFor(
      () => expect(invoice.data.value?.summary.unpaidAmount).toBe(72),
      { timeout: 5000 }
    );

    expect(invoice.meta.value.isPending).toBe(true);
    expect(invoice.meta.value.isPaid).toBe(false);
  });
});

describe("invoices integration — @INV-guest-denied", () => {
  beforeEach(async () => {
    clearSessionCookies();
    await seedClientSession();
    await logoutSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("does not reach the wire for an unauthenticated caller (@INV-guest-denied, @INV-state-availability)", async () => {
    serveInvoice("paid");
    const observed = observeInvoiceRequests();
    const { useActiveSession } = await import("../../session-store");
    const { useInvoice } = await import("../useInvoice");
    const invoice = useInvoice(paidId);

    await invoice.isReady();
    await settle(100);
    observed.stop();

    expect(observed.count()).toBe(0);
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
    expect(invoice.data.value).toStrictEqual([]);
  });
});

describe("invoices integration — @INV-state-error (404)", () => {
  beforeEach(async () => {
    clearSessionCookies();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("surfaces an unknown id as an error state (@INV-state-error)", async () => {
    serveInvoice("not-found");
    const { useInvoice } = await import("../useInvoice");
    const invoice = useInvoice("00000000-0000-0000-0000-000000000000");

    await vi.waitFor(() => expect(invoice.error.value).toBeTruthy(), {
      timeout: 10000
    });

    expect(invoice.data.value).toStrictEqual([]);
  });
});

describe("invoices integration — @INV-refresh / @INV-invalidate", () => {
  beforeEach(async () => {
    clearSessionCookies();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("re-reads the invoice on refetch, picking up the new balance (@INV-refresh)", async () => {
    const invoiceCase = serveInvoice("unpaid");
    const { useInvoice } = await import("../useInvoice");
    const invoice = useInvoice(unpaidId);

    await vi.waitFor(
      () => expect(invoice.data.value?.summary.unpaidAmount).toBe(72),
      { timeout: 5000 }
    );

    invoiceCase.setCase("paid");
    await invoice.refetch();

    await vi.waitFor(
      () => expect(invoice.data.value?.summary.unpaidAmount).toBe(0),
      { timeout: 5000 }
    );
    expect(invoiceCase.reads()).toBeGreaterThanOrEqual(2);
  });

  it("drops the cache on invalidate so the next read re-fetches (@INV-invalidate)", async () => {
    const invoiceCase = serveInvoice("unpaid");
    const { useInvoice } = await import("../useInvoice");
    const invoice = useInvoice(unpaidId);

    await vi.waitFor(
      () => expect(invoice.data.value?.summary.unpaidAmount).toBe(72),
      { timeout: 5000 }
    );

    const before = invoiceCase.reads();
    invoiceCase.setCase("paid");
    await invoice.invalidate();

    await vi.waitFor(
      () => expect(invoice.data.value?.summary.unpaidAmount).toBe(0),
      { timeout: 5000 }
    );
    expect(invoiceCase.reads()).toBeGreaterThan(before);
  });
});
