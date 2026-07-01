import { QUERY_PARAMS } from "@upmind-automation/types";
import { router } from "../routing/useRoutingEngine";
import { verifyFromLink as verifyFromLinkService } from "./auth.services.client.email";
// -----------------------------------------------------------------------------
/**
 * @module auth/useVerifyEmail
 * @description Lightweight, session-agnostic entry composable for link-based
 * email verification (M2). Reads the verification params from the URL, delegates
 * to the verifyFromLink service (which owns the PATCH + /self refresh), then
 * routes to the app root synchronously (mirroring the redirect away from the
 * verify page). The composable NEVER calls useQuery, patch, refresh, or
 * markEmailVerified directly.
 */
export const useVerifyEmail = () => {
  // --- methods

  function verifyFromLink(): void {
    const route = new URL(window.location.href);

    verifyFromLinkService({
      clientId: route.searchParams.get(QUERY_PARAMS.CLIENT_ID) ?? "",
      emailId: route.searchParams.get(QUERY_PARAMS.EMAIL_ID) ?? "",
      hash: route.searchParams.get(QUERY_PARAMS.HASH) ?? ""
    }).catch(() => {});

    router.replace("/");
  }

  // ---------------------------------------------------------------------------
  return {
    /**
     * Verifies the email from the URL link params via the verifyFromLink service.
     */
    verifyFromLink
  };
};

/** The return type of {@link useVerifyEmail} composable. */
export type UseVerifyEmail = ReturnType<typeof useVerifyEmail>;
