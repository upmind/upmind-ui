// --- external

// --- internal
import { useI18n, useQuery, type AnyEventObject } from "../..";

// --- utils
import { compact, isEmpty, map, reject } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { getTokenFromStorage, persistTokenToStorage } from "./utils";

// --- types
import {
  GrantTypes,
  type IBrandSettings,
  type IToken
} from "@upmind-automation/types";
import type { SessionContext } from "./types";

// -----------------------------------------------------------------------------

async function check(_context: SessionContext) {
  const { post, useUrl } = useQuery();
  const token = getTokenFromStorage();

  if (!isEmpty(token)) {
    return Promise.resolve(token);
  } else {
    // generate/persist the new guest token immediately
    return post<IToken>({
      mutationKey: ["session"],
      url: useUrl("access_token", {}, { context: "oauth" }),
      data: { grant_type: GrantTypes.GUEST }
    }).then(data => persistTokenToStorage(data));
  }
}

async function transferTo(_context: SessionContext) {
  const { post, useUrl } = useQuery();

  return post({
    mutationKey: ["session", "transfer_to"],
    url: useUrl("auth_code"),
    withAccessToken: true
  });
}

async function transferFrom({ transfer }: SessionContext) {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();

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
    mutationKey: ["session", "transfer_from"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.AUTH_CODE,
      code: transfer.code,
      lang: "en" // ensure we dont init i18n to get the locale
    }
  }).then(data => {
    persistTokenToStorage(data);
    return data;
  });
}

/**
 * Fetch the brand's live registered client origins — the redirect allowlist for
 * the session transfer flow.
 *
 * Deliberately NOT `useBrand()`. That composable fires several queries the moment
 * it is called, and the transfer entrypoint boots before the brand is loaded at
 * all. One request for one field, owned by the module that needs it. Shares the
 * `["brand", "settings"]` query key, so it is served from cache when the brand
 * does load rather than duplicating the request.
 *
 * FAILS CLOSED: any error resolves to an empty list, which leaves same-host as
 * the only permitted redirect target. It never rejects, so a brand-settings
 * outage degrades the redirect rather than breaking the session transfer itself.
 *
 * NB the values are BARE HOSTS in real payloads ("kn6x1dzbtcgb.upmind.dev")
 * despite the field name. Normalising them is the consumer's job — see
 * `originToHost` in `useTransfer` — because getting that wrong is a bypass.
 */
async function fetchAllowedOrigins(): Promise<string[]> {
  const { get, useUrl } = useQuery();

  return get<IBrandSettings, string[]>({
    url: useUrl("brand/settings"),
    queryKey: ["brand", "settings"],
    // --- options
    retry: false,
    select: (data: IBrandSettings) =>
      compact(
        map(reject(data?.oauth_clients ?? [], { revoked: true }), "origin")
      )
  }).catch((error: unknown) => {
    console.warn("Redirect allowlist unavailable:", error);
    return [];
  });
}

async function verify(_context: SessionContext, { data }: AnyEventObject) {
  const { t } = useI18n();
  const { patch, useUrl } = useQuery();

  const { clientId, emailId, hash } = data ?? {};

  if (!clientId || !emailId || !hash)
    return Promise.reject(
      new DetailedError(
        t("error.client_email_verify_failed"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless,
        data
      )
    );

  return patch({
    mutationKey: ["session", "email", "check_verify", clientId, emailId],
    url: useUrl(`clients/${clientId}/emails/${emailId}/check_verify`),
    data: { reg_hash: hash },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------

export default {
  check,
  fetchAllowedOrigins,
  transferTo,
  transferFrom,
  verify
};
