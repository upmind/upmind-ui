import { GrantTypes, type IToken } from "@upmind-automation/types";
import { useQuery } from "../query";
import { persistTokenToStorage } from "../session-store/session-store.utils";
import { useSessionStoreActions } from "../session-store/useSessionStore.actions";
import { useI18n } from "../system-localisation";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import type { IAuthTransfer, TransferContext } from "./session-transfer.types";
// -----------------------------------------------------------------------------
/**
 * @module session-transfer/services
 * @description API services for session transfer operations.
 */
// -----------------------------------------------------------------------------
/**
 * Generate a transfer code for the current session.
 * Creates a one-time code that can be used to transfer the session to another tab/domain.
 */
async function transferTo(): Promise<IAuthTransfer> {
  const { post, useUrl } = useQuery();

  return post<IAuthTransfer>({
    mutationKey: ["session-transfer", "transfer_to"],
    url: useUrl("auth_code"),
    withAccessToken: true
  });
}

/**
 * Consume a transfer code and establish the session.
 * Persists the token to session store and legacy storage.
 * @param context - The transfer context containing the code
 */
async function transferFrom({ transfer }: TransferContext): Promise<IToken> {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();
  const { add } = useSessionStoreActions();

  if (!transfer?.code)
    return Promise.reject(
      new DetailedError(
        t("error.session_transfer_code_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        transfer
      )
    );

  return post<IToken>({
    mutationKey: ["session-transfer", "transfer_from"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.AUTH_CODE,
      code: transfer.code,
      lang: "en" // ensure we dont init i18n to get the locale
    }
  }).then(token => {
    // Persist to session store
    add(token, false);

    // Also persist to legacy storage for compatibility
    persistTokenToStorage(token);

    return token;
  });
}
// -----------------------------------------------------------------------------
export const sessionTransferServices = {
  transferTo,
  transferFrom
};
