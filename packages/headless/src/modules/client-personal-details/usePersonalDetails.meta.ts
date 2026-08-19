import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientPersonalDetailsRecordQuery,
  ClientPersonalDetailsServices
} from "./client-personal-details.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetails.meta
 * @description Read meta — computed state flags, one computed per flag.
 * @doctrine clause 2 — shared-only (armless). No capability read-state
 * exists in this module, so `meta` legitimately stays shared-only rather
 * than needing a per-actor capability arm.
 */
export function createPersonalDetailsMeta(
  _actorScope: ScopeActorTypes,
  service: ClientPersonalDetailsServices,
  query: ClientPersonalDetailsRecordQuery
) {
  const hasError = computed(() => !!query.error.value);

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  const isEmptyProfile = computed(() => isEmpty(query.data.value));

  // --- actor-specific meta: none earned yet (clause 2).

  return {
    /** True if the profile read failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gate calls.
     */
    isAvailable: service.isAvailable,

    /** True if the profile read has not yet returned any fields. */
    isEmpty: isEmptyProfile,

    /** True while the read is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UsePersonalDetailsMeta = ReturnType<
  typeof createPersonalDetailsMeta
>;
