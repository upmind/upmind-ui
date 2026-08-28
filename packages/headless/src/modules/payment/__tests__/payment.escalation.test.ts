// -----------------------------------------------------------------------------
/**
 * @fileoverview payment escalation — the parentId guard, proven both ways
 * (unit, AC-9)
 *
 * ## Job To Be Done
 * The machine hands things up to a parent in TWO places — a terminal error via
 * `escalate`, and a taken-up payment via `providePayment`'s `sendParent`. Both
 * only have a target when another machine invoked this one.
 * `order.machine` (`orderManager`) and `basket.machine` (`basketManager`) invoke
 * it and rely on that hand-up; `usePayment` interprets it as a ROOT, where the
 * hand-up throws and freezes the machine mid-transition. `PaymentContext.parentId`
 * is what tells the two apart, because xstate v4 gives an action no supported way
 * to ask whether it is running as an invoked child.
 *
 * A guard is only worth having if BOTH of its answers are proven, so this file
 * is the negative control for it: unset `parentId` reaches `error` cleanly, and
 * a `parentId` set with no real parent above does NOT — which is exactly the
 * freeze the guard exists to prevent. If either guard is removed, a test here or
 * the offsite-challenge test in `payment.int.test.ts` goes red — the success leg
 * froze in `processing` for exactly this reason until `providePayment` was
 * guarded too.
 *
 * ## What Breaks If These Fail
 * Either a root caller freezes in `loading` and never learns the payment failed
 * (a promise that never settles), or a child stops handing its error to the
 * order/basket machine above it and a failed payment looks like a stalled one.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import "./mocks";
import { GatewayTypes } from "@upmind-automation/types";
import { emitAuth, loadMock, resetPaymentMocks } from "./mocks";
import paymentMachine from "../payment.machine";
import type { PaymentContext } from "../payment.types";

// -----------------------------------------------------------------------------

const REFUSAL = { status: 422, data: { message: "cannot be used" } };

function context(parentId?: string): PaymentContext {
  return {
    orderId: "order-mine-0001",
    paymentDetail: {
      gateway_id: "gateway-0001",
      type: GatewayTypes.CREDITCARD
    } as PaymentContext["paymentDetail"],
    parentId
  };
}

/** Start the machine as a ROOT and drive it to its terminal error. */
function runToRefusal(parentId?: string) {
  const service = interpret(paymentMachine.withContext(context(parentId)), {
    devTools: false
  }).start();

  emitAuth({ type: "AUTHENTICATED" });
  return service;
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

// -----------------------------------------------------------------------------

describe("payment escalation — parentId decides whether the error goes up", () => {
  beforeEach(() => {
    resetPaymentMocks();
    loadMock.mockRejectedValue(REFUSAL);
  });

  it("AC-9 a root with no parent reaches its error state and keeps the reason", async () => {
    const service = runToRefusal();
    await settle();

    expect(service.state.matches("error")).toBe(true);
    expect(service.state.context.error?.status).toBe(422);

    service.stop();
  });

  it("AC-9 a parentId with no real parent above cannot settle — the guard is load-bearing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const service = runToRefusal("orderManager");
    await settle();

    expect(service.state.matches("error")).toBe(false);

    service.stop();
    vi.restoreAllMocks();
  });

  it("the two answers really do differ, so the guard is not decorative", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const rootless = runToRefusal();
    await settle();
    const parented = runToRefusal("basketManager");
    await settle();

    expect(rootless.state.matches("error")).not.toBe(
      parented.state.matches("error")
    );

    rootless.stop();
    parented.stop();
    vi.restoreAllMocks();
  });
});
