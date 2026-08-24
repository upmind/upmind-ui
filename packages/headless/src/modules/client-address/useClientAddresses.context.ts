import { computed, toRaw, unref } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./client-address.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import {
  every,
  get,
  isArray,
  isEqual,
  isMatch,
  isPlainObject,
  isString
} from "lodash-es";
import type {
  Address,
  ClientAddressListQuery,
  ClientAddressServices
} from "./client-address.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { MaybeRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddresses.context
 * @description Collection context — the reactive list and its lookup helpers.
 * Query-backed: data is mapped in `client-address.services.ts` via `select`,
 * never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure — the
 * last rejected row mutation, else the list query's own — exposed for the
 * consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */

// `useQuerySchema` / `useQueryUischema` / `useSortUischema` take no
// arguments and hold no reactive state, so their output is fixed for the
// module's lifetime — minted once here rather than per `useContext()` call,
// so a JSONForms FilterBar bound to `schemas.query.schema` keeps one stable
// identity across renders instead of resetting on every re-render.
const QUERY_SCHEMA = useQuerySchema();
const QUERY_UISCHEMA = useQueryUischema();
const SORT_UISCHEMA = useSortUischema();
export function createClientAddressesContext(
  _actorScope: ScopeActorTypes,
  service: ClientAddressServices,
  query: ClientAddressListQuery
) {
  const {
    findOne: findOneByValue,
    getOne,
    getDefault
  } = useCollection<Address>(query.data);

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  const data = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  // R5 / `design.md` D-4 — `default()` is the ID, not the row, matching the
  // merged `client-company` precedent: callers use the value directly as
  // `setDefault`/lookup input. Ten in-tree consumer expressions read
  // `defaultAddress()?.id` today and each is migrated with the module.
  function getDefaultId() {
    return getDefault()?.id;
  }

  // `useCollection().findOne` compares each mapped top-level key with a strict
  // `isEqual`, so a nested partial (`{ address: { city } }`, hazard Z1) never
  // matches the full mapped `address` object. Deep-partial-match nested
  // plain-object values instead, mirroring `client-phone`'s containment —
  // `ensure`'s whole-object mapping still matches, since a full match is the
  // degenerate case of a partial one. The SHARED helper serves six modules and
  // is deliberately NOT edited (`design.md` D-11 / AC-7).
  function findOne(
    mapping: string | Partial<Address>,
    data: MaybeRef<Address[] | null | undefined> = query.data,
    searchableProps: string[] = ["title", "description"]
  ) {
    if (isString(mapping)) {
      return findOneByValue(mapping, data, searchableProps);
    }

    const rows = unref(toRaw(data));
    return (isArray(rows) ? rows : []).find(item =>
      every(mapping, (value, key) => {
        if (key === "id") return get(item, "id") == value;
        const modelValue = get(item, key);
        return isPlainObject(value) && isPlainObject(modelValue)
          ? isMatch(modelValue as object, value as object)
          : isEqual(modelValue, value);
      })
    );
  }

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope earns
  // one, add `useClientAddresses.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive list of this scope's addresses (always an array). */
    data,

    /** This scope's default address's ID, or undefined if none (R5). */
    default: getDefaultId,

    /** The scope's captured error — read, never raised. */
    error,

    /**
     * Finds a single address by a partial mapping — nested partials included —
     * or, given a string, by a case-insensitive substring of its `title` or
     * `description`.
     */
    findOne,

    /** Finds a single address by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — `{ filters, sort, pagination }`,
     * the query's own published criteria rather than a copy of it;
     * read-only, write through `useActions().filters.query` / `.sortBy` /
     * `.setCriteria`.
     */
    query: query.criteria,

    /**
     * The module's schema family, plain JSON so it survives the renderer
     * port's `JSON` round-trip. The renderer's only door to it is
     * `useContext()`.
     */
    schemas: {
      query: {
        schema: QUERY_SCHEMA,
        uischema: QUERY_UISCHEMA,
        sortUischema: SORT_UISCHEMA
      }
    }

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientAddressesContext = ReturnType<
  typeof createClientAddressesContext
>;
