// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — the three criteria presets (AC-2's
 * consolidatable count, AC-7's credit notes, AC-10's unpaid existence)
 *
 * ## Job To Be Done
 * Prove each declared preset action reaches the wire with its documented
 * filter columns, and that `hasUnpaid` derives from the server's own count.
 *
 * ## Confirmed contract-vs-implementation defects (NOT worked around here)
 * The first two tests below are written to the CONTRACT
 * (`design.md`/`invoices.types.ts`) and are EXPECTED to fail. Confirmed
 * black-box (request-observed, never by reading schema/service source):
 *
 * 1. `filterConsolidatable()` issues NO request — the same underlying
 *    `additionalProperties` schema rejection every dotted filter column hits
 *    (see `invoices.collection.int.test.ts`'s fileoverview): the preset's
 *    model uses `"status.code"` and `"category.slug"`, both dotted.
 * 2. `filterCreditNotes()` issues NO request for the same reason
 *    (`"category.slug"` is dotted) — AC-7's entire credit-notes mechanic is
 *    unreachable through the public composable surface as shipped.
 *
 * These are filed as failures in this dispatch's hand-off — never weakened,
 * skipped, or routed around.
 *
 * ## Correction (verifier ABSENT repair, this dispatch)
 * A third defect was previously recorded here for AC-10 (`useMeta().hasUnpaid`
 * resolving `false` with no outbound request). The prior AC-10 test only
 * asserted a bare substring match on `"count"`, which the list read's own
 * `with_count=products` include also contains, so it could pass for the wrong
 * reason without ever proving the dedicated read fired or that the boolean
 * tracked anything real. The AC-10 tests below are rewritten to identify the
 * dedicated read by its own declared shape (`filter[status.code|in]` +
 * `limit=1`, never `with_count`) — that half IS now confirmed: the dedicated
 * request genuinely fires, on-demand, only once `hasUnpaid` is read.
 *
 * ## A NEW confirmed contract-vs-implementation defect (NOT worked around here)
 * 4. `hasUnpaid` never resolves `true`. Empirically (black-box,
 *    request-observed, never by reading service/meta source): the dedicated
 *    request fires correctly and — confirmed against the REAL recorded list
 *    fixture (`total: 1086`) served verbatim for that exact request, with a
 *    3-second settle window matching the documented eventual-consistency
 *    quirk in `invoices.collection.int.test.ts` — `hasUnpaid.value` stays
 *    `false` regardless of the dedicated response's total. The
 *    total-tracks-when-total-is-zero direction is separately confirmed
 *    correct (the third test below), so the boolean is not simply frozen;
 *    it specifically fails to ever flip `true`. Filed as a failure in this
 *    dispatch's hand-off — never weakened, skipped, or routed around.
 *
 * ## What Breaks If These Fail
 * A client cannot see how many invoices are consolidatable, cannot read
 * their credit notes at all, or is told they owe something (or nothing)
 * based on the wrong signal — three of this story's eleven `client x self`
 * acceptance criteria.
 */

import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import { server } from "./setup.integration";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("invoices — count how many of my invoices could be consolidated (AC-2)", () => {
  it("AC-2 filterConsolidatable() issues a GET /invoices request carrying the consolidatable preset's filter columns", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterConsolidatable();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    expect(decodeURIComponent(observed.last().url)).toContain(
      "is_consolidation"
    );
  });
});

describe("invoices — read my credit notes as a filtered view (AC-7)", () => {
  it("AC-7 filterCreditNotes() issues a GET /invoices request carrying the credit-note category values", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterCreditNotes();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    expect(decodeURIComponent(observed.last().url)).toMatch(/credit_note/);
  });
});

describe("invoices — find out whether I owe anything at all (AC-10)", () => {
  it("AC-10 reading hasUnpaid issues a dedicated request carrying filter[status.code|in] and limit=1 — never satisfied by the list request or its with_count include", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    const isDedicated = (url: string) =>
      new URL(url).searchParams.get("limit") === "1";

    // On-demand: nothing has asked for hasUnpaid yet, so no dedicated
    // request exists, even though the list has already loaded.
    expect(observed.all().some(request => isDedicated(request.url))).toBe(
      false
    );

    // Touch the computed to force evaluation, matching how a real consumer
    // (a template binding) would read it.
    void invoices.useMeta().hasUnpaid.value;
    await vi.waitFor(() =>
      expect(observed.all().some(request => isDedicated(request.url))).toBe(
        true
      )
    );
    observed.stop();

    const dedicated = observed.all().find(request => isDedicated(request.url));
    expect(dedicated).toBeDefined();
    const decoded = decodeURIComponent(dedicated!.url);
    expect(decoded).toContain("filter[status.code|in]");
    // The list request's with_count=products include is precisely what the
    // prior, weaker assertion (a bare substring match on "count") could be
    // satisfied by. The dedicated read never carries it.
    expect(decoded).not.toContain("with_count");

    // A genuine list request (refresh()) observed in the SAME window is
    // never mistaken for the dedicated read.
    const secondObserved = observeInvoiceRequests();
    await invoices.useActions().refresh();
    await vi.waitFor(() => expect(secondObserved.all().length).toBeGreaterThan(0));
    secondObserved.stop();
    const listRequest = secondObserved.first();
    expect(listRequest).toBeDefined();
    expect(isDedicated(listRequest.url)).toBe(false);
    expect(decodeURIComponent(listRequest.url)).toContain("with_count=products");
  });

  it("AC-10 hasUnpaid tracks the dedicated request's server total, with the visible row array held constant", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const listFixture = recorded.list();
    const constantRows = listFixture.data.slice(0, 2);
    server.use(
      http.get("*/invoices", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("limit") === "1") {
          return HttpResponse.json(
            {
              status: "ok",
              data: constantRows,
              total: 50,
              error: null,
              messages: null,
              meta: null
            },
            { headers: { "x-total-count": "50" } }
          );
        }
        return HttpResponse.json(listFixture);
      })
    );

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    void invoices.useMeta().hasUnpaid.value;
    await vi.waitFor(() =>
      expect(
        observed
          .all()
          .some(request => new URL(request.url).searchParams.get("limit") === "1")
      ).toBe(true)
    );
    observed.stop();

    // Touch once to trigger the on-demand read, then allow the query's own
    // eventual-consistency settling window (the same quirk documented in
    // invoices.collection.int.test.ts for useContext().total) before the
    // final assertion. total is 50 with only 2 visible rows: hasUnpaid must
    // resolve true.
    await new Promise(resolve => setTimeout(resolve, 2500));
    expect(invoices.useMeta().hasUnpaid.value).toBe(true);
  });

  it("AC-10 hasUnpaid is false when the dedicated request's own total is zero, even with the SAME non-empty row array as the true case above", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const listFixture = recorded.list();
    const constantRows = listFixture.data.slice(0, 2);
    server.use(
      http.get("*/invoices", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("limit") === "1") {
          return HttpResponse.json(
            {
              status: "ok",
              data: constantRows,
              total: 0,
              error: null,
              messages: null,
              meta: null
            },
            { headers: { "x-total-count": "0" } }
          );
        }
        return HttpResponse.json(listFixture);
      })
    );

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    void invoices.useMeta().hasUnpaid.value;
    await vi.waitFor(() =>
      expect(
        observed
          .all()
          .some(request => new URL(request.url).searchParams.get("limit") === "1")
      ).toBe(true)
    );
    observed.stop();

    // The row array is IDENTICAL to the true case above (2 real rows); only
    // total changed, to zero. hasUnpaid must resolve false — a
    // row-array-truthy derivation would get this backwards, since the array
    // itself never changed.
    await new Promise(resolve => setTimeout(resolve, 2500));
    expect(invoices.useMeta().hasUnpaid.value).toBe(false);
  });
});
