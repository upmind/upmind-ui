import { computed } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./invoices.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  Invoice,
  InvoicesListQuery,
  InvoicesServices
} from "./invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices.context
 * @description Collection context — the reactive list and its lookup
 * helpers. Query-backed: data is mapped in `invoices.services.ts` via
 * `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createInvoicesContext(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoicesListQuery
) {
  const { findOne, getOne } = useCollection<Invoice>(query.data);

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
  // earns one, add `useInvoices.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive list of this scope's invoices (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single invoice by a partial mapping. */
    findOne,

    /** Finds a single invoice by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — the query's own published criteria
     * model, not a copy of it; read-only, write through
     * `useActions().setCriteria`.
     */
    query: query.criteria,

    /** The server's total for this criteria — the consolidation notice's count. */
    total: query.total,

    /**
     * The module's schema family, plain JSON so it survives the renderer
     * port's `JSON` round-trip. The renderer's only door to it is
     * `useContext()`.
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

// Type export for consumers
export type UseInvoicesContext = ReturnType<typeof createInvoicesContext>;
