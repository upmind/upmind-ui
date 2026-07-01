import { initialise } from "./session-store.store";
import { useSessionStoreActions } from "./useSessionStore.actions";
import { useSessionStoreContext } from "./useSessionStore.context";
import { useSessionStoreInternals } from "./useSessionStore.internals";
import { useSessionStoreMeta } from "./useSessionStore.meta";
// -----------------------------------------------------------------------------
/**
 * @module session-store/useSessionStore
 * @description Factory composable wiring sub-composables together.
 */

/**
 * Composable for accessing the multi-session store.
 * Supports multiple simultaneous sessions per actor type (guest, client, staff).
 *
 * **Important:** Call `initialise()` from `useUpmind` before using other sub-composables.
 * This ensures config (allowedScopes) is set before state is built.
 *
 * @example
 * ```ts
 * import { useSessionStore } from '@upmind/headless'
 *
 * // In useUpmind — initialise with scope restrictions
 * await useSessionStore().initialise({ allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST] })
 *
 * // Elsewhere — access sub-composables (no config needed)
 * const { activeActor, activeSession } = useSessionStore().useContext()
 * const { isAuthenticated, isScopeAllowed } = useSessionStore().useMeta()
 * const { add, activate, remove } = useSessionStore().useActions()
 * ```
 */
export function useSessionStore() {
  return {
    /**
     * Initialise the session store with optional scope restrictions.
     * Sets config BEFORE building state — prevents race conditions.
     *
     * @param config - Optional config to restrict which actor scopes can be activated
     * @returns Promise that resolves when store is fully initialised
     */
    initStore: initialise,

    /** Sub-composable for session store mutations. */
    useActions: useSessionStoreActions,

    /** Sub-composable for session state computed values. */
    useContext: useSessionStoreContext,

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: useSessionStoreInternals,

    /** Sub-composable for session state helpers. */
    useMeta: useSessionStoreMeta
  };
}

export type UseSessionStore = ReturnType<typeof useSessionStore>;
