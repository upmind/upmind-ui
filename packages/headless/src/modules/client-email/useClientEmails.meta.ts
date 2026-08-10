import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientEmailListQuery,
  ClientEmailServices
} from "./client-email.types";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.meta
 * @description Collection meta — computed state flags, one computed per flag.
 */
export function createClientEmailsMeta(
  _actorScope: ScopeActorTypes,
  service: ClientEmailServices,
  query: ClientEmailListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with no
  // own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  return {
    /** True if a row mutation or the list query failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services instance:
     * this IS the predicate the request gates call, not a second copy of it.
     */
    isAvailable: service.isAvailable,

    /** True if this scope has no addresses. */
    isEmpty: isEmptyList,

    /**
     * True while any declared filter column carries a value. Handed straight
     * through from the query's published criteria — so an empty list that is
     * empty BECAUSE it is filtered can say so, instead of both emptinesses
     * reading the same.
     */
    isFiltered: query.isFiltered,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading
  };
}

export type UseClientEmailsMeta = ReturnType<typeof createClientEmailsMeta>;
