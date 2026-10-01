// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the one-time-purchases gate, FE-3244 interim (AC-17)
 *
 * ## Job To Be Done
 * Pin the interim contract of `hidesOneTimePurchases()`: until FE-3244 exposes
 * the brand portal one-time-purchases setting, the gate reads false — the same
 * interim as contract-product's `hidesOneTimePurchasesForced`. The gate reads
 * no brand state yet, so the hidden, the shown and the absent value give one
 * answer: not hidden, so a one-time item keeps its link.
 *
 * ## What Breaks If These Fail
 * A one-time purchase loses its link before FE-3244 lands the real setting, or
 * the interim silently starts hiding purchases the brand never asked to hide.
 */

import { describe, expect, it } from "vitest";
import { hidesOneTimePurchases } from "../orders.utils";

// -----------------------------------------------------------------------------

describe("orders one-time-purchases gate — FE-3244 interim (AC-17)", () => {
  it("AC-17: the gate reads not-hidden until FE-3244 exposes the brand portal setting", () => {
    expect(hidesOneTimePurchases()).toBe(false);
  });
});
