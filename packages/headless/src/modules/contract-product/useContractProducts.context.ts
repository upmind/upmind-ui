import { computed } from "vue";
import {
  useContractProductPickerSchema,
  useContractProductPickerUischema,
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./contract-product.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  ContractProduct,
  ContractProductGroupedCountsQuery,
  ContractProductListQuery,
  ContractProductPickerLookupService,
  ContractProductsContextMembers
} from "./contract-product.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.context
 * @description Collection context: the reactive list, its lookup helpers, the
 * grouped counts and the query schema family. Data is mapped in
 * `contract-products.services.ts` via `select`, never here. Errors are state,
 * not events.
 */

export function createContractProductsContext(
  _actorScope: ScopeActorTypes,
  lookup: ContractProductPickerLookupService,
  query: ContractProductListQuery,
  groupedCounts: ContractProductGroupedCountsQuery
): ContractProductsContextMembers {
  const { findOne, getOne } = useCollection<ContractProduct>(query.data);

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  const data = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  return {
    /** The reactive list of this scope's contract products (always an array). */
    data,

    /** The scope's captured error — criteria errors first; read, never raised. */
    error,

    /** Finds a single product by a partial mapping. */
    findOne,

    /** Finds a single product by id. */
    getOne,

    /**
     * The dashboard's grouped counts, once `useActions().loadGroupedCounts`
     * resolves; empty until then.
     */
    groupedCounts: groupedCounts.data,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — the query's own published criteria;
     * read-only, write through `useActions().setCriteria` / `.filterBy` / `.sortBy`.
     */
    query: query.criteria,

    /**
     * The module's query schema family, plain JSON so it survives the renderer
     * port's `JSON` round-trip. `useContext()` is the renderer's only door to it.
     */
    schemas: {
      contractProductPicker: {
        schema: useContractProductPickerSchema(),
        uischema: useContractProductPickerUischema(lookup)
      },
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      }
    }
  };
}

export type UseContractProductsContext = ReturnType<
  typeof createContractProductsContext
>;
