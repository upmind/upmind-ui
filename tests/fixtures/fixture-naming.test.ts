// -----------------------------------------------------------------------------
/**
 * @fileoverview Fixture identity — `currency_code` / `keys` list-param order
 *
 * ## Job To Be Done
 * Prove the replay identity (the one definition the recorder filename and the
 * MSW matcher both derive from) keys on the params that actually select a
 * different response: `currency_code` (which currency an amount is converted to)
 * forks the identity, while the ORDER of a comma-list value (`keys`) does not —
 * the same config-key set asked in another order is the same question.
 *
 * ## What Breaks If These Fail
 * A currency conversion request matches the wrong-currency recording; or config-
 * key order forks an identity and gaps an otherwise-recorded read.
 */

import { describe, it, expect } from "vitest";
import { fixtureIdentity, generateFixtureName } from "./fixture-naming.mjs";

// -----------------------------------------------------------------------------

describe("fixtureIdentity — `currency_code` forks identity", () => {
  it("gives two unpaid-amount reads differing only by currency_code different names", () => {
    const gbp = generateFixtureName(
      "GET",
      "/api/invoices/unpaid_amount/3fa85f64-5717-4562-b3fc-2c963f66afa6?lang=en&currency_code=GBP"
    );
    const dzd = generateFixtureName(
      "GET",
      "/api/invoices/unpaid_amount/3fa85f64-5717-4562-b3fc-2c963f66afa6?lang=en&currency_code=DZD"
    );
    expect(gbp).not.toBe(dzd);
  });
});

describe("fixtureIdentity — `keys` is order-insensitive", () => {
  it("gives the same identity whatever order the config keys arrive in", () => {
    const a = fixtureIdentity(
      "GET",
      "/api/config/brand/values?keys=ui.basket.default_currency,invoices.common.display_price_type"
    );
    const b = fixtureIdentity(
      "GET",
      "/api/config/brand/values?keys=invoices.common.display_price_type,ui.basket.default_currency"
    );
    expect(a).toEqual(b);
  });
});
