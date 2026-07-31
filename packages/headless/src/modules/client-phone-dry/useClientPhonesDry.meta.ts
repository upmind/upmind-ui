import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { ScopeActorTypes } from "../scope";
import type { ClientPhoneDryListQuery } from "./client-phone-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/useClientPhonesDry.meta
 * @description Collection state flags. Armless — identical shape across both
 * cells (design.md §7): derived purely off the query's own state, which
 * already differs per arm via its `enabled`/`guard` (no actor branch needed
 * here — clause 4).
 */

export function createClientPhoneDryMeta(
  _actorScope: ScopeActorTypes,
  query: ClientPhoneDryListQuery
) {
  const isError = computed(() => !isEmpty(query.error.value));

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query?.isLoading.value || !query.isFetched.value
  );

  const isAvailable = computed(() => query.isFetched.value && !isError.value);

  return {
    /** True if the list query resolved with an error. */
    isError,

    /** True if the collection has no items. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading,

    /** True once the list has fetched without error, for THIS scope's identity. */
    isAvailable,

    /** Alias of `isAvailable` (baseline `client-phone/useClientPhones.ts` naming). */
    isAuthenticated: isAvailable
  };
}

// Type export for consumers
export type UseClientPhonesDryMeta = ReturnType<
  typeof createClientPhoneDryMeta
>;
