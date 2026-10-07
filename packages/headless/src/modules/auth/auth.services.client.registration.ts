/** @internal */
import {
  AccessRoleTypes,
  BrandConfigKeys,
  GrantTypes
} from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { AuthEvents, getTokenFromStorage } from "../session-store";
import { persistTokenToStorage } from "../session-store/session-store.utils";
import { mapRegistrationToken, mapVerifyRegistration } from "./auth.mappers";
import { AUTH_SESSION_QUERY_KEY_BASE } from "./auth.types";
import { useCookies } from "../../utils";
import { compact, get, isEmpty, join, replace, split } from "lodash-es";
import type {
  CompleteRegistrationPayload,
  VerifyRegistrationContext,
  VerifyRegistrationData
} from "./auth.types";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module auth/services.client.registration
 * @description Registration-activation link services: the verify request, the
 * `complete_registration` grant and its client token save.
 *
 * WARNING: Do not import directly. Use via the registration landing machine only.
 */

const REGISTRATION_MUTATION_KEY = [
  ...AUTH_SESSION_QUERY_KEY_BASE,
  "registration"
];

/**
 * Read the GA client and session ids for the grant `meta`.
 * @returns the payload, or `undefined` when the brand has no measurement id or
 * either cookie is missing.
 * @private
 */
async function readAnalyticsMeta(): Promise<
  CompleteRegistrationPayload["meta"]
> {
  const brand = useBrand();
  await brand.isReady();

  const measurementId = replace(
    brand.getConfigValue<string>(BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID) ??
      "",
    /^G-/,
    ""
  );
  if (!measurementId) return;

  // The GA cookies are plain dotted strings; the default decoder JSON-parses
  // and would drop them.
  const { get: getCookie } = useCookies();
  const raw = (value: string) => value;
  const ga = split(String(getCookie("_ga", raw) ?? ""), ".");
  const gaSession = split(
    String(getCookie(`_ga_${measurementId}`, raw) ?? ""),
    "."
  );

  const ga_client_id = join(compact([get(ga, 2), get(ga, 3)]), ".");
  const ga_session_id = get(gaSession, 2);
  if (isEmpty(ga_client_id) || isEmpty(ga_session_id)) return;

  return { ga_client_id, ga_session_id };
}

/**
 * Check the activation link. Sends the client token only, never another actor's.
 */
export async function verifyRegistrationLink({
  params
}: VerifyRegistrationContext): Promise<VerifyRegistrationData> {
  const { patch, useUrl } = useQuery();

  return patch({
    mutationKey: [...REGISTRATION_MUTATION_KEY, "verify"],
    url: useUrl("clients/reg_hash/verify"),
    data: { username: params.username, reg_hash: params.hash },
    withAccessToken:
      getTokenFromStorage(AccessRoleTypes.CLIENT)?.access_token || false
  }).then(mapVerifyRegistration);
}

/**
 * Complete the registration with the `complete_registration` grant, then save
 * the token as the CLIENT session.
 * @returns the saved token.
 */
export async function completeRegistration({
  params,
  model
}: VerifyRegistrationContext): Promise<IToken> {
  const { post, useUrl } = useQuery();
  const meta = await readAnalyticsMeta();

  const data: CompleteRegistrationPayload = {
    grant_type: GrantTypes.COMPLETE_REGISTRATION,
    username: params.username ?? "",
    reg_hash: params.hash,
    password: model.password
  };
  if (meta) data.meta = meta;

  return post<IToken>({
    mutationKey: [...REGISTRATION_MUTATION_KEY, "complete"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data,
    withAccessToken: false
  }).then(token => {
    const clientToken = mapRegistrationToken(token);
    persistTokenToStorage(clientToken, { event: AuthEvents.LOGIN });
    return clientToken;
  });
}
