import type {
  StatCurrencyQuery,
  StatTicketQuery,
  UpmindUsageQuery
} from "./stats.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module stats/useStats.internals
 * @description Read internals (debugging) — the four raw TanStack query
 * objects behind the tiles, and the usage read's own raw query object, kept
 * as a SEPARATE member because it answers to a separate gate.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createStatsInternals(
  actorScope: ScopeActorTypes,
  queries: {
    totalOrders: StatCurrencyQuery;
    totalInvoices: StatCurrencyQuery;
    unpaidInvoices: StatCurrencyQuery;
    activeTickets: StatTicketQuery;
  },
  usageQuery: UpmindUsageQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** TILES — raw TanStack query objects backing the four reads. */
    queries,
    /** USAGE — raw TanStack query object backing the host-gated usage read. */
    usageQuery
  };
}

// Type export for consumers
export type UseStatsInternals = ReturnType<typeof createStatsInternals>;
