import { computed } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import { sessionStore, storeTick, isScopeAllowed } from "./session-store.store";
import { getExpiresAt, getLiveGuestToken } from "./session-store.utils";
import { get } from "lodash-es";
import type {
  Impersonations,
  SessionEntry,
  SessionUser
} from "./session-store.types";
import type { IToken } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module session-store/useSessionStoreContext
 * @description Session store context sub-composable.
 * Provides reactive computed values for session state data.
 */

/**
 * Sub-composable for session store context (computed values).
 * Provides reactive access to session state data.
 *
 * @example
 * ```ts
 * import { useSessionStoreContext } from '@upmind/headless'
 *
 * const { activeActor, activeSession } = useSessionStoreContext()
 *
 * if (activeActor.value === AccessRoleTypes.STAFF) {
 *   // Staff is active
 * }
 * ```
 *
 * @returns Context computed refs for session state
 */
export function useSessionStoreContext() {
  // storeTick triggers reactivity; sessionStore.state is the authoritative source.
  // See session-store.store.ts for why we use this pattern instead of a shallowRef.
  const activeActor = computed((): AccessRoleTypes => {
    void storeTick.value;
    return sessionStore.state.activeActor;
  });

  const activeSessionId = computed((): string | undefined => {
    void storeTick.value;
    return sessionStore.state.activeSessionId;
  });

  // Guest storage became an id-keyed map in FE-3087; this member deliberately
  // keeps its single-token contract, so consumers outside the module are
  // untouched. With several guests pooled it names the LIVE one (R8).
  const guestSession = computed((): IToken | undefined => {
    void storeTick.value;
    return isScopeAllowed(AccessRoleTypes.GUEST)
      ? getLiveGuestToken(sessionStore.state)
      : undefined;
  });

  // Scope-filtered session accessors.
  // Only exposes sessions for allowed actor types in this app instance.
  const clientSessions = computed((): Record<string, SessionEntry> => {
    void storeTick.value;
    return isScopeAllowed(AccessRoleTypes.CLIENT)
      ? sessionStore.state.clientSessions
      : {};
  });

  const guestSessions = computed((): Record<string, SessionEntry> => {
    void storeTick.value;
    return isScopeAllowed(AccessRoleTypes.GUEST)
      ? sessionStore.state.guestSessions
      : {};
  });

  const staffSessions = computed((): Record<string, SessionEntry> => {
    void storeTick.value;
    return isScopeAllowed(AccessRoleTypes.STAFF)
      ? sessionStore.state.staffSessions
      : {};
  });

  const allSessions = computed(
    (): Record<string, SessionEntry> => ({
      ...clientSessions.value,
      ...staffSessions.value,
      ...guestSessions.value
    })
  );

  const impersonatedSessions = computed((): Impersonations => {
    void storeTick.value;
    return sessionStore.state.impersonatedSessions;
  });

  const impersonatedSession = computed(() => {
    const id = activeSessionId.value;
    if (!id) return null;
    const impersonatorId = impersonatedSessions.value[id];
    if (!impersonatorId) return null;
    return {
      impersonatedId: id,
      impersonatorId
    };
  });

  // Derived computed from reactive refs
  const activeSession = computed(() => {
    const actor = activeActor.value;
    const id = activeSessionId.value;

    if (actor === AccessRoleTypes.GUEST) {
      return guestSession.value ?? null;
    }

    if (actor === AccessRoleTypes.CLIENT && id) {
      return get(clientSessions.value, [id, "token"]);
    }

    if (actor === AccessRoleTypes.STAFF && id) {
      return get(staffSessions.value, [id, "token"]);
    }

    return undefined;
  }) as ComputedRef<IToken | undefined>;

  const activeUser = computed(() => {
    const actor = activeActor.value;
    const id = activeSessionId.value;

    if (actor === AccessRoleTypes.CLIENT && id) {
      return get(clientSessions.value, [id, "user"]);
    }

    if (actor === AccessRoleTypes.STAFF && id) {
      return get(staffSessions.value, [id, "user"]);
    }

    return null;
  }) as ComputedRef<SessionUser | null>;

  const expiresAt = computed(() =>
    getExpiresAt(activeSession.value)
  ) as ComputedRef<number | null>;

  return {
    /** Currently active actor type. */
    activeActor,

    /** Session token for the currently active actor. */
    activeSession,

    /**
     * Currently active session ID — the active actor's key in its own session
     * map. Present for a chosen guest, absent for the guest floor.
     */
    activeSessionId,

    /** User profile for the currently active session. */
    activeUser,

    /** Every pooled session — client, staff and guest — for dropdown display. */
    allSessions,

    /** Client sessions keyed by actor_id. */
    clientSessions,

    /** Computed expiration timestamp for the active session (Unix epoch in ms). */
    expiresAt,

    /** The live guest session's token — the chosen guest, else the cookie-backed one. */
    guestSession,

    /** Guest sessions keyed by session id. */
    guestSessions,

    /** Active impersonation info (impersonatedId + impersonatorId), or null. */
    impersonatedSession,

    /** Impersonated sessions mapping (impersonated ID → impersonator ID). */
    impersonatedSessions,

    /** Staff sessions keyed by actor_id. */
    staffSessions
  };
}

// Type export for consumers
export type UseSessionStoreContext = ReturnType<typeof useSessionStoreContext>;
