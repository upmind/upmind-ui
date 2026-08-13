import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientEmailHistoryServices,
  ReceivedEmailItemQuery
} from "./client-email-history.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmail.meta
 * @description Single-read meta — computed state flags, one computed per
 * flag. The oracle spreads `query.data.value.meta` into its `meta` object;
 * that read-state is KEPT but exposed as named computeds rather than a
 * spread, so the four-layer return is a fixed, inspectable set rather than
 * whatever the payload carried. The same flags remain on
 * `context.data.value.meta` for parity with the collection's rows.
 * @doctrine clause 2 — shared-only (armless). No per-actor capability
 * read-state exists in this module (NFR-1, no mutations at all).
 */
export function createClientReceivedEmailMeta(
  _actorScope: ScopeActorTypes,
  service: ClientEmailHistoryServices,
  query: ReceivedEmailItemQuery
) {
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyResult = computed(() => isEmpty(query.data.value?.id));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  const isComplete = computed(() => query.isFetched.value);

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientReceivedEmail.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the item query failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gates call, not a second
     * copy of it.
     */
    isAvailable: service.isAvailable,

    /** True once the first fetch has completed, regardless of outcome. */
    isComplete,

    /** True if this scope's email carries no id. */
    isEmpty: isEmptyResult,

    /** True while the read is loading or has not completed its first fetch. */
    isLoading,

    /** True if there was an issue delivering this email. */
    isBounced: computed(() => query.data.value?.meta?.isBounced ?? false),

    /** True if there was an error sending this email. */
    isError: computed(() => query.data.value?.meta?.isError ?? false),

    /** True if this email was sent successfully. */
    isSent: computed(() => query.data.value?.meta?.isSent ?? false)

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientReceivedEmailMeta = ReturnType<
  typeof createClientReceivedEmailMeta
>;
