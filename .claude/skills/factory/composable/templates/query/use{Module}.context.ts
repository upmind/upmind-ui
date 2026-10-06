// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { computed } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./module.schemas";
import { useCollection } from "../../utils";
import { castArray } from "lodash-es";
import type { ScopeActorTypes } from "../scope";
import type { {Module}, ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context
 * @description Module collection context factory.
 */

// An actor arm receives this so its lookups extend the base set, never copy it.
const baseLookups = [{ key: "currencies" }, { key: "languages" }];

export function createModuleContext(
  actorScope: ScopeActorTypes,
  query: ModuleListQuery
) {
  const { findOne, getOne } = useCollection<{Module}>(query.data);

  const data = computed(() => castArray(query.data.value ?? []));
  // A rejected filter is the user's own input, so it surfaces first.
  const error = computed(() => query.criteriaError.value ?? query.error.value);
  const lookups = computed(() => baseLookups);

  return {
    /** The reactive list (always an array). */
    data,

    /** The last criteria or request error. */
    error,

    /** Finds a single item by a partial mapping. */
    findOne,

    /** Finds a single item by id. */
    getOne,

    /** Reference data every actor needs. */
    lookups,

    /** Pagination descriptor for the list query. */
    pagination: query.pagination,

    /** The active request state: filters, sort, pagination. */
    query: query.criteria,

    /** The query schema family the filter bar and sort control render from. */
    schemas: {
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      }
    }
  };
}

export type UseModuleContext = ReturnType<typeof createModuleContext>;
