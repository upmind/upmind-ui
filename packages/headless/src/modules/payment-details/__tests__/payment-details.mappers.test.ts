// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails mappers — the selection handed on for payment
 * (unit; AC-A2, AC-A4, AC-A6, AC-A7, AC-A19)
 *
 * ## Job To Be Done
 * Capture ends at one artefact: the selection the sibling `payment` module
 * submits. The co-located `payment-details.feature` states three things about it
 * that nothing else in the module can state — a stored-method choice names the
 * method and no gateway, a fresh-gateway choice names the gateway and no method,
 * and the account credit the client chose to spend rides along beside the amount
 * rather than replacing it. It also states whose selection it is: the
 * client the capture was opened for, not whoever holds the session.
 *
 * ## Provenance
 * The stored method and the gateway named here are read out of this module's own
 * recorded `fixtures/` — the real records `pnpm fixtures:generate payment-details`
 * captured off staging. Nothing about the client's real methods is typed in, so a
 * re-record cannot leave a stale literal behind.
 *
 * ## What Breaks If These Fail
 * A client picks a stored card and is charged through a fresh gateway (or the
 * reverse); the credit they chose to spend is silently dropped and the full
 * amount goes to the gateway; or staff pay from their own account instead of the
 * client's.
 *
 * ## The caller trap this file pins
 * A fresh-gateway selection needs BOTH halves: the chosen gateway on the model
 * AND the gateway's own capture bag (the `data` argument). A model that names a
 * gateway with no capture bag beside it yields a selection naming no gateway at
 * all — the payment would go out with nothing to charge. The last AC-A7 case
 * pins that, so the trap cannot regress into silence.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { PaymentType } from "@upmind-automation/types";
import {
  mapGateway,
  mapGateways,
  mapPaymentData
} from "../payment-details.mappers";
import type { PaymentDetailsContext } from "../payment-details.types";
import type {
  IBrandGateway,
  IPaymentDetail,
  SelectPaymentMethodData
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

function recordedRows<T>(key: string): T[] {
  const body = getFixtureBody<{ data?: T[] | Record<string, T> }>(key, {
    recordingsDir
  });
  const rows = Object.values(body?.data ?? {}) as T[];

  if (!rows.length) {
    throw new Error(
      `Missing fixture "${key}". Run \`pnpm fixtures:generate payment-details\` ` +
        "to capture it."
    );
  }
  return rows;
}

/** A real stored method of the recording client, and the brand's real gateways. */
function recorded() {
  const method = recordedRows<IPaymentDetail>(
    "get-clients-id-payment-details-active-true-brand-id-country-id"
  )[0];
  const gateways = recordedRows<IBrandGateway>(
    "get-brands-id-gateways-active-1-case-pay-client-id-country-id"
  );
  const gateway = gateways.find(row => row.gateway_id);

  if (!method?.id || !method.client_id || !gateway?.gateway_id) {
    throw new Error(
      "The recorded fixtures carry no stored method and gateway to build a " +
        "selection from. Re-run `pnpm fixtures:generate payment-details`."
    );
  }
  return { method, gateways, gatewayId: gateway.gateway_id };
}

const { method, gateways, gatewayId } = recorded();

const lookups: PaymentDetailsContext["lookups"] = {
  amountsFormatted: { amount: "", outstanding: "", wallet: "" },
  gateways,
  storedPaymentMethods: []
};

const select = (
  model: Partial<PaymentDetailsContext["model"]>,
  clientId: string = method.client_id,
  data?: SelectPaymentMethodData
) =>
  mapPaymentData({
    clientId,
    data,
    lookups,
    model: { amount: 50, type: PaymentType.PAY_IN_FULL, ...model }
  });

/** What a fresh-gateway capture produces: the gateway's own field bag. */
const gatewayCapture = { gateway_id: gatewayId } as SelectPaymentMethodData;

// -----------------------------------------------------------------------------

describe("AC-A6 a client paying with a stored method hands on that method alone", () => {
  it("names the stored method the client chose", () => {
    const selection = select({ payment_details_id: method.id });

    expect(selection).toMatchObject({ payment_details_id: method.id });
  });

  it("names no gateway beside it", () => {
    const selection = select({ payment_details_id: method.id });

    expect(
      (selection as { gateway_id?: string } | undefined)?.gateway_id
    ).toBeUndefined();
  });
});

describe("AC-A7 a client paying with a fresh gateway hands on that gateway alone", () => {
  it("names the gateway the client chose", () => {
    const selection = select(
      { gateway_id: gatewayId },
      method.client_id,
      gatewayCapture
    );

    expect(selection).toMatchObject({ gateway_id: gatewayId });
  });

  it("names no stored method beside it", () => {
    const selection = select(
      { gateway_id: gatewayId },
      method.client_id,
      gatewayCapture
    );

    expect(
      (selection as { payment_details_id?: string } | undefined)
        ?.payment_details_id
    ).toBeUndefined();
  });

  it("hands on no gateway when the gateway's own capture produced no fields", () => {
    const selection = select({ gateway_id: gatewayId }, method.client_id);

    expect(
      (selection as { gateway_id?: string } | undefined)?.gateway_id
    ).toBeUndefined();
  });
});

describe("AC-A4 account credit rides beside the amount, it does not replace it", () => {
  it("leaves the amount whole and records the credit the client chose to spend", () => {
    const selection = select(
      {
        amount: 50,
        wallet_amount: 20
      },
      method.client_id,
      gatewayCapture
    );

    expect(selection).toMatchObject({ amount: 50, wallet_amount: 20 });
  });

  it("records no credit contribution when the client spends none", () => {
    const selection = select(
      {
        amount: 50,
        wallet_amount: 0
      },
      method.client_id,
      gatewayCapture
    );

    expect(
      (selection as { wallet_amount?: number } | undefined)?.wallet_amount
    ).toBeUndefined();
  });

  it("never records a negative credit contribution", () => {
    const selection = select(
      {
        amount: 50,
        wallet_amount: -20
      },
      method.client_id,
      gatewayCapture
    );

    expect(
      (selection as { wallet_amount?: number } | undefined)?.wallet_amount
    ).toBeUndefined();
  });
});

describe("AC-A19 the selection belongs to the client it was built for", () => {
  it("names the client the capture was opened for, not whoever holds the session", () => {
    const namedClient = "8d632507-9806-5d1e-48dc-8174e234e98d";
    const selection = select(
      { gateway_id: gatewayId },
      namedClient,
      gatewayCapture
    );

    expect(selection).toMatchObject({ client_id: namedClient });
    expect(namedClient).not.toBe(method.client_id);
  });
});

describe("a deferred payment hands nothing on to be submitted", () => {
  it("AC-A10 produces no selection when the client chose to pay later", () => {
    expect(select({ type: PaymentType.PAY_LATER })).toBeUndefined();
  });
});

describe("AC-A2 a gateway the client is offered carries what the form needs", () => {
  it("names the gateway and says whether it can hold a method", () => {
    const row = gateways.find(
      entry => entry.gateway?.store_outside_payment
    ) as IBrandGateway;
    const offered = mapGateway(row.gateway as never);

    expect(offered.id).toBe(row.gateway?.id);
    expect(offered.title).toBe(row.gateway?.name);
    expect(offered.type).toBe(row.gateway?.type);
    expect(offered.meta.canStore).toBe(true);
  });

  it("says a gateway that cannot hold a method cannot hold one", () => {
    const row = gateways.find(
      entry => entry.gateway && !entry.gateway.store_outside_payment
    ) as IBrandGateway;
    const offered = mapGateway(row.gateway as never);

    expect(offered.meta.canStore).toBe(false);
  });

  it("offers the brand's whole spread, not just the first of it", () => {
    const offered = mapGateways(gateways.map(row => row.gateway) as never);

    expect(offered).toHaveLength(gateways.length);
    expect(offered.filter(entry => entry.meta.canStore).length).toBe(
      gateways.filter(row => row.gateway?.store_outside_payment).length
    );
  });
});
