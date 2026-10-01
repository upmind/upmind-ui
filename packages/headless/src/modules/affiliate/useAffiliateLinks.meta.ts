import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { AffiliateLinksListQuery } from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinks.meta
 * @description Collection meta — computed state flags.
 */
export function createAffiliateLinksMeta(
  _actorScope: ScopeActorTypes,
  query: AffiliateLinksListQuery,
  keyAccountId: Ref<string | undefined>,
  writeError: Ref<ResponseError | undefined>
) {
  const hasError = computed(
    () =>
      !!writeError.value || !!query.error.value || !!query.criteriaError.value
  );

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total == 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  return {
    /** True if the list query failed. */
    hasError,

    /** True while the query has a further page after the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while pagination applies to this list at all. */
    hasPages: computed(() => query.meta.value.hasPages),

    /** True while the query has a page before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /** True while the collection is bound to an account and has requests to send. */
    isAvailable: computed(() => !!keyAccountId.value),

    /** True if this scope has no links. */
    isEmpty: isEmptyList,

    /** True while any declared filter column carries a value. */
    isFiltered: query.isFiltered,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading
  };
}
