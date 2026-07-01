// -----------------------------------------------------------------------------
/**
 * @module composables/useActorScopeSelector
 * @description Global actor scope and session management for labs playground.
 * Provides a single source of truth for the active actor scope across all pages.
 * Syncs with URL scope segments and provides reactive session switching.
 */

import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ScopeActorTypes, useSessionStore } from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import { useActorScope, buildScopePath } from "../../composables/scope";
import {
  capitalize,
  filter,
  findKey,
  first,
  has,
  keys,
  map,
  sortBy,
  toPairs
} from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * A session item for dropdown display.
 */
export type SessionItem = {
  id: string;
  actor: AccessRoleTypes;
  label: string;
  sublabel?: string;
  icon: string;
  isActive: boolean;
  expiresAt: number | null;
  avatar?: {
    caption: string;
    src?: string;
  };
};

/**
 * A staff session with its nested impersonated client sessions.
 */
export type StaffSessionNode = SessionItem & {
  impersonatedClients: SessionItem[];
};

// --- Global state (shared across all component instances)
const globalActorScope = ref<ScopeActorTypes>(ScopeActorTypes.SELF);

// --- Default scopes when no page has set custom scopes
const DEFAULT_SCOPES: ScopeActorTypes[] = [ScopeActorTypes.SELF];

// --- Available scopes (can be dynamically modified by pages)
const availableScopes = ref<ScopeActorTypes[]>(DEFAULT_SCOPES);

// --- Track which component set the scopes (for cleanup)
let scopeOwner: symbol | null = null;

// --- Track if we've initialized from route (only do it once)
let hasInitializedFromRoute = false;

// -----------------------------------------------------------------------------

/**
 * Actor scope selector composable for managing active actor scope and sessions across playground pages.
 *
 * @example
 * ```ts
 * const { actorScope, isClient, isStaff, switchScope } = useActorScopeSelector();
 *
 * // In template
 * <ActorScopeSelector :scope="actorScope" @change="switchScope" />
 * ```
 */
export function useActorScopeSelector() {
  const route = useRoute();
  const router = useRouter();

  // Get actor scope from URL (via scope composable)
  const actorScope = useActorScope();

  // Session store for activating sessions on scope switch
  const store = useSessionStore();
  const { activate, logout, getExpiresAt } = store.useActions();
  const {
    activeActor,
    activeSessionId,
    allSessions,
    clientSessions,
    impersonatedSessions,
    staffSessions
  } = store.useContext();
  const { isScopeAllowed } = store.useMeta();

  // --- Helper to activate session store for a given scope
  function activateSessionForScope(scope: ScopeActorTypes) {
    if (scope === ScopeActorTypes.CLIENT) {
      const sessionId = first(keys(clientSessions.value));
      if (sessionId) {
        activate(scope as unknown as AccessRoleTypes, sessionId);
      }
    } else if (scope === ScopeActorTypes.STAFF) {
      const sessionId = first(keys(staffSessions.value));
      if (sessionId) {
        activate(scope as unknown as AccessRoleTypes, sessionId);
      }
    } else if (scope === ScopeActorTypes.GUEST) {
      activate(scope as unknown as AccessRoleTypes);
    }
    // For SELF scope, don't change session store active - let it stay as-is
  }

  // --- Sync scope from URL on initial load
  const initFromRoute = () => {
    const scope = actorScope.value;
    globalActorScope.value = scope;

    // Only activate session on first initialization (not on every composable call)
    if (!hasInitializedFromRoute) {
      hasInitializedFromRoute = true;
      activateSessionForScope(scope);
    }
  };

  // Initialize from route
  initFromRoute();

  // --- Watch actor scope changes from URL
  watch(actorScope, newActor => {
    globalActorScope.value = newActor;
    activateSessionForScope(newActor);
  });

  // --- Helper to build a SessionItem from a session entry
  function buildSessionItem(
    id: string,
    entry: (typeof allSessions.value)[string]
  ): SessionItem {
    const actor = entry.scope;
    const actorKey = findKey(
      ScopeActorTypes,
      v => (v as string) === (actor as string)
    );

    const label =
      entry.user?.publicName ?? entry.user?.fullName ?? entry.user?.email ?? id;

    const initials =
      map(label.split(" "), n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "G";

    const avatar = entry.user?.avatar
      ? { ...entry.user.avatar, initials }
      : { caption: label, initials };

    return {
      id,
      actor,
      avatar,
      expiresAt: getExpiresAt(entry.token),
      icon: getScopeIcon(actor as unknown as ScopeActorTypes),
      isActive: id === activeSessionId.value,
      label,
      sublabel: capitalize(actorKey ?? actor)
    };
  }

  // --- Flat list of all session items (kept for backward compat)
  const sessionItems = computed<SessionItem[]>(() => {
    return map(allSessions.value, (entry, id) => buildSessionItem(id, entry));
  });

  // --- Staff sessions with nested impersonated clients
  const staffSessionNodes = computed<StaffSessionNode[]>(() => {
    const impersonations = impersonatedSessions.value;

    return map(staffSessions.value, (entry, staffId) => {
      const item = buildSessionItem(staffId, entry);

      // Find client sessions whose impersonator is this staff session
      const children: SessionItem[] = [];
      for (const [clientId, parentId] of toPairs(impersonations)) {
        if (parentId === staffId) {
          const clientEntry = clientSessions.value[clientId];
          if (clientEntry) {
            children.push(buildSessionItem(clientId, clientEntry));
          }
        }
      }

      // Sort active impersonated clients to the top
      return {
        ...item,
        impersonatedClients: sortBy(children, c => (c.isActive ? 0 : 1))
      };
    });
  });

  // --- Client sessions NOT impersonated by any staff session
  const directClientItems = computed<SessionItem[]>(() => {
    const impersonations = impersonatedSessions.value;

    return filter(
      map(clientSessions.value, (entry, id) => buildSessionItem(id, entry)),
      item => !has(impersonations, item.id)
    );
  });

  // --- Auth scopes that can add new sessions
  //     Driven by app-level allowedScopes (not page-level availableScopes)
  //     so login buttons always appear when the app supports a scope.
  const AUTH_SCOPES = [ScopeActorTypes.CLIENT, ScopeActorTypes.STAFF];

  const addableScopes = computed<ScopeActorTypes[]>(() => {
    return filter(AUTH_SCOPES, scope => {
      return isScopeAllowed(scope as unknown as AccessRoleTypes);
    });
  });

  // --- Whether guest mode can be shown (allowed by config and not already active)
  const canUseGuestMode = computed(
    () => isScopeAllowed(AccessRoleTypes.GUEST) && !isGuest.value
  );

  // --- Computed helpers
  const isClient = computed(
    () => globalActorScope.value === ScopeActorTypes.CLIENT
  );
  const isStaff = computed(
    () => globalActorScope.value === ScopeActorTypes.STAFF
  );
  const isGuest = computed(
    () => globalActorScope.value === ScopeActorTypes.GUEST
  );
  const isSelf = computed(
    () => globalActorScope.value === ScopeActorTypes.SELF
  );

  // --- Actions
  /**
   * Switch to a new actor scope, update the route, and activate the session.
   */
  function switchScope(scope: ScopeActorTypes) {
    globalActorScope.value = scope;

    // Activate the corresponding session in the session store
    activateSessionForScope(scope);

    // Update scope in URL path while preserving current route and brand
    const currentBrand = route.params.brandIdOrOrg as string | undefined;
    const currentContext = (route.meta?.scopeConfig as { context?: any })
      ?.context;

    // Extract page name from current path
    const pathParts = filter(route.path.split("/"), Boolean);
    // If no brand param, page is first segment; otherwise second segment
    const page = currentBrand ? pathParts[1] || "" : pathParts[0] || "";

    router.push(
      buildScopePath({
        page,
        brandId: currentBrand,
        actor: scope,
        context: currentContext
      })
    );
  }

  /**
   * Activate a specific session by ID and actor type.
   */
  function switchSession(actor: AccessRoleTypes, sessionId: string) {
    activate(actor, sessionId);

    // Map AccessRoleTypes to ScopeActorTypes for the global scope
    const scopeType = findKey(
      ScopeActorTypes,
      v => (v as string) === (actor as string)
    )
      ? (actor as unknown as ScopeActorTypes)
      : ScopeActorTypes.SELF;
    globalActorScope.value = scopeType;

    // Update scope in URL path while preserving current route and brand
    const currentBrand = route.params.brandIdOrOrg as string | undefined;
    const currentContext = (route.meta?.scopeConfig as { context?: any })
      ?.context;

    // Extract page name from current path
    const pathParts = filter(route.path.split("/"), Boolean);
    // If no brand param, page is first segment; otherwise second segment
    const page = currentBrand ? pathParts[1] || "" : pathParts[0] || "";

    router.push(
      buildScopePath({
        page,
        brandId: currentBrand,
        actor: scopeType,
        context: currentContext
      })
    );
  }

  /**
   * Navigate to auth page to add a new session for a given scope.
   */
  function addSession(scope: ScopeActorTypes) {
    const currentBrand = route.params.brandIdOrOrg as string | undefined;

    router.push(
      buildScopePath({
        page: "useAuth",
        brandId: currentBrand,
        actor: scope
      })
    );
  }

  /**
   * Set available scopes without auto-cleanup.
   * Use when you need manual control over lifecycle.
   */
  function set(scopes: ScopeActorTypes[]) {
    availableScopes.value = scopes;
  }

  /**
   * Reset available scopes to default.
   */
  function reset() {
    availableScopes.value = DEFAULT_SCOPES;
    scopeOwner = null;
  }

  /**
   * Register available scopes with auto-cleanup on component unmount.
   * Resets to default scopes when the component unmounts.
   * This is the recommended way to set scopes from a page component.
   */
  function register(scopes: ScopeActorTypes[]) {
    const owner = Symbol("scope-owner");
    scopeOwner = owner;
    availableScopes.value = scopes;

    onUnmounted(() => {
      // Only reset if this component still owns the scopes
      if (scopeOwner === owner) {
        reset();
      }
    });
  }

  /**
   * Get the scope label for display.
   * Uses the enum key (e.g., "STAFF") instead of value (e.g., "user").
   */
  function getScopeLabel(scope: ScopeActorTypes | AccessRoleTypes): string {
    const key = findKey(ScopeActorTypes, v => v === scope);
    return capitalize(key ?? scope);
  }

  /**
   * Get the scope icon for display.
   */
  function getScopeIcon(scope: ScopeActorTypes | AccessRoleTypes): string {
    switch (scope) {
      case ScopeActorTypes.CLIENT:
        return "user-01";
      case ScopeActorTypes.STAFF:
        return "building-07";
      case ScopeActorTypes.GUEST:
        return "user-circle";
      default:
        return "user-01";
    }
  }

  /**
   * Exit impersonation by logging out of active session.
   * The session store automatically restores the parent session.
   */
  function exitImpersonation() {
    logout(); // Removes active session, restores parent via built-in logic
  }

  /**
   * Logout a specific session by actor type.
   * Removes the session and restores the next available session.
   */
  function logoutSession(actor: AccessRoleTypes) {
    logout(actor);
  }

  return {
    /** Current actor type of active session. */
    activeActor,

    /** Current actor scope. */
    actorScope: globalActorScope,

    /** Scopes that can add new sessions (no existing session, scope allowed). */
    addableScopes,

    /** Add a new session for a given scope (navigates to auth). */
    addSession,

    /** Available scopes for the scope switcher. */
    availableScopes,

    /** Whether guest mode can be shown in the actions area. */
    canUseGuestMode,

    /** Client sessions not impersonated by any staff session. */
    directClientItems,

    /** Exit impersonation and restore parent session. */
    exitImpersonation,

    /** Get display label for a scope. */
    getScopeLabel,

    /** Get icon name for a scope. */
    getScopeIcon,

    /** True if current scope is client. */
    isClient,

    /** True if current scope is guest. */
    isGuest,

    /** True if current scope is self. */
    isSelf,

    /** True if current scope is staff. */
    isStaff,

    /** Logout a specific session by actor type. */
    logoutSession,

    /** Register scopes with auto-cleanup on unmount (recommended). */
    register,

    /** Reset to default scopes. */
    reset,

    /** Active session items for dropdown display. */
    sessionItems,

    /** Set scopes without auto-cleanup (manual lifecycle). */
    set,

    /** Staff sessions with nested impersonated clients. */
    staffSessionNodes,

    /** Switch to a new scope (updates route). */
    switchScope,

    /** Activate a specific session by ID and actor type. */
    switchSession
  };
}

// Type export for consumers
export type UseActorScopeSelector = ReturnType<typeof useActorScopeSelector>;
