// TEMPLATE FILE — scaffold only when this actor earns a context arm (ARMS.md).
import { computed } from "vue";
import { castArray, flatMap } from "lodash-es";
import type { {Module}, ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context.client
 * @description Client-specific module collection context.
 */

export function createClientModuleContext(
  query: ModuleListQuery,
  baseLookups: { key: string }[]
) {
  const entitlements = computed<string[]>(() =>
    flatMap(
      castArray(query.data.value ?? []),
      (item: {Module}) => item.entitlements ?? []
    )
  );
  const clientLookups = computed(() => [
    ...baseLookups,
    { key: "clientCustomFields" }
  ]);

  return {
    /** Entitlements across the client's items. */
    entitlements,

    /** Base reference data plus the client's custom fields. */
    lookups: clientLookups
  };
}

export type ClientModuleContext = ReturnType<typeof createClientModuleContext>;
