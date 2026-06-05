// --- internal
import services from "../services";
import { useI18n, useBrand, useQuery, useSystem } from "../..";
import { useRecaptcha } from "../../system";

// --- utils
import { isEmpty, map } from "lodash-es";
import { getTokenFromStorage } from "../utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useValidation
} from "../../../utils";
import { mapCustomField } from "../../client/customFields/mappers";

// ---types
import type { ClientContext, CompleteRegistrationModel } from "./types";
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

/**
 * Upgrades a guest client to a fully registered client.
 *
 * The endpoint returns no auth payload — the existing `guest_customer` token
 * keeps working post-upgrade. The machine re-fetches `/self` afterwards via
 * `register.registering → onDone → loading` to reconcile `is_guest: false`.
 * Do NOT add token-handling here.
 */
async function completeRegistration(
  { client }: ClientContext,
  { data }: AnyEventObject
) {
  const { post, useUrl } = useQuery();
  const recaptcha = useRecaptcha();

  const model = data as CompleteRegistrationModel & { username?: string };
  // The reused register form supplies the email via its `username` field;
  // fall back to it so the upgrade payload always carries an email.
  const email = model.email ?? model.username;
  const payload: any = {
    custom_fields: model.customFields,
    email,
    firstname: model.firstname,
    lastname: model.lastname,
    password: model.password,
    phone: model.phone?.nationalNumber,
    phone_code: model.phone?.countryCallingCode,
    phone_country_code: model.phone?.country,
    username: email
  };

  await recaptcha
    .generate("client_register")
    .then(token => (payload.recaptcha_token = token))
    .catch(() => null);

  return post({
    mutationKey: ["session", "client", "completeRegistration"],
    url: useUrl(`clients/${client?.id}/complete_registration`),
    data: payload,
    withAccessToken: true
  }).finally(() => recaptcha.clear());
}

async function updateGuestEmail(
  { client }: ClientContext,
  { data }: AnyEventObject
) {
  const { put, useUrl } = useQuery();
  return put({
    mutationKey: ["session", "client", "updateEmail"],
    url: useUrl(`clients/${client?.id}`),
    data: { email: data.email },
    withAccessToken: true
  });
}

/**
 * Fetches the order-form custom fields for the guest → full registration form.
 * Mirrors the guest machine's `getCustomFields` (generic — no guest coupling).
 */
async function getCustomFields(
  _context: ClientContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();
  const { ensureCountries } = useSystem();

  // Countries are needed by the register schema's default country (phone).
  ensureCountries();

  return get({
    url: useUrl("clients_fields", {
      "filter[show_on_order_form]": true
    }),
    queryKey: ["session", "client", "custom-fields"],
    select: data => map(data ?? [], mapCustomField)
  });
}

/**
 * Validates `context.model` against `context.schema` (AJV). Same generic shape
 * as the guest machine's `validate` — drives the form `checking → valid/invalid`
 * cycle. Rejects with the AJV errors so they surface as `error.data`.
 */
async function validate(
  { schema, model }: ClientContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.auth_not_valid"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  completeRegistration,
  getCustomFields,
  load,
  transferTo: services.transferTo,
  verifyEmailCode,
  updateGuestEmail,
  validate
};
