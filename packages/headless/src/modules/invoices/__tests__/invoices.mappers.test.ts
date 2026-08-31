// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices mapper unit tests — mapInvoice / mapPayments
 *
 * ## Job To Be Done
 * Pin the pure transform from the raw platform invoice record to the
 * customer-facing shape: identity + money summary carry across, the embedded
 * (frozen) client survives, an absent address maps to none, and each payment
 * row resolves its pending/successful meaning, its card details, and its order.
 *
 * ## What Breaks If These Fail
 * The customer panel shows a wrong balance, a stale client, a crash on a
 * wallet/guest payment with no saved card, or declined attempts out of order.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapInvoice } from "..";
import type { IInvoice, IPayment } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

function rawInvoice(kase: "paid" | "unpaid"): IInvoice {
  const body = getFixtureBody<{ data: IInvoice }>(
    `get-invoices-id-case-${kase}`,
    {
      recordingsDir
    }
  );
  if (!body?.data) {
    throw new Error(
      `Missing fixture get-invoices-id-case-${kase}. Run \`pnpm fixtures:generate invoices\`.`
    );
  }
  return body.data;
}

const paidRaw = rawInvoice("paid");
const unpaidRaw = rawInvoice("unpaid");

// -----------------------------------------------------------------------------

describe("mapInvoice — @INV-map-shape", () => {
  it("carries identity and the money summary from the raw record", () => {
    const mapped = mapInvoice(paidRaw);

    expect(mapped.id).toBe(paidRaw.id);
    expect(mapped.number).toBe("QAT-INV-00007");
    expect(mapped.status).toBe("invoice_paid");
    expect(mapped.locked).toBe(false);
    expect(mapped.summary.paidAmount).toBe(4);
    expect(mapped.summary.unpaidAmount).toBe(0);
    expect(mapped.summary.total).toBe("£4.00");
    expect(mapped.summary.subtotal).toBe("£4.00");
    expect(mapped.currency.code).toBe("GBP");
  });

  it("maps the line items and the tax summary of an unpaid invoice", () => {
    const mapped = mapInvoice(unpaidRaw);

    expect(mapped.products).toHaveLength(1);
    expect(mapped.summary.unpaidAmount).toBe(72);
    expect(mapped.summary.taxes.length).toBeGreaterThan(0);
  });
});

describe("mapInvoice — @INV-map-frozen", () => {
  it("keeps the client embedded on the record, not a live join", () => {
    const mapped = mapInvoice(paidRaw);

    expect(mapped.client).toBeTruthy();
    expect(mapped.client.id).toBe(paidRaw.client.id);
  });
});

describe("mapInvoice — @INV-map-optional-address", () => {
  it("maps to no address when the record carries none", () => {
    const withoutAddress = { ...paidRaw, address: null } as IInvoice;
    expect(mapInvoice(withoutAddress).address).toBeUndefined();
  });

  it("maps an address when the record carries one", () => {
    const address = {
      id: "addr-1",
      client_id: "client-1",
      address_1: "10 Downing Street",
      city: "London",
      postcode: "SW1A 2AA"
    } as unknown as IInvoice["address"];
    const mapped = mapInvoice({ ...paidRaw, address } as IInvoice);

    expect(mapped.address).toBeDefined();
    expect(mapped.address?.title).toBe("10 Downing Street");
  });
});

describe("mapPayments (via mapInvoice) — payment meaning and order", () => {
  const realPayment = paidRaw.payments[0];

  it("marks a captured, non-pending payment successful (@INV-map-payment-success)", () => {
    const mapped = mapInvoice(paidRaw);

    expect(mapped.payments).toHaveLength(1);
    expect(mapped.payments[0].meta.isSuccessful).toBe(true);
    expect(mapped.payments[0].meta.isPending).toBe(false);
    expect(mapped.payments[0].amountFormatted).toBe("£4.00");
  });

  it("marks a pending payment pending and not successful (@INV-map-payment-pending)", () => {
    const pending: IPayment = {
      ...realPayment,
      pending: true,
      captured: 0
    };
    const raw = { ...paidRaw, payments: [pending] } as IInvoice;

    expect(mapInvoice(raw).payments[0].meta).toStrictEqual({
      isPending: true,
      isSuccessful: false
    });
  });

  it("resolves card details when a saved card funded the payment", () => {
    const withCard: IPayment = {
      ...realPayment,
      payment_details: {
        ...(realPayment.payment_details as object),
        card_type: "visa",
        card_last4: "4242"
      } as IPayment["payment_details"]
    };
    const raw = { ...paidRaw, payments: [withCard] } as IInvoice;
    const mapped = mapInvoice(raw).payments[0];

    expect(mapped.cardType).toBe("visa");
    expect(mapped.cardLast4).toBe("4242");
  });

  it("carries no card details for a payment with no saved card (@INV-map-payment-cardless)", () => {
    const mapped = mapInvoice(paidRaw).payments[0];

    expect(mapped.cardType == null).toBe(true);
    expect(mapped.cardLast4 == null).toBe(true);
  });

  it("orders payments newest first (@INV-map-payments-order)", () => {
    const older: IPayment = {
      ...realPayment,
      id: "older",
      created_at: "2020-01-01 00:00:00"
    };
    const newer: IPayment = {
      ...realPayment,
      id: "newer",
      created_at: "2024-12-31 23:59:59"
    };
    const raw = { ...paidRaw, payments: [older, newer] } as IInvoice;

    expect(mapInvoice(raw).payments.map(p => p.id)).toStrictEqual([
      "newer",
      "older"
    ]);
  });

  it("maps to an empty list when the invoice has no payments", () => {
    expect(mapInvoice(unpaidRaw).payments).toStrictEqual([]);
  });
});
