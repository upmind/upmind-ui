import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientPhoneListQuery,
  ClientPhoneServices
} from "./client-phone.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/useClientPhones.meta
 * @description Collection meta — computed state flags, one computed per
 * flag.
 * @doctrine clause 2 — shared-only (armless). No capability read-state exists
 * in this module, so `meta` legitimately stays shared-only rather than
 * needing a per-actor capability arm.
 */
export function createClientPhonesMeta(
  _actorScope: ScopeActorTypes,
  service: ClientPhoneServices,
  query: ClientPhoneListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with no
  // own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientPhones.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if a row mutation or the list query failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance (row C4): this IS the predicate the request gates call, not a
     * second copy of it.
     */
    isAvailable: service.isAvailable,

    /** True if this scope has no phone numbers. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last.
  };
}

// Type export for consumers
export type UseClientPhonesMeta = ReturnType<typeof createClientPhonesMeta>;
