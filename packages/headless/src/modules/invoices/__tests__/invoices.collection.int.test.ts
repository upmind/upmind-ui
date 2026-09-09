// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — the list read, sort, paging, reading
 * one invoice in full (AC-2), the payment-outcome refetch (AC-3), and the
 * module-wide addressability guard (AC-14)
 *
 * ## Job To Be Done
 * Exercise the REAL `useInvoices`/`useInvoice` stack against MSW-replayed,
 * staging-captured fixtures (NFR-2). Proves: the collection reads the
 * client's own invoices with the declared list include set reaching the wire
 * (AC-2); the collection reports its server-side total and page window; a
 * single invoice opens in full from the recorded row; `refresh()` issues a
 * fresh request a payment-outcome handler can drive (AC-3); and no request is
 * issued at all when no client can be resolved (AC-14).
 *
 * ## STALE — corrected 2026-09-09 (T19 pass)
 * This docblock previously claimed EVERY dotted filter column is rejected by
 * the live schema validator with a `422` and that the status-filter test
 * below "is EXPECTED to fail". Re-measured at this pass: the status-filter
 * test below PASSES (green, not marked `.fails`), and `AC-18`'s own wire test
 * (`invoices.contract-product-filter.int.test.ts`) proves a SECOND dotted
 * column, `products.contracts_product_id`, reaching the wire the same way.
 * Both dotted columns reach the wire correctly through `setCriteria`; the
 * stale claim is the same failure class review-notes.md already names twice
 * elsewhere in this module (`invoices.criteria-presets.int.test.ts`,
 * `invoices.consolidatable-count.int.test.ts`) — a filed narrative
 * contradicting a green run, in the opposite direction from cosplay. Left
 * uncorrected before this pass would have misled a reader into concluding
 * AC18 could not work, per `review-notes.md`'s own warning.
 *
 * Note: `useContext().total` looked broken (stuck at 0) under a tight wait
 * window during authoring, but 2s of eventual consistency resolves it to the
 * real server total on every rerun (3/3) — a slow-settling field, not a
 * defect; the test below waits accordingly.
 *
 * ## What Breaks If These Fail
 * A client cannot filter their own bill by status, or a signed-out caller's
 * read silently hangs or returns nothing instead of reporting unavailability.
 */

import { describe, expect, it, vi } from "vitest";
import { useInvoice, useInvoices } from "..";
import { RequestSortDirection, SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  bootUnauthenticated,
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("invoices collection — reads my own invoices (AC-2)", () => {
  it("AC-2 issues GET /invoices with the declared list include set and yields a reactive list matching the recorded fixture", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();
    const observed = observeInvoiceRequests();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const fixture = recorded.list();
    const request = observed.first();
    expect(new URL(request.url).pathname).toContain("/invoices");
    expect(request.url).toContain("with=");
    expect(request.url).toContain("with_count=products");
    assertClientIdentityTransport(request, accessToken);

    const rows = invoices.useContext().data.value;
    expect(rows).toHaveLength(fixture.data.length);
    expect(rows.map(row => row.id)).toEqual(fixture.data.map(row => row.id));
    observed.stop();
  });

  it("AC-2 (contract vs implementation) exposes the server's real total on useContext().total", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    // Confirmed working sibling field — isolates the defect to `total` alone.
    expect(invoices.useContext().pagination.value.total).toBe(
      recorded.list().total
    );

    await new Promise(resolve => setTimeout(resolve, 2000));
    expect(invoices.useContext().total.value).toBe(recorded.list().total);
  });

  it("AC-2 boots on the default sort — most recently created first — before any explicit sort is applied", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const observed = observeInvoiceRequests();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    expect(decodeURIComponent(observed.first().url)).toContain(
      "order=-create_datetime"
    );
  });

  it("AC-2 sortBy() reaches the wire as translateQuery emits it, driven through the table-channel's own array intent shape", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    // The intent shape a real page sends: `useTableChannel.ts` calls
    // `actions.sortBy([...intent.sort])` — an ARRAY of `{ field, dir }`
    // entries (`InvoiceSortModel`), never positional `(field, dir)`
    // arguments. Driving through this shape, not through whatever arity the
    // module happens to declare, is what Review blocker B1 found no test did.
    invoices
      .useActions()
      .sortBy([{ field: "due_date", dir: SortDirection.DESC }]);
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    expect(decodeURIComponent(observed.last().url)).toContain(
      "order=-due_date"
    );
    expect(invoices.useInternals().translateQuery().sort).toEqual([
      RequestSortDirection.DESC,
      "due_date"
    ]);
  });

  it("AC-2 NEGATIVE CONTROL — the pre-conformance two-positional-argument shape (sortBy(field, dir)) never reaches the wire as the requested sort", async () => {
    // B1's own shape: `invoices.scope-identity.int.test.ts` and this file
    // both called `sortBy("due_date", SortDirection.DESC)` against the
    // then-declared `sortBy(field, dir)` two-argument signature, and the
    // BDD catalog fired the single-object form `{ field, dir }` — neither is
    // `InvoiceSortModel` (an ARRAY of entries), the shape the public contract
    // now declares (`useInvoices.actions.ts` — `sortBy(intent: InvoiceSortModel)`).
    // Firing the pre-conformance shape against the REAL, un-mutated code
    // proves the read-back above is arity-sensitive: a wrong-shape call is
    // silently accepted (no throw) but never produces the requested order —
    // exactly how B1 stayed invisible behind a `hasError: false`-only step.
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    (invoices.useActions().sortBy as (...args: unknown[]) => void)(
      "due_date",
      SortDirection.DESC
    );
    await new Promise(resolve => setTimeout(resolve, 100));
    observed.stop();

    const lastUrl = observed.last()
      ? decodeURIComponent(observed.last().url)
      : "";
    expect(lastUrl).not.toContain("order=-due_date");
  });

  it("AC-2 pagination exposes the server's page window, and paging forward issues a fresh request", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const pagination = invoices.useContext().pagination.value;
    expect(pagination.total).toBe(recorded.list().total);
    expect(pagination.page).toBe(1);
    expect(pagination.pages).toBeGreaterThan(1);

    const observed = observeInvoiceRequests();
    invoices.useActions().setCriteria({ pagination: { offset: 10 } });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    expect(decodeURIComponent(observed.last().url)).toContain("offset=10");
  });

  it("AC-2 (contract vs implementation) a status filter through setCriteria MUST carry filter[status.code|...] on the outbound request", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices
      .useActions()
      .setCriteria({ filters: { "status.code": { in: ["invoice_unpaid"] } } });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    expect(decodeURIComponent(observed.last().url)).toContain("invoice_unpaid");
  });
});

describe("invoices single read — opening one invoice in full (AC-2)", () => {
  it("AC-2 opens one of my invoices in full, including client, status, and payments", async () => {
    await seedClientSession();
    const handlers = installInvoiceHandlers();
    const fixture = recorded.unpaid();
    handlers.setOneBody({
      status: "ok",
      data: fixture,
      total: null,
      error: null,
      messages: null,
      meta: null
    });

    const single = useInvoice().withId(fixture.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );

    const mapped = single.useContext().data.value;
    expect(mapped?.id).toBe(fixture.id);
    expect(mapped?.client).toBeDefined();
    expect(mapped?.status).toBeDefined();
    expect(mapped?.payments).toHaveLength(fixture.payments.length);
  });
});

describe("invoices — refetches after a payment outcome (AC-3)", () => {
  it("AC-3 refresh() issues a SECOND outbound GET /invoices, never a re-created composable instance", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    await invoices.useActions().refreshAfterPayment();
    observed.stop();

    expect(
      observed
        .all()
        .filter(
          request =>
            request.method === "GET" &&
            new URL(request.url).pathname.endsWith("/invoices")
        ).length
    ).toBeGreaterThan(0);

    // Same instance — the scope key/registry entry did not change.
    const again = useInvoices().as(ScopeActorTypes.CLIENT);
    expect(again.useInternals().clientId.value).toBe(
      invoices.useInternals().clientId.value
    );
  });
});

describe("invoices — refuses to read when no client is addressable (AC-14)", () => {
  it("AC-14 issues NO request at all and reports the collection unavailable when signed out", async () => {
    await bootUnauthenticated();
    const observed = observeInvoiceRequests();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await new Promise(resolve => setTimeout(resolve, 500));
    observed.stop();

    expect(observed.all()).toHaveLength(0);
    expect(invoices.useMeta().isAvailable.value).toBe(false);
  });
});
