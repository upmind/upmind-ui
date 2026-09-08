// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails utils — what the client is offered, and what the
 * credit covers (unit; AC-A5, AC-A8, AC-A9, AC-A10, AC-A11, AC-A18, AC-B1,
 * AC-B2)
 *
 * ## What is NOT proven here, and why
 * `isOrder` and `isPayable`'s free-amount leg are left alone deliberately: the
 * feature states no capability whose outcome those two predicates decide, and a
 * test written to match what they currently return would assert the code back at
 * itself. Naming them here is the record that they were considered and left.
 *
 * AC-B9 (a resume the client can no longer complete) has no proof at this layer:
 * `registerOperation` / `clearOperation` write the pending envelope but the
 * module exposes no reader for it, and `getOperationReturnUrl` composes a fresh
 * place to return to rather than reading the held operation back — so the
 * "envelope is gone" leg is unobservable from outside. It is owed on FE-3130.
 *
 * ## Job To Be Done
 * Everything a client may choose between is narrowed here before any of it
 * reaches a form: which of the brand's gateways apply to the capture in hand,
 * which of the three transaction shapes the brand and the invoice still allow,
 * and whether the account credit has already settled the whole amount. These are
 * the decisions the co-located `payment-details.feature` states as capabilities,
 * and none of them involves the network — so this is where they are pinned.
 *
 * ## Provenance
 * Every gateway row replayed here was captured by
 * `pnpm fixtures:generate payment-details` into this module's own `fixtures/`
 * dir — 15 real gateways this brand actually offers, of which exactly two can
 * store a method outside a payment. No gateway is authored in this file, so the
 * store-only filter is proven against the brand's real spread rather than
 * against two rows written to make it pass.
 *
 * ## What Breaks If These Fail
 * A client is offered a gateway that cannot store their card and the add flow
 * dead-ends on it; a brand that forbids part payments has the option offered
 * anyway; or a fully-credit-settled amount still asks a gateway for money.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  BrandConfigKeys,
  GatewayContext,
  PaymentType
} from "@upmind-automation/types";
import { mapPaymentDetails } from "../payment-details.mappers";
import {
  filterGateways,
  filterPaymentDetails,
  filterPaymentTypes,
  hasAmount,
  isAddFlow,
  isFree,
  isFullyCoveredByWallet,
  isPayLater,
  isPayable,
  needsPayment,
  usePaymentState
} from "../payment-details.utils";
import type { PaymentDetailsContext } from "../payment-details.types";
import type { IBrandGateway } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The brand's real gateway spread, as the recorder captured it. */
function recordedGateways(): IBrandGateway[] {
  const body = getFixtureBody<{
    data?: IBrandGateway[] | Record<string, IBrandGateway>;
  }>("get-brands-id-gateways-active-1-case-pay-client-id-country-id", {
    recordingsDir
  });

  const rows = Object.values(body?.data ?? {}) as IBrandGateway[];

  if (!rows.length) {
    throw new Error(
      "Missing fixture. Run `pnpm fixtures:generate payment-details` to capture " +
        "the brand's gateway list."
    );
  }
  return rows;
}

/** The recording client's real stored methods, as the recorder captured them. */
function recordedStoredMethods(): unknown[] {
  const body = getFixtureBody<{ data?: unknown }>(
    "get-clients-id-payment-details-active-true-brand-id-country-id",
    { recordingsDir }
  );
  const rows = Object.values((body?.data ?? {}) as Record<string, unknown>);

  if (!rows.length) {
    throw new Error(
      "Missing fixture. Run `pnpm fixtures:generate payment-details` to capture " +
        "the client's stored methods."
    );
  }
  return rows;
}

const model = (
  over: Partial<PaymentDetailsContext["model"]> = {}
): PaymentDetailsContext["model"] => ({
  amount: 50,
  type: PaymentType.PAY_IN_FULL,
  ...over
});

// -----------------------------------------------------------------------------

describe("AC-B1 a client storing a method is offered only the gateways that can store one", () => {
  it("keeps every gateway the brand offers when the capture is a payment", () => {
    const rows = recordedGateways();
    const offered = filterGateways(rows, model(), undefined);

    expect(offered.length).toBeGreaterThan(2);
    expect(offered.length).toBeLessThanOrEqual(rows.length);
  });

  it("keeps only the store-capable gateways when the capture stores a method", () => {
    const rows = recordedGateways();
    const storeCapable = rows.filter(
      row => row.gateway?.store_outside_payment
    ).length;

    const offered = filterGateways(rows, model({ amount: 0 }), undefined, {
      storeOnly: true
    });

    expect(storeCapable).toBeGreaterThan(0);
    expect(storeCapable).toBeLessThan(rows.length);
    expect(offered).toHaveLength(storeCapable);
    expect(offered.every(row => row.gateway?.store_outside_payment)).toBe(true);
  });
});

describe("AC-A8 / AC-A9 the part-payment choice follows the brand's permission", () => {
  it("AC-A8 offers a part payment when the brand permits one", () => {
    const types = filterPaymentTypes(
      { [BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED]: true },
      model()
    );

    expect(Object.values(types)).toContain(PaymentType.PARTIAL_PAYMENT);
  });

  it("AC-A9 withdraws the part payment when the brand forbids one", () => {
    const types = filterPaymentTypes(
      { [BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED]: false },
      model()
    );

    expect(Object.values(types)).not.toContain(PaymentType.PARTIAL_PAYMENT);
  });
});

describe("AC-A10 / AC-A11 the defer choice follows the brand and the invoice", () => {
  it("AC-A10 offers pay later when the brand permits deferring", () => {
    const types = filterPaymentTypes(
      { [BrandConfigKeys.PAY_LATER_ENABLED]: true },
      model()
    );

    expect(Object.values(types)).toContain(PaymentType.PAY_LATER);
  });

  it("AC-A11 withdraws pay later when the brand forbids deferring", () => {
    const types = filterPaymentTypes(
      { [BrandConfigKeys.PAY_LATER_ENABLED]: false },
      model()
    );

    expect(Object.values(types)).not.toContain(PaymentType.PAY_LATER);
  });
});

describe("AC-B2 a client storing a method is never offered a payment choice", () => {
  it("does not read a deferral as available while a method is being stored", () => {
    expect(
      isPayLater(model({ type: PaymentType.PAY_LATER }), GatewayContext.ADD)
    ).toBe(false);
  });

  it("reads the same deferral as available while a payment is being captured", () => {
    expect(
      isPayLater(model({ type: PaymentType.PAY_LATER }), GatewayContext.PAY)
    ).toBe(true);
  });
});

describe("AC-A5 account credit that covers the whole amount settles it alone", () => {
  it("reports the amount fully covered when the credit matches it", () => {
    expect(
      isFullyCoveredByWallet(model({ amount: 20, wallet_amount: 20 }))
    ).toBe(true);
  });

  it("reports the amount not covered while any of it is left for a gateway", () => {
    expect(
      isFullyCoveredByWallet(model({ amount: 50, wallet_amount: 20 }))
    ).toBe(false);
  });
});

describe("AC-A18 an amount still owing needs a payment method", () => {
  it("requires a method while an amount is left for a gateway", () => {
    expect(needsPayment(model({ amount: 50, wallet_amount: 20 }))).toBe(true);
  });

  it("requires no method once the credit has settled the whole amount", () => {
    expect(needsPayment(model({ amount: 20, wallet_amount: 20 }))).toBe(false);
  });

  it("requires a method for a free amount when the brand captures one anyway", () => {
    expect(needsPayment(model({ amount: 0 }), true)).toBe(true);
  });
});

describe("AC-B2 the capture context decides what kind of capture this is", () => {
  it("reads a named add context as storing a method", () => {
    expect(isAddFlow({ ctx: GatewayContext.ADD, amount: 0 })).toBe(true);
  });

  it("reads a zero amount on a brand that captures anyway as storing a method", () => {
    expect(isAddFlow({ amount: 0, requirePaymentForFreeOrders: true })).toBe(
      true
    );
  });

  it("reads an outstanding amount as capturing a payment", () => {
    expect(isAddFlow({ amount: 50, requirePaymentForFreeOrders: true })).toBe(
      false
    );
  });
});

describe("AC-A5 an amount left at nothing to pay is free", () => {
  it("reads nothing outstanding as free", () => {
    expect(isFree(model({ amount: 0 }))).toBe(true);
    expect(hasAmount(model({ amount: 0 }))).toBe(false);
  });

  it("reads an outstanding amount as not free", () => {
    expect(isFree(model({ amount: 50 }))).toBe(false);
    expect(hasAmount(model({ amount: 50 }))).toBe(true);
  });
});

describe("AC-A18 an amount is payable only while something is left to pay", () => {
  it("reads an outstanding amount as payable", () => {
    expect(isPayable(model({ amount: 50 }))).toBe(true);
  });

  it("reports an amount still owing as needing a method", () => {
    const state = usePaymentState(
      model({ amount: 50 }),
      GatewayContext.PAY,
      false,
      false,
      10
    );

    expect(state).toMatchObject({
      needsPayment: true,
      isFullyCoveredByWallet: false,
      hasAmount: true,
      isFree: false
    });
  });

  it("reports a credit-settled amount as needing no method", () => {
    const state = usePaymentState(
      model({ amount: 20, wallet_amount: 20 }),
      GatewayContext.PAY,
      false,
      false,
      10
    );

    expect(state).toMatchObject({
      needsPayment: false,
      isFullyCoveredByWallet: true
    });
  });
});

describe("AC-A1 a method is offered only when a live gateway still stands behind it", () => {
  it("keeps the methods whose gateway the brand still offers", () => {
    const rows = recordedGateways();
    const mine = mapPaymentDetails(
      recordedStoredMethods().slice(0, 2) as never
    );
    const dropped = { ...mine[1], gatewayId: "gateway-the-brand-dropped" };

    const offered = filterPaymentDetails([mine[0], dropped], rows);

    expect(offered.map(method => method.id)).toEqual([mine[0].id]);
    expect(mine).toHaveLength(2);
  });
});
