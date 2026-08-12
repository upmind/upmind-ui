import { computed } from "vue";
import { isArray, isEmpty } from "lodash-es";
import type {
  ClientCustomFieldsListQuery,
  ClientCustomFieldsServices
} from "./client-custom-fields.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFields.meta
 * @description Collection meta — computed state flags, one computed per flag.
 * @doctrine clause 2 — shared-only (armless). No capability read-state exists
 * in this module, so `meta` legitimately stays shared-only rather than
 * needing a per-actor capability arm.
 */
export function createClientCustomFieldsMeta(
  _actorScope: ScopeActorTypes,
  service: ClientCustomFieldsServices,
  query: ClientCustomFieldsListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with
  // no own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  const count = computed(() =>
    isArray(query.data.value) ? query.data.value.length : 0
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientCustomFields.meta.{actor}.ts` and spread it LAST.

  return {
    /** How many definitions this scope's brand has (AC-9). */
    count,

    /** True if a mutation or the list query failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id AND a resolved brand id. Handed straight through
     * from the services instance: this IS the predicate the request gates
     * call, not a second copy of it.
     */
    isAvailable: service.isAvailable,

    /** True if this scope's brand has no definitions (AC-9). */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientCustomFieldsMeta = ReturnType<
  typeof createClientCustomFieldsMeta
>;
