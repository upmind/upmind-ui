// --- internal
import { useSession } from "./useSession";
import { router } from "../routing/useRoutingEngine";

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module session/useVerifyEmail
 * @description Lightweight, session-agnostic entry composable for link-based
 * email verification. Reads the verification params from the URL, dispatches to
 * the session machine via {@link useSession} (fire-and-forget — the machine
 * verifies, toasts and re-checks), then routes to the app root (mirroring
 * vue-app's redirect away from the verify page).
 */

export const useVerifyEmail = () => {
  // --- methods

  function verifyFromLink(): void {
    const route = new URL(window.location.href);

    useSession().verifyFromLink({
      clientId: route.searchParams.get(QUERY_PARAMS.CLIENT_ID) ?? "",
      emailId: route.searchParams.get(QUERY_PARAMS.EMAIL_ID) ?? "",
      hash: route.searchParams.get(QUERY_PARAMS.HASH) ?? ""
    });

    router.replace("/");
  }

  // ---------------------------------------------------------------------------
  return {
    /**
     * Verifies the email from the URL link params via the session machine.
     */
    verifyFromLink
  };
};

/** The return type of {@link useVerifyEmail} composable. */
export type UseVerifyEmail = ReturnType<typeof useVerifyEmail>;
