// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import { useApi, useSystem, useSession } from "../..";

// --- utils
import { useValidation } from "../../../utils";
import {
  includes,
  isString,
  keyBy,
  filter,
  find,
  isEmpty,
  isEqual,
} from "lodash-es";

// --- types
import type { PhoneEvent, PhoneContext, IPhoneData } from "./types";
import type { ClientListingsEvents, ClientListingsContext } from "../types";

// --------------------------------------------------------
//  ENUMS
export const PhoneTypes: any[] = [
  { key: 1, value: "Mobile" },
  { key: 2, value: "Home" },
  { key: 3, value: "Office" },
  { key: 4, value: "Company" },
];

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  _context: ClientListingsContext,
  _event: ClientListingsEvents
) {
  const { get, useUrl } = useApi();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get({
    url: useUrl(`clients/${client.id}/phones`, {
      limit: 0,
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true,
  }).then(({ data }: any) => data);
}

async function filterItems(
  { raw }: ClientListingsContext,
  { data }: ClientListingsEvents
) {
  if (!data?.length)
    return Promise.reject({ error: "No data provided for filtering" });

  const filteredItems = filter(
    raw,
    item =>
      includes(item.state.context?.title?.toLowerCase(), data.toLowerCase()) ||
      includes(
        item.state.context?.description?.toLowerCase(),
        data.toLowerCase()
      ) ||
      includes(
        item.state.context?.country?.code.toUpperCase(),
        data.toUpperCase()
      )
  );

  return Promise.resolve(filteredItems);
}

async function findItem(
  { raw }: ClientListingsContext,
  { data }: { data: IPhoneData }
) {
  if (isEmpty(data))
    return Promise.reject({ error: "No data provided for filtering" });

  const found = find(
    raw,
    item =>
      isEqual(item.state.context.model.id, data) ||
      isEqual(item.state.context.model.phone, data)
  );

  return new Promise((resolve, reject) => {
    if (!found) reject();
    resolve(found);
  });
}

// --------------------------------------------------------

async function add({ model }: PhoneContext, _event: PhoneEvent) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/phones`),
    data: {
      phone: model.phone.nationalNumber, // without the country code
      phoneCode: `+${model.phone.countryCallingCode}`,
      phoneCountryCode: model.phone.country,
      type: model.type,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function update({ model }: PhoneContext, _event: PhoneEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/phones/${model.id}`),
    data: {
      phone: model.phone.nationalNumber, // without the country code
      phoneCode: `+${model.phone.countryCallingCode}`,
      phoneCountryCode: model.phone.country,
      type: model.type,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function remove({ model }: PhoneContext, _event: PhoneEvent) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/phones/${model.id}`),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function setDefault({ model }: PhoneContext, _event: PhoneEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/phones/${model.id}`),
    data: { default: true },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------

async function loadLookups(
  _context: PhoneContext,
  _event: PhoneEvent
): Promise<{ types: Record<string, any>; country: any }> {
  // we dont have any lookups for emails, so just return null
  const { getCountry, fetchCountries } = useSystem();
  await fetchCountries();
  return Promise.resolve({
    types: keyBy(PhoneTypes, "key"),
    country: getCountry(),
  });
}

// TODO: async function parse({ model, country }: PhoneContext, _event: PhoneEvent) {
async function parse({ model, country }: any, _event: PhoneEvent) {
  // ---

  if (!model?.phone) return Promise.resolve({ model, country });

  const phonenumber = isString(model.phone)
    ? model?.phone
    : model?.phone?.number || model?.phone?.nationalNumber || "";

  const countryCode =
    model?.phone?.country || model?.phoneCountryCode || country?.code;
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

async function validate({ schema, model }: PhoneContext, _event: PhoneEvent) {
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

// --------------------------------------------------------
// EXPORTS

export default {
  find: findItem,
  load,
  loadLookups,
  parse,
  validate,
  setDefault,
  add,
  update,
  remove,
  filter: filterItems,
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
