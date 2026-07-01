import { computed } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import { getExpiresAt } from "./session-store.utils";
import { useSessionStore } from ".";
import { useBrand } from "../brand";
import { has } from "lodash-es";
import type { ComputedRef } from "vue";
/** Threshold in ms before expiry to consider "about to expire" (5 minutes) */
const EXPIRY_WARNING_THRESHOLD_MS = 5 * 60 * 1000;
// -----------------------------------------------------------------------------
/**
 * @module session-store/useSession.meta
 * @description Scope-aware session meta sub-composable.
 * Delegates global flags to useSessionStoreMeta,
 * computes scope-aware flags from useSessionStoreContext.
 */

/**
 * Factory for scope-aware session meta.
 * All flags are relative to the specified actor scope.
 *
 * @param actorScope - The actor scope to check (staff, client, guest, self)
 * @returns Scope-aware meta computed refs
 */

export function createSessionMeta(_sessionId?: string) {
  const { useMeta, useContext } = useSessionStore();
  const storeMeta = useMeta();
  const {
    activeSession,
    activeActor,
    activeSessionId,
    impersonatedSessions,
    activeUser
  } = useContext();

  const isAuthenticated = computed(() => isClient.value || isStaff.value);

  const isGuest = computed(() => activeActor.value === AccessRoleTypes.GUEST);

  const isStaff = computed(() => activeActor.value === AccessRoleTypes.STAFF);

  const isClient = computed(() => activeActor.value === AccessRoleTypes.CLIENT);

  const isGuestClient = computed(() => !!activeUser.value?.isGuest);

  const isUnverified = computed(() => {
    if (!isClient.value || isGuestClient.value) return false;
    const { enforceEmailVerification } = useBrand();
    if (!enforceEmailVerification.value) return false;
    return !activeUser.value?.primaryEmail?.isVerified;
  });

  const isImpersonated = computed(() => {
    if (!activeSessionId.value) return false;
    return has(impersonatedSessions.value, activeSessionId.value);
  });

  // --- Token expiry checks (relative to active session)
  const isExpired = computed(() => {
    const expiresAt = getExpiresAt(activeSession.value);
    if (!expiresAt) return false;
    return Date.now() >= expiresAt;
  });

  const isAboutToExpire = computed(() => {
    const expiresAt = getExpiresAt(activeSession.value);
    if (!expiresAt) return false;
    const timeUntilExpiry = expiresAt - Date.now();
    return (
      timeUntilExpiry > 0 && timeUntilExpiry <= EXPIRY_WARNING_THRESHOLD_MS
    );
  });

  const canRefresh = computed(() => {
    if (!activeSession.value?.refresh_token) return false;
    const createdAt = activeSession.value.created_at ?? 0;
    const refreshExpiresIn = activeSession.value.refresh_expires_in ?? 0;
    if (!createdAt || !refreshExpiresIn)
      return !!activeSession.value.refresh_token;
    const refreshExpiresAt = createdAt + refreshExpiresIn * 1000;
    return Date.now() < refreshExpiresAt;
  }) as ComputedRef<boolean>;

  return {
    /** True if refresh token can be used to get a new access token. */
    canRefresh,

    /** True if access token will expire within 5 minutes. */
    isAboutToExpire,

    /**
     * True if the current active session is authenticated (has valid token) for its actor scope.
     * For STAFF scope: true  the active actor is STAFF
     * For CLIENT scope: true if the active actor is CLIENT
     * For SELF: true if the active session is authenticated (client or staff)
     */
    isAuthenticated,

    /** True if session store has completed initialisation (hydration from storage). */
    isAvailable: storeMeta.isAvailable,

    /** True if only client sessions exist. */
    isClient,

    /** True if access token has expired. */
    isExpired,

    /** True if only guest session exists (no client/staff). */
    isGuest,

    /** True if only client session exists AND client is marked as 'guest' */
    isGuestClient,

    /** True if current session is an impersonation (has parent session). */
    isImpersonated,

    /** True if session store is currently synchronising with storage or validating tokens. */
    isLoading: storeMeta.isLoading,

    /** True if at least one staff session exists. */
    isStaff,

    /** True if client must verify email before proceeding (brand enforces + email not verified). */
    isUnverified
  };
}

// Type export for consumers
export type UseActiveSessionMeta = ReturnType<typeof createSessionMeta>;
