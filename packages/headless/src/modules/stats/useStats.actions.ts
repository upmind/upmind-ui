import { watch } from "vue";
import { resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { queryKey, usageQueryKey } from "./stats.services";
import { isUpmindContext } from "./stats.utils";
import { NotAuthenticatedError } from "../../utils";
import { every, map } from "lodash-es";
import type {
  StatCurrencyQuery,
  StatsServices,
  StatTicketQuery,
  UpmindUsageQuery
} from "./stats.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module stats/useStats.actions
 * @description Read actions — bounded, error-settling readiness over the FOUR
 * tile queries, plus refresh and lifecycle, and the SAME three actions for the
 * host-gated usage read. The precedent is
 * `useClientReceivedEmails.actions.ts:103-121` (design 8.6, AC21, AC16).
 *
 * WHY THE USAGE ACTIONS STAY SEPARATE: the usage read is gated on the Upmind
 * host context and the four tile reads are not. `isReady()` over both would
 * never settle on a non-Upmind host, and `refresh()` over both would reject
 * the tiles' re-read for the usage read's sake. The usage actions therefore
 * carry their own names — `isUsageReady`, `refreshUsage`, `resetUsage` — and
 * their own cache key.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useStats.actions.{actor}.ts` exists.
 */
export function createStatsActions(
  _actorScope: ScopeActorTypes,
  service: StatsServices,
  queries: {
    totalOrders: StatCurrencyQuery;
    totalInvoices: StatCurrencyQuery;
    unpaidInvoices: StatCurrencyQuery;
    activeTickets: StatTicketQuery;
  },
  usageQuery: UpmindUsageQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  const allQueries = [
    queries.totalOrders,
    queries.totalInvoices,
    queries.unpaidInvoices,
    queries.activeTickets
  ];

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /** Resolves the addressability outcome; self-stopping. */
  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
        () => {
          const outcome = addressableOutcome();
          if (outcome === undefined) return;
          stop();
          resolve(outcome);
        }
      );
    });
  }

  /** Resolves once EACH of the four reads has completed its first fetch. */
  function whenAllFetched(): Promise<boolean> {
    if (every(allQueries, q => q.isFetched.value)) {
      return Promise.resolve(every(allQueries, q => !q.error.value));
    }

    return new Promise<boolean>(resolve => {
      const stop = watch(
        map(allQueries, q => q.isFetched),
        fetched => {
          if (!every(fetched, Boolean)) return;
          stop();
          resolve(every(allQueries, q => !q.error.value));
        }
      );
    });
  }

  /** Resolves once the usage read has completed its first fetch. */
  function whenUsageFetched(): Promise<boolean> {
    if (usageQuery.isFetched.value) {
      return Promise.resolve(!usageQuery.error.value);
    }

    return new Promise<boolean>(resolve => {
      const stop = watch(usageQuery.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(!usageQuery.error.value);
      });
    });
  }

  /**
   * Resolves once the four stat TILES are ready to read.
   * @returns true once every stat has settled its first fetch, false if the
   * session settles without an addressable client. Always SETTLES.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenAllFetched();
  }

  /**
   * Resolves once the USAGE read is ready.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client. Always SETTLES — a 409 refusal
   * still counts as "settled": it resolves `false`, matching
   * `whenUsageFetched`'s `!usageQuery.error.value` read.
   */
  async function isUsageReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;
    // Outside the Upmind context the read is gated off at the query and never
    // fetches, so `whenUsageFetched()` would wait for a settle that never comes.
    if (!isUpmindContext()) return false;

    return whenUsageFetched();
  }

  /**
   * Forces a re-read of all four stat TILES from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const results = await Promise.all(map(allQueries, q => q.refetch()));
    const authError = results.find(
      result => result.error instanceof NotAuthenticatedError
    );
    if (authError) throw authError.error;
  }

  /**
   * Forces a re-read of the USAGE block from the server (AC16).
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refreshUsage(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await usageQuery.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /** Destroys this scoped instance — removes it from the registry. */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned (arms: none — parity.yaml).

  return {
    /** SHARED — destroys this scoped instance; removes it from the registry. */
    destroy,

    /** TILES — resolves true when all four stats are ready to read. Always settles. */
    isReady,

    /** TILES — refetches all four stats; rejects if it cannot address a client. */
    refresh,

    /** TILES — drops the cached data of all four stat reads (design DA56, AC22). */
    reset: resetQueryByKey(queryKey),

    /** USAGE — resolves true when the usage read is ready. Always settles. */
    isUsageReady,

    /** USAGE — refetches the usage read; rejects if it cannot address a client. */
    refreshUsage,

    /** USAGE — drops the usage read's cached data (design DA56, AC22). */
    resetUsage: resetQueryByKey(usageQueryKey)

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseStatsActions = ReturnType<typeof createStatsActions>;
