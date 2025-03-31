// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import { useQuery, useSystem, useSession, useQueryPaginated } from "../..";

// --- utils
import { mapIPhone, mapPhones } from "./mapper";
import { invalidateQueryByKey } from "../../query/utils";
import { keyBy, isString, isNil } from "lodash-es";
import { CacheIsStaleError, useValidation } from "../../../utils";

// --- types
import { PhoneTypes } from "./types";
import type { IPhone } from "@upmind-automation/types";
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

  return get<IPhone[]>({
    url: useUrl(`clients/${client.id}/phones`, {
      limit: 0,
    }),
    queryKey,
    allowStale,
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }) => mapPhones(data ?? []));
}

async function loadPaged(
  paginationParams: PaginatedParams,
  { allowStale = true } = {}
) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IPhone[]>({
    url: useUrl(`clients/${client.id}/phones`),
    queryKey: [...queryKey, { ...paginationParams }],
    allowStale,
    withAccessToken: true,
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => mapPhones(data ?? []));
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedPhones =
    queryClient.getQueryData<QueryResponse<IPhone[]>>(queryKey);
  if (isNil(cachedPhones)) throw new CacheIsStaleError();
  return mapPhones(cachedPhones.data ?? []);
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
  })
    .then(invalidateQueryByKey(queryKey))
    .then(({ data }) => mapPhones(data ?? []));
}

async function update(id: Phone["id"], data: PhoneModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IPhone[]>({
    url: useUrl(`clients/${clientId}/phones/${id}`),
    data: mapIPhone(data),
    withAccessToken: true,
  })
    .then(invalidateQueryByKey(queryKey))
    .then(({ data }) => mapPhones(data ?? []));
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

  return put<IPhone[]>({
    url: useUrl(`clients/${clientId}/phones/${phoneId}`),
    data: { default: true },
    withAccessToken: true,
  })
    .then(invalidateQueryByKey(queryKey))
    .then(({ data }) => mapPhones(data ?? []));
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function loadLookups(
  _context: PhoneContext
): Promise<{ types: Record<string, any>; country: any }> {
  // we don't have any lookups for emails, so just return null
  const { getCountry, fetchCountries } = useSystem();
  await fetchCountries();
  return Promise.resolve({
    types: keyBy(PhoneTypes, "key"),
    country: getCountry(),
  });
}

// TODO: async function parse({ model, country }: PhoneContext, ) {
async function parse(
  { model, country }: PhoneContext,
  { data }: AnyEventObject & { data: PhoneContext }
) {
  // ---
  if (!model?.phone) return Promise.resolve({ model, country });

  const phoneNumber = isString(model.phone)
    ? model?.phone
    : model?.phone?.number || model?.phone?.nationalNumber || "";

  const countryCode =
    model?.phone_country_code || model?.phone?.country || country?.code;
  const phone = parsePhoneNumber(phoneNumber, countryCode) || model.phone;

  // now map the phone number to the model in the correct format with fallbacks
  model.phone = {
    number: phone?.number || model.phone?.number,
    nationalNumber: phone?.nationalNumber || model.phone?.nationalNumber,
    countryCallingCode:
      phone?.countryCallingCode || model.phone?.countryCallingCode,
    country: phone?.country || model.phone?.country || country?.code,
  };

  if (!!model.phone?.country && model.phone.country !== country.code) {
    const { getCountry } = useSystem();
    // we have change countries in the form, so we need to get our new country
    country = getCountry(model.phone.country);
  }

  return Promise.resolve({ model, country });
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

  //--- session
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
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
