import { computed } from "vue";
import {
  useCreateSchema,
  useCreateUischema,
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./tickets.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  Ticket,
  TicketsListQuery,
  TicketsServices
} from "./tickets.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTickets.context
 * @description Collection context — the reactive list, its lookup helpers
 * and the module's schema family (criteria + create-form, R8). Data is
 * mapped in `tickets.services.ts` via `select`, never here.
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientTicketsContext(
  _actorScope: ScopeActorTypes,
  service: TicketsServices,
  query: TicketsListQuery
) {
  const { findOne, getOne } = useCollection<Ticket>(query.data);

  const data = computed<Ticket[]>(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  return {
    /** The reactive list of this scope's tickets (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single ticket by a partial mapping. */
    findOne,

    /** Finds a single ticket by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /** This scope's ACTIVE request state — read-only, write via `setCriteria`. */
    query: query.criteria,

    /** The module's schema family — criteria (filter bar + sort) and create. */
    schemas: {
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      },
      create: {
        schema: useCreateSchema(),
        uischema: useCreateUischema()
      }
    }
  };
}

// Type export for consumers
export type UseClientTicketsContext = ReturnType<
  typeof createClientTicketsContext
>;
