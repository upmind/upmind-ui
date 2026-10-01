import { computed } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import { useActiveSession, useSessionStore } from "../session-store";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateActiveAccount.meta
 * @description Account-source state flags (design.md §8.4, R-NO-SWITCH).
 */
export function createAffiliateActiveAccountMeta(
  _actorScope: ScopeActorTypes,
  deps: {
    error: Ref<ResponseError | undefined>;
    state: Ref<string>;
  }
) {
  const session = useActiveSession().useContext();
  const store = useSessionStore().useMeta();

  /**
   * @decision `isAvailable` also requires a non-`"inert"` resolver state.
   * what: adds `deps.state.value !== "inert"` ahead of the session checks.
   * why: design.md §8.4 "Server render": on the server, where `window` is
   *      undefined, `isAvailable` is false there. The session store and its
   *      actor are unaffected by a stubbed/absent `window` — a CLIENT
   *      session that is otherwise available would leave `isAvailable` true
   *      on the server too, with no resolver state ever consulted.
   * rejected: a `typeof window === "undefined"` check here instead —
   *      `bootstrap()` already routes every reader through the one `state`
   *      ref (design.md §8.4 "Server render"), so a second, independent
   *      `window` check here would drift from it under a test that resets
   *      state in one environment and reads meta in another.
   */
  const isAvailable = computed(
    () =>
      deps.state.value !== "inert" &&
      store.isAvailable.value &&
      session.actor.value === AccessRoleTypes.CLIENT
  );

  return {
    /** The session store is ready and the SESSION actor is CLIENT. */
    isAvailable,

    /** `true` when `error` is set. */
    hasError: computed(() => !!deps.error.value)
  };
}

export type UseAffiliateActiveAccountMeta = ReturnType<
  typeof createAffiliateActiveAccountMeta
>;
