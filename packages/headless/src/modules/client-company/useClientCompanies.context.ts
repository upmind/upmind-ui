import { computed } from "vue";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  ClientCompanyListQuery,
  ClientCompanyServices,
  Company
} from "./client-company.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { MaybeRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanies.context
 * @description Collection context — the reactive list and its lookup
 * helpers. Query-backed: data is mapped in `client-company.services.ts` via
 * `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure — the
 * last rejected row mutation, else the list query's own — exposed for the
 * consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCompaniesContext(
  _actorScope: ScopeActorTypes,
  service: ClientCompanyServices,
  query: ClientCompanyListQuery
) {
  const { findOne, getOne, getDefault } = useCollection<Company>(query.data);

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  const data = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  // AC-3/AC-11 — `default()` is the id, not the row (requirements.md AC-3,
  // AC-11): callers use it directly as `setDefault`/lookup input.
  function getDefaultId() {
    return getDefault()?.id;
  }

  // AC-6 — `useCollection`'s `findOne` defaults `searchableProps` to `[]`,
  // so a bare re-export never matches a free-text mapping. `name` is the
  // one searchable field the AC exercises.
  function findOneCompany(
    mapping: string | Partial<Company>,
    data?: MaybeRef<Company[] | null | undefined>,
    searchableProps: string[] = ["name"]
  ) {
    return findOne(mapping, data, searchableProps);
  }

  const error = computed<ResponseError | undefined>(
    () =>
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope earns
  // one, add `useClientCompanies.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive list of this scope's companies (always an array). */
    data,

    /** This scope's default company's id, or undefined if none. */
    default: getDefaultId,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single company by a partial mapping or a `name` substring. */
    findOne: findOneCompany,

    /** Finds a single company by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientCompaniesContext = ReturnType<
  typeof createClientCompaniesContext
>;
