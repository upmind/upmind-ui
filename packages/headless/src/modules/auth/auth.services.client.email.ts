/** @internal */
import { useI18n } from "../system-localisation";
import { useQuery } from "../query";
import { useSessionStore } from "../session-store";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import type { VerifyFromLinkParams } from "./auth.types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module auth/services.client.email
 * @description Email-verification link flow service (M2).
 * Session-agnostic — `reg_hash` is the proof. Hosts the raw check_verify PATCH
 * (checkVerifyEmail) and the composing verifyFromLink which also refreshes the
 * active CLIENT session's /self on success.
 *
 * WARNING: Do not import directly. Only useVerifyEmail.ts imports this.
 */

/**
 * Raw PATCH clients/{clientId}/emails/{emailId}/check_verify with {reg_hash}.
 * Empty params reject BEFORE the PATCH is constructed.
 */
export async function checkVerifyEmail({
  clientId,
  emailId,
  hash
}: VerifyFromLinkParams): Promise<void> {
  const { t } = useI18n();

  if (!clientId || !emailId || !hash) {
    return Promise.reject(
      new DetailedError(
        t("error.client_email_verify_failed"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );
  }

  const { patch, useUrl } = useQuery();

  await patch({
    mutationKey: ["session", "email", "check_verify", clientId, emailId],
    url: useUrl(`clients/${clientId}/emails/${emailId}/check_verify`),
    data: { reg_hash: hash },
    withAccessToken: true
  });
}

/**
 * Composing service: PATCH check_verify then refresh the active CLIENT
 * session's /self on success. The /self refresh re-maps default_email.verified,
 * which reactively recomputes useSession.meta.isUnverified to false.
 *
 * NEVER calls markEmailVerified (M4 is OTP-only).
 */
export async function verifyFromLink(
  params: VerifyFromLinkParams
): Promise<void> {
  await checkVerifyEmail(params);
  await useSessionStore().useActions().refresh();
}
