// --- internal
import services from "../services";
import { useBrand, useI18n, useQuery } from "../..";

// --- utils
import { isEmpty } from "lodash-es";
import { getTokenFromStorage } from "../utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../../utils";

// ---types
import type { ClientContext } from "./types";
import type { AnyEventObject } from "xstate";
import { Contexts } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function load(_context: ClientContext, _event: any) {
  // if we have a token, we are potentially authenticated
  // and we need to check the token/get the client
  const { t } = useI18n();

  const token = getTokenFromStorage(Contexts.CLIENT);
  if (isEmpty(token))
    return Promise.reject(
      new DetailedError(
        t("error.token_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  const { get, queryClient, useUrl } = useQuery();

  // Each machine `load` (initial or REFRESH-triggered) must hit the BE — the
  // global query cache has a 5-minute staleTime so without invalidation a
  // REFRESH would return stale `/self` data and miss server-side changes
  // (e.g. an email that was verified in another tab).
  await queryClient.invalidateQueries({ queryKey: ["session", "self"] });

  const selfData = await get<{ actor: any; accounts: any }>({
    url: useUrl("self", {
      with: [
        "actor",
        "accounts"
        // client specific only
        // "actor.account", // Relation required for determining `topup_enabled` value
        // "actor.brand", // Relation required for determining `topup_enabled` value
        // "delegated_ids",
        // "enabled_modules"
      ].join()
    }),
    queryKey: ["session", "self"],
    withAccessToken: true
  });

  // Resolve brand-level email verification enforcement at load time so the
  // machine guard can read it from event data (avoids a circular import
  // between `client.machine.ts` and `useBrand`).
  const enforceEmailVerification = !!useBrand().enforceEmailVerification.value;

  return { ...selfData, enforceEmailVerification };
}

// -----------------------------------------------------------------------------

/**
 * Confirms email verification via a hashed link (ported from vue-app's
 * `verifyEmailAddress` action). Called directly from `guardVerifyEmail` when
 * the user lands on `/auth/verify-email` with `hash`, `client_id`, `email_id`
 * query params.
 */
export async function checkVerifyEmail(
  clientId: string,
  emailId: string,
  regHash: string
) {
  const { patch, useUrl } = useQuery();

  return patch({
    mutationKey: ["session", "email", "check_verify", clientId, emailId],
    url: useUrl(`clients/${clientId}/emails/${emailId}/check_verify`),
    data: { reg_hash: regHash },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------

async function verifyEmailCode(
  _context: ClientContext,
  { data }: AnyEventObject
) {
  const { t } = useI18n();

  if (!data?.code) {
    return Promise.reject(
      new DetailedError(
        t("error.client_email_verify_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  }

  const { post, useUrl } = useQuery();

  return post({
    mutationKey: ["session", "email", "verify_code"],
    url: useUrl("clients/verification_code/verify"),
    data: { code: data.code },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  transferTo: services.transferTo,
  verifyEmailCode
};
