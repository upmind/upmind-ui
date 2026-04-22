// --- internal
import services from "../services";
import { useI18n, useQuery } from "../..";
import { useRecaptcha } from "../../system";

// --- utils
import { isEmpty } from "lodash-es";
import { getTokenFromStorage } from "../utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../../utils";

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

async function completeRegistration(
  { client }: ClientContext,
  { data }: AnyEventObject
) {
  const { post, useUrl } = useQuery();
  const recaptcha = useRecaptcha();

  const model = data as CompleteRegistrationModel;
  const payload: any = {
    custom_fields: model.customFields,
    email: model.email,
    firstname: model.firstname,
    lastname: model.lastname,
    password: model.password,
    phone: model.phone?.nationalNumber,
    phone_code: model.phone?.countryCallingCode,
    phone_country_code: model.phone?.country,
    username: model.email
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

// -----------------------------------------------------------------------------

export default {
  completeRegistration,
  load,
  transferTo: services.transferTo,
  updateGuestEmail
};
