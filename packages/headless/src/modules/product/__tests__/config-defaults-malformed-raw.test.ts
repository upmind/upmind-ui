import { describe, it, expect } from "vitest";
import { applyConfigDefaults } from "../product.services";

/**
 * A domain SUGGESTION product can carry a `prices` array with a null element
 * (the API returns a sparse row). Feeding that through applyConfigDefaults must
 * NOT throw — the domain modules used to wrap this call in try/catch precisely
 * because it threw "Cannot read properties of null (reading
 * 'billing_cycle_months')". The parser must tolerate the malformed row and
 * return a usable model, so no caller needs a guard.
 */
const baseModel = { productId: "p1", quantity: 1, term: 1 } as never;

describe("applyConfigDefaults on a malformed suggestion product", () => {
  it("does not throw on a prices array containing a null row", () => {
    const raw = {
      id: "p1",
      default_payment_period: 1,
      prices: [null]
    } as never;
    expect(() => applyConfigDefaults(baseModel, raw)).not.toThrow();
  });

  it("does not throw on undefined raw", () => {
    expect(() => applyConfigDefaults(baseModel, undefined)).not.toThrow();
  });

  it("still applies config for a well-formed product", () => {
    const raw = {
      id: "p1",
      default_payment_period: 1,
      prices: [{ billing_cycle_months: 1, currency_id: "c1", price: 10 }]
    } as never;
    expect(() => applyConfigDefaults(baseModel, raw)).not.toThrow();
  });
});
