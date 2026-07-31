import { computed } from "vue";
import { ScopeActorTypes } from "../scope";
import { createStaffClientAddressDryMeta } from "./useClientAddressesDry.meta.staff";
import { isEmpty } from "lodash-es";
import type {
  ClientAddressDryListQuery,
  ClientAddressDryStaffCapabilities
} from "./client-address-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/useClientAddressesDry.meta
 * @description Collection state flags. Shared shape (`isError`/`isEmpty`/
 * `isLoading`/`isAvailable`/`isAuthenticated`) is identical across all three
 * cells (design.md §7): derived purely off the query's own state, which
 * already differs per arm via its `enabled`/`guard` (no actor branch needed
 * for these — clause 4). ARMED for `staff` only (D-ADDR-5, parity #19) —
 * the four staff capability booleans, staff-EXCLUSIVE (client/self never
 * capability-gated, ADR-001 §6).
 */
export function createClientAddressDryMeta(
  actorScope: ScopeActorTypes,
  query: ClientAddressDryListQuery,
  staffCapabilities?: ClientAddressDryStaffCapabilities
) {
  const isError = computed(() => !isEmpty(query.error.value));

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query?.isLoading.value || !query.isFetched.value
  );

  const isAvailable = computed(() => query.isFetched.value && !isError.value);

  // --- actor-specific meta: parity #19 (D-ADDR-5) — staff-EXCLUSIVE
  // capability read-state. Off-arm the four keys are explicitly `undefined`
  // (not omitted) so the return shape stays uniform across actors (clause 1)
  // — a client/self actor's `useMeta().canDelete` reads `undefined`, never a
  // missing key (AC-B5).
  const staffMeta: Partial<ClientAddressDryStaffCapabilities> =
    actorScope === ScopeActorTypes.STAFF && staffCapabilities
      ? createStaffClientAddressDryMeta(staffCapabilities)
      : {
          canList: undefined,
          canCreate: undefined,
          canUpdate: undefined,
          canDelete: undefined
        };

  return {
    /** True if the list query resolved with an error. */
    isError,

    /** True if the collection has no items. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading,

    /** True once the list has fetched without error, for THIS scope's identity. */
    isAvailable,

    /** Alias of `isAvailable` (baseline `client-address/useClientAddresses.ts` naming). */
    isAuthenticated: isAvailable,

    // A spread overwrites, which is what lets the staff arm's real booleans
    // win over the `undefined` defaults above (mirrors
    // `useClientAddressesDry.actions.ts`'s own merge seam); anything it omits
    // falls through.
    ...staffMeta
  };
}

// Type export for consumers
export type UseClientAddressesDryMeta = ReturnType<
  typeof createClientAddressDryMeta
>;
