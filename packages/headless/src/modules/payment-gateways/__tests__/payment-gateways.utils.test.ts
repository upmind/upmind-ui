/**
 * @fileoverview payment-gateways utils — URL generation, storage eligibility, settings parsing
 *
 * ## Job To Be Done
 * These pure functions decide what URLs a client is redirected to after a
 * provider round-trip, whether a gateway can store a payment method, and how
 * to surface gateway settings. They run before any network call or SDK
 * invocation, so they are pinned here at the unit layer.
 *
 * ## What Breaks If These Fail
 * A client returning from the provider lands at a broken URL and loses their
 * payment context; a gateway that cannot store is offered for storing; or a
 * private setting leaks to the client.
 */

import { describe, expect, it } from "vitest";
import {
  generateResponseUrls,
  canBeStored,
  parseSettings
} from "../payment-gateways.utils";
import { GatewayStoreType } from "@upmind-automation/types";
import type { IGateway } from "@upmind-automation/types";

function gateway(overrides: Partial<IGateway> = {}): IGateway {
  return {
    id: "gw-1",
    is_stored: true,
    store_outside_payment: true,
    store_on_payment: false,
    gateway_provider: {
      store_type: GatewayStoreType.CARD
    },
    gateway_settings: [],
    ...overrides
  } as IGateway;
}

describe("generateResponseUrls — the context carried across the provider round trip (AC-D5, AC-D6)", () => {
  const freshUrl = () => new URL("https://shop.test/checkout");

  it("AC-D5 success URL appends payment_success=true", () => {
    const { successUrl } = generateResponseUrls(freshUrl());
    expect(successUrl).toContain("payment_success=true");
  });

  it("AC-D5 fail URL appends payment_success=false", () => {
    const { failUrl } = generateResponseUrls(freshUrl());
    expect(failUrl).toContain("payment_success=false");
  });

  it("AC-D6 cancel URL carries AUTO_PAY encoded", () => {
    const { cancelUrl } = generateResponseUrls(freshUrl(), { autoPay: true });
    expect(cancelUrl).toContain("auto_pay=");
  });

  it("AC-D6 cancel URL carries INIT_PAY with orderId when externalPayment is true", () => {
    const { cancelUrl } = generateResponseUrls(freshUrl(), {
      orderId: "order-123",
      externalPayment: true
    });
    expect(cancelUrl).toContain("init_pay=");
  });

  it("AC-D6 INIT_PAY does not carry orderId when externalPayment is false", () => {
    const { cancelUrl } = generateResponseUrls(freshUrl(), {
      orderId: "order-123",
      externalPayment: false
    });
    expect(cancelUrl).toContain("init_pay=");
  });

  it("appends pmt (payment_method_type) when type is supplied", () => {
    const { cancelUrl } = generateResponseUrls(freshUrl(), { type: "card" });
    expect(cancelUrl).toContain("pmt=card");
  });

  it("returnUrl encodes success and fail URLs", () => {
    const { returnUrl } = generateResponseUrls(freshUrl());
    expect(returnUrl).toContain("success=");
    expect(returnUrl).toContain("failed=");
  });

  it("handles no options at all", () => {
    const result = generateResponseUrls(freshUrl());
    expect(result.successUrl).toBeTruthy();
    expect(result.failUrl).toBeTruthy();
    expect(result.cancelUrl).toBeTruthy();
    expect(result.returnUrl).toBeTruthy();
  });

  it("handles autoPay undefined", () => {
    const { cancelUrl } = generateResponseUrls(freshUrl(), { orderId: "o1" });
    expect(cancelUrl).toContain("auto_pay=");
  });
});

describe("canBeStored — whether a gateway can store a payment method (AC-C4, AC-C5)", () => {
  it("AC-C4 returns false when no gateway is provided", () => {
    expect(canBeStored(undefined)).toBe(false);
  });

  it("AC-C4 returns false when is_stored is falsy", () => {
    expect(canBeStored(gateway({ is_stored: false }))).toBe(false);
  });

  it("AC-C4 returns false when store_type is NONE", () => {
    expect(
      canBeStored(
        gateway({
          gateway_provider: { store_type: GatewayStoreType.NONE }
        })
      )
    ).toBe(false);
  });

  it("AC-C5 returns true when store_outside_payment is truthy", () => {
    expect(canBeStored(gateway({ store_outside_payment: true }))).toBe(true);
  });

  it("AC-C5 returns false when store_on_payment is truthy but store_outside_payment is not", () => {
    expect(
      canBeStored(
        gateway({
          store_outside_payment: false,
          store_on_payment: true
        })
      )
    ).toBe(false);
  });

  it("returns true when neither store flag is set but other conditions pass", () => {
    expect(
      canBeStored(
        gateway({
          store_outside_payment: false,
          store_on_payment: false
        })
      )
    ).toBe(true);
  });

  it("follows the ordered short-circuit: is_stored checked before store_type", () => {
    expect(
      canBeStored(
        gateway({
          is_stored: false,
          gateway_provider: { store_type: GatewayStoreType.CARD }
        })
      )
    ).toBe(false);
  });
});

describe("parseSettings — extracts public gateway settings", () => {
  it("returns an empty object when gateway_settings is absent", () => {
    expect(parseSettings(gateway({ gateway_settings: undefined }))).toEqual({});
  });

  it("drops private settings", () => {
    const settings = parseSettings(
      gateway({
        gateway_settings: [
          { field: "publicKey", value: '"pk_test"', private: false },
          { field: "secretKey", value: '"sk_test"', private: true }
        ]
      })
    );
    expect(settings).toHaveProperty("publicKey");
    expect(settings).not.toHaveProperty("secretKey");
  });

  it("JSON-parses values", () => {
    const settings = parseSettings(
      gateway({
        gateway_settings: [
          { field: "enabled", value: "true", private: false },
          { field: "count", value: "42", private: false }
        ]
      })
    );
    expect(settings.enabled).toBe(true);
    expect(settings.count).toBe(42);
  });

  it("returns the raw string when JSON parsing fails", () => {
    const settings = parseSettings(
      gateway({
        gateway_settings: [
          { field: "label", value: "not-valid-json", private: false }
        ]
      })
    );
    expect(settings.label).toBe("not-valid-json");
  });

  it("last setting wins when fields duplicate", () => {
    const settings = parseSettings(
      gateway({
        gateway_settings: [
          { field: "key", value: '"first"', private: false },
          { field: "key", value: '"second"', private: false }
        ]
      })
    );
    expect(settings.key).toBe("second");
  });

  it("handles empty gateway_settings array", () => {
    expect(parseSettings(gateway({ gateway_settings: [] }))).toEqual({});
  });
});
