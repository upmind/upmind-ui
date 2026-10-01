import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { AffiliatePayoutsListQuery } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayouts.meta
 * @description Collection meta — computed state flags.
 */
export function createAffiliatePayoutsMeta(
  _actorScope: ScopeActorTypes,
  query: AffiliatePayoutsListQuery,
  keyAccountId: Ref<string | undefined>
) {
  const hasError = computed(
    () => !!query.error.value || !!query.criteriaError.value
  );

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total == 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  return {
    hasError,
    hasNextPage: computed(() => query.meta.value.hasNextPage),
    hasPages: computed(() => query.meta.value.hasPages),
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),
    isAvailable: computed(() => !!keyAccountId.value),
    isEmpty: isEmptyList,
    isFiltered: query.isFiltered,
    isLoading
  };
}
