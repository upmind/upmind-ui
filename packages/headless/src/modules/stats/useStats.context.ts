import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import { find } from "lodash-es";
import type {
  StatCurrencyQuery,
  StatsData,
  StatTicketQuery,
  UpmindUsageData,
  UpmindUsageQuery
} from "./stats.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module stats/useStats.context
 * @description Read context — the four published stat counts, flat off the
 * four query results, plus the Upmind-usage answer and its own error. Data is
 * mapped in `stats.services.ts` via `select`, never here.
 *
 * WHY THE TWO CONCERNS KEEP SEPARATE MEMBERS: the usage read is gated on the
 * Upmind host context (`isUpmindContext`) and the four tile reads are not.
 * `data.usage` carries its own absent value and `usageError` its own failure,
 * so a host with the usage read gated off still reads four honest counts. A
 * single shared `error` would report the usage refusal as a tile failure.
 *
 * @doctrine clause 2 — shared-only (armless).
 */

// The query core's own `data` falls back to `[] as TData` on every unresolved
// branch (disabled, errored, unfetched) — `[]` never legitimately holds a
// stat count. Normalising it back to the contracted absent value keeps that
// core-level default from leaking as a false answer here (ruling R16.2).
function normalizeStatCount(value: number | null): number | null {
  return Array.isArray(value) ? null : value;
}

export function createStatsContext(
  _actorScope: ScopeActorTypes,
  queries: {
    totalOrders: StatCurrencyQuery;
    totalInvoices: StatCurrencyQuery;
    unpaidInvoices: StatCurrencyQuery;
    activeTickets: StatTicketQuery;
  },
  usageQuery: UpmindUsageQuery
) {
  // The query core's own `data` falls back to `[] as TData` on every
  // unresolved branch (disabled, errored, unfetched) — normalise that
  // core-level default back to `undefined`, the contracted absent value
  // (ruling R16.2).
  const usage = computed<UpmindUsageData>(() =>
    Array.isArray(usageQuery.data.value) ? undefined : usageQuery.data.value
  );

  const data = computed<StatsData>(() => ({
    totalOrders: normalizeStatCount(queries.totalOrders.data.value),
    totalInvoices: normalizeStatCount(queries.totalInvoices.data.value),
    unpaidInvoices: normalizeStatCount(queries.unpaidInvoices.data.value),
    activeTickets: normalizeStatCount(queries.activeTickets.data.value),
    usage: usage.value
  }));

  const allQueries = [
    queries.totalOrders,
    queries.totalInvoices,
    queries.unpaidInvoices,
    queries.activeTickets
  ];

  /**
   * The first failed stat's captured error, mapped. The oracle publishes no
   * failure signal at all on this half (design 10.1 row 43, DA10) — this is
   * a net add, so a consumer can tell a failure from an empty result (AC9).
   *
   * TILES ONLY. The usage read's failure is `usageError` below.
   */
  const error = computed<ResponseError | undefined>(() => {
    const failed = find(allQueries, q => !!q.error.value);
    return failed?.error.value
      ? mapToHeadlessError(failed.error.value)
      : undefined;
  });

  /**
   * ERRORS ARE STATE, NOT EVENTS. The usage query's own captured failure,
   * which is the recorded 409 refusal on every reachable branch (AC14). This
   * layer never raises it.
   *
   * USAGE ONLY — never folded into `error` above.
   */
  const usageError = computed<ResponseError | undefined>(() =>
    usageQuery.error.value
      ? mapToHeadlessError(usageQuery.error.value)
      : undefined
  );

  // --- actor-specific context: none earned (arms: none — parity.yaml).

  return {
    /**
     * The four published counts (an absent report key stays `null`, design
     * 8.3) and, as its own member, the Upmind-usage answer — `undefined` on
     * every reachable branch (ruling R7) and on every non-Upmind host.
     */
    data,

    /** TILES — the first failed stat's captured error, read, never raised (AC9). */
    error,

    /** USAGE — the usage read's own captured error, read, never raised (AC14). */
    usageError

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseStatsContext = ReturnType<typeof createStatsContext>;
