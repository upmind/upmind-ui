import { interpret } from "xstate";
import { createScopedComposable, remove } from "../scope";
import { useSessionStore } from "../session-store";
import { useI18n } from "../system-localisation";
import { authMachine } from "./auth.machine";
import { AUTH_SCOPE_MATRIX } from "./auth.types";
import { createAuthActions } from "./useAuth.actions";
import { createAuthContext } from "./useAuth.context";
import { createAuthInternals } from "./useAuth.internals";
import { createAuthMeta } from "./useAuth.meta";
import {
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stopService
} from "../../utils";
import type { AuthContext, AuthScopeMatrix } from "./auth.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeConfig, ScopeKey } from "../scope/scope.types";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module auth/useAuth
 * @description Scoped authentication composable supporting client and staff flows.
 */
// -----------------------------------------------------------------------------
/**
 * Creates auth composable for a specific scope (actor + optional context).
 * Actor is already resolved by the scope builder (SELF → concrete actor).
 * Scope key is passed from the builder — no need to regenerate.
 * @private
 */
function createAuthForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const { t } = useI18n();

  // Actor is already resolved by the scope builder (SELF → concrete actor)
  const actorScope = config.actor as ScopeActorTypes;

  // Create interpreter with actorScope in initial context
  // This determines which services (client vs admin) are used
  const service = interpret(
    authMachine.withContext({
      scopeActor: actorScope,
      scopeContext: config.context,
      brandId: config.brandId,
      newSession: config.newSession
    } as AuthContext),
    { devTools: true }
  );
  service.start();

  const actorRef = createActor(service);
  if (!actorRef) {
    throw new DetailedError(
      t("errors.auth.unavailable"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  // Auto-destroy auth instance on logout so fresh machine is created next time
  const { onLogout } = useSessionStore().useActions();
  const unsubscribeLogout = onLogout(loggedOutActor => {
    if ((loggedOutActor as string) === (actorScope as string)) {
      unsubscribeLogout();
      stopService(service);
      remove(scopeKey);
    }
  });

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for auth actions (actor-aware). */
    useActions: () => createAuthActions(actorScope, actorRef, scopeKey),

    /** Sub-composable for auth context (computed values). */
    useContext: () => createAuthContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createAuthInternals(actorScope, actorRef),

    /** Sub-composable for auth meta (state flags). */
    useMeta: () => createAuthMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for authentication flows.
 *
 * @example
 * ```ts
 * // Client login (as self)
 * const clientAuth = useAuth().as('client')
 *
 * // Staff login (as self)
 * const staffAuth = useAuth().as('staff')
 *
 * // Staff acting on behalf of a client
 * const staffAsClient = useAuth().as('staff').for('client', clientId)
 * ```
 */
export const useAuth = createScopedComposable<
  ReturnType<typeof createAuthForScope>,
  AuthScopeMatrix
>("auth", createAuthForScope, AUTH_SCOPE_MATRIX);

// Type export for consumers
export type UseAuth = ReturnType<typeof useAuth>;
