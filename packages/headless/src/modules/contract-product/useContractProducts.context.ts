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
  ContractProductListQuery,
  ContractProductServices
} from "./contract-product.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ICProdGroup } from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.context
 * @description Collection context — the reactive list, its lookup helpers and
 * the query schema family. Data is mapped in `contract-product.services.ts`
 * via `select`, never here. Errors are state, not events.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractProductsContext(
  _actorScope: ScopeActorTypes,
  service: ContractProductServices,
  query: ContractProductListQuery,
  groupedCounts: Ref<ICProdGroup[]>
) {
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
     * resolves — empty until then (G1).
     */
    groupedCounts,

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
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      },
      /**
       * The product picker's pair, its lookup already bound to THIS scope's
       * service (R38 item 2) — the same shape `useTickets` publishes for its
       * `ticketPicker`.
       */
      contractProductPicker: {
        schema: useContractProductPickerSchema(),
        uischema: useContractProductPickerUischema(service.lookups)
      }
    }
  };
}

export type UseContractProductsContext = ReturnType<
  typeof createContractProductsContext
>;
