import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import type { TicketItemQuery, TicketsServices } from "./tickets.types";
import type { TicketFeedState } from "./useClientTicket.actions";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTicket.context
 * @description Manager context — the ticket, its merged feed, its
 * department and its related product. Data is mapped in
 * `tickets.services.ts` via `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientTicketContext(
  _actorScope: ScopeActorTypes,
  service: TicketsServices,
  query: TicketItemQuery,
  feed: TicketFeedState
) {
  const data = computed(() => query.data.value);

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  return {
    /** The loaded ticket, or `undefined` before the first fetch settles. */
    data,

    /** The ticket's department relation (AC12, AC31). */
    department: computed(() => data.value?.department),

    /** The scope's captured error — read, never raised. */
    error,

    /** AC14/AC15/AC22 — the merged, cursor-paged message + status-log feed. */
    feed: {
      entries: computed(() => feed.entries.value),
      hasOlder: computed(() => feed.hasOlder.value),
      hasNewer: computed(() => feed.hasNewer.value),
      isLoading: computed(() => feed.isLoading.value)
    },

    /** AC13 — the ticket's linked product, if any. */
    relatedProduct: computed(() => data.value?.contract_product)
  };
}

// Type export for consumers
export type UseClientTicketContext = ReturnType<
  typeof createClientTicketContext
>;
