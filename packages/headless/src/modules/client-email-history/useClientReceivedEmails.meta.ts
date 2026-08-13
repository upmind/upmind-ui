import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientEmailHistoryServices,
  ReceivedEmailsListQuery
} from "./client-email-history.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmails.meta
 * @description Collection meta — computed state flags, one computed per
 * flag.
 * @doctrine clause 2 — shared-only (armless). No capability read-state exists
 * in this module (NFR-1, no mutations at all), so `meta` legitimately stays
 * shared-only rather than needing a per-actor capability arm.
 */
export function createClientReceivedEmailsMeta(
  _actorScope: ScopeActorTypes,
  service: ClientEmailHistoryServices,
  query: ReceivedEmailsListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with no
  // own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total === 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientReceivedEmails.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the list query failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gates call, not a second
     * copy of it.
     */
    isAvailable: service.isAvailable,

    /** True if this scope has no history. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading,

    /** True while there is a further page beyond the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while there is a page before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /** True while the history spans more than one page. */
    hasPages: computed(() => query.meta.value.hasPages)

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientReceivedEmailsMeta = ReturnType<
  typeof createClientReceivedEmailsMeta
>;
