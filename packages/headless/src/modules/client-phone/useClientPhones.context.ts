import { computed, toRaw, unref, type MaybeRef } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./client-phone.schemas";
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
  ClientPhoneListQuery,
  ClientPhoneServices,
  Phone
} from "./client-phone.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/useClientPhones.context
 * @description Collection context — the reactive list and its lookup
 * helpers. Query-backed: data is mapped in `client-phone.services.ts` via
 * `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure — the
 * last rejected row mutation, else the list query's own — exposed for the
 * consumer to render. This layer never raises it (row C10).
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientPhonesContext(
  _actorScope: ScopeActorTypes,
  service: ClientPhoneServices,
  query: ClientPhoneListQuery
) {
  const {
    findOne: findOneByValue,
    getOne,
    getDefault
  } = useCollection<Phone>(query.data);

  // `useCollection().findOne` matches each mapped key with `isEqual`, so a
  // nested partial (e.g. `{ phone: { number } }`, row C8) never matches the
  // full mapped `phone` object. Deep-partial-match nested plain-object
  // values instead — `ensure`'s whole-object mapping (client-phone.services)
  // still matches, since a full match is the degenerate case of a partial
  // one.
  function findOne(
    mapping: string | Partial<Phone>,
    data: MaybeRef<Phone[] | null | undefined> = query.data,
    searchableProps: string[] = []
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
  // earns one, add `useClientPhones.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive list of this scope's phone numbers (always an array). */
    data,

    /** This scope's default phone, or undefined if none. */
    default: getDefault,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single phone by a partial mapping. */
    findOne,

    /** Finds a single phone by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — `{ filters, sort, pagination }`,
     * the query's own published criteria rather than a copy of it;
     * read-only, write through `useActions().filterBy` / `.sortBy`.
     */
    query: query.criteria,

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
  };
}

// Type export for consumers
export type UseClientPhonesContext = ReturnType<
  typeof createClientPhonesContext
>;
