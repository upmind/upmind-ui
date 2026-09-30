import { computed } from "vue";
import {
  useContractPickerSchema,
  useContractPickerUischema,
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./contract.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  Contract,
  ContractServices,
  ContractListQuery
} from "./contract.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContracts.context
 * @description Collection context — the reactive list, its lookup helpers and
 * the module's schema family (criteria + contracts picker, R38). Data is
 * mapped in `contract.services.ts` via `select`, never here. `error` is the
 * scope's captured failure — read, never raised.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractsContext(
  _actorScope: ScopeActorTypes,
  service: ContractServices,
  query: ContractListQuery
) {
  const { findOne, getOne } = useCollection<Contract>(query.data);

  const data = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  return {
    /** The reactive list of this scope's contracts (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single contract by a partial mapping. */
    findOne,

    /** Finds a single contract by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /** This scope's ACTIVE request state — read-only, write through `useActions().setCriteria`. */
    query: query.criteria,

    /** The module's schema family — criteria (filter bar + sort) and the contracts picker. */
    schemas: {
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      },
      /**
       * The contracts picker's pair, its lookup already bound to THIS scope's
       * service (R38 item 7) — the same shape `useTickets` publishes for
       * `schemas.ticketPicker`.
       */
      contractPicker: {
        schema: useContractPickerSchema(),
        uischema: useContractPickerUischema(service.lookups)
      }
    }
  };
}

export type UseContractsContext = ReturnType<typeof createContractsContext>;
