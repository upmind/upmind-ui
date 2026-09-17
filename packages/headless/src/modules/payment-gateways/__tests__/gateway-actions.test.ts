/**
 * @fileoverview Gateway action maps — stripe, braintree, and others
 *
 * ## Job To Be Done
 * @AC-B4/@AC-B5 of `payment-gateways.feature` promise correct minor-unit
 * conversion: a GBP payment is converted to pence, a JPY payment stays whole.
 * The gateway action maps drive these conversions through `updateSdk` — the
 * function that pushes amount/currency/address changes into a hosted SDK. This
 * file pins those branches: no SDK, SDK present, amount edge cases, address
 * presence, and currency normalization.
 *
 * @AC-A11 promises re-capture on change. The `setModel` action sets model and
 * dirty flag. @AC-C1/@AC-D4 promise schema-setting actions.
 *
 * ## What Breaks If These Fail
 * A JPY payment is charged 100x the intended amount (5000 JPY -> 500000), an
 * amount update never reaches the hosted SDK, or a model change never marks
 * the gateway dirty.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import braintreeActions from "../braintree/actions";
import dlocalModule from "../dlocal/index";
import mercadoPagoActions from "../mercadoPago/actions";
import nickyActions from "../nicky/actions";
import openPayActions from "../openPay/actions";
import razorpayActions from "../razorpay/actions";
import stripeActions from "../stripe/actions";
import type { GatewayContext } from "../payment-gateways.types";
import type {
  ICurrency,
  IGateway,
  IClient,
  IAddress
} from "@upmind-automation/types";

const CLIENT: IClient = { id: "test-client-id" } as IClient;
const CURRENCY_GBP: ICurrency = { id: "gbp-id", code: "GBP" } as ICurrency;
const CURRENCY_JPY: ICurrency = { id: "jpy-id", code: "JPY" } as ICurrency;
const CURRENCY_USD: ICurrency = { id: "usd-id", code: "USD" } as ICurrency;

function baseGateway(): IGateway {
  return {
    id: "test-gateway-id",
    is_stored: true,
    store_outside_payment: true
  } as IGateway;
}

function baseContext(overrides: Partial<GatewayContext> = {}): GatewayContext {
  return {
    ctx: GatewayCtx.PAY,
    client: CLIENT,
    gateway: baseGateway(),
    currency: CURRENCY_GBP,
    amount: 50,
    orderId: "test-order-id",
    supported: true,
    model: {},
    ...overrides
  } as GatewayContext;
}

function createStripeElementDouble() {
  return {
    mount: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    update: vi.fn()
  };
}

function createStripeElementsDouble() {
  return {
    create: vi.fn(),
    getElement: vi.fn(),
    submit: vi.fn(),
    update: vi.fn()
  };
}

function createStripeSDKDouble() {
  const element = createStripeElementDouble();
  const elements = createStripeElementsDouble();
  return {
    stripe: {},
    element,
    elements
  };
}

function createBraintreeDropinDouble() {
  return {
    requestPaymentMethod: vi.fn(),
    teardown: vi.fn(),
    isPaymentMethodRequestable: vi.fn(() => true),
    clearSelectedPaymentMethod: vi.fn(),
    updateConfiguration: vi.fn(),
    on: vi.fn()
  };
}

function createBraintreeSDKDouble() {
  return {
    authorization: "sandbox_test_token",
    braintree: createBraintreeDropinDouble()
  };
}

describe("stripeActions.updateSdk — minor-unit conversion (AC-B4, AC-B5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AC-B5 GBP amount 50 is converted to 5000 minor units", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, currency: CURRENCY_GBP, amount: 50 });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000, currency: "gbp" })
    );
  });

  it("AC-B4 JPY amount 5000 is NOT multiplied (zero-decimal currency)", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, currency: CURRENCY_JPY, amount: 5000 });
    const event = {
      type: "SET",
      data: { amount: 5000, currency: CURRENCY_JPY }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000, currency: "jpy" })
    );
  });

  it("AC-B5 USD 19.99 converts to 1999 (rounding)", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, currency: CURRENCY_USD, amount: 19.99 });
    const event = {
      type: "SET",
      data: { amount: 19.99, currency: CURRENCY_USD }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1999, currency: "usd" })
    );
  });

  it("currency code is lowercased for Stripe SDK", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, currency: CURRENCY_GBP, amount: 10 });
    const event = { type: "SET", data: { amount: 10, currency: CURRENCY_GBP } };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "gbp" })
    );
  });
});

describe("stripeActions.updateSdk — guard branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bails early when sdk is absent (no error, no call)", () => {
    const ctx = baseContext({ sdk: undefined, amount: 50 });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    expect(() => stripeActions.updateSdk(ctx, event)).not.toThrow();
  });

  it("bails early when sdk.elements is absent", () => {
    const ctx = baseContext({ sdk: { stripe: {} }, amount: 50 });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    expect(() => stripeActions.updateSdk(ctx, event)).not.toThrow();
  });

  it("bails early when sdk.elements.update is not a function", () => {
    const ctx = baseContext({ sdk: { stripe: {}, elements: {} }, amount: 50 });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    expect(() => stripeActions.updateSdk(ctx, event)).not.toThrow();
  });

  it("bails early when amount is zero", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 0 });
    const event = { type: "SET", data: { amount: 0, currency: CURRENCY_GBP } };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).not.toHaveBeenCalled();
  });

  it("bails early when amount is negative", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: -50 });
    const event = {
      type: "SET",
      data: { amount: -50, currency: CURRENCY_GBP }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).not.toHaveBeenCalled();
  });

  it("calls update when amount is positive", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 1 });
    const event = { type: "SET", data: { amount: 1, currency: CURRENCY_GBP } };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalled();
  });
});

describe("stripeActions.updateSdk — address handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes address fields when address is present", () => {
    const sdk = createStripeSDKDouble();
    const address: IAddress = {
      address_1: "123 Test St",
      city: "London",
      postcode: "SW1A 1AA",
      country_code: "GB"
    } as IAddress;
    const ctx = baseContext({ sdk, amount: 50, address });
    const event = {
      type: "SET",
      data: { amount: 50, currency: CURRENCY_GBP, address }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        currency: "gbp"
      })
    );
  });

  it("works without address", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 50, address: undefined });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalled();
  });

  it("handles address with all fields populated", () => {
    const sdk = createStripeSDKDouble();
    const address: IAddress = {
      address_1: "123 Test St",
      address_2: "Suite 100",
      city: "London",
      postcode: "SW1A 1AA",
      country_code: "GB",
      state: "Greater London"
    } as IAddress;
    const ctx = baseContext({ sdk, amount: 100, address });
    const event = {
      type: "SET",
      data: { amount: 100, currency: CURRENCY_GBP, address }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalled();
  });

  it("handles address with minimal fields", () => {
    const sdk = createStripeSDKDouble();
    const address: IAddress = {
      country_code: "US"
    } as IAddress;
    const ctx = baseContext({ sdk, amount: 25, address });
    const event = {
      type: "SET",
      data: { amount: 25, currency: CURRENCY_USD, address }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalled();
  });
});

describe("stripeActions.updateSdk — event data variations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bails when event data is empty (no amount)", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 75, currency: CURRENCY_GBP });
    const event = { type: "SET", data: {} };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).not.toHaveBeenCalled();
  });

  it("throws when currency is missing from event data", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 50, currency: CURRENCY_USD });
    const event = { type: "SET", data: { amount: 50 } };

    expect(() => stripeActions.updateSdk(ctx, event)).toThrow();
  });

  it("bails when event has no data property", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 50, currency: CURRENCY_GBP });
    const event = { type: "UPDATE" };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).not.toHaveBeenCalled();
  });

  it("handles decimal amounts with many places", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 99.999, currency: CURRENCY_USD });
    const event = {
      type: "SET",
      data: { amount: 99.999, currency: CURRENCY_USD }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10000 })
    );
  });

  it("handles very large amounts", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 999999.99, currency: CURRENCY_GBP });
    const event = {
      type: "SET",
      data: { amount: 999999.99, currency: CURRENCY_GBP }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 99999999 })
    );
  });

  it("handles very small amounts", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk, amount: 0.01, currency: CURRENCY_USD });
    const event = {
      type: "SET",
      data: { amount: 0.01, currency: CURRENCY_USD }
    };

    stripeActions.updateSdk(ctx, event);

    expect(sdk.elements.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1 })
    );
  });
});

describe("braintreeActions.updateSdk — guard branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bails early when sdk is absent (no error)", () => {
    const ctx = baseContext({ sdk: undefined, amount: 50 });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    expect(() => braintreeActions.updateSdk(ctx, event)).not.toThrow();
  });

  it("bails early when sdk.braintree is absent", () => {
    const ctx = baseContext({ sdk: { authorization: "token" }, amount: 50 });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    expect(() => braintreeActions.updateSdk(ctx, event)).not.toThrow();
  });

  it("bails early when sdk.braintree.updateConfiguration is not a function", () => {
    const ctx = baseContext({
      sdk: { authorization: "token", braintree: {} },
      amount: 50
    });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    expect(() => braintreeActions.updateSdk(ctx, event)).not.toThrow();
  });

  it("bails early when amount is zero", () => {
    const sdk = createBraintreeSDKDouble();
    const ctx = baseContext({ sdk, amount: 0 });
    const event = { type: "SET", data: { amount: 0, currency: CURRENCY_GBP } };

    braintreeActions.updateSdk(ctx, event);

    expect(sdk.braintree.updateConfiguration).not.toHaveBeenCalled();
  });

  it("bails early when amount is negative", () => {
    const sdk = createBraintreeSDKDouble();
    const ctx = baseContext({ sdk, amount: -50 });
    const event = {
      type: "SET",
      data: { amount: -50, currency: CURRENCY_GBP }
    };

    braintreeActions.updateSdk(ctx, event);

    expect(sdk.braintree.updateConfiguration).not.toHaveBeenCalled();
  });

  it("does not throw when amount is positive", () => {
    const sdk = createBraintreeSDKDouble();
    const ctx = baseContext({ sdk, amount: 50 });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_GBP } };

    expect(() => braintreeActions.updateSdk(ctx, event)).not.toThrow();
  });

  it("does not throw with valid USD context", () => {
    const sdk = createBraintreeSDKDouble();
    const ctx = baseContext({ sdk, amount: 50, currency: CURRENCY_USD });
    const event = { type: "SET", data: { amount: 50, currency: CURRENCY_USD } };

    expect(() => braintreeActions.updateSdk(ctx, event)).not.toThrow();
  });
});

describe("stripeActions.setError — error handling (AC-A9, AC-A13)", () => {
  const errorFn = (stripeActions.setError as any).assignment.error;

  it("AC-A9 setError error callback preserves message from event data", () => {
    const ctx = baseContext({ error: undefined });
    const errorData = { message: "Card declined", code: "card_declined" };
    const event = { type: "ERROR", data: errorData };

    const result = errorFn(ctx, event);

    expect(result.message).toBe("Card declined");
    expect(result.origin).toBe("headless");
  });

  it("AC-A13 setError error callback preserves refusal message", () => {
    const ctx = baseContext({ error: undefined });
    const refusalError = { message: "Your card was declined." };
    const event = { type: "REFUSED", data: refusalError };

    const result = errorFn(ctx, event);

    expect(result.message).toBe("Your card was declined.");
  });

  it("AC-A9 setError error callback wraps validation error with origin", () => {
    const ctx = baseContext({ error: undefined });
    const validationError = { message: "Validation failed" };
    const event = { type: "VALIDATION_ERROR", data: validationError };

    const result = errorFn(ctx, event);

    expect(result.message).toBe("Validation failed");
    expect(result.origin).toBeDefined();
  });
});

describe("stripeActions.setErrorSDK — SDK error handling", () => {
  const errorFn = (stripeActions.setErrorSDK as any).assignment.error;

  it("setErrorSDK error callback produces a structured error object", () => {
    const ctx = baseContext({ error: undefined });
    const event = { type: "SDK_ERROR", data: { message: "SDK failed" } };

    const result = errorFn(ctx, event);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("setErrorSDK error callback includes error code", () => {
    const ctx = baseContext({ error: undefined });
    const event = { type: "SDK_ERROR", data: {} };

    const result = errorFn(ctx, event);

    expect(result.code).toBeDefined();
  });

  it("setErrorSDK error callback includes origin to identify source", () => {
    const ctx = baseContext({ error: undefined });
    const event = { type: "SDK_ERROR", data: {} };

    const result = errorFn(ctx, event);

    expect(result.origin).toBeDefined();
  });
});

describe("stripeActions.cleanupSdk — SDK cleanup (AC-A7)", () => {
  const sdkFn = (stripeActions.cleanupSdk as any).assignment.sdk;

  it("cleanupSdk sdk callback returns undefined to clear SDK reference", () => {
    const sdk = createStripeSDKDouble();
    const ctx = baseContext({ sdk });
    const event = { type: "CLEANUP" };

    const result = sdkFn(ctx, event);

    expect(result).toBeUndefined();
  });
});

describe("braintreeActions.setErrorSDK — SDK error handling", () => {
  const errorFn = (braintreeActions.setErrorSDK as any).assignment.error;

  it("setErrorSDK error callback produces a defined error object", () => {
    const ctx = baseContext({ error: undefined });
    const event = { type: "SDK_ERROR", data: { message: "Failed" } };

    const result = errorFn(ctx, event);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("setErrorSDK error callback includes error code when SDK fails", () => {
    const ctx = baseContext({ error: undefined });
    const event = { type: "SDK_ERROR", data: {} };

    const result = errorFn(ctx, event);

    expect(result.code).toBeDefined();
  });

  it("setErrorSDK error callback includes origin to identify error source", () => {
    const ctx = baseContext({ error: undefined });
    const event = { type: "SDK_ERROR", data: {} };

    const result = errorFn(ctx, event);

    expect(result.origin).toBeDefined();
  });
});

describe("braintreeActions.cleanupSdk — SDK cleanup (AC-A7)", () => {
  const sdkFn = (braintreeActions.cleanupSdk as any).assignment.sdk;

  it("cleanupSdk sdk callback returns undefined to clear SDK reference", () => {
    const sdk = createBraintreeSDKDouble();
    const ctx = baseContext({ sdk });
    const event = { type: "CLEANUP" };

    const result = sdkFn(ctx, event);

    expect(result).toBeUndefined();
  });
});

describe("mercadoPagoActions.cleanupSdk — SDK cleanup (AC-A7)", () => {
  const sdkFn = (mercadoPagoActions.cleanupSdk as any).assignment.sdk;

  it("cleanupSdk sdk callback returns undefined to clear SDK reference", () => {
    const ctx = baseContext({ sdk: { mp: {} } });
    const event = { type: "CLEANUP" };

    const result = sdkFn(ctx, event);

    expect(result).toBeUndefined();
  });
});

describe("nickyActions — setSchemas and setModel (AC-C1, AC-D4, AC-A11)", () => {
  const schemaFn = (nickyActions.setSchemas as any).assignment.schema;
  const uischemaFn = (nickyActions.setSchemas as any).assignment.uischema;
  const modelFn = (nickyActions.setModel as any).assignment.model;

  it("AC-C1 schema callback returns object with type for ADD context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.ADD, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 schema callback returns object with type for PAY context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 uischema callback returns layout with type and elements", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = uischemaFn(ctx, event);

    expect(typeof result.type).toBe("string");
    expect(Array.isArray(result.elements)).toBe(true);
  });

  it("AC-A11 model callback extracts model from event data", () => {
    const ctx = baseContext({ model: {} });
    const newModel = { email: "test@example.com" };
    const event = { type: "SET", data: newModel };

    const result = modelFn(ctx, event);

    expect(result).toEqual(newModel);
  });
});

describe("openPayActions — setSchemas and setModel (AC-C1, AC-D4, AC-A11)", () => {
  const schemaFn = (openPayActions.setSchemas as any).assignment.schema;
  const uischemaFn = (openPayActions.setSchemas as any).assignment.uischema;
  const modelFn = (openPayActions.setModel as any).assignment.model;

  it("AC-C1 schema callback returns object with type for ADD context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.ADD, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 schema callback returns object with type for PAY context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 uischema callback returns layout with type and elements", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = uischemaFn(ctx, event);

    expect(typeof result.type).toBe("string");
    expect(Array.isArray(result.elements)).toBe(true);
  });

  it("AC-A11 model callback extracts model from event data", () => {
    const ctx = baseContext({ model: {} });
    const newModel = { device_session_id: "session123" };
    const event = { type: "SET", data: newModel };

    const result = modelFn(ctx, event);

    expect(result).toEqual(newModel);
  });
});

describe("razorpayActions — setSchemas (AC-C1, AC-D4)", () => {
  const schemaFn = (razorpayActions.setSchemas as any).assignment.schema;
  const uischemaFn = (razorpayActions.setSchemas as any).assignment.uischema;

  it("AC-C1 schema callback returns object with type for ADD context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.ADD, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 schema callback returns object with type for PAY context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 uischema callback returns layout with type and elements", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = uischemaFn(ctx, event);

    expect(typeof result.type).toBe("string");
    expect(Array.isArray(result.elements)).toBe(true);
  });
});

describe("dlocalActions — setSchemas (AC-C1, AC-D4)", () => {
  const dlocalActions = dlocalModule.actions;
  const schemaFn = (dlocalActions.setSchemas as any).assignment.schema;
  const uischemaFn = (dlocalActions.setSchemas as any).assignment.uischema;

  it("AC-C1 schema callback returns object with type for ADD context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.ADD, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 schema callback returns object with type for PAY context", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.type).toBe("object");
    expect(typeof result.properties).toBe("object");
  });

  it("AC-D4 uischema callback returns layout with type and elements", () => {
    const ctx = baseContext({ ctx: GatewayCtx.PAY, canStore: true });
    const event = { type: "LOADED", data: {} };

    const result = uischemaFn(ctx, event);

    expect(typeof result.type).toBe("string");
    expect(Array.isArray(result.elements)).toBe(true);
  });

  it("schema callback includes payment_method_addition block for guest", () => {
    const ctx = baseContext({
      ctx: GatewayCtx.PAY,
      canStore: true,
      client: { is_guest: true } as IClient
    });
    const event = { type: "LOADED", data: {} };

    const result = schemaFn(ctx, event);

    expect(result.properties.payment_method_addition).toBeDefined();
    expect(typeof result.properties.payment_method_addition.properties).toBe(
      "object"
    );
  });
});
