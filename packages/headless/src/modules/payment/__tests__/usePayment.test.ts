// -----------------------------------------------------------------------------
/**
 * @fileoverview usePayment — the sign-in guard (unit, AC-11/AC-14/AC-15)
 *
 * ## Job To Be Done
 * AC-14 and AC-15 say that signed out, NO payment is attempted at all — not for
 * the client's own order and not for anybody else's. AC-11 says a payment does
 * not outlive the sign-in it started under. Those are the FE-2824 capability
 * questions for this module: not "does a guard state exist" but "did anything
 * reach the provider before there was a session". The real machine runs here
 * with the HTTP boundary spied, so "nothing was attempted" is proven by the spy
 * staying cold, never by a state name.
 *
 * The guard is also proven to OPEN — a signed-out-only assertion would pass
 * just as well against a module that can never pay at all.
 *
 * ## What this layer deliberately does not prove
 * Every scenario needing a real provider response — a payment clearing (AC-4),
 * a bank confirmation completing (AC-6), a refusal carrying its reason (AC-9),
 * an unusable method stopping the attempt (AC-10) — needs recorded response
 * bodies this repo does not have. Those are the integration layer's, and the
 * missing capture is filed on FE-3130. Nothing here fakes one.
 *
 * AC-1, AC-2, AC-3 and AC-16 rest on a consumer reading the order back off the
 * exposed context. That member is inert — see `payment.no-cosplay.test.ts`, the
 * receipt for the defect — so those scenarios have no surface to be proven
 * through at this layer.
 *
 * ## What Breaks If These Fail
 * A signed-out visitor's order is charged — money taken with no live identity
 * behind it. Or the guard never opens and no client can pay at all.
 */

import { beforeEach, describe, expect, it } from "vitest";
import "./mocks";
import { GatewayTypes } from "@upmind-automation/types";
import {
  emitAuth,
  loadMock,
  resetPaymentMocks,
  updateMock,
  validateMock
} from "./mocks";
import { usePayment } from "../usePayment";
import type { PaymentArgs } from "../payment.types";

// -----------------------------------------------------------------------------

const ORDER_ID = "order-mine-0001";
const OTHER_ORDER_ID = "order-someone-else-0002";

/** The two things a client supplies to pay: which order, and how. */
function args(orderId: string = ORDER_ID): PaymentArgs {
  return {
    orderId,
    paymentDetail: {
      gateway_id: "gateway-0001",
      type: GatewayTypes.CREDITCARD
    } as PaymentArgs["paymentDetail"]
  };
}

/** Let the interpreter drain its queue. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

// -----------------------------------------------------------------------------

describe("usePayment — nothing is attempted before there is a session", () => {
  beforeEach(() => {
    resetPaymentMocks();
  });

  it("AC-14 attempts nothing at all against the client's own order while signed out", async () => {
    usePayment(args());
    await settle();

    expect(loadMock).not.toHaveBeenCalled();
    expect(validateMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("AC-15 attempts nothing against somebody else's order while signed out either", async () => {
    usePayment(args(OTHER_ORDER_ID));
    await settle();

    expect(loadMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("AC-14 a signed-out pay() takes no money and raises no request", async () => {
    const payment = usePayment(args());
    await settle();

    payment.pay();
    await settle();

    expect(updateMock).not.toHaveBeenCalled();
    expect(payment.meta.value.hasPaid).toBe(false);
  });

  it("AC-11 a sign-in that ends without ever authenticating attempts nothing", async () => {
    usePayment(args());
    await settle();

    emitAuth({ type: "UNAUTHENTICATED" });
    await settle();

    expect(loadMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("AC-11 the guard opens on a live session — so the guard is real, not a dead end", async () => {
    usePayment(args());
    await settle();

    emitAuth({ type: "AUTHENTICATED" });
    await settle();

    expect(loadMock).toHaveBeenCalled();
  });

  it("AC-11 a session that ends after authenticating stops the payment reaching the provider", async () => {
    const payment = usePayment(args());
    await settle();

    emitAuth({ type: "AUTHENTICATED" });
    await settle();
    emitAuth({ type: "UNAUTHENTICATED" });
    await settle();

    payment.pay();
    await settle();

    expect(updateMock).not.toHaveBeenCalled();
    expect(payment.meta.value.hasPaid).toBe(false);
  });
});
