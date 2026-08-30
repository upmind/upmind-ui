// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails schemas — the bounds the payment form enforces
 * (unit; AC-A12, AC-B2)
 *
 * ## Job To Be Done
 * A part payment is the one place a client types an amount, and the co-located
 * `payment-details.feature` states the bound on it: never more than what is
 * outstanding. The form's schema is where that bound is expressed, so it is
 * where it is pinned — a client who can type 80.00 against a 50.00 balance
 * reaches the gateway with an amount the platform will reject after the card has
 * already been taken.
 *
 * ## Provenance
 * The gateways offered to the form are read out of this module's own recorded
 * `fixtures/` — the brand's real 15-gateway spread, captured by
 * `pnpm fixtures:generate payment-details`.
 *
 * ## What Breaks If These Fail
 * A client part-pays more than they owe and the payment is refused after
 * capture, or the credit they can spend is uncapped and the gateway is asked for
 * a negative remainder.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  BrandConfigKeys,
  GatewayContext,
  PaymentType
} from "@upmind-automation/types";
import { useSchema, useUischema } from "../payment-details.schemas";
import type { PaymentDetailsContext } from "../payment-details.types";
import type { IBrandGateway } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

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

const gateways = recordedGateways();

function context(outstanding: number, credit: number): PaymentDetailsContext {
  return {
    ctx: GatewayContext.PAY,
    client: { id: "client-0001" },
    currency: { id: "currency-0001", code: "USD" },
    amount: outstanding,
    paidAmount: 0,
    raw: {
      config: { [BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED]: true },
      gateways
    },
    lookups: {
      amountsFormatted: { amount: "", outstanding: "", wallet: "" },
      gateways,
      storedPaymentMethods: [],
      paymentTypes: {
        PAY_IN_FULL: PaymentType.PAY_IN_FULL,
        PARTIAL_PAYMENT: PaymentType.PARTIAL_PAYMENT
      },
      accountCredit: {
        owned: { value: credit, amount: `$${credit}` },
        credit: { value: 0, amount: "" },
        total: { value: credit, amount: `$${credit}` }
      }
    },
    model: { amount: outstanding, type: PaymentType.PARTIAL_PAYMENT }
  } as unknown as PaymentDetailsContext;
}

/** The bound the form puts on one of its own fields. */
function bounds(
  schema: ReturnType<typeof useSchema>,
  field: string
): { minimum?: number; maximum?: number } {
  const definitions = (
    schema as {
      definitions?: Record<string, { minimum?: number; maximum?: number }>;
    }
  ).definitions;

  const bound = definitions?.[field];
  if (!bound) {
    throw new Error(`The payment form declares no "${field}" field to bound.`);
  }
  return bound;
}

// -----------------------------------------------------------------------------

describe("AC-A12 a client cannot ask to pay more than is outstanding", () => {
  it("bounds the amount a client may part-pay by what is outstanding", () => {
    const amount = bounds(useSchema(context(50, 10)), "amount");

    expect(amount.maximum).toBe(50);
    expect(amount.minimum).toBe(0);
  });

  it("moves the bound with the outstanding balance rather than fixing it", () => {
    const smaller = bounds(useSchema(context(12.5, 10)), "amount");

    expect(smaller.maximum).toBe(12.5);
  });

  it("bounds the credit a client may spend by the credit they hold", () => {
    const wallet = bounds(useSchema(context(50, 10)), "wallet_amount");

    expect(wallet.maximum).toBe(10);
    expect(wallet.minimum).toBe(0);
  });
});

describe("AC-B2 a client storing a method is never asked how to pay", () => {
  /** The same context, but opened to store a method rather than pay one. */
  function addContext(): PaymentDetailsContext {
    return {
      ...context(0, 10),
      ctx: GatewayContext.ADD,
      amount: 0,
      requirePaymentForFreeOrders: true,
      model: { amount: 0, type: null }
    } as unknown as PaymentDetailsContext;
  }

  it("asks for nothing but the gateway that will hold the method", () => {
    const form = useSchema(addContext()) as {
      required?: string[];
      properties?: Record<string, unknown>;
    };

    expect(Object.keys(form.properties ?? {})).toEqual(["gateway_id"]);
    expect(form.required).toEqual(["gateway_id"]);
  });

  it("asks for an amount and a payment choice when a payment is being captured", () => {
    const form = useSchema(context(50, 10)) as {
      properties?: Record<string, unknown>;
    };
    const asked = Object.keys(form.properties ?? {});

    expect(asked).toContain("amount");
    expect(asked).toContain("type");
  });

  it("lays out a control for the gateway and for nothing else", () => {
    const layout = useUischema(addContext()) as {
      elements?: Array<{ scope?: string }>;
    };
    const asked = (layout.elements ?? []).map(element => element.scope);

    expect(asked).toEqual(["#/properties/gateway_id"]);
  });
});
