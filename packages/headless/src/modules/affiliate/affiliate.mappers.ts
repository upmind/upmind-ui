/** @internal */
import { map } from "lodash-es";
import type { AffiliatePayoutRow } from "./affiliate.types";
import type { IAffiliatePayout } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/affiliate.mappers
 * @description `mapAffiliatePayout(s)` — the payout history's field map
 * (design.md §5.2, D-34, audit D20). Legacy wins over the portal mock's
 * `status` / `error` / destination-code fields on every renamed member.
 */

/** Maps one wire `IAffiliatePayout` row to its camelCase model. */
export function mapAffiliatePayout(row: IAffiliatePayout): AffiliatePayoutRow {
  return {
    id: row.id,
    createdAt: row.created_at,
    amount: row.amount,
    amountFormatted: row.amount_converted_formatted,
    success: row.success,
    paymentLog: row.payment_log ?? null,
    destinationName: row.affiliate_payout_destination?.name_translated ?? ""
  };
}

/** Maps a page of payout rows. */
export function mapAffiliatePayouts(
  rows?: IAffiliatePayout[]
): AffiliatePayoutRow[] {
  return map(rows, mapAffiliatePayout);
}
