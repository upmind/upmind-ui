import { AccessRoleTypes } from "@upmind-automation/types";
import { useSessionStore } from ".";
import { sessionStore } from "./session-store.store";
import { useI18n } from "../system-localisation";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { get } from "lodash-es";
import type { SessionState, SessionUser } from "./session-store.types";
// -----------------------------------------------------------------------------
/**
 * @module session-store/useSession.actions
 * @description Scope-aware session actions sub-composable.
 * Delegates to useSessionStoreActions, wrapping with scope resolution.
 */

/**
 * Read the active session's loaded user straight from raw store state — safe
 * outside Vue's effect scope (router guards, async callbacks).
 */
function readActiveUser(state: SessionState): SessionUser | undefined {
  const id = state.activeSessionId;
  if (!id) return undefined;
  if (state.activeActor === AccessRoleTypes.CLIENT)
    return get(state.clientSessions, [id, "user"]);
  if (state.activeActor === AccessRoleTypes.STAFF)
    return get(state.staffSessions, [id, "user"]);
  return undefined;
}

/**
 * Factory for scope-aware session actions.
 * Delegates to store actions with scope resolution.
 *
 * @returns Scope-aware action methods
 */
export function createSessionActions(_sessionId?: string) {
  const store = useSessionStore();
  const storeActions = store.useActions();
  const storeMeta = store.useMeta();
  const { t } = useI18n();

  return {
    /**
     * Wait for authenticated session to be available with user data loaded.
     * Resolves when a client or staff session exists AND user data is loaded.
     * Rejects with DetailedError if not authenticated (guest session).
     * @returns Promise<SessionUser> - Resolves to user when authenticated
     */
    isAuthenticated: async (): Promise<SessionUser> => {
      await storeActions.isReady();

      const guestError = (): DetailedError =>
        new DetailedError(
          t("auth.login_to_continue"),
          responseCodes.Unauthorized,
          ErrorOrigin.Headless
        );

      // Read directly from raw store state — useStore() computeds don't work
      // outside Vue's effect scope (router guards, async callbacks).
      const state = sessionStore.state;
      if (state.activeActor === AccessRoleTypes.GUEST) throw guestError();
      const user = readActiveUser(state);
      if (user) return user;

      // Session exists but user not hydrated yet — subscribe to the raw store
      // (the same signal storeTick uses), not Vue computeds, which don't
      // re-evaluate outside an effect scope.
      return new Promise<SessionUser>((resolve, reject) => {
        let unsubscribe = (): void => {};
        let timer: ReturnType<typeof setTimeout>;
        const done = (): void => {
          unsubscribe();
          clearTimeout(timer);
        };
        const check = (): void => {
          const s = sessionStore.state;
          if (s.activeActor === AccessRoleTypes.GUEST) {
            done();
            reject(guestError());
            return;
          }
          const u = readActiveUser(s);
          if (u) {
            done();
            resolve(u);
          }
        };
        unsubscribe = sessionStore.subscribe(check);
        timer = setTimeout(() => {
          done();
          reject(
            new DetailedError(
              t("error.401_title_md"),
              responseCodes.Unauthorized,
              ErrorOrigin.Headless
            )
          );
        }, 60_000);
        check();
      });
    },

    /**
     * Wait for session store initialization to complete.
     * @returns Promise<boolean> - Resolves to true when initialised
     */
    isReady: () => storeActions.isReady(),

    /**
     * Wait until the active session is a fully-loaded client/staff.
     *
     * Unlike `isAuthenticated()` (a guard that rejects a guest immediately),
     * this WAITS through the guest→client promotion window: after login the
     * auth machine has the token, but loading the user + promoting the active
     * session is the session store's job and lands a beat later. Resolves the
     * moment that promotion completes, driven by the raw-store subscribe (the
     * same signal `isAuthenticated` uses) — no polling, no timeout. Callers
     * that need a bound (e.g. tests) get it from their own outer timeout; a
     * login that never promotes simply never resolves here.
     *
     * @returns Promise<SessionUser> - Resolves once user data is loaded.
     */
    whenAuthenticated: (): Promise<SessionUser> =>
      new Promise((resolve, reject) => {
        let unsubscribe = (): void => {};
        const check = (): void => {
          if (sessionStore.state.activeActor === AccessRoleTypes.GUEST) return; // wait, don't reject
          // An interactive login that promoted the session but failed to load
          // the user records `userError`; surface it rather than wait forever
          // for a user that will never arrive.
          if (sessionStore.state.userError) {
            unsubscribe();
            reject(sessionStore.state.userError);
            return;
          }
          const user = readActiveUser(sessionStore.state);
          if (user) {
            unsubscribe();
            resolve(user);
          }
        };
        unsubscribe = sessionStore.subscribe(check);
        check();
      }),

    /**
     * Log out of THIS scope's session.
     * Removes cookie and state, falls back to next available session.
     */
    logout: () => storeActions.logout(),

    /**
     * Subscribe to logout events for ANY scope.
     * @param callback - Called with actor type when logout occurs
     * @returns Unsubscribe function
     */
    onLogout: storeActions.onLogout
  };
}

// Type export for consumers
export type UseActiveSessionActions = ReturnType<typeof createSessionActions>;
