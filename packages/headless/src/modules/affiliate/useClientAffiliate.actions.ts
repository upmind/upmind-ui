import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useClientAffiliate.actions
 * @description `enrol`, `requestWithdrawal` and the lifecycle actions
 * (design.md §8.5).
 */
export function createClientAffiliateActions(
  _actorScope: ScopeActorTypes,
  deps: {
    destroy: () => void;
    enrol: () => Promise<void>;
    invalidate: () => Promise<void>;
    isReady: () => Promise<boolean>;
    refresh: () => Promise<void>;
    requestWithdrawal: (payload: {
      message: string;
    }) => Promise<string | undefined>;
    reset: () => void;
  }
) {
  return {
    // --- methods (alphabetized)
    /** Removes this scoped instance from the registry. */
    destroy: () => deps.destroy(),

    /** `POST accounts/{a}/affiliate`, no body, while not enrolled (design.md §8.2). */
    enrol: () => deps.enrol(),

    /** Marks the account and balance reads of the active account stale so they refetch. */
    invalidate: () => deps.invalidate(),

    /** Resolves once the resolver publishes an id and the four reads settle (D-41). */
    isReady: () => deps.isReady(),

    /** Re-runs the account, balance and settings reads together. */
    refresh: () => deps.refresh(),

    /** `POST accounts/{a}/affiliate/withdraw`, resolves the ticket id. */
    requestWithdrawal: (payload: { message: string }) =>
      deps.requestWithdrawal(payload),

    /** Clears every locally held value back to its start state. */
    reset: () => deps.reset()
  };
}
