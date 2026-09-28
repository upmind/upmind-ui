// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the manager publishes the order conditions
 * (AC-18, design 8.5)
 *
 * ## Job To Be Done
 * Prove `useClientOrder().useMeta()` publishes each design 8.5 condition and
 * the pay and cancel gates from a recorded single read, on the true branch and
 * the false branch. Each expected value is a literal of the truth table.
 *
 * ## Provenance
 * Each order is a recorded section 8.1 single read, served verbatim on its own
 * id: paid, unpaid, part-paid, overdue, cancelled-none-paid and refunded. The
 * gateway read serves the recorded online-gateway capture of the order brand.
 * Declared construction (design 8.8, "cancelled part-paid"): the recorded
 * cancelled read with `paid_amount` and `unpaid_amount_converted` from the
 * recorded part-paid read.
 *
 * ## What Breaks If These Fail
 * The order screen shows a wrong status badge, or hides "Pay" or "Cancel" on
 * an order that can take the action, or offers it on one that cannot.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientOrder } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capturedOrder,
  seedClientSession,
  serveRecordedOrder
} from "./client-orders.int-helpers";
import type { OrderEnvelope } from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

type Conditions = {
  isDue: boolean;
  isPayable: boolean;
  isCancellable: boolean;
  isOverdue: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  isPartiallyPaid: boolean;
  canPay: boolean;
  canCancel: boolean;
};

async function conditionsOf(envelope: OrderEnvelope): Promise<Conditions> {
  await seedClientSession();
  serveRecordedOrder(envelope);
  const manager = useClientOrder()
    .as(ScopeActorTypes.SELF)
    .withId(envelope.data.id as string);
  const meta = manager.useMeta();
  await vi.waitFor(() => {
    expect(meta.isLoading.value).toBe(false);
    expect(manager.useContext().data.value?.id).toBe(envelope.data.id);
  });
  return {
    isDue: meta.isDue.value,
    isPayable: meta.isPayable.value,
    isCancellable: meta.isCancellable.value,
    isOverdue: meta.isOverdue.value,
    isPaid: meta.isPaid.value,
    isCancelled: meta.isCancelled.value,
    isPartiallyPaid: meta.isPartiallyPaid.value,
    canPay: meta.canPay.value,
    canCancel: meta.canCancel.value
  };
}

const NONE: Conditions = {
  isDue: false,
  isPayable: false,
  isCancellable: false,
  isOverdue: false,
  isPaid: false,
  isCancelled: false,
  isPartiallyPaid: false,
  canPay: false,
  canCancel: false
};

const DUE: Conditions = {
  ...NONE,
  isDue: true,
  isPayable: true,
  isCancellable: true,
  canPay: true,
  canCancel: true
};

// -----------------------------------------------------------------------------

describe("client-orders — the manager publishes the order conditions (AC-18)", () => {
  it("a recorded PAID order: isPaid true, both gates closed", async () => {
    expect(
      await conditionsOf(capturedOrder("get-invoices-id-case-order-paid"))
    ).toEqual({
      ...NONE,
      isPaid: true
    });
  });

  it("a recorded CANCELLED order: isCancelled true, both gates closed", async () => {
    expect(
      await conditionsOf(
        capturedOrder("get-invoices-id-case-order-cancelled-none-paid")
      )
    ).toEqual({
      ...NONE,
      isCancelled: true
    });
  });

  it("a recorded UNPAID order: due, payable, cancellable, and both gates open", async () => {
    expect(
      await conditionsOf(capturedOrder("get-invoices-id-case-order-unpaid"))
    ).toEqual(DUE);
  });

  it("a recorded PART-PAID order: isPartiallyPaid true, and both gates open", async () => {
    expect(
      await conditionsOf(capturedOrder("get-invoices-id-case-order-part-paid"))
    ).toEqual({
      ...DUE,
      isPartiallyPaid: true
    });
  });

  it("a recorded OVERDUE order: isOverdue true, and both gates open", async () => {
    expect(
      await conditionsOf(capturedOrder("get-invoices-id-case-order-overdue"))
    ).toEqual({
      ...DUE,
      isOverdue: true
    });
  });

  it("a recorded REFUNDED order: every condition false", async () => {
    expect(
      await conditionsOf(capturedOrder("get-invoices-id-case-order-refunded"))
    ).toEqual(NONE);
  });

  it("the cancelled part-paid construction: isCancelled true, isPartiallyPaid false, both gates closed", async () => {
    const cancelled = capturedOrder(
      "get-invoices-id-case-order-cancelled-none-paid"
    );
    const partPaid = capturedOrder("get-invoices-id-case-order-part-paid");
    expect(
      await conditionsOf({
        ...cancelled,
        data: {
          ...cancelled.data,
          paid_amount: partPaid.data.paid_amount,
          unpaid_amount_converted: partPaid.data.unpaid_amount_converted
        }
      })
    ).toEqual({ ...NONE, isCancelled: true });
  });
});
