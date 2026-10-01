import { watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { AFFILIATE_REFERRALS_QUERY_KEY } from "./affiliate.services";
import { NotAuthenticatedError } from "../../utils";
import type {
  AffiliateReferralsListQuery,
  AffiliateSortEntry
} from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateReferrals.actions
 * @description Collection actions — list controls and lifecycle (design.md §8.3).
 */

const READINESS_TIMEOUT_MS = 15_000;

export function createAffiliateReferralsActions(
  _actorScope: ScopeActorTypes,
  query: AffiliateReferralsListQuery,
  keyAccountId: Ref<string | undefined>,
  scopeKey: string
) {
  function whenListFetched(): Promise<boolean> {
    if (query.isFetched.value) return Promise.resolve(true);

    return new Promise<boolean>(resolve => {
      const timer = setTimeout(() => {
        stop();
        resolve(false);
      }, READINESS_TIMEOUT_MS);

      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        clearTimeout(timer);
        stop();
        resolve(true);
      });
    });
  }

  async function isReady(): Promise<boolean> {
    if (!keyAccountId.value) return false;
    return whenListFetched();
  }

  async function refresh(): Promise<void> {
    if (!keyAccountId.value) throw new NotAuthenticatedError();
    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  function sortBy(intent: AffiliateSortEntry<"created_at">[]): void {
    query.setCriteria({ sort: intent });
  }

  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  return {
    destroy,
    invalidate: invalidateQueryByKey(AFFILIATE_REFERRALS_QUERY_KEY, {
      exact: false
    }),
    isReady,
    nextPage: async (): Promise<void> => query.fetchNextPage(),
    prevPage: async (): Promise<void> => query.fetchPreviousPage(),
    refresh,
    reset: resetQueryByKey(AFFILIATE_REFERRALS_QUERY_KEY),
    setCriteria: query.setCriteria,
    sortBy
  };
}
