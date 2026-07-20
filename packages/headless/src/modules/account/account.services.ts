/** @internal */
import { AccessRoleTypes } from "@upmind-automation/types";
import { mapCustomField } from "../client-custom-fields";
import { useQuery } from "../query";
import { useSessionStore, mapSessionUser } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import { useRecaptcha } from "../system-recaptcha";
import { mapCompleteRegistrationData } from "./account.mappers";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { map } from "lodash-es";
import type { ClientContext, CompleteRegistrationModel } from "./account.types";
import type { IClient, IUser } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module account/account.services
 * @description Account machine services (verify-email, guest upgrade, email).
 */
// -----------------------------------------------------------------------------

/**
 * Resends the email-verification code (`send_verify`). Duplicated here so the
 * session machine owns the call with no cross-module dependency, and awaited
 * via `post` so the resend region can resolve success vs failure.
 */
async function sendVerificationEmail({ client }: ClientContext) {
  const { t } = useI18n();

  const emailId = client?.primaryEmail?.id;
  if (!emailId)
    throw new DetailedError(
      t("error.client_email_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless,
      { emailId }
    );

  const { post, useUrl } = useQuery();

  return post({
    mutationKey: ["session", "email", "send_verify", emailId],
    url: useUrl(`clients/resend_verification`),
    withAccessToken: true
  });
}

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

  const { post, useUrl, queryClient } = useQuery();

  return post({
    mutationKey: ["session", "email", "verify_code"],
    url: useUrl("clients/verification_code/verify"),
    data: { code: data.code },
    withAccessToken: true
  }).then(result => {
    const store = useSessionStore();
    const { activeSessionId, activeUser } = store.useContext();
    const id = activeSessionId.value!;
    const user = activeUser.value!;
    // Optimistically mark the email as verified.
    user.primaryEmail!.isVerified = true;
    store.useActions().updateUser(AccessRoleTypes.CLIENT, id, user);
    // Invalidate the cached /self so it refetches fresh in the background.
    void queryClient.invalidateQueries({
      queryKey: ["session", AccessRoleTypes.CLIENT, id]
    });
    return result;
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
  const payload = mapCompleteRegistrationData(model);

  await recaptcha
    .generate("client_register")
    .then(token => (payload.recaptcha_token = token))
    .catch(() => null);

  return post<IClient>({
    mutationKey: ["session", "client", "completeRegistration"],
    url: useUrl(`clients/${client?.id}/complete_registration`),
    data: payload,
    withAccessToken: true
  })
    .then((updatedClient: IClient) => {
      const { updateUser } = useSessionStore().useActions();
      const user = mapSessionUser({ actor: updatedClient as unknown as IUser });
      updateUser(AccessRoleTypes.CLIENT, updatedClient.id, user);
      return updatedClient;
    })
    .finally(() => recaptcha.clear());
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
 * Parse raw form data into the typed model against the active schema. Mirrors
 * auth.services `parse` — model shaping is deferred to the schema here, never
 * done inline in machine actions.
 */
async function parse(
  { model = {}, schema }: ClientContext,
  _event: AnyEventObject
) {
  if (!schema) return model;
  return useModelParser(schema, model as Record<string, unknown>);
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
  parse,
  sendVerificationEmail,
  verifyEmailCode,
  updateGuestEmail,
  validate
};
