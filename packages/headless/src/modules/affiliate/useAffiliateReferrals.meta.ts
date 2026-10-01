import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { AffiliateReferralsListQuery } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateReferrals.meta
 * @description Collection meta — computed state flags.
 */
export function createAffiliateReferralsMeta(
  _actorScope: ScopeActorTypes,
  query: AffiliateReferralsListQuery,
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
