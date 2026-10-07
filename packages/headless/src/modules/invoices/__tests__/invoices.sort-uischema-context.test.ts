/**
 * @fileoverview invoices — each context publishes its own sort uischema
 *
 * ## Job To Be Done
 * Prove the context layer publishes the sort uischema that matches its
 * context (design 8.3): the order history draws the order sort labels, and the
 * plain invoice list keeps the invoice sort labels.
 *
 * ## What Breaks If These Fail
 * The order history sorts by "ID" where the client expects "Order ID", or the
 * plain invoice list offers order labels for invoices it does not treat as
 * orders.
 */

import { afterEach, describe, expect, it } from "vitest";
import { openCell, resetCells } from "./invoices.unit-helpers";

afterEach(resetCells);

// FE-3237 AC10
describe("AC-27: each invoices context draws its own sort labels", () => {
  it("publishes the order sort uischema on the order history and the invoice sort uischema on the invoice list", () => {
    const orders = openCell("orders").published.schemas.query.sortUischema;
    const invoices = openCell("invoices").published.schemas.query.sortUischema;

    expect(orders.i18n).toBe("form.orders_sort");
    expect(invoices.i18n).toBe("form.invoice_sort");
  });
});
