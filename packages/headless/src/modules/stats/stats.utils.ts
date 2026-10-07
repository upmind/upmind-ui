import dayjs from "dayjs";
import {
  STATS_ALL_CURRENCY_CODE,
  InvoiceStatus
} from "@upmind-automation/types";
import { StatType } from "./stats.types";
import { includes, split } from "lodash-es";
// -----------------------------------------------------------------------------
/**
 * @module stats/stats.utils
 * @description The fixed `GET api/stats` parameter bags, one per tile, and
 * the `date_to` value they all share. Pure — no HTTP, no scope.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useStats.ts` only (`@internal/no-cross-module-imports`).
 */

/**
 * The backend's fixed date format — a local constant, on the
 * `client-custom-fields.mappers.ts:48` `BACKEND_DATETIME_FORMAT` precedent.
 * Never imported from a legacy file (design 8.1).
 */
export const BACKEND_DATE_FORMAT = "YYYY-MM-DD";

/**
 * The day of the read, off the system clock. Takes no clock parameter: the
 * oracle takes none, and a parameter with one caller is a seam nobody asked
 * for. The specs freeze the clock instead, to the recorded probe's own
 * `probe_date` (design 8.1, DA41).
 */
export function statsDateTo(): string {
  return dayjs().format(BACKEND_DATE_FORMAT);
}

/**
 * The Upmind-context gate, mirroring the oracle at vue-app
 * `src/store/index.ts:66-69` verbatim: a hostname allowlist read off
 * `VITE_APP_UPMIND_HOSTNAMES`, never a field on the client record.
 *
 * The oracle is a browser SPA and reads `window.location.hostname` directly.
 * Under SSR there is no hostname to match, so the gate closes.
 */
export function isUpmindContext(): boolean {
  if (typeof window === "undefined") return false;
  const hostnames = import.meta.env.VITE_APP_UPMIND_HOSTNAMES || "";
  return includes(split(hostnames, ","), window.location.hostname);
}

/**
 * `report` and `invoice_status` values are sent as a STRING that HOLDS the
 * JSON-array text, never as a JS array. `useUrl` serialises a JS array as
 * `key[]=...`, which the endpoint answers with a 500 (design 8.1, [o1]).
 */
function bracketed(values: readonly string[]): string {
  return JSON.stringify(values);
}

/** `type=contracts&date_to=<today>&currency_code=ALL` — the total-orders tile. */
export function totalOrdersParams(): Record<string, string> {
  return {
    type: StatType.CONTRACTS,
    date_to: statsDateTo(),
    currency_code: STATS_ALL_CURRENCY_CODE
  };
}

/** `type=invoices&date_to=<today>&currency_code=ALL` — the total-invoices tile. */
export function totalInvoicesParams(): Record<string, string> {
  return {
    type: StatType.INVOICES,
    date_to: statsDateTo(),
    currency_code: STATS_ALL_CURRENCY_CODE
  };
}

/**
 * `type=invoices_category&report=["total"]&invoice_status=["invoice_unpaid","invoice_overdue"]
 * &date_to=<today>&currency_code=ALL` — the unpaid-invoices tile.
 */
export function unpaidInvoicesParams(): Record<string, string> {
  return {
    type: StatType.INVOICES_CATEGORY,
    report: bracketed(["total"]),
    invoice_status: bracketed([InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE]),
    date_to: statsDateTo(),
    currency_code: STATS_ALL_CURRENCY_CODE
  };
}

/**
 * `type=tickets&report=["open"]&date_to=<today>` — the active-tickets tile.
 * No `currency_code`: the tickets type is not currency-bound, and sending
 * the key omitted on the wire keeps the request the oracle sends (design 8.1).
 */
export function activeTicketsParams(): Record<string, string> {
  return {
    type: StatType.TICKETS,
    report: bracketed(["open"]),
    date_to: statsDateTo()
  };
}
