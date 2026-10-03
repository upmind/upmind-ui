/** @internal */
import { computed } from "vue";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { mapCurrencyStatCount, mapTicketStatCount } from "./stats.mappers";
import {
  activeTicketsParams,
  isUpmindContext,
  totalOrdersParams,
  totalInvoicesParams,
  unpaidInvoicesParams
} from "./stats.utils";
import { useTime, NotAuthenticatedError } from "../../utils";
import type {
  StatCurrencyQuery,
  StatCurrencyResponseData,
  StatsServices,
  StatTicketQuery,
  StatTicketResponseData,
  UpmindUsageData,
  UpmindUsageQuery
} from "./stats.types";
import type { ScopeContext } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module stats/stats.services
 * @description The ONE services file `useStats` consumes — the four
 * fixed-parameter `GET api/stats` reads behind the dashboard tiles, and the
 * `GET api/clients/upmind_usage` refusal read. ONE factory, one identity
 * seam, one addressability predicate, so the five reads can never disagree
 * about whose data is being read.
 *
 * The two concerns keep SEPARATE cache keys and SEPARATE gates: the usage
 * read carries the Upmind-context gate on top of the shared addressability
 * predicate, and the four tile reads do not.
 *
 * Nothing here raises feedback. A failure lands in the query's own error
 * state, which `useStats.meta.ts` / `useStats.context.ts` exposes.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useStats.ts` only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. */
export const queryKey = ["client", "stats"] as const;

/** The Upmind-usage read's own cache key. */
export const usageQueryKey = ["client", "upmind-usage"] as const;

/**
 * Derives the target client from the RESOLVED scope. This module declares no
 * context (design 8.9): the scope matrix refuses `.for()` for every actor, so
 * the identity is always the active session's own client — never a
 * scope-context id. Every request-issuing function in this file shares this
 * one seam.
 */
function resolveClientId(_scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() => activeUser.value?.id);
}

/**
 * Resolves true only for an authenticated session with an addressable
 * client. The module's ONE addressability predicate — the landed convention
 * (ruling R9), copied from `client-personal-details.services.ts:117-120`.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * One currency-bound stat read (orders, invoices, unpaid invoices). Each
 * caller supplies its own fixed parameter bag and its own cache-key segment;
 * everything else — the guard, the gate, the mapper — is shared.
 */
function loadCurrencyStat(
  segment: string,
  params: Record<string, string>,
  clientId: ReturnType<typeof resolveClientId>
): StatCurrencyQuery {
  const { query, useUrl } = useQuery();

  return query<StatCurrencyResponseData, number | null>({
    queryKey: [...queryKey, segment, { client: clientId }],
    url: useUrl("stats", params),
    withAccessToken: true,
    guard: async () => {
      if (!isAddressable(clientId.value)) {
        return Promise.reject(new NotAuthenticatedError());
      }
      return true;
    },
    enabled: () => isAddressable(clientId.value),
    select: mapCurrencyStatCount,
    staleTime: useTime().MINUTE
  });
}

/** The active-tickets read — the one stat with no `currency_code` (design 8.1). */
function loadActiveTickets(
  clientId: ReturnType<typeof resolveClientId>
): StatTicketQuery {
  const { query, useUrl } = useQuery();

  return query<StatTicketResponseData, number | null>({
    queryKey: [...queryKey, "tickets", { client: clientId }],
    url: useUrl("stats", activeTicketsParams()),
    withAccessToken: true,
    guard: async () => {
      if (!isAddressable(clientId.value)) {
        return Promise.reject(new NotAuthenticatedError());
      }
      return true;
    },
    enabled: () => isAddressable(clientId.value),
    select: mapTicketStatCount,
    staleTime: useTime().MINUTE
  });
}

/**
 * The Upmind-usage read. `staleTime: 0` (ruling R3) — the oracle dispatches
 * this read uncached, and a landed `query()` with a normal `staleTime` would
 * change observable refetch behaviour. Gated exactly like its landed
 * siblings (ruling R9): `enabled` AND `guard` both call `isAddressable`, on
 * the `client-personal-details.services.ts:117-120,174` /
 * `client-address.services.ts:209-227` precedent. No Upmind-context
 * predicate stands in front of it — the server's 409 is the gate.
 *
 * The success path is deferred (ruling R7): `select` discards whatever the
 * server returns on a 200, so `useContext().data` stays `undefined` on every
 * reachable branch today.
 */
function loadUsage(
  clientId: ReturnType<typeof resolveClientId>
): UpmindUsageQuery {
  const { query, useUrl } = useQuery();

  return query<unknown, UpmindUsageData>({
    queryKey: [...usageQueryKey, { client: clientId }],
    url: useUrl("clients/upmind_usage"),
    withAccessToken: true,
    guard: async () => {
      if (!isAddressable(clientId.value)) {
        return Promise.reject(new NotAuthenticatedError());
      }
      return isUpmindContext();
    },
    enabled: () => isUpmindContext() && isAddressable(clientId.value),
    select: () => undefined as UpmindUsageData,
    staleTime: 0
  });
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useStats.ts` calls it once per scope, for BOTH
 * concerns.
 *
 * `_scopeActor` is unused today — the scope matrix is SELF-only and declares
 * no arm, so there is no per-actor member to select (`parity.yaml`'s `arms:`
 * determination, independently re-derived at Code: none).
 */
export const createStatsServices = (
  _scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): StatsServices => {
  const clientId = resolveClientId(scopeContext);

  return {
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    loadTotalOrders: () =>
      loadCurrencyStat("orders", totalOrdersParams(), clientId),
    loadTotalInvoices: () =>
      loadCurrencyStat("invoices", totalInvoicesParams(), clientId),
    loadUnpaidInvoices: () =>
      loadCurrencyStat("unpaid", unpaidInvoicesParams(), clientId),
    loadActiveTickets: () => loadActiveTickets(clientId),
    loadUsage: () => loadUsage(clientId)
  };
};

export default createStatsServices;
