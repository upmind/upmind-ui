// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import { useQuery, useSystem, useSession, useQueryPaginated } from "../..";

// --- utils
import { mapIPhone, mapPhones } from "./mapper";
import { invalidateQueryByKey } from "../../query";
import { keyBy, isString, isNil, get, set } from "lodash-es";
import {
  CacheIsStaleError,
  useModelParser,
  useValidation,
} from "../../../utils";

// --- types
import { PhoneTypes } from "./types";
import type { ICountry, IPhone } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/query-core";
import type { AnyEventObject } from "xstate";
import type { PaginatedParams, QueryResponse } from "../..";
import type { Phone, PhoneModel, PhoneContext } from "./types";

// -----------------------------------------------------------------------------

const queryKey: QueryKey = ["client", "phones"];

async function loadAll({ allowStale = true } = {}) {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<Phone>({
    url: useUrl(`clients/${client.id}/phones`, {
      limit: 0,
    }),
    queryKey,
    allowStale,
    withAccessToken: true,
    transformResponse: (response: any) =>
      set(response, "data", mapPhones(response?.data ?? [])),
    revalidateIfStale: true,
  }).then(({ data }) => data);
}

async function loadPaged(
  paginationParams: PaginatedParams,
  { allowStale = true } = {}
) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<Phone>({
    url: useUrl(`clients/${client.id}/phones`),
    queryKey: [...queryKey, { ...paginationParams }],
    allowStale,
    withAccessToken: true,
    transformResponse: (response: any) =>
      set(response, "data", mapPhones(response?.data ?? [])),
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => data ?? []);
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedPhones =
    queryClient.getQueryData<QueryResponse<Phone[]>>(queryKey);
  if (isNil(cachedPhones)) throw new CacheIsStaleError();
  return cachedPhones.data;
}

/**
 * Load the lookups for the phone form
 * @param {PhoneContext} _context
 * @returns {Promise<{
 *   types: Record<string, (typeof PhoneTypes)[number]>;
 *   country: ICountry;
 * }>}
 */
async function loadLookups(_context: PhoneContext): Promise<{
  types: Record<string, (typeof PhoneTypes)[number]>;
  country: ICountry;
}> {
  // we don't have any lookups for emails, so just return null
  const { getCountry, fetchCountries } = useSystem();
  await fetchCountries();
  return Promise.resolve({
    types: keyBy(PhoneTypes, "key"),
    country: getCountry(),
  });
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: PhoneModel) {
  const { getUserId } = useSession();
  const { post, useUrl } = useQuery();

  const clientId = await getUserId();

  return post<IPhone>({
    url: useUrl(`clients/${clientId}/phones`),
    data: mapIPhone(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function update(id: Phone["id"], data: PhoneModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IPhone>({
    url: useUrl(`clients/${clientId}/phones/${id}`),
    data: mapIPhone(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function remove(phoneId: Phone["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  return del<null>({
    url: useUrl(`clients/${clientId}/phones/${phoneId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function setDefault(phoneId: Phone["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IPhone>({
    url: useUrl(`clients/${clientId}/phones/${phoneId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema, country }: PhoneContext,
  { data }: AnyEventObject & { data: PhoneContext }
) {
  const safeModel = useModelParser(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---
  if (!safeModel?.phone) return Promise.resolve({ model: safeModel, country });

  const phoneNumber = isString(safeModel.phone)
    ? safeModel?.phone
    : safeModel?.phone?.number || safeModel?.phone?.nationalNumber || "";

  const countryCode =
    safeModel?.phone_country_code ||
    safeModel?.phone?.country ||
    data?.country ||
    country.code;
  const phone = parsePhoneNumber(phoneNumber, countryCode) || safeModel.phone;

  // now map the phone number to the model in the correct format with fallbacks
  safeModel.phone = {
    number: phone?.number || safeModel.phone?.number,
    nationalNumber: phone?.nationalNumber || safeModel.phone?.nationalNumber,
    countryCallingCode:
      phone?.countryCallingCode || safeModel.phone?.countryCallingCode,
    country: phone?.country || safeModel.phone?.country || country?.code,
  };

  if (!!safeModel.phone?.country && safeModel.phone.country !== country.code) {
    const { getCountry } = useSystem();
    // we have change countries in the form, so we need to get our new country
    country = getCountry(safeModel.phone.country);
  }

  return Promise.resolve({ model: safeModel, country });
}

async function validate({ schema, model }: PhoneContext) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject({ error: errors });
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadAll,
  loadPaged,
  refresh: async () => loadAll({ allowStale: false }),

  loadAllFromCache,
  //--- mutations

  remove,
  setDefault,
};

export const useClientPhoneServices = () => {
  return {
    loadLookups,
    add: async (context: PhoneContext) => {
      if (!context.model?.phone)
        return Promise.reject("No phone model provided");
      return add(context.model);
    },
    update: async (context: PhoneContext) => {
      if (!context.id) return Promise.reject("No phone id provided");
      if (!context.model?.phone)
        return Promise.reject("No phone model provided");

      return update(context.id, context.model);
    },
    parse,
    validate,
    refresh: async () => loadAll({ allowStale: false }),
  };
};
