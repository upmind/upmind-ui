// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices single read — consolidation/credit fields and line
 * grouping (AC-5), the large-bundle flag (AC-6), pending-payment detection
 * (AC-8), the next-charge date (AC-9), and the balance/unpaid-amount
 * divergence (AC-11)
 *
 * ## Job To Be Done
 * Map a recorded invoice payload through the real `useInvoice` stack and
 * assert the mapped VM.
 *
 * ## Provenance
 * AC-8 (pending payment + awaiting-client) is proven on a GENUINELY REAL
 * recorded row: `recorded.unpaid()` carries 4 REAL pending payments, every
 * one on a gateway whose `type` is `10` (`GatewayTypes.AWAITING_CLIENT`) —
 * this staging account's real history reaches this branch without
 * construction. AC-9 (present) also uses this same real row
 * (`next_charge_date: "2026-09-01"`); AC-9 (absent) uses `recorded.paid()`.
 *
 * AC-5 (consolidation identity/credit fields, bundle groups) and AC-6 (large
 * bundle) are NOT reachable from this staging account's real history —
 * `invoices.fixtures.ts`'s own disclosure log confirms zero consolidation
 * invoices, zero credit notes, and no bundle over the large-bundle threshold
 * at capture time. Each such test below constructs its condition from
 * `recorded.unpaid()` with an EXPLICITLY LABELLED set of fields toggled — the
 * accepted precedent in `client-email-history.mappers.test.ts` (a
 * bounced+error row neither staging account has ever produced). Every toggle
 * is named at its call site; nothing here is presented as a capture.
 *
 * ## What Breaks If These Fail
 * A client cannot tell what a consolidation invoice merged into, cannot tell
 * a large bundle from a truncated page of line items, cannot tell a pending
 * payment awaiting them from one awaiting the gateway, sees an epoch date
 * instead of "no next charge", or cannot tell their outstanding balance from
 * the raw (pre-credit) unpaid amount.
 */

import { describe, expect, it, vi } from "vitest";
import { useInvoice } from "..";
import {
  installInvoiceHandlers,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import type { WireInvoice } from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

function envelope(data: WireInvoice) {
  return {
    status: "ok",
    data,
    total: null,
    error: null,
    messages: null,
    meta: null
  };
}

async function openMapped(row: WireInvoice) {
  await seedClientSession();
  const handlers = installInvoiceHandlers();
  handlers.setOneBody(envelope(row));
  const single = useInvoice().withId(row.id);
  await vi.waitFor(() => expect(single.useMeta().isLoading.value).toBe(false));
  return single.useContext().data.value!;
}

// -----------------------------------------------------------------------------

describe("invoices single read — pending payment + awaiting-client (AC-8, REAL recorded row)", () => {
  it("AC-8 detects every real pending payment and marks it awaiting the client (gateway type 10)", async () => {
    const row = recorded.unpaid();
    expect(row.payments.length).toBeGreaterThan(0);
    expect(row.payments.every(payment => payment.pending)).toBe(true);
    expect(row.payments.every(payment => payment.gateway?.type === 10)).toBe(
      true
    );

    const mapped = await openMapped(row);
    expect(mapped.payments.length).toBe(row.payments.length);
    for (const payment of mapped.payments) {
      expect(payment.isAwaitingClient).toBe(true);
    }
  });

  it("AC-8 (constructed — one toggle) a pending payment on a gateway NOT awaiting the client carries no such signal", async () => {
    const row = recorded.unpaid();
    const toggled: WireInvoice = {
      ...row,
      payments: [{ ...row.payments[0], gateway: { type: 1 } }]
    };

    const mapped = await openMapped(toggled);
    expect(mapped.payments[0].isAwaitingClient).toBe(false);
  });
});

describe("invoices single read — the next charge date (AC-9)", () => {
  it("AC-9 exposes the REAL next_charge_date when the invoice carries one", async () => {
    const row = recorded.unpaid();
    expect(row.next_charge_date).toBeTruthy();

    const mapped = await openMapped(row);
    expect(mapped.nextChargeDate).toBeTruthy();
  });

  it("AC-9 resolves to absent, never an epoch date or a thrown error, when the field is absent", async () => {
    const row = { ...recorded.paid(), next_charge_date: null };

    const mapped = await openMapped(row);
    expect(mapped.nextChargeDate?.date).toBeFalsy();
  });
});

describe("invoices single read — consolidation identity and credit fields (AC-5, constructed)", () => {
  it("AC-5 (constructed — is_consolidation + consolidation_invoice_id + credit_invoice_id toggled) exposes the merged-into document, the credit-note partner, and the queued-credit amount", async () => {
    const row = recorded.unpaid();
    const toggled: WireInvoice = {
      ...row,
      is_consolidation: true,
      consolidation_invoice_id: "22222222-3333-4444-5555-666666666666",
      consolidation_status: 1,
      credit_invoice_id: "33333333-4444-5555-6666-777777777777",
      partial_amount_to_credit_converted: 42,
      partial_amount_to_credit_formatted: "£42.00",
      partial_amount_credited: 10,
      to_be_credited: true
    };

    const mapped = await openMapped(toggled);
    expect(mapped.consolidation.isConsolidation).toBe(true);
    expect(mapped.consolidation.consolidationInvoiceId).toBe(
      toggled.consolidation_invoice_id
    );
    expect(mapped.consolidation.creditInvoiceId).toBe(
      toggled.credit_invoice_id
    );
    expect(mapped.consolidation.amountToCreditConverted).toBe(42);
  });

  it("AC-5 (constructed — products.contracts_product_id/contract_id toggled on real cloned line items) groups line items one group per originating subscription, with un-linked lines in a trailing null-keyed group", async () => {
    const row = recorded.unpaid();
    const realProduct = row.products[0];
    const toggled: WireInvoice = {
      ...row,
      products: [
        {
          ...realProduct,
          id: "p1",
          contract_id: "c1",
          contracts_product_id: "cp1"
        },
        {
          ...realProduct,
          id: "p2",
          contract_id: "c1",
          contracts_product_id: "cp1"
        },
        {
          ...realProduct,
          id: "p3",
          contract_id: "c2",
          contracts_product_id: "cp2"
        },
        {
          ...realProduct,
          id: "p4",
          contract_id: null,
          contracts_product_id: null
        }
      ]
    };

    const mapped = await openMapped(toggled);
    expect(mapped.bundle.groups.length).toBe(3);
    const unlinked = mapped.bundle.groups.find(
      group => group.contractsProductId === null && group.contractId === null
    );
    expect(unlinked).toBeDefined();
    expect(unlinked!.products.map(p => p.id)).toContain("p4");
  });
});

describe("invoices single read — the large-bundle flag (AC-6, constructed)", () => {
  it("AC-6 (constructed — products_count toggled above the floor) derives isLarge from products_count, never from the array length", async () => {
    const row = recorded.unpaid();
    const toggled: WireInvoice = {
      ...row,
      products_count: 6,
      products: row.products.slice(0, 1)
    };

    const mapped = await openMapped(toggled);
    expect(mapped.bundle.productCount).toBe(6);
    expect(mapped.bundle.isLarge).toBe(true);
    expect(mapped.bundle.groups.length).not.toBe(6);
  });

  it("AC-6 (constructed) resolves isLarge false at or below the threshold", async () => {
    const row = recorded.unpaid();
    const toggled: WireInvoice = { ...row, products_count: 5 };

    const mapped = await openMapped(toggled);
    expect(mapped.bundle.isLarge).toBe(false);
  });
});

describe("invoices single read — balance diverges from the raw unpaid amount (AC-11, constructed)", () => {
  it("AC-11 (constructed — balance toggled distinct from unpaid_amount) exposes both numbers distinctly on the summary", async () => {
    const row = recorded.unpaid();
    const toggled: WireInvoice = {
      ...row,
      is_consolidation: true,
      balance: 30,
      balance_formatted: "£30.00"
    };
    expect(toggled.balance).not.toBe(toggled.unpaid_amount);

    const mapped = await openMapped(toggled);
    expect(mapped.summary.balance).toBe(30);
    expect(mapped.summary.unpaidAmount).toBe(row.unpaid_amount);
    expect(mapped.summary.balance).not.toBe(mapped.summary.unpaidAmount);
  });
});
