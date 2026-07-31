import { ref } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry, ScopeActorTypes } from "../scope";
import { createStaffClientAddressDryActions } from "./useClientAddressesDry.actions.staff";
import { useCollection } from "../../utils";
import { set, isEmpty } from "lodash-es";
import type { RequestFilters } from "../query";
import type {
  Address,
  AddressModel,
  AddressFormContext,
  ClientAddressDryListQuery,
  ClientAddressDryServices,
  ClientAddressDryStaffCapabilities
} from "./client-address-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/useClientAddressesDry.actions
 * @description Collection actions (mutations, refresh, lifecycle). Shared
 * body enforces AC-A2's `can_delete` guard identically for all three cells —
 * a member equal across actors is shared, never an arm (design.md §7).
 *
 * @doctrine clause 2/3 — the `staff` arm below is earned by parity #8
 * (capability gating, ADR-001 §6) ONLY; the members here stay shared.
 * @precedent `client-phone-dry/useClientPhonesDry.actions.ts` — the closest
 * worked exemplar this module mirrors.
 */
export function createClientAddressDryActions(
  actorScope: ScopeActorTypes,
  service: ClientAddressDryServices,
  query: ClientAddressDryListQuery,
  scopeKey: string,
  staffCapabilities?: ClientAddressDryStaffCapabilities
) {
  const { getOne, findOne } = useCollection<Address>(query.data);

  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  /**
   * @precedent `client-address/useClientAddresses.ts:42-55` — polls the
   * shared query's own state rather than `useActiveSession()`'s
   * active-default readiness, so this stays correct for ALL THREE cells
   * without an actor branch (clause 4): the staff arm's `loadList` guard
   * already rejects to an error state when no staff token/target is present.
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

  function add(model: AddressModel): Promise<Address | unknown> {
    return service.add(model);
  }

  function ensure(model: AddressModel): Promise<Address> {
    return service.ensure(model);
  }

  function update(id: Address["id"], model: AddressModel): Promise<unknown> {
    return service.update(id, model);
  }

  function setDefault(id: Address["id"]): Promise<unknown> {
    return service.setDefault(id).mutateAsync();
  }

  /**
   * AC-A2 — no outbound DELETE when `meta.canDelete` is false (correction
   * over the baseline it converts, which maps `can_delete` but never
   * enforces it). Identical for all three cells.
   */
  function remove(id: Address["id"]): Promise<unknown> {
    const address = getOne(id);
    if (!address || !address.meta.canDelete) {
      return Promise.resolve(undefined);
    }
    return service.remove(id).mutateAsync();
  }

  function parse(
    formContext: Pick<AddressFormContext, "schema" | "regions" | "country">,
    data: unknown
  ) {
    return service.parse(formContext, data);
  }

  function validate(formContext: Pick<AddressFormContext, "schema" | "model">) {
    return service.validate(formContext);
  }

  const filters = ref<RequestFilters & { query?: string }>({ query: "" });

  const filterQuery = (value?: string) => {
    set(filters.value, "query", value ?? "");
    query.filter(filters.value);
  };

  // --- actor-specific actions: parity #8 capability gating (ADR-001 §6,
  // AC-B3/AC-B4) — staff-exclusive; client/self (cells 1/3) is never gated
  // (design.md §7). `staffCapabilities` is computed ONCE by the entry
  // factory (D-ADDR-5) — this arm gates on it, never a second independent
  // `hasStaffCapability` lookup.
  const actorActions =
    actorScope === ScopeActorTypes.STAFF && staffCapabilities
      ? createStaffClientAddressDryActions(service, query, staffCapabilities)
      : {};

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Resolves once the collection is ready to read. */
    isReady,

    /** Add a new address. */
    add,

    /** Update an existing address. */
    update,

    /** Find-or-create an address matching `model`. */
    ensure,

    /** Remove an address (AC-A2 `can_delete` guard). */
    remove,

    /** Set an address as default. */
    setDefault,

    /** Refetches the list from the server. */
    refresh: query.refetch,

    /** Go to the next page of items. */
    nextPage: query.fetchNextPage,

    /** Go to the previous page of items. */
    prevPage: query.fetchPreviousPage,

    /** Invalidate the query cache for this collection. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Find a single address by id. */
    getOne,

    /** Find a single address by a partial mapping. */
    findOne,

    /** Parse raw submitted form data into a typed `AddressModel`. */
    parse,

    /** Validate an `AddressModel` against the current schema. */
    validate,

    /** Filters for the query. */
    filters: {
      query: filterQuery
    },

    // A spread overwrites, which is what lets the arm override a shared
    // member (parity #8's conditional `remove`/`update`/`setDefault`/`add`/
    // `refresh`); anything it omits falls through. The arm's own file
    // carries the @decision block for each member it conditionally supplies.
    ...actorActions
  };
}

// Type export for consumers
export type UseClientAddressesDryActions = ReturnType<
  typeof createClientAddressDryActions
>;
