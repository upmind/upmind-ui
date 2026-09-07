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
 * All three tests below are written to the CONTRACT
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
 * 3. `useMeta().hasUnpaid` resolves to `false` with NO outbound request at
 *    all, on a real account this story's own fixtures show DOES carry
 *    unpaid/overdue invoices — the dedicated always-on count query AC-10
 *    requires is never issued.
 *
 * These are filed as failures in this dispatch's hand-off — never weakened,
 * skipped, or routed around. They share ONE root cause worth a single
 * developer dispatch: every declared filter column whose name contains a
 * literal `.` (`status.code`, `category.slug`, `contracts.id`,
 * `products.contracts_product_id`) is unreachable via `setCriteria` or any
 * preset action built on it.
 *
 * ## What Breaks If These Fail
 * A client cannot see how many invoices are consolidatable, cannot read
 * their credit notes at all, and cannot find out whether they owe anything —
 * three of this story's eleven `client x self` acceptance criteria.
 */

import { describe, expect, it, vi } from "vitest";
import { useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  seedClientSession
} from "./invoices.int-helpers";
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
  it("AC-10 hasUnpaid derives from a dedicated count request, never from the visible row array", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    // Touch the computed to force evaluation, matching how a real consumer
    // (a template binding) would read it.
    void invoices.useMeta().hasUnpaid.value;
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const countRequest = observed
      .all()
      .find(request => decodeURIComponent(request.url).includes("count"));
    expect(countRequest).toBeDefined();
  });
});
