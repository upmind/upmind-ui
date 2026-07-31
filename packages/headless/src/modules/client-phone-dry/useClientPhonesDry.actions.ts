import { ref } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry, ScopeActorTypes } from "../scope";
import { canEdit } from "./client-phone-dry.utils";
import { createStaffClientPhoneDryActions } from "./useClientPhonesDry.actions.staff";
import { useCollection } from "../../utils";
import { set, isEmpty } from "lodash-es";
import type { RequestFilters } from "../query";
import type {
  Phone,
  PhoneModel,
  PhoneFormContext,
  ClientPhoneDryListQuery,
  ClientPhoneDryServices
} from "./client-phone-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/useClientPhonesDry.actions
 * @description Collection actions (mutations, refresh, lifecycle). Shared
 * body enforces D4's edit lockout and AC-A2's `can_delete` guard identically
 * for both cells — a member equal across actors is shared, never an arm
 * (design.md §7).
 *
 * @doctrine clause 2/3 — the `staff` arm below is earned by gap #7
 * (capability gating, ADR-001 §6) ONLY; the members here stay shared.
 * @precedent `client-phone/useClientPhones.ts` — the baseline this converts.
 */
export function createClientPhoneDryActions(
  actorScope: ScopeActorTypes,
  service: ClientPhoneDryServices,
  query: ClientPhoneDryListQuery,
  scopeKey: string
) {
  const { getOne } = useCollection<Phone>(query.data);

  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  /**
   * @precedent `client-phone/useClientPhones.ts:42-55` — polls the shared
   * query's own state rather than `useActiveSession()`'s active-default
   * readiness, so this stays correct for BOTH cells without an actor branch
   * (clause 4): the staff arm's `loadList` guard already rejects to an error
   * state when no staff token/target is present.
   */
  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (query.isFetched.value || !isEmpty(query.error.value)) {
          clearInterval(interval);
          resolve(isEmpty(query.error.value));
        }
      }, 100);
    });
  }

  function add(model: PhoneModel): Promise<Phone | unknown> {
    return service.add(model);
  }

  function ensure(model: PhoneModel): Promise<Phone> {
    return service.ensure(model);
  }

  /**
   * D4 — no-ops (resolves `undefined`, no PUT issued) on a staged row.
   * Identical for both cells (SHARED enforcement, same shape as the
   * `can_delete` guard below).
   */
  function update(id: Phone["id"], model: PhoneModel): Promise<unknown> {
    const phone = getOne(id);
    if (phone && !canEdit(phone)) return Promise.resolve(undefined);
    return service.update(id, model);
  }

  /** D4 — no-ops on a staged row. Identical for both cells. */
  function setDefault(id: Phone["id"]): Promise<unknown> {
    const phone = getOne(id);
    if (phone && !canEdit(phone)) return Promise.resolve(undefined);
    return service.setDefault(id).mutateAsync();
  }

  /**
   * AC-A2 — no outbound DELETE when `meta.canDelete` is false (correction
   * over the baseline it converts). D4 — also no-ops on a staged row.
   * Identical for both cells.
   */
  function remove(id: Phone["id"]): Promise<unknown> {
    const phone = getOne(id);
    if (!phone || !phone.meta.canDelete || !canEdit(phone)) {
      return Promise.resolve(undefined);
    }
    return service.remove(id).mutateAsync();
  }

  function parse(
    formContext: Pick<PhoneFormContext, "schema" | "country">,
    data: unknown
  ) {
    return service.parse(formContext, data);
  }

  function validate(formContext: Pick<PhoneFormContext, "schema" | "model">) {
    return service.validate(formContext);
  }

  const filters = ref<RequestFilters & { query?: string }>({ query: "" });

  const filterQuery = (value?: string) => {
    set(filters.value, "query", value ?? "");
    query.filter(filters.value);
  };

  // --- actor-specific actions: gap #7 capability gating (ADR-001 §6, AC-B3)
  // — staff-exclusive; client/self is never gated (design.md §7).
  const actorActions =
    actorScope === ScopeActorTypes.STAFF
      ? createStaffClientPhoneDryActions(service, query)
      : {};

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Resolves once the collection is ready to read. */
    isReady,

    /** Add a new phone. */
    add,

    /** Update an existing phone (D4 — no-ops on a staged row). */
    update,

    /** Find-or-create a phone matching `model`. */
    ensure,

    /** Remove a phone (AC-A2 `can_delete` + D4 staged-lock). */
    remove,

    /** Set a phone as default (D4 — no-ops on a staged row). */
    setDefault,

    /** Refetches the list from the server. */
    refresh: query.refetch,

    /** Go to the next page of items. */
    nextPage: query.fetchNextPage,

    /** Go to the previous page of items. */
    prevPage: query.fetchPreviousPage,

    /** Invalidate the query cache for this collection. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Parse raw submitted form data into a typed `PhoneModel`. */
    parse,

    /** Validate a `PhoneModel` against the current schema. */
    validate,

    /** Filters for the query. */
    filters: {
      query: filterQuery
    },

    // A spread overwrites, which is what lets the arm override a shared
    // member (gap #7's conditional `remove`/`update`/`setDefault`/`add`/
    // `refresh`); anything it omits falls through. The arm's own file
    // carries the @decision block for each member it conditionally supplies.
    ...actorActions
  };
}

// Type export for consumers
export type UseClientPhonesDryActions = ReturnType<
  typeof createClientPhoneDryActions
>;
