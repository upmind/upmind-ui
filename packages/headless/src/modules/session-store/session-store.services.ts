import {
  type IToken,
  type ISelf,
  AccessRoleTypes
} from "@upmind-automation/types";
import { useQuery } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import { mapSessionUser } from "./session-store.mappers";
import { getTokenFromStorage } from "./session-store.utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useTime
} from "../../utils";
import { keys, map, reduce, values } from "lodash-es";
import type { SessionState, SessionUser } from "./session-store.types";
// -----------------------------------------------------------------------------
/**
 * @module session-store/services
 * @description Session store services.
 * Handles API requests for loading session user data.
 */

/**
 * Load client user profile data from /self endpoint.
 *
 * @param token - The client session token
 * @returns Promise resolving to SessionUser data
 */
async function loadClientUser(token: IToken): Promise<SessionUser> {
  const { get, useUrl } = useQuery();

  return get<ISelf, SessionUser>({
    queryKey: ["session", token.actor_type, token.actor_id],
    url: useUrl("self", {
      with_count: "actor.child_client_configs",
      with: map(
        [
          "actor",
          "actor.account",
          "actor.brand",
          "actor.image",
          "actor.parent_client_config.parent_client",
          "actor.parent_client_config.parent_client.image",
          "accounts",
          "delegated_ids",
          "enabled_modules"
        ],
        String
      ).join()
    }),
    select: mapSessionUser,
    staleTime: useTime()?.DAY,
    withAccessToken: token.access_token,
    withoutLocale: true
  });
}

/**
 * Load staff user profile data from /admin/self endpoint.
 *
 * @param token - The staff session token
 * @returns Promise resolving to SessionUser data
 */
async function loadStaffUser(token: IToken): Promise<SessionUser> {
  const { get, useUrl } = useQuery();

  return get<ISelf, SessionUser>({
    queryKey: ["session", token.actor_type, token.actor_id],
    url: useUrl("admin/self", {
      with: map(
        [
          "actor",
          "actor.image",
          "brands",
          "brands.image",
          "brands.icon",
          "functionalities",
          "user_flow_secrets",
          "upmind_contract_product"
        ],
        String
      ).join()
    }),
    select: mapSessionUser,
    staleTime: useTime()?.DAY,
    withAccessToken: token.access_token,
    withoutLocale: true
  });
}

export async function loadUser(token: IToken): Promise<SessionUser> {
  switch (token.actor_type) {
    case AccessRoleTypes.STAFF:
      return loadStaffUser(token);

    case AccessRoleTypes.CLIENT:
    default:
      return loadClientUser(token);
  }
}

/**
 * Load user data for all sessions in parallel.
 * Uses Promise.allSettled to load all sessions without failing if one fails.
 *
 * @returns Promise resolving to Record of session ID to SessionUser data
 */
export async function loadAllSessionUsers(
  state: SessionState
): Promise<Record<string, SessionUser>> {
  const allSessions = {
    ...state.clientSessions,
    ...state.staffSessions
  };

  // Build Record of sessionId -> promise
  const sessionPromises = reduce(
    allSessions,
    (acc: Record<string, Promise<SessionUser>>, session, sessionId) => {
      if (!session.user && session.token.access_token) {
        acc[sessionId] = loadUser(session.token);
      }
      return acc;
    },
    {}
  );

  // Load all in parallel and build result object
  return Promise.allSettled(values(sessionPromises)).then(results => {
    const sessionIds = keys(sessionPromises);

    return reduce(
      sessionIds,
      (acc: Record<string, SessionUser>, sessionId, index) => {
        const result = results[index];
        if (result.status === "fulfilled") {
          acc[sessionId] = result.value;
        } else {
          console.warn(
            `Failed to load user data for session ${sessionId}:`,
            result.reason
          );
        }
        return acc;
      },
      {}
    );
  });
}

/**
 * Mint a guest token from the auth module.
 *
 * Session-store delegates all token minting to the auth module to maintain
 * separation of concerns. This function:
 * 1. Dynamically imports auth module (avoids circular dependency)
 * 2. Creates guest auth instance (auto-starts guest flow)
 * 3. Waits for auth completion via `isReady()`
 * 4. Retrieves minted token from cookie storage
 *
 * **Why retrieve from storage instead of direct return?**
 * The auth module persists tokens via `persistTokenToStorage()` which handles
 * cookie writing and session-store updates. Retrieving from storage ensures
 * consistency with the auth module's storage strategy.
 *
 * @private
 * @returns Promise resolving to minted guest token, or undefined if minting failed
 */
const GUEST_MINT_MAX_ATTEMPTS = 3;

export async function mintGuestToken(): Promise<IToken> {
  // `useAuth` stays a lazy import: the auth module imports session-store
  // statically, so importing the auth barrel at the top of this file would
  // close a real auth ↔ session-store cycle. (ScopeActorTypes is imported
  // statically from scope's leaf types file, which has no such cycle.)
  const { useAuth } = await import("../auth");

  for (let attempt = 1; attempt <= GUEST_MINT_MAX_ATTEMPTS; attempt++) {
    // A fresh instance per attempt: `destroy()` clears the registry so the next
    // `.as(GUEST)` re-runs the mint rather than reusing a machine parked in a
    // terminal state.
    const guestAuth = useAuth().as(ScopeActorTypes.GUEST);
    const { onDone, onError, destroy } = guestAuth.useActions();

    // Race success against failure: `onError` (the failure counterpart to
    // `onDone`) guarantees the promise settles even when the mint fails, so a
    // failed attempt can NEVER hang the boot await — the old `onDone`-only wait
    // never settled on failure and froze `initialise` forever.
    const mintedToken = await new Promise<IToken | undefined>(resolve => {
      onDone(() => {
        const token = getTokenFromStorage(
          AccessRoleTypes.GUEST
        ) as IToken | null;
        resolve(token?.access_token ? token : undefined);
      });
      onError(() => resolve(undefined));
    }).finally(() => destroy());

    if (mintedToken) return mintedToken;
  }

  // Retries exhausted. A guest session is required by design, so a mint that
  // cannot be obtained is a fatal boot condition: explode loudly rather than
  // hang or proceed guestless. `initialise` catches this and surfaces the boot
  // error so downstream consumers can react.
  throw new DetailedError(
    `Failed to mint a guest token after ${GUEST_MINT_MAX_ATTEMPTS} attempts`,
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );
}
