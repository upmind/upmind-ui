// TEMPLATE FILE — scaffold only when this actor earns a meta arm (ARMS.md).
import { computed } from "vue";
import type { ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta.client
 * @description Client-specific module collection meta.
 */

export function createClientModuleMeta(query: ModuleListQuery) {
  const canRegisterAsGuest = computed(() => true);
  const isLoadingOrRefetching = computed(
    () =>
      query.isLoading.value || !query.isFetched.value || query.isFetching.value
  );

  return {
    /** True if this client may register as a guest. */
    canRegisterAsGuest,

    /** True while the list is loading, unfetched, or refetching. */
    isLoading: isLoadingOrRefetching
  };
}

export type ClientModuleMeta = ReturnType<typeof createClientModuleMeta>;
