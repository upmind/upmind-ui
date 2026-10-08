// -----------------------------------------------------------------------------
/**
 * @module composables/useActorScopeSelector
 * @description Global actor scope and session management for labs playground.
 * Provides a single source of truth for the active actor scope across all pages.
 * Syncs with URL scope segments and provides reactive session switching.
 */

import { computed, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
  getTokenFromStorage,
  ScopeActorTypes,
  useSessionStore
} from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import { scenarioRoutes } from "../../../modules/scenarios/runtime/registry";
import {
  useActorScope,
  useBrandScope,
  buildScopePath
} from "../../composables/scope";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import {
  capitalize,
  filter,
  find,
  findKey,
  get,
  has,
  map,
  size,
  some,
  sortBy,
  toPairs
} from "lodash-es";
import type { ScopeConfig } from "../../composables/scope";
import { authOverlayTarget } from "~/funnels/labs";

// -----------------------------------------------------------------------------

/**
 * A session item for dropdown display.
 */
export type SessionItem = {
  id: string;
  actor: AccessRoleTypes;
  label: string;
  /** i18n key naming the session's actor — resolved by the surface (AC10.4). */
  sublabel?: string;
  icon: string;
  isActive: boolean;
  expiresAt: number | null;
  avatar?: {
    caption: string;
    src?: string;
    forceCaption?: boolean;
  };
};

/** The i18n key naming each actor — the ONE place an actor becomes words. */
export const ACTOR_LABEL_KEYS: Record<ScopeActorTypes, string> = {
  [ScopeActorTypes.SELF]: "labs.actor_self",
  [ScopeActorTypes.CLIENT]: "labs.actor_client",
  [ScopeActorTypes.STAFF]: "labs.actor_staff",
  [ScopeActorTypes.GUEST]: "labs.actor_guest"
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
  const { t } = useI18n();

  // Get actor scope from URL (via scope composable)
  const actorScope = useActorScope();

  // The playground's surface state lives outside the router (history), so a
  // scope push rebuilding the query would drop it (design §7.3).
  const { preserveQuery } = usePlaygroundUrlState();

  // Brand scope from URL (FE-2973)
  const brandScope = useBrandScope();
  const currentBrandId = computed(() =>
    brandScope.value.mode === "brand" ? brandScope.value.brandId : undefined
  );

  // Session store for activating sessions on scope switch
  const store = useSessionStore();
  const { activate, addGuest, getExpiresAt, logout, remove } =
    store.useActions();
  const {
    activeActor,
    activeSessionId,
    allSessions,
    clientSessions,
    guestSessions,
    impersonatedSessions,
    staffSessions
  } = store.useContext();
  const { hasClientSession, hasGuestSession, hasStaffSession, isScopeAllowed } =
    store.useMeta();

  /**
   * Check if a session is valid for the current brand (FE-2973).
   * - No brand filter (org mode): all sessions valid
   * - Guest: never valid — a guest holds no brand membership to check
   * - Client: valid iff session.user.brandId === currentBrand
   * - Staff: valid iff currentBrand is in session.user.brands
   */
  function isSessionValidForBrand(
    entry: (typeof allSessions.value)[string]
  ): boolean {
    const brand = currentBrandId.value;
    if (!brand) return true;

    // `allSessions` carries the guest pool (FE-3087 R10) and a guest has no
    // `user`, so without this the `!user` fallthrough below would report every
    // guest brand-valid and the org-wide redirect could never fire.
    if (entry.scope === AccessRoleTypes.GUEST) return false;

    const user = entry.user;
    if (!user) return true;

    if (entry.scope === AccessRoleTypes.STAFF) {
      return some(user.brands, b => b.id === brand);
    }
    return user.brandId === brand;
  }

  /**
   * Whether a session belongs in the switcher's rows under the current brand.
   *
   * Brand membership is a client/staff question, so it decides who the tab may
   * be handed to — never who is drawn. A guest holds no membership either way,
   * and hiding one in brand mode would offer "add another guest" beside a pool
   * the user can never see (FE-3087 R13).
   */
  function isSessionListable(
    entry: (typeof allSessions.value)[string]
  ): boolean {
    return (
      entry.scope === AccessRoleTypes.GUEST || isSessionValidForBrand(entry)
    );
  }

  // --- Helper to activate session store for a given scope
  async function activateSessionForScope(
    scope: ScopeActorTypes
  ): Promise<void> {
    // The store owns the active pointer (persisted + restored across reloads).
    // `activate(scope)` is a no-op when the scope is already active and falls to
    // the scope's first session otherwise, so a same-scope load never stomps a
    // restored/switched pointer. SELF leaves the pointer untouched.
    //
    // Awaited because activating GUEST mints a session when the pool holds none
    // — so a switch settles over a network call, and the store supersedes it if
    // another activation lands first.
    if (scope === ScopeActorTypes.SELF) return;
    await activate(scope as unknown as AccessRoleTypes);
  }

  // --- Sync scope from URL on initial load
  const initFromRoute = async (): Promise<void> => {
    const scope = actorScope.value;
    globalActorScope.value = scope;

    // Only activate session on first initialization (not on every composable call)
    if (!hasInitializedFromRoute) {
      hasInitializedFromRoute = true;
      await activateSessionForScope(scope);
    }
  };

  // Initialize from route
  void initFromRoute();

  // --- Watch actor scope changes from URL
  watch(actorScope, async newActor => {
    globalActorScope.value = newActor;
    await activateSessionForScope(newActor);
  });

  // --- Watch brand changes: fall back if active session becomes invalid (FE-2973)
  watch(currentBrandId, async () => {
    const currentId = activeSessionId.value;
    if (!currentId) return;

    const currentEntry = allSessions.value[currentId];
    if (!currentEntry) return;

    // A brand change re-activates client/staff sessions only. Guest is reached
    // by explicit choice alone: switching a chosen guest away would discard that
    // choice, and activating a pooled one would turn the unclaimed guest FLOOR
    // into a chosen guest, opting the tab out of its upgrade on a remote login.
    if (currentEntry.scope === AccessRoleTypes.GUEST) return;

    if (isSessionValidForBrand(currentEntry)) return;

    // Active session is invalid for this brand — find a valid one to fall back to
    const validEntry = find(
      allSessions.value,
      (entry, id) => id !== currentId && isSessionValidForBrand(entry)
    );

    if (validEntry)
      await activate(validEntry.scope, validEntry.token.actor_id ?? undefined);
  });

  // --- Helper to build a SessionItem from a session entry
  function buildSessionItem(
    id: string,
    entry: (typeof allSessions.value)[string]
  ): SessionItem {
    const actor = entry.scope;

    const label =
      entry.user?.publicName ??
      entry.user?.fullName ??
      entry.user?.email ??
      (actor === AccessRoleTypes.GUEST
        ? t("labs.session_guest_row", { id: id.slice(0, 8) })
        : id);

    const initials =
      map(label.split(" "), n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "G";

    const stored = entry.user?.avatar;

    const avatar = {
      caption: stored?.caption ?? initials,
      src: stored?.src,
      forceCaption: stored?.forceCaption
    };

    return {
      id,
      actor,
      avatar,
      expiresAt: getExpiresAt(entry.token),
      icon: getScopeIcon(actor as unknown as ScopeActorTypes),
      isActive: id === activeSessionId.value,
      label,
      sublabel: ACTOR_LABEL_KEYS[actor as unknown as ScopeActorTypes]
    };
  }

  // --- Guest sessions as pool rows, one per pooled guest (FE-3087)
  const guestItems = computed<SessionItem[]>(() =>
    map(guestSessions.value, (entry, id) => buildSessionItem(id, entry))
  );

  // --- Flat list of all session items (kept for backward compat)
  const sessionItems = computed<SessionItem[]>(() =>
    filter(
      map(allSessions.value, (entry, id) => buildSessionItem(id, entry)),
      item => {
        const entry = allSessions.value[item.id];
        return entry ? isSessionListable(entry) : false;
      }
    )
  );

  // --- Staff sessions with nested impersonated clients
  const staffSessionNodes = computed<StaffSessionNode[]>(() => {
    const impersonations = impersonatedSessions.value;

    const nodes: StaffSessionNode[] = [];
    for (const [staffId, entry] of toPairs(staffSessions.value)) {
      if (!isSessionListable(entry)) continue;

      const item = buildSessionItem(staffId, entry);

      // Find client sessions whose impersonator is this staff session
      const children: SessionItem[] = [];
      for (const [clientId, parentId] of toPairs(impersonations)) {
        if (parentId === staffId) {
          const clientEntry = clientSessions.value[clientId];
          if (clientEntry && isSessionListable(clientEntry)) {
            children.push(buildSessionItem(clientId, clientEntry));
          }
        }
      }

      // Sort active impersonated clients to the top
      nodes.push({
        ...item,
        impersonatedClients: sortBy(children, c => (c.isActive ? 0 : 1))
      });
    }
    return nodes;
  });

  // --- Client sessions NOT impersonated by any staff session
  const directClientItems = computed<SessionItem[]>(() => {
    const impersonations = impersonatedSessions.value;

    return filter(
      map(clientSessions.value, (entry, id) => buildSessionItem(id, entry)),
      item => {
        if (has(impersonations, item.id)) return false;
        const entry = clientSessions.value[item.id];
        return entry ? isSessionListable(entry) : false;
      }
    );
  });

  // --- Scopes that can add new sessions
  //     Driven by app-level allowedScopes (not page-level availableScopes)
  //     so login buttons always appear when the app supports a scope.
  const ADDABLE_SCOPES = [
    ScopeActorTypes.CLIENT,
    ScopeActorTypes.STAFF,
    ScopeActorTypes.GUEST
  ];

  const addableScopes = computed<ScopeActorTypes[]>(() => {
    return filter(ADDABLE_SCOPES, scope => {
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

  /**
   * The actor a session switch encodes in the url. A guest always rides its
   * `/as/guest` suffix; a client or staff switch keeps the page acting as self
   * unless the current scenario explicitly offers that actor. Encoding an actor
   * the page serves as self makes `useModulePort` refuse the scope (FE-3087).
   */
  function urlActorFor(scope: ScopeActorTypes): ScopeActorTypes {
    if (scope === ScopeActorTypes.GUEST) return scope;

    const key = route.meta?.scenario as string | undefined;
    const offered = key ? get(scenarioRoutes, [key, "actors"]) : undefined;

    return some(offered, actor => actor === scope)
      ? scope
      : ScopeActorTypes.SELF;
  }

  // --- Actions
  /**
   * Switch to a new actor scope, update the route, and activate the session.
   */
  async function switchScope(scope: ScopeActorTypes): Promise<void> {
    globalActorScope.value = scope;

    // Activate the corresponding session in the session store
    await activateSessionForScope(scope);

    // The homepage and the auth pages have no scoped variant, so there the
    // switch lives in the store alone and the url stays put.
    if (route.params.scopeSuffix === undefined) return;

    // Update scope in URL path while preserving current route and brand
    const currentBrand = route.params.brandIdOrOrg as string | undefined;
    const currentContext = (route.meta?.scopeConfig as ScopeConfig | undefined)
      ?.context;

    // Extract page name from current path
    const pathParts = filter(route.path.split("/"), Boolean);
    // If no brand param, page is first segment; otherwise second segment
    const page = currentBrand ? pathParts[1] || "" : pathParts[0] || "";

    router.push(
      preserveQuery(
        buildScopePath({
          page,
          brandId: currentBrand,
          actor: urlActorFor(scope),
          context: currentContext
        })
      )
    );
  }

  /**
   * Activate a specific session by ID and actor type.
   */
  async function switchSession(
    actor: AccessRoleTypes,
    sessionId: string
  ): Promise<void> {
    await activate(actor, sessionId);

    // Map AccessRoleTypes to ScopeActorTypes for the global scope
    const scopeType = findKey(
      ScopeActorTypes,
      v => (v as string) === (actor as string)
    )
      ? (actor as unknown as ScopeActorTypes)
      : ScopeActorTypes.SELF;

    // Update scope in URL path while preserving current route and brand
    const currentBrand = route.params.brandIdOrOrg as string | undefined;
    const currentContext = (route.meta?.scopeConfig as ScopeConfig | undefined)
      ?.context;

    // Extract page name from current path
    const pathParts = filter(route.path.split("/"), Boolean);
    // If no brand param, page is first segment; otherwise second segment
    const page = currentBrand ? pathParts[1] || "" : pathParts[0] || "";

    const target = preserveQuery(
      buildScopePath({
        page,
        brandId: currentBrand,
        actor: urlActorFor(scopeType),
        context: currentContext
      })
    );

    // The scope suffix rides a PAGE, and the homepage is not one: it has no page
    // segment and no `scopeSuffix` param, so a scoped home path resolves to
    // nothing and the push lands on 404. The store pointer is already moved by
    // then, which is the part a switch actually means — so an unroutable target
    // is a no-op navigation, not a failed switch.
    //
    // `globalActorScope` is NOT written here: it mirrors the url's own scope
    // segment (`initFromRoute` + the `actorScope` watch), so setting it beside
    // an abandoned navigation makes the mirror name an actor the url does not.
    // The watch sets it when the navigation lands, and only then.
    if (!size(router.resolve(target).matched)) return;

    router.push(target);
  }

  /**
   * Add a session — the auth OVERLAY over the page the pool is open on, never a
   * navigation away.
   *
   * The control's own scope IS the choice: "Add another staff session" opens
   * the overlay at the staff actor and "Add another client" at the client one.
   * So it is carried, not asked for a second time.
   */
  async function addSession(scope: ScopeActorTypes): Promise<void> {
    // Guest has no credentials to collect, so the overlay would offer a form
    // nobody can fill. `addGuest` is the store's own fresh-session seam, and it
    // mints a NEW guest beside the ones already pooled.
    if (scope === ScopeActorTypes.GUEST) return addGuest();

    await router.push(authOverlayTarget(route, { actor: scope, fresh: true }));
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
   * i18n key for the "add a new session" action of a given scope.
   * Reads "Add another …" once a session of that scope already exists,
   * so the affordance is unambiguous while a user is already logged in.
   */
  function getAddSessionLabel(scope: ScopeActorTypes): string {
    if (scope === ScopeActorTypes.GUEST) {
      return hasGuestSession.value
        ? "labs.session_add_guest_another"
        : "labs.session_add_guest";
    }

    if (scope === ScopeActorTypes.STAFF) {
      return hasStaffSession.value
        ? "labs.session_add_staff_another"
        : "labs.session_add_staff";
    }
    return hasClientSession.value
      ? "labs.session_add_client_another"
      : "labs.session_add_client";
  }

  /**
   * Stable test hook for the "add session" control of a given scope.
   */
  function getAddSessionTestKey(scope: ScopeActorTypes): string {
    switch (scope) {
      case ScopeActorTypes.GUEST:
        return "actor-scope-add-guest";
      case ScopeActorTypes.STAFF:
        return "actor-scope-add-staff";
      default:
        return "actor-scope-add-client";
    }
  }

  /**
   * Icon for the "add a new session" action of a given scope.
   */
  function getAddSessionIcon(scope: ScopeActorTypes): string {
    switch (scope) {
      case ScopeActorTypes.GUEST:
        return "user-circle";
      case ScopeActorTypes.CLIENT:
        return "log-in-01";
      default:
        return "log-in-02";
    }
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
   * End the ONE session whose control was pressed (`P5`).
   *
   * A row names its own session, so the store's targeted `remove` is what a row
   * control means, and it restores the impersonation parent when the session
   * ended was the active one — exiting an impersonation is this same call on
   * the impersonated row (`P6`).
   *
   * One row per scope is the exception: `remove` never touches the scope
   * cookie, and the store's write gate re-overlays a cookie-backed session
   * straight back into the map, so that row would come back. It ends through
   * `logout(actor)` instead, which dumps the cookie — the same "only when the
   * dead session IS the cookie-backed one" test the store applies internally —
   * and then removes exactly the session the cookie names.
   */
  function logoutSession(actor: AccessRoleTypes, sessionId: string) {
    const brand = currentBrandId.value;

    if (get(getTokenFromStorage(actor), "actor_id") === sessionId)
      logout(actor);
    else remove(actor, sessionId);

    // After logout, check if any remaining session can access the current brand
    // If not, navigate to org-wide (FE-2973)
    if (brand) {
      const hasValidSession = some(allSessions.value, entry =>
        isSessionValidForBrand(entry)
      );
      if (!hasValidSession) {
        const segments = filter(route.path.split("/"), Boolean);
        const page = segments[1] ?? segments[0] ?? "";

        router.push(
          preserveQuery(
            buildScopePath({
              page,
              brandId: undefined,
              actor: ScopeActorTypes.GUEST
            })
          )
        );
      }
    }
  }

  return {
    /** Current actor type of active session. */
    activeActor,

    /** Current actor scope. */
    actorScope: globalActorScope,

    /** Scopes that can add new sessions (no existing session, scope allowed). */
    addableScopes,

    /**
     * Add a session for a scope — opens the auth overlay on its chooser, or
     * mints a new guest session when the scope is guest.
     */
    addSession,

    /** Available scopes for the scope switcher. */
    availableScopes,

    /** Whether guest mode can be shown in the actions area. */
    canUseGuestMode,

    /** Current brand ID from URL (undefined = org mode, FE-2973). */
    currentBrandId,

    /** Client sessions not impersonated by any staff session. */
    directClientItems,

    /** Icon for the "add a new session" action of a scope. */
    getAddSessionIcon,

    /** i18n key for the "add a new session" action of a scope. */
    getAddSessionLabel,

    /** Stable test hook for the "add session" control of a scope. */
    getAddSessionTestKey,

    /** Get icon name for a scope. */
    getScopeIcon,

    /** Get display label for a scope. */
    getScopeLabel,

    /** Guest sessions in the pool; the chosen one reads as active. */
    guestItems,

    /** True if current scope is client. */
    isClient,

    /** True if current scope is guest. */
    isGuest,

    /** True if current scope is self. */
    isSelf,

    /** True if current scope is staff. */
    isStaff,

    /** End one named session; the store restores its parent or the next one. */
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
