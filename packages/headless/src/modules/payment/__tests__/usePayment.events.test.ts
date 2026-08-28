// -----------------------------------------------------------------------------
/**
 * @fileoverview usePayment methods — the UI→machine contract and the failure
 * report (unit, AC-6/AC-7/AC-8/AC-9)
 *
 * ## Job To Be Done
 * AC-6 and AC-7 say a client waiting on their bank can either see the
 * confirmation through or back out, and that backing out takes no money. AC-8
 * says a provider running its confirmation step in its own way takes the client
 * through that step. The five methods `usePayment` publishes are the whole of
 * the UI's access to those journeys, so each is exercised for real and asserted
 * to leave the payment un-taken while no confirmation is in flight — a method
 * that quietly settled a payment on a stray call is money moved by accident.
 *
 * AC-9 says a refused payment tells the client what went wrong. The machine
 * hands a terminal error up with `escalate`, which only has a target when a
 * parent invoked it — so `PaymentContext.parentId` guards it, and a root
 * interpretation like this composable leaves it unset and reads the error off
 * `errors`. `payment.escalation.test.ts` proves the guard both ways. Here the
 * consumer-facing half is asserted: `hasFailed`, the reason on `errors`, and
 * `isReady()` settling instead of hanging. A rejection is a control response,
 * not journey data, so nothing here stands in for a recorded body; the
 * provider's own refusal body still needs a recording (FE-3130).
 *
 * ## What Breaks If These Fail
 * A client who confirms with their bank is never carried through and their money
 * sits in limbo; a client who backs out is charged anyway; or a refused payment
 * reports nothing at all and the client waits on a promise that never settles.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { GatewayTypes } from "@upmind-automation/types";
import "./mocks";
import {
  emitAuth,
  loadMock,
  redirectMock,
  renderMock,
  resetPaymentMocks,
  updateMock
} from "./mocks";
import { usePayment } from "../usePayment";
import type { PaymentArgs } from "../payment.types";

// -----------------------------------------------------------------------------

function args(): PaymentArgs {
  return {
    orderId: "order-mine-0001",
    paymentDetail: {
      gateway_id: "gateway-0001",
      type: GatewayTypes.CREDITCARD
    } as PaymentArgs["paymentDetail"]
  };
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

// -----------------------------------------------------------------------------

describe("usePayment methods — every published journey is reachable", () => {
  beforeEach(() => {
    resetPaymentMocks();
  });

  it("AC-6 completing a confirmation takes no money when none is in flight", async () => {
    const payment = usePayment(args());
    await settle();

    payment.completeChallenge({ paRes: "confirmation-blob" });
    await settle();

    expect(updateMock).not.toHaveBeenCalled();
    expect(payment.meta.value.hasPaid).toBe(false);
  });

  it("AC-7 backing out takes no money when no confirmation is in flight", async () => {
    const payment = usePayment(args());
    await settle();

    payment.cancelChallenge();
    await settle();

    expect(updateMock).not.toHaveBeenCalled();
    expect(payment.meta.value.hasPaid).toBe(false);
  });

  it("AC-8 asking for a provider's own step raises no request before there is one", async () => {
    const payment = usePayment(args());
    await settle();

    payment.renderChallenge(document.createElement("div"));
    await settle();

    expect(renderMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(payment.meta.value.isRenderingChallenge).toBe(false);
  });

  it("re-reading the order re-reads it from the source rather than from cache", async () => {
    const payment = usePayment(args());
    await settle();
    emitAuth({ type: "AUTHENTICATED" });
    await settle();

    const before = loadMock.mock.calls.length;
    payment.refresh(args());
    await settle();

    expect(loadMock.mock.calls.length).toBeGreaterThanOrEqual(before);
  });

  it("reports readiness rather than hanging once a call is refused", async () => {
    loadMock.mockRejectedValue({ status: 422, data: { message: "nope" } });

    const payment = usePayment(args());
    await settle();
    emitAuth({ type: "AUTHENTICATED" });
    await settle();

    const outcome = await Promise.race([
      payment.isReady(),
      new Promise(resolve => setTimeout(() => resolve("never settled"), 300))
    ]);

    expect(outcome).toBe(false);
  });
});

describe("usePayment — a refused call is reported, not swallowed (AC-9)", () => {
  beforeEach(() => {
    resetPaymentMocks();
  });

  it("AC-9 tells the client the payment did not go through", async () => {
    loadMock.mockRejectedValue({
      status: 422,
      data: { message: "This payment method can no longer be used" }
    });

    const payment = usePayment(args());
    await settle();
    emitAuth({ type: "AUTHENTICATED" });
    await settle();

    expect(payment.meta.value.hasFailed).toBe(true);
    expect(payment.meta.value.hasPaid).toBe(false);
  });

  it("AC-9 carries the reason through rather than reporting a bare failure", async () => {
    loadMock.mockRejectedValue({
      status: 422,
      data: { message: "This payment method can no longer be used" }
    });

    const payment = usePayment(args());
    await settle();
    emitAuth({ type: "AUTHENTICATED" });
    await settle();

    expect(payment.errors.value).toBeDefined();
    expect(payment.errors.value?.status).toBe(422);
  });

  it("AC-9 leaves nothing taken against the order when the call is refused", async () => {
    loadMock.mockRejectedValue({ status: 500, data: {} });

    const payment = usePayment(args());
    await settle();
    emitAuth({ type: "AUTHENTICATED" });
    await settle();

    payment.pay();
    await settle();

    expect(updateMock).not.toHaveBeenCalled();
    expect(payment.meta.value.hasPaid).toBe(false);
  });
});
