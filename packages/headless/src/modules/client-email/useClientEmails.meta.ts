import { computed } from "vue";
import service from "./client-email.services";
import { useActiveSession } from "../session-store";
import { isEmpty } from "lodash-es";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.meta
 * @description Client-emails collection meta factory (computed state flags).
 */

/** The reactive list query minted by `service.loadList`. */
type EmailListQuery = ReturnType<typeof service.loadList>;

/**
 * Creates the client-emails collection meta (computed state flags).
 * @internal
 */
export function createClientEmailsMeta(query: EmailListQuery) {
  const { isAuthenticated } = useActiveSession().useMeta();

  // ---------------------------------------------------------------------------
  return {
    /** True if the active session is authenticated (the list is addressable). */
    isAvailable: isAuthenticated,

    /** True if the client has no emails. */
    isEmpty: computed(
      () => isEmpty(query.data?.value) || query.pagination.value.total == 0
    ),

    /** True if the list query resolved with an error. */
    hasError: computed(() => !isEmpty(query.error.value)),

    /** True while the list is loading or has not completed its first fetch. */
    isLoading: computed(() => query?.isLoading.value || !query.isFetched.value)
  };
}

// Type export for consumers
export type UseClientEmailsMeta = ReturnType<typeof createClientEmailsMeta>;
