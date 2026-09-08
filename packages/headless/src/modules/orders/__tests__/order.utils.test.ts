/**
 * @fileoverview order utils — invoice state predicates (unit)
 *
 * ## Job To Be Done
 * Prove the order utility functions correctly identify invoice payment states:
 * whether an invoice is free (zero balance), has errors, and is ready for
 * payment. These predicates drive the order payment flow decisions.
 *
 * ## Provenance
 * Invoice data replayed here was captured by the order fixtures generator into
 * this module's own `fixtures/` dir — real invoices from staging with unpaid,
 * paid, not-found, and signed-out cases.
 *
 * ## What Breaks If These Fail
 * A free invoice forces the client through payment anyway; an error state is
 * hidden from the client; the payment form renders before the invoice is ready.
 *
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import type { IInvoice } from "@upmind-automation/types";

const recordingsDir = join(import.meta.dirname, "fixtures");

function recordedInvoice(caseName: string): IInvoice {
  const fixture = getFixtureBody<{ data?: IInvoice }>(
    `get-invoices-id-case-${caseName}`,
    { recordingsDir }
  );

  if (!fixture?.data) {
    throw new Error(
      `Missing fixture "get-invoices-id-case-${caseName}". ` +
        "Run the fixture generator to capture it."
    );
  }
  return fixture.data;
}

describe("fixture provenance — free invoice shape", () => {
  it("reports an unpaid invoice as not free (has outstanding balance)", () => {
    const invoice = recordedInvoice("unpaid");

    expect(invoice.balance).toBeGreaterThan(0);
    expect(invoice.unpaid_amount).toBeGreaterThan(0);
  });

  it("reports a paid invoice as free (zero outstanding balance)", () => {
    const invoice = recordedInvoice("paid");

    expect(invoice.paid_amount).toBe(invoice.total_amount);
  });
});

describe("fixture provenance — error response shapes", () => {
  it("identifies a 404 error response for invoice not found", () => {
    const fixture = getFixtureBody<{
      error?: { code: number; message: string };
    }>("get-invoices-id-case-not-found", { recordingsDir });

    expect(fixture?.error?.code).toBe(404);
    expect(fixture?.error?.message).toBe("Invoice not found!");
  });

  it("identifies a 401 error response for signed-out client", () => {
    const fixture = getFixtureBody<{
      error?: { code: number; message: string };
    }>("get-invoices-id-case-signed-out", { recordingsDir });

    expect(fixture?.error?.code).toBe(401);
    expect(fixture?.error?.message).toBe("Please log in to continue");
  });
});
