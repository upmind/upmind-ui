// --- internal
import services from "../services";
import { useI18n, useQuery, useSystem } from "../..";
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

  const { get, useUrl } = useQuery();

  return get({
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
  updateGuestEmail,
  validate
};
