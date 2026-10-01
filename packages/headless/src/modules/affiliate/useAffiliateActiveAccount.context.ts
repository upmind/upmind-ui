import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateActiveAccount.context
 * @description Account-source context — the published id and the last read
 * failure (design.md §8.4, R-NO-SWITCH).
 */
export function createAffiliateActiveAccountContext(
  _actorScope: ScopeActorTypes,
  deps: {
    activeAccountId: Ref<string | undefined>;
    error: Ref<ResponseError | undefined>;
  }
) {
  return {
    /** The resolved account id — the `/self` account, else the client's only account. */
    activeAccountId: deps.activeAccountId,

    /** The error of the last failed self read, else `undefined`. */
    error: deps.error
  };
}

export type UseAffiliateActiveAccountContext = ReturnType<
  typeof createAffiliateActiveAccountContext
>;
