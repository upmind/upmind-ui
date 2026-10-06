/** @internal */
import { STATS_ALL_CURRENCY_CODE } from "@upmind-automation/types";
import type {
  StatCurrencyResponseData,
  StatTicketResponseData
} from "./stats.types";
// -----------------------------------------------------------------------------
/**
 * @module stats/stats.mappers
 * @description Wire report → published count. Pure — no HTTP, no scope.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useStats.ts` only (`@internal/no-cross-module-imports`).
 */

/**
 * The read path shared by the three currency-bound tiles (design 8.4):
 * `total.result.ALL[0].count`. `total: null` (no report for the window) and
 * an answer with no `ALL` currency key both read as an absent count — the
 * module never coalesces an absence into zero (design 8.3, 8.8).
 */
export function mapCurrencyStatCount(
  data: StatCurrencyResponseData
): number | null {
  return data?.total?.result?.[STATS_ALL_CURRENCY_CODE]?.[0]?.count ?? null;
}

/**
 * The tickets tile's read path: `open.result[0].count` (design 8.4). A
 * server answer that omits the `open` key entirely reads as an absent count
 * — defensive; no recorded fixture reaches this branch (design 8.3). A real
 * zero count passes through unchanged, never promoted to an absence.
 */
export function mapTicketStatCount(
  data: StatTicketResponseData
): number | null {
  return data?.open?.result?.[0]?.count ?? null;
}
