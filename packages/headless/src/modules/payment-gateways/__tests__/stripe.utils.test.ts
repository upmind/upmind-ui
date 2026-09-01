/**
 * @fileoverview stripe utils — minor unit conversion, payment method filtering, public key extraction
 *
 * ## Job To Be Done
 * Stripe requires amounts in minor units (cents) except for zero-decimal currencies.
 * These utils convert amounts correctly, filter gateway settings to supported payment
 * methods, and extract the public key for SDK initialization. They run before any
 * Stripe SDK call.
 *
 * ## What Breaks If These Fail
 * A JPY payment is charged 100x the intended amount (5000 JPY becomes 500000);
 * a payment method the gateway doesn't support is offered; or the Stripe SDK
 * cannot initialize because the public key is missing.
 */

import { describe, expect, it } from "vitest";
import {
  parseMinorUnitAmount,
  getSupportedPaymentMethods,
  getPublicKey
} from "../stripe/utils";
import { ZERO_DECIMAL_CURRENCIES } from "../payment-gateways.types";
import type { IGateway } from "@upmind-automation/types";

function gateway(settings: Array<{ field: string; value: string }>): IGateway {
  return {
    id: "stripe-gw",
    gateway_settings: settings.map(s => ({ ...s, private: false }))
  } as IGateway;
}

describe("parseMinorUnitAmount — currency-aware conversion (AC-B4, AC-B5)", () => {
  it("AC-B4 JPY (zero-decimal) returns value unchanged", () => {
    expect(parseMinorUnitAmount(5000, "JPY")).toBe(5000);
  });

  it("AC-B5 GBP returns value multiplied by 100", () => {
    expect(parseMinorUnitAmount(50, "GBP")).toBe(5000);
  });

  it("AC-B5 rounds to avoid floating point issues", () => {
    expect(parseMinorUnitAmount(19.99, "USD")).toBe(1999);
  });

  it("handles lowercase currency codes", () => {
    expect(parseMinorUnitAmount(5000, "jpy")).toBe(5000);
    expect(parseMinorUnitAmount(50, "gbp")).toBe(5000);
  });

  it("UGX multiplies rounded value by 100", () => {
    expect(parseMinorUnitAmount(1000, "UGX")).toBe(100000);
  });

  it("treats falsy value as 0", () => {
    expect(parseMinorUnitAmount(0, "USD")).toBe(0);
    expect(parseMinorUnitAmount(NaN, "USD")).toBe(0);
  });

  it("handles all zero-decimal currencies except UGX", () => {
    const zeroDecimals = Object.values(ZERO_DECIMAL_CURRENCIES).filter(
      c => c !== ZERO_DECIMAL_CURRENCIES.UGX
    );
    for (const currency of zeroDecimals) {
      expect(parseMinorUnitAmount(100, currency)).toBe(100);
    }
  });
});

describe("getSupportedPaymentMethods — filters gateway settings to enabled methods", () => {
  it("returns empty array when no gateway provided", () => {
    expect(
      getSupportedPaymentMethods(undefined as unknown as IGateway, "USD")
    ).toEqual([]);
  });

  it("includes CARD when paymentMethodCard is enabled", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodCard", value: "1" }]),
      "USD"
    );
    expect(methods).toContain("card");
  });

  it("excludes CARD when paymentMethodCard is disabled", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodCard", value: "0" }]),
      "USD"
    );
    expect(methods).not.toContain("card");
  });

  it("includes PAYPAL when enabled and currency is supported", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodPayPal", value: "1" }]),
      "USD"
    );
    expect(methods).toContain("paypal");
  });

  it("excludes PAYPAL when currency is unsupported", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodPayPal", value: "1" }]),
      "JPY"
    );
    expect(methods).not.toContain("paypal");
  });

  it("includes SEPA_DEBIT when enabled and currency is EUR", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodSepaDebit", value: "1" }]),
      "EUR"
    );
    expect(methods).toContain("sepa_debit");
  });

  it("excludes SEPA_DEBIT when currency is not EUR", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodSepaDebit", value: "1" }]),
      "USD"
    );
    expect(methods).not.toContain("sepa_debit");
  });

  it("includes IDEAL when enabled and currency is EUR", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodIdeal", value: "1" }]),
      "EUR"
    );
    expect(methods).toContain("ideal");
  });

  it("excludes IDEAL when currency is not EUR", () => {
    const methods = getSupportedPaymentMethods(
      gateway([{ field: "paymentMethodIdeal", value: "1" }]),
      "GBP"
    );
    expect(methods).not.toContain("ideal");
  });

  it("ignores unknown setting fields", () => {
    const methods = getSupportedPaymentMethods(
      gateway([
        { field: "paymentMethodCard", value: "1" },
        { field: "unknownMethod", value: "1" }
      ]),
      "USD"
    );
    expect(methods).toEqual(["card"]);
  });

  it("handles multiple enabled methods", () => {
    const methods = getSupportedPaymentMethods(
      gateway([
        { field: "paymentMethodCard", value: "1" },
        { field: "paymentMethodSepaDebit", value: "1" },
        { field: "paymentMethodIdeal", value: "1" }
      ]),
      "EUR"
    );
    expect(methods).toContain("card");
    expect(methods).toContain("sepa_debit");
    expect(methods).toContain("ideal");
  });
});

describe("getPublicKey — extracts the Stripe public key from settings", () => {
  it("returns the publicKey setting value", () => {
    expect(
      getPublicKey(gateway([{ field: "publicKey", value: "pk_test_123" }]))
    ).toBe("pk_test_123");
  });

  it("returns undefined when gateway is missing", () => {
    expect(getPublicKey(undefined)).toBeUndefined();
  });

  it("returns undefined when publicKey setting is absent", () => {
    expect(
      getPublicKey(gateway([{ field: "secretKey", value: "sk_test_123" }]))
    ).toBeUndefined();
  });

  it("returns undefined when gateway_settings is empty", () => {
    expect(getPublicKey(gateway([]))).toBeUndefined();
  });
});
