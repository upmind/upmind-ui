import { computed } from "vue";
import {
  sessionStore,
  storeTick,
  isScopeAllowed as checkScopeAllowed
} from "./session-store.store";
import { isEmpty, keys, size } from "lodash-es";
import type { AccessRoleTypes } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module session-store/useSessionStoreMeta
 * @description Session store meta sub-composable.
 * Provides reactive boolean flags about the current session state.
 */

/**
 * Sub-composable for session store meta flags.
 * Provides individual computed refs for session state flags.
 *
 * @example
 * ```ts
 * import { useSessionStoreMeta } from '@upmind/headless'
 *
 * const { isAuthenticated, isExpired, canRefresh } = useSessionStoreMeta()
 *
 * if (isExpired.value && canRefresh.value) {
 *   // Token expired but can refresh
 * }
 * ```
 *
 * @returns Individual computed refs for session state flags
 */

export function useSessionStoreMeta() {
  // storeTick triggers reactivity; sessionStore.state is the authoritative source.
  // See session-store.store.ts for why we use this pattern instead of a shallowRef.

  const isAvailable = computed(() => {
    storeTick.value;
    return !!sessionStore.state.initialised;
  });

  const isLoading = computed(() => {
    storeTick.value;
    return !!sessionStore.state.loading;
  });

  const hasClientSession = computed(() => {
    storeTick.value;
    return size(keys(sessionStore.state.clientSessions)) > 0;
  });

  const hasGuestSession = computed(() => {
    storeTick.value;
    return !!sessionStore.state.guestSession;
  });

  const hasStaffSession = computed(() => {
    storeTick.value;
    return !isEmpty(sessionStore.state.staffSessions);
  });

  const hasImpersonatedSessions = computed(() => {
    storeTick.value;
    return !isEmpty(sessionStore.state.impersonatedSessions);
  });

  const hasMultipleSessions = computed(() => {
    storeTick.value;
    const clientCount = size(keys(sessionStore.state.clientSessions));
    const staffCount = size(keys(sessionStore.state.staffSessions));
    return clientCount + staffCount > 1;
  });

  return {
    /** True if at least one client session exists. */
    hasClientSession,

    /** True if a guest session exists. */
    hasGuestSession,

    /** True if at least one impersonated session exists. */
    hasImpersonatedSessions,

    /** True if more than one session exists across all actors. */
    hasMultipleSessions,

    /** True if at least one staff session exists. */
    hasStaffSession,

    /** True when store initialization is complete and the store is available. */
    isAvailable,

    /** True if the store is currently synchronising with storage or validating tokens. */
    isLoading,

    /**
     * Check if an actor scope is allowed by the current store config.
     * Returns true if no restriction is set or the actor is in the allowed list.
     */
    isScopeAllowed: (actor: AccessRoleTypes) => checkScopeAllowed(actor)
  };
}

// Type export for consumers
export type UseSessionStoreMeta = ReturnType<typeof useSessionStoreMeta>;
