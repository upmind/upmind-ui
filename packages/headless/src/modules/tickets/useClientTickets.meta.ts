import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { TicketsListQuery, TicketsServices } from "./tickets.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTickets.meta
 * @description Collection meta — computed state flags, one computed per flag.
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientTicketsMeta(
  _actorScope: ScopeActorTypes,
  service: TicketsServices,
  query: TicketsListQuery
) {
  /**
   * AC-CE (R9 fold-in) — a rejected `setCriteria` populates `query.criteriaError`
   * without touching `query.error`; folding it in here is what makes a
   * rejected criteria write visible to a consumer watching `hasError`.
   */
  const hasError = computed(
    () =>
      !!service.error.value ||
      !!query.error.value ||
      !!query.criteriaError.value
  );

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total === 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  return {
    /** True if the list query failed. */
    hasError,

    /** True while this scope can address a client. */
    isAvailable: service.isAvailable,

    /** True if this scope has no tickets. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading,

    /** True while there is a further page beyond the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while there is a page before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /** True while the list spans more than one page. */
    hasPages: computed(() => query.meta.value.hasPages)
  };
}

// Type export for consumers
export type UseClientTicketsMeta = ReturnType<typeof createClientTicketsMeta>;
