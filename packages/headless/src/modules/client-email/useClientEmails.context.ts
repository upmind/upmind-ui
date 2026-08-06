import { computed } from "vue";
import { useQuerySchema, useQueryUischema } from "./client-email.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  ClientEmailListQuery,
  ClientEmailServices,
  Email,
  QueryModel
} from "./client-email.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.context
 * @description Collection context — the reactive list and its lookup helpers.
 * Query-backed: data is mapped in `client-email.services.ts` via `select`,
 * never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure —
 * the last rejected row mutation, else the list query's own — exposed for the
 * consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientEmailsContext(
  _actorScope: ScopeActorTypes,
  service: ClientEmailServices,
  query: ClientEmailListQuery,
  queryModel: ComputedRef<QueryModel>
) {
  const { findOne, getOne, getDefault } = useCollection<Email>(query.data);

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  const data = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  const error = computed<ResponseError | undefined>(
    () =>
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope earns
  // one, add `useClientEmails.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive list of this scope's addresses (always an array). */
    data,

    /** This scope's default address, or undefined if none. */
    default: getDefault,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single address by a partial mapping. */
    findOne,

    /** Finds a single address by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — `{ filters, sort, pagination }`,
     * derived and read-only; write through `useActions().filterBy` / `.sortBy`.
     */
    query: queryModel,

    /**
     * The module's schema family, plain JSON so it survives the renderer port's
     * `JSON` round-trip. `query` is the request-state schema pair (S-D9); the
     * renderer's only door to it is `useContext()`.
     */
    schemas: {
      query: { schema: useQuerySchema(), uischema: useQueryUischema() }
    }

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientEmailsContext = ReturnType<
  typeof createClientEmailsContext
>;
