// -----------------------------------------------------------------------------
/**
 * @fileoverview usePaymentGateway meta — the capability flags a consumer reads
 *
 * ## Job To Be Done
 * Cells A, B, D and E of `payment-gateways.feature` say a consumer never
 * branches on which provider is in play: it reads one set of flags and learns
 * whether the gateway is loading, driveable, dirty, valid, refused, renderless
 * or simply not supported. This file pins those flags against a live actor
 * parked in each lifecycle state — the API contract between UI and machine.
 *
 * ## What this layer deliberately does not prove
 * That the production gateway machine actually reaches these states. That is
 * the integration layer's, with the real machine and recorded responses.
 *
 * ## What Breaks If These Fail
 * A consumer asks a client to pay through a gateway that is still loading,
 * unsupported or already refused — or hides a gateway that is ready.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { GatewayTypes } from "@upmind-automation/types";

vi.mock("../../config", () => ({
  useConfig: () => ({
    data: { clickwrapDisclaimer: "You agree to the brand terms before paying." }
  })
}));

vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

import { usePaymentGateway } from "../usePaymentGateway";
import { noGateway, spawnGateway } from "./gateway.doubles";

// -----------------------------------------------------------------------------

/** The eight gateways this module drives through one contract. */
const GATEWAYS = [
  "braintree",
  "card",
  "dlocal",
  "mercadoPago",
  "nicky",
  "openPay",
  "razorpay",
  "stripe"
];

/** A supported gateway carrying a chargeable amount. */
function payable(overrides: Record<string, unknown> = {}) {
  return {
    supported: true,
    amount: 50,
    gateway: { type: GatewayTypes.CREDITCARD },
    ...overrides
  };
}

// -----------------------------------------------------------------------------

describe("usePaymentGateway meta — one contract, every gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(GATEWAYS)(
    "AC-A1 reports %s available to be driven, with no error",
    code => {
      const { actor } = spawnGateway(
        "available",
        payable({ gateway: { type: GatewayTypes.CREDITCARD, code } })
      );
      const { meta } = usePaymentGateway(actor);

      expect(meta.value.isAvailable).toBe(true);
      expect(meta.value.hasErrors).toBe(false);
      expect(meta.value.isUnavailable).toBe(false);
    }
  );

  it("AC-A2 reports a still-loading gateway as loading, not as available", () => {
    const { actor } = spawnGateway("loading", payable());
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isLoading).toBe(true);
    expect(meta.value.isAvailable).toBe(false);
  });

  it("AC-A5 reports a gateway holding no captured input as not dirty", () => {
    const { actor } = spawnGateway("available", payable());
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isDirty).toBe(false);
  });

  it("AC-A6 reports a gateway holding captured input as dirty", () => {
    const { actor } = spawnGateway(
      "available",
      payable({ model: { number: "4242424242424242" } })
    );
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isDirty).toBe(true);
  });

  it("AC-A8 reports a gateway that passes validation as valid", () => {
    const { actor } = spawnGateway({ available: "valid" }, payable());
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isValid).toBe(true);
    expect(meta.value.hasErrors).toBe(false);
  });

  it("AC-A9 reports a gateway that fails validation as errored, not valid", () => {
    const { actor } = spawnGateway({ available: "error" }, payable());
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.hasErrors).toBe(true);
    expect(meta.value.isValid).toBe(false);
  });

  it("AC-A15 reports a gateway waiting on the provider as processing", () => {
    const { actor } = spawnGateway("processing", payable());
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isProcessing).toBe(true);
  });

  it("AC-B1 asks a client to pay when the amount is chargeable", () => {
    const { actor } = spawnGateway("available", payable());
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.needsPayment).toBe(true);
  });

  it("AC-B2 does not ask a client to pay through an offline gateway", () => {
    const { actor } = spawnGateway(
      "available",
      payable({ gateway: { type: GatewayTypes.OFFLINE } })
    );
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.needsPayment).toBe(false);
  });

  it("AC-B6 surfaces the gateway's own payment instructions when it carries them", () => {
    const { actor } = spawnGateway(
      "available",
      payable({
        gateway: {
          type: GatewayTypes.BANKTRANSFER,
          payment_instructions: "Pay into account 12345678."
        }
      })
    );
    const { meta, instructions } = usePaymentGateway(actor);

    expect(meta.value.hasInstructions).toBe(true);
    expect(instructions.value).toBe("Pay into account 12345678.");
  });

  it("AC-B7 surfaces the brand's clickwrap disclaimer to a paying client", () => {
    const { actor } = spawnGateway("available", payable());
    const { clickwrap } = usePaymentGateway(actor);

    expect(clickwrap.value).toBe("You agree to the brand terms before paying.");
  });

  it("AC-D4 reports a gateway whose fields are all read-only as needing no form", () => {
    const { actor } = spawnGateway(
      "available",
      payable({
        schema: {
          properties: {
            reference: { readOnly: true },
            note: { readOnly: true }
          }
        }
      })
    );
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isRenderless).toBe(true);
  });

  it("AC-D4 reports a gateway with a writable field as needing a form", () => {
    const { actor } = spawnGateway(
      "available",
      payable({
        schema: {
          properties: { number: { readOnly: false }, note: { readOnly: true } }
        }
      })
    );
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isRenderless).toBe(false);
  });

  it("AC-E1 refuses a gateway the module does not support instead of half-driving it", () => {
    const { actor } = spawnGateway("available", payable({ supported: false }));
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isNotSupported).toBe(true);
    expect(meta.value.needsPayment).toBe(false);
  });

  it("AC-E2 reports a gateway whose setup failed as unavailable", () => {
    const { actor } = spawnGateway("unavailable", payable());
    const { meta } = usePaymentGateway(actor);

    expect(meta.value.isUnavailable).toBe(true);
    expect(meta.value.isAvailable).toBe(false);
  });

  it("AC-E3 tells a consumer holding no gateway that nothing is driveable", () => {
    const { meta } = usePaymentGateway(noGateway);

    expect(meta.value.isNotSupported).toBe(true);
    expect(meta.value.isAvailable).toBe(false);
    expect(meta.value.needsPayment).toBe(false);
  });
});
