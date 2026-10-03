/**
 * @graphify-citation `graphify query "client stats dashboard tiles orders
 * invoices tickets usage"` against `graphify-out/graph.json` — no existing
 * `StatType` / `StatsData` / `UpmindUsageData` / `STATS_SCOPE_MATRIX`
 * node. Every type minted below is net-new; none re-declares an existing
 * node. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module stats/stats.types
 * @description Types for the client dashboard stats data layer — ONE
 * composable, `useStats`, carrying TWO concerns: the four stat-count reads
 * (the tiles) and the Upmind-usage refusal read (the usage block). Only ONE
 * actor may ever address it: the signed-in client, SELF. The oracle names no
 * cell where a client acts for another client, and no cell where staff
 * addresses this leaf either (`parity.yaml`), so this module declares NO
 * context enum and a SELF-only matrix — the FE-3095 "single-record read"
 * shape (`client-email-history.types.ts`'s `RECEIVED_EMAIL_SCOPE_MATRIX`),
 * applied here even though this read carries no record id at all: the
 * identity is simply whoever is signed in (design 8.9).
 *
 * The two concerns keep DISTINCT members throughout. The usage read is gated
 * on the Upmind host context and the four tile reads are not, so a shared
 * flag would be wrong the moment the usage half is gated off.
 *
 * The usage success path is deferred (ruling R7) and the quota-key map is
 * deferred with it (ruling R10) — `UpmindUsageData` therefore has no members
 * today, and no `UpmindUsageQuotaKey` type exists.
 */
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { SimpleQuery } from "../query";
import type { ScopeContext } from "../scope";
import type { IClient } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — no context enum, SELF only
//
// A cell governs `.for()` ONLY. The matrix declares SELF alone, and SELF is
// `null as never`, so `.for()` is a compile-time error for every actor —
// `ContextsForActor` answers `never` for an actor the matrix omits. It does
// NOT make `.as('staff')` a compile error, because `as<TActor>` carries no
// matrix constraint. AC20 proves the resulting behaviour: naming another
// actor still reads the session client's own path. See design 8.9.
// -----------------------------------------------------------------------------

/**
 * Scope matrix for `useStats`. SELF only, and `null as never`: the oracle
 * supports no client-for-another-client cell and no staff cell for this leaf
 * (`parity.yaml`), so there is no arm to declare and `.for(type, id)` is a
 * compile-time error for every actor.
 */
export const STATS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never
} as const;

/** Scope matrix type for `useStats` (derived from the runtime const). */
export type StatsScopeMatrix = typeof STATS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// WIRE TYPES — GET api/stats
// -----------------------------------------------------------------------------

/** The four `type` values `GET api/stats` accepts on the client path (design 8.1). */
export enum StatType {
  CONTRACTS = "contracts",
  INVOICES = "invoices",
  INVOICES_CATEGORY = "invoices_category",
  TICKETS = "tickets"
}

/**
 * One row of a currency-bound report's `result.<CURRENCY>` array. The wire
 * carries many more fields (amounts, currency detail, formatted strings) —
 * only `count` is ever read (design 8.4).
 */
export type StatCurrencyResultRow = { count: number };

/**
 * The currency-keyed result of a currency-bound report (`total`, on the
 * three currency-bound stat types). Keyed by currency code, plus the fixed
 * `ALL` key this module always requests (design 8.1).
 */
export type StatCurrencyResult = Record<string, StatCurrencyResultRow[]>;

/** One row of the tickets report's bare result array. */
export type StatTicketResultRow = { count: number };

/** The bare result array of the tickets report (`open`). */
export type StatTicketResult = StatTicketResultRow[];

/**
 * One report key of a `GET api/stats` answer: a first/last date pair and a
 * result. The server sends `null` for a currency-bound report with nothing
 * to report in the window (design 8.3) — the tickets report has no recorded
 * null case, but the mapper reads it defensively (design 8.3, 8.4, 10.1
 * row 15 group note).
 *
 * @template TResult - {@link StatCurrencyResult} or {@link StatTicketResult}.
 */
export type StatReport<TResult> = {
  date: { first_date: string; last_date: string };
  result: TResult;
} | null;

/** The `total` report of a currency-bound stat type. */
export type StatCurrencyReport = StatReport<StatCurrencyResult>;

/** The `open` report of the tickets stat type. */
export type StatTicketReport = StatReport<StatTicketResult>;

/** The `GET api/stats` answer for a currency-bound read (`total` key only). */
export type StatCurrencyResponseData = { total: StatCurrencyReport };

/** The `GET api/stats` answer for the tickets read (`open` key only). */
export type StatTicketResponseData = { open?: StatTicketReport };

// -----------------------------------------------------------------------------
// PUBLISHED TYPES
// -----------------------------------------------------------------------------

/**
 * The published read context of `useStats`. The four tile counts and the
 * usage answer are SEPARATE members and never collapse into one: an absent
 * report key stays `null`; the module never coalesces an absence into zero,
 * and never promotes a real zero into an absence (design 8.3). `usage` is
 * host-gated and the four counts are not, so `usage` carries its own absent
 * value and its own flags.
 */
export type StatsData = {
  totalOrders: number | null;
  totalInvoices: number | null;
  unpaidInvoices: number | null;
  activeTickets: number | null;
  /**
   * The Upmind-usage answer. DISTINCT from the four counts above — the usage
   * read is gated on the Upmind host context (`isUpmindContext`) and the tile
   * reads are not, so it is absent on every non-Upmind host while the tiles
   * still answer.
   */
  usage: UpmindUsageData;
};

/**
 * The usage answer of the server. Ruling R7 defers the whole 200 success
 * path — the eleven usage numbers and the quota-key map (ruling R10) — so
 * this type carries no members today. `useContext().data` therefore stays
 * `undefined` on every reachable branch; the refusal path (409) is what this
 * module proves, through `useContext().error` and `useMeta().isVisible`.
 */
export type UpmindUsageData = undefined;

/**
 * The quota bag of the client record (AC18), as the wire actually carries
 * it. Declared for read-back clarity; no composable of this module reads it
 * — the bag lands on the session alone (ruling R2, design DA12).
 */
export type PackageLimits = IClient["upmind_package_limits"];

// -----------------------------------------------------------------------------
// SERVICE-LAYER SHAPES
// -----------------------------------------------------------------------------

/** The reactive single read for a currency-bound stat, minted once per scope. */
export type StatCurrencyQuery = SimpleQuery<
  StatCurrencyResponseData,
  number | null
>;

/** The reactive single read for the tickets stat, minted once per scope. */
export type StatTicketQuery = SimpleQuery<
  StatTicketResponseData,
  number | null
>;

/** The reactive usage read, minted once per scope. */
export type UpmindUsageQuery = SimpleQuery<unknown, UpmindUsageData>;

/**
 * The contract `createStatsServices` resolves to — consumed by `useStats.ts`
 * alone. ONE identity seam and ONE addressability predicate serve all five
 * reads, so they can never disagree about whose data is being read.
 */
export type StatsServices = {
  /** The target client this scope resolved. */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate
   * in `stats.services.ts` calls (R9's landed convention). The usage read
   * carries the Upmind-context gate ON TOP of this one; the tile reads do
   * not.
   */
  isAvailable: ComputedRef<boolean>;
  loadTotalOrders: () => StatCurrencyQuery;
  loadTotalInvoices: () => StatCurrencyQuery;
  loadUnpaidInvoices: () => StatCurrencyQuery;
  loadActiveTickets: () => StatTicketQuery;
  loadUsage: () => UpmindUsageQuery;
};

export type { ScopeContext, ResponseError };
