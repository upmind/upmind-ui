// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.mappers — the payout row mapping (@AC20 unit half)
 *
 * ## Job To Be Done
 * Protect `mapAffiliatePayout`'s wire-to-model field map (design.md §5.2's
 * `AffiliatePayoutRow` field-map table, D-34): every one of the seven model
 * fields comes from its named wire field of a real recorded `IAffiliatePayout`
 * row, never a look-alike wire field (the mock's `status`/`error`/destination
 * code, which design.md's table explicitly says legacy overrides).
 *
 * ## What Breaks If These Fail
 * A client's payout history would show the wrong amount label, the wrong
 * success flag, or a blank destination/payment-log when the real API row
 * carries one — the field-map table exists because the portal mock's
 * look-alike field names do NOT match the real wire shape.
 *
 * ## Finding F-1 — closed
 * `paymentLog` was asserted EXPECTED-RED via `it.fails`: the real, recorded
 * payout row has no `payment_log` relation, and design.md §5.2's field-map
 * table states the contract as "`paymentLog` ... `null` when the relation is
 * absent" — but the landed `mapAffiliatePayout` returned `undefined`, not
 * `null`, for that case. The developer seat fixed the defect; the wrapped
 * assertion now passes, which flips `it.fails` itself to a suite failure
 * ("Expect test to fail"), so the assertion below is promoted to a plain
 * `it()` — the exact assertion is unchanged, only the wrapper. Proven once,
 * by the declared override below that drops the `payment_log` relation key
 * from the real recorded row. History: CONTROLS.md.
 *
 * `id` and `amountFormatted` are read back from the same `wireRow` object the
 * mapper also reads (never a hand-copied literal); `createdAt`, `amount`,
 * `success` and `destinationName` are HAND-WRITTEN LITERALS, since none of
 * them is a money figure or an id. The required negative control
 * (`wrong-wire-field`: the mapper reads `amount` instead of
 * `amount_converted_formatted`) already reddens the first case below, since
 * `amount` is a number (`5`) and `amountFormatted` is a formatted string
 * ("£5.00") — no override needed to catch it.
 *
 * ## ADR-035 (`code-tests.companion.md`: "serve no flipped value inside a
 * recording")
 * No case below overrides a real recorded field to a hand-picked value. The
 * required control (`wrong-wire-field`) is proven by the unmodified case
 * above; no alternate mutant outside design.md §8.11's table is guarded
 * against here. Authoring history: `__tests__/CONTROLS.md`.
 */
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapAffiliatePayout } from "../affiliate.mappers";
import type { IAffiliatePayout } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = resolve(
  process.cwd(),
  "src/modules/affiliate/__tests__/fixtures"
);

function recordedPayoutRow(): IAffiliatePayout {
  const body = getFixtureBody<{ data: IAffiliatePayout[] }>(
    "accounts-id-affiliate-payouts",
    { recordingsDir }
  );
  const row = body?.data?.[0];
  if (!row) {
    throw new Error(
      "[affiliate.mappers.test] Missing the recorded payouts capture. Run " +
        "`pnpm fixtures:generate affiliate` before this spec."
    );
  }
  return row;
}

describe("affiliate.mappers — mapAffiliatePayout", () => {
  it("maps id, createdAt, amount, amountFormatted, success and destinationName from a real recorded payout row (design.md §5.2)", () => {
    const wireRow = recordedPayoutRow();

    const mapped = mapAffiliatePayout(wireRow);

    expect(mapped.id).toBe(wireRow.id);
    expect(mapped.createdAt).toBe("2026-09-29 18:30:04");
    expect(mapped.amount).toBe(5);
    expect(mapped.amountFormatted).toBe(wireRow.amount_formatted);
    expect(mapped.success).toBe(true);
    expect(mapped.destinationName).toBe("Wallet");
  });

  it("gives an empty destinationName when the destination relation is absent (declared override)", () => {
    const { affiliate_payout_destination: _dropped, ...rowWithNoDestination } =
      recordedPayoutRow();

    const mapped = mapAffiliatePayout(rowWithNoDestination as IAffiliatePayout);

    expect(mapped.destinationName).toBe("");
  });

  it("gives a null paymentLog when the payment_log relation is absent (design.md §5.2, F-1)", () => {
    const { payment_log: _dropped, ...rowWithNoPaymentLog } =
      recordedPayoutRow();

    const mapped = mapAffiliatePayout(rowWithNoPaymentLog as IAffiliatePayout);

    expect(mapped.paymentLog).toBeNull();
  });
});
