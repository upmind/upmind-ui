// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — assigning and clearing the payment
 * method (AC-4)
 *
 * ## Job To Be Done
 * Prove `assignPaymentMethod(invoiceId, paymentDetailsId)` issues a real
 * `PATCH /invoices/{id}/payment_details` whose body carries the chosen id,
 * and that clearing sends `payment_details_id: null` as a PRESENT key —
 * never an omitted one. The response is a synthetic `{status:"ok",data:null}`
 * ack: a control/error response, exempt from the recorded-journey-body rule
 * (`code-tests.companion.md`) — the assertion is on the REQUEST body, which
 * no fixture capture is needed to prove.
 *
 * ## What Breaks If These Fail
 * A client's chosen payment method silently fails to save, or "clear to none
 * selected" is indistinguishable from "don't touch it" on the wire.
 */

import { describe, expect, it } from "vitest";
import { useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("invoices — assign a payment method to an invoice (AC-4)", () => {
  it("AC-4 issues PATCH /invoices/{id}/payment_details with the chosen id as a present key", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const target = recorded.unpaid();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await invoices.useMeta().isLoading;
    const observed = observeInvoiceRequests();

    await invoices.useActions().assignPaymentMethod(target.id, "method-123");
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    const patch = observed.all().find(request => request.method === "PATCH");
    expect(patch).toBeDefined();
    expect(new URL(patch!.url).pathname).toBe(
      `/api/invoices/${target.id}/payment_details`
    );
    expect(patch!.body).toMatchObject({ payment_details_id: "method-123" });
  });
});

describe("invoices — clear the assigned payment method back to none selected (AC-4)", () => {
  it("AC-4 sends payment_details_id: null as a PRESENT key, never an omitted one", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const target = recorded.unpaid();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await invoices.useMeta().isLoading;
    const observed = observeInvoiceRequests();

    await invoices.useActions().assignPaymentMethod(target.id, null);
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    const patch = observed.all().find(request => request.method === "PATCH");
    expect(patch).toBeDefined();
    expect(patch!.body).toHaveProperty("payment_details_id");
    expect(
      (patch!.body as { payment_details_id: unknown }).payment_details_id
    ).toBeNull();
  });
});
