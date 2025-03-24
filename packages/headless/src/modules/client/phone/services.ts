// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import { useQuery, useSystem, useSession, useQueryPaginated } from "../..";

// --- utils
import { mapPhone } from "./mapper";
import { invalidateQueryByKey } from "../../query/utils";
import { keyBy, isString, isNil } from "lodash-es";
import { CacheIsStaleError, useValidation } from "../../../utils";

// --- types
import { PhoneTypes } from "./types";
import type { Phone } from "./types";
import type { IPhone } from "@upmind-automation/types";
import type { PhoneContext } from "./types";
import type { PaginatedParams } from "../..";

// -----------------------------------------------------------------------------

const queryKey = ["client", "phones"];

async function loadAll() {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IPhone>({
    url: useUrl(`clients/${client.id}/phones`, {
      limit: 0,
    }),
    queryKey,
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }) => mapPhone(data ?? []));
}

async function loadPaged(paginationParams: PaginatedParams) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IPhone>({
    url: useUrl(`clients/${client.id}/phones`),
    queryKey: [...queryKey, { ...paginationParams }],
    withAccessToken: true,
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => mapPhone(data ?? []));
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedPhones = queryClient.getQueryData<IPhone>(queryKey);
  if (isNil(cachedPhones)) throw new CacheIsStaleError();
  return mapPhone(cachedPhones ?? []);
}

// -----------------------------------------------------------------------------

async function add(phone: Phone) {
  const { post, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  await post({
    url: useUrl(`clients/${clientId}/phones`),
    data: {
      type: phone.type,
      phone: phone.nationalNumber, // without the country code
      phone_code: `+${phone.countryCallingCode}`,
      phone_country_code: phone.country,
    },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "phones"]));
}

async function update(phone: Phone) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  await put({
    url: useUrl(`clients/${clientId}/phones/${phone.id}`),
    data: {
      type: phone.type,
      phone: phone.nationalNumber, // without the country code
      phone_code: `+${phone.countryCallingCode}`,
      phone_country_code: phone.country,
    },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "phones"]));
}

async function remove(phoneId: Phone["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  await del({
    url: useUrl(`clients/${clientId}/phones/${phoneId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "phones"]));
}

async function setDefault(phoneId: Phone["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  await put({
    url: useUrl(`clients/${clientId}/phones/${phoneId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "phones"]));
}

// -----------------------------------------------------------------------------

async function loadLookups(
  _context: PhoneContext
): Promise<{ types: Record<string, any>; country: any }> {
  // we dont have any lookups for emails, so just return null
  const { getCountry, fetchCountries } = useSystem();
  await fetchCountries();
  return Promise.resolve({
    types: keyBy(PhoneTypes, "key"),
    country: getCountry(),
  });
}

// TODO: async function parse({ model, country }: PhoneContext, ) {
async function parse({ model, country }: any) {
  // ---
  if (!model?.phone) return Promise.resolve({ model, country });

  const phonenumber = isString(model.phone)
    ? model?.phone
    : model?.phone?.number || model?.phone?.nationalNumber || "";

  const countryCode =
    model?.phone_country_code || model?.phone?.country || country?.code;
  const phone = parsePhoneNumber(phonenumber, countryCode) || model.phone;

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
  loadLookups,
  loadAllFromCache,
  //--- mutations
  add,
  update,
  remove,
  setDefault,
  //--- utils
  parse,
  validate,
  //--- session
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
