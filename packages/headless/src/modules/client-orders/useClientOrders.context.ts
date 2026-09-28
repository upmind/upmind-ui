import { computed } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./client-orders.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  ClientOrdersListQuery,
  ClientOrdersServices
} from "./client-orders.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IOrder } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrders.context
 * @description Collection context — the reactive current page of orders.
 * Query-backed: no client-side mapping runs here (design D2 publishes the
 * raw `IOrder`).
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientOrdersContext(
  _actorScope: ScopeActorTypes,
  service: ClientOrdersServices,
  query: ClientOrdersListQuery
) {
  const { findOne, getOne } = useCollection<IOrder>(query.data);

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  const data = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientOrders.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive current page of this scope's orders (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds one order on the page by a partial mapping. */
    findOne,

    /** Finds one order on the page by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — the query's own published
     * criteria model, not a copy of it; read-only, write through
     * `useActions()`.
     */
    query: query.criteria,

    /**
     * The query schema and its two uischemas (design 5.3, 8.6, ADR-032's
     * 2026-08-18 amendment puts the sort uischema on the list context too).
     */
    schemas: {
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      }
    }

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers. Named `...Collection...` — `UseClientOrdersContext`
// collides with the portal mock contract (`client-orders.types.ts` head `@decision`).
export type UseClientOrdersCollectionContext = ReturnType<
  typeof createClientOrdersContext
>;
