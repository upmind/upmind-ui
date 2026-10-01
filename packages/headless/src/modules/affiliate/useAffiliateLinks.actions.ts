import { watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { AFFILIATE_LINKS_QUERY_KEY } from "./affiliate.services";
import { mapToHeadlessError, NotAuthenticatedError } from "../../utils";
import type {
  AffiliateLinksListQuery,
  AffiliateSortEntry
} from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinks.actions
 * @description Collection actions — list controls, `remove` and lifecycle
 * (design.md §8.1, §8.2, §8.3).
 */

const READINESS_TIMEOUT_MS = 15_000;

export function createAffiliateLinksActions(
  _actorScope: ScopeActorTypes,
  query: AffiliateLinksListQuery,
  keyAccountId: Ref<string | undefined>,
  removeLink: (accountId: string, linkId: string) => Promise<void>,
  scopeKey: string,
  writeError: Ref<ResponseError | undefined>
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

  /** Resolves once the first fetch has settled; `false` while no account is keyed. */
  async function isReady(): Promise<boolean> {
    if (!keyAccountId.value) return false;
    return whenListFetched();
  }

  /** Refetches the list from the server; rejects while no account is keyed. */
  async function refresh(): Promise<void> {
    if (!keyAccountId.value) throw new NotAuthenticatedError();
    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /** Writes `filters.name.like` — the links free-text search (design.md §8.3). */
  function filterQuery(value?: string): void {
    query.setCriteria({ filters: { name: { like: value ?? null } } });
  }

  /** Applies a sort intent — the `sort` branch of the one query model. */
  function sortBy(
    intent: AffiliateSortEntry<
      "created_at" | "visit_count" | "referral_count"
    >[]
  ): void {
    query.setCriteria({ sort: intent });
  }

  /**
   * Deletes a link, then refetches with the current criteria (design.md
   * §8.2, AC12). A refused delete fills `writeError` and keeps the row —
   * it never rejects (design.md §8.2 Failure surface, D-33): "`hasError`
   * true, `error` holds the failure. The row stays. No links GET."
   */
  async function remove(linkId: string): Promise<void> {
    const accountId = keyAccountId.value;
    if (!accountId) throw new NotAuthenticatedError();
    try {
      await removeLink(accountId, linkId);
      writeError.value = undefined;
    } catch (err) {
      writeError.value = mapToHeadlessError(err);
    }
  }

  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  return {
    destroy,
    filters: { query: filterQuery },
    invalidate: invalidateQueryByKey(AFFILIATE_LINKS_QUERY_KEY, {
      exact: false
    }),
    isReady,
    nextPage: async (): Promise<void> => query.fetchNextPage(),
    prevPage: async (): Promise<void> => query.fetchPreviousPage(),
    refresh,
    remove,
    reset: resetQueryByKey(AFFILIATE_LINKS_QUERY_KEY),
    setCriteria: query.setCriteria,
    sortBy
  };
}
