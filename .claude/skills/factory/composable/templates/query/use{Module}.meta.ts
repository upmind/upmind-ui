// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { computed } from "vue";
import { useActiveSession } from "../session-store";
import { isEmpty } from "lodash-es";
import type { ScopeActorTypes } from "../scope";
import type { ModuleListQuery } from "./module.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta
 * @description Module collection meta factory.
 */

export function createModuleMeta(
  actorScope: ScopeActorTypes,
  query: ModuleListQuery,
  clientId: ComputedRef<string | undefined>
) {
  const { isAuthenticated } = useActiveSession().useMeta();

  const hasErrors = computed(
    () => !isEmpty(query.error.value) || !isEmpty(query.criteriaError.value)
  );
  const hasPages = computed(() => query.meta.value.hasPages);
  const isAvailable = computed(() => isAuthenticated.value && !!clientId.value);
  const isEmptyList = computed(() => isEmpty(query.data.value));
  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  return {
    /** True if the list query or the last criteria write failed. */
    hasErrors,

    /** True while pagination applies to this list. */
    hasPages,

    /** True while the session is authenticated and the scope targets a client. */
    isAvailable,

    /** True if the collection has no items. */
    isEmpty: isEmptyList,

    /** True while any filter is applied. */
    isFiltered: query.isFiltered,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading
  };
}

export type UseModuleMeta = ReturnType<typeof createModuleMeta>;
