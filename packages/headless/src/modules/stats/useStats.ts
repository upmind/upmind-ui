import { createScopedComposable } from "../scope";
import { createStatsServices } from "./stats.services";
import { STATS_SCOPE_MATRIX } from "./stats.types";
import { createStatsActions } from "./useStats.actions";
import { createStatsContext } from "./useStats.context";
import { createStatsInternals } from "./useStats.internals";
import { createStatsMeta } from "./useStats.meta";
import type { StatsScopeMatrix } from "./stats.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module stats/useStats
 * @description Scoped, query-backed read of the client dashboard's stats: the
 * four stat counts (total orders, total invoices, unpaid invoices, active
 * tickets) and the Upmind-usage block. Five reactive single-record queries,
 * minted once per concrete `(actor, context)` scope so they survive component
 * lifecycles.
 *
 * TWO CONCERNS, ONE COMPOSABLE, DISTINCT MEMBERS. The four tile reads answer
 * on every host. The usage read (`GET api/clients/upmind_usage`) is gated on
 * the Upmind host context (`isUpmindContext`, mirroring the vue-app oracle at
 * `src/store/index.ts:66-69`) AND on the landed `isAddressable` predicate
 * (ruling R9), and its success path is deferred (ruling R7) — it ships the
 * request and the refusal path only, where the server's 409 IS the gate. A
 * flag shared between the halves would therefore be wrong the moment the
 * usage read is gated off, which is why every usage member is named apart.
 *
 * SELF ONLY. The scope matrix declares SELF alone and no context, so there is
 * no `.for()` and no staff arm (design 8.9).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createStatsForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor;

  /**
   * ONE services instance for this scope, serving BOTH concerns.
   * `config.context` goes in here and nowhere else — though this module
   * declares no context (design 8.9), so every read always resolves the
   * active session's own client.
   */
  const service = createStatsServices(actorScope, config.context);

  /**
   * The four reactive stat queries, minted ONCE per scope — a
   * `service.loadX()` call inside a layer factory would mint a second query
   * with its own refs, key and effect scope.
   */
  const totalOrders = service.loadTotalOrders();
  const totalInvoices = service.loadTotalInvoices();
  const unpaidInvoices = service.loadUnpaidInvoices();
  const activeTickets = service.loadActiveTickets();

  const queries = { totalOrders, totalInvoices, unpaidInvoices, activeTickets };

  /** The reactive usage query, minted ONCE per scope, on its own cache key. */
  const usageQuery = service.loadUsage();

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for read actions (readiness, refresh, lifecycle). */
    useActions: () =>
      createStatsActions(actorScope, service, queries, usageQuery, scopeKey),

    /** Sub-composable for read context (the counts, the usage answer, errors). */
    useContext: () => createStatsContext(actorScope, queries, usageQuery),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createStatsInternals(actorScope, queries, usageQuery),

    /** Sub-composable for read meta (loading, error and visibility flags). */
    useMeta: () => createStatsMeta(actorScope, service, queries, usageQuery)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for the client dashboard's stats — the four counts and
 * the Upmind-usage block.
 *
 * @example
 * ```ts
 * const stats = useStats().as('client')
 * const { totalOrders, totalInvoices, unpaidInvoices, activeTickets } = stats.useContext().data.value
 * await stats.useActions().isReady()
 *
 * // The usage half, on its own members:
 * await stats.useActions().isUsageReady()
 * const { isUsageVisible } = stats.useMeta()
 * ```
 */
export const useStats = createScopedComposable<
  ReturnType<typeof createStatsForScope>,
  StatsScopeMatrix
>("stats", createStatsForScope, STATS_SCOPE_MATRIX);

// Type export for consumers
export type UseStats = ReturnType<typeof useStats>;
