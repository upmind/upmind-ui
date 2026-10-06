/**
 * @fileoverview invoices — the order-history criteria schema
 *
 * ## Job To Be Done
 * Prove the value domains the order history accepts (design 8.3): the five
 * status choices and nothing else, a past or a future relative period on
 * `after` and `before`, and an absolute `YYYY-MM-DD hh:mm:ss` on the other four
 * date comparisons. A value outside its domain is refused before any read.
 *
 * ## What Breaks If These Fail
 * A client cannot ask for orders placed in the next month, a status the
 * platform does not know reaches the wire, or a relative period is sent where
 * the platform expects a date.
 */

import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { ORDER_STATUS_CHOICES } from "..";
import { openCell, resetCells } from "./invoices.unit-helpers";

afterEach(resetCells);

/** Writes one filter intent on a fresh order history and reports its error. */
async function refusalOf(intent: Record<string, unknown>): Promise<unknown> {
  const { actions, view } = openCell();
  await Promise.resolve(actions.filterBy(intent)).catch(() => undefined);
  await nextTick();
  return view().error;
}

// FE-3237 AC9
describe("AC-26: the order status choices", () => {
  it("offers the five status choices, Unpaid one value over two statuses", () => {
    expect([...ORDER_STATUS_CHOICES]).toEqual([
      "invoice_paid",
      "invoice_unpaid,invoice_adjusted",
      "invoice_overdue",
      "invoice_cancelled",
      "invoice_refunded"
    ]);
  });

  it("accepts each status choice as an equal and as a not-equal narrowing", async () => {
    for (const choice of ORDER_STATUS_CHOICES) {
      expect(await refusalOf({ "status.code": { eq: [choice] } })).toBeFalsy();
      expect(await refusalOf({ "status.code": { neq: [choice] } })).toBeFalsy();
    }
  });

  it("refuses a status outside the five choices", async () => {
    expect(
      await refusalOf({ "status.code": { eq: ["invoice_adjusted"] } })
    ).toBeTruthy();
  });
});

// FE-3237 AC8
describe("AC-25: the order date domains", () => {
  it("accepts a past and a future relative period after and before", async () => {
    for (const op of ["after", "before"])
      for (const period of ["-7_days", "+1_months", "-1.5_years", "+2_weeks"])
        expect(
          await refusalOf({ create_datetime: { [op]: period } }),
          `${op} ${period}`
        ).toBeFalsy();
  });

  it("refuses a relative period with no sign or no unit after and before", async () => {
    for (const period of ["7_days", "-7", "-7_fortnights"])
      expect(
        await refusalOf({ paid_datetime: { after: period } }),
        period
      ).toBeTruthy();
  });

  it("accepts an absolute date and time on the four plain comparisons", async () => {
    for (const op of ["gt", "gte", "lt", "lte"])
      expect(
        await refusalOf({ paid_datetime: { [op]: "2026-10-01 00:00:00" } }),
        op
      ).toBeFalsy();
  });

  it("refuses a relative period or a bare date on the four plain comparisons", async () => {
    for (const value of ["-7_days", "2026-10-01"])
      expect(
        await refusalOf({ create_datetime: { gte: value } }),
        value
      ).toBeTruthy();
  });
});
