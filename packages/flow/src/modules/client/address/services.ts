// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import { useApi, useSystem, useSession } from "../../";
import { usePlaces } from "../places";
import { useClientAddresses } from "../address";
import { useClientPhones } from "../phone";
import { useClientEmails } from "../email";

// --- utils
import { useValidation } from "../../../utils";
import { parseAddress } from "./utils";
import {
  some,
  first,
  isEmpty,
  find,
  get,
  includes,
  filter,
  defaultsDeep,
  isString,
} from "lodash-es";

// --- types
import type {
  AddressEvent,
  AddressContext,
  AddressesEvents,
  AddressesContext,
} from "./types.d";

// --------------------------------------------------------
// ENUMS
export const AddressTypes = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" },
];
// --------------------------------------------------------

const { authSubscription, isAuthenticated } = useSession();

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// async function getEnums({ field }: AddressContext, _event: AddressEvent) {
//   const { getConfig } = useBrand();

//   const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
//     BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
//   ).then(response =>
//     get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
//   );
// }

async function load(_context: AddressesContext, _event: AddressesEvents) {
  const { get, useUrl } = useApi();
  const { isAuthenticated, getUserId } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const clientId = await getUserId();

  const addresses = get({
    url: useUrl(`clients/${clientId}/addresses`, { limit: 0 }),
    withAccessToken: true,
    useCache: true,
    refresh: true,
  }).then(({ data }) => parseAddress(data));

  const companies = get({
    url: useUrl(`clients/${clientId}/companies`, { limit: 0 }),
    withAccessToken: true,
    useCache: true,
    refresh: true,
  }).then(({ data }) => parseAddress(data));

  return Promise.all([addresses, companies]).then(([addresses, companies]) => {
    return [...addresses, ...companies];
  });
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
      includes(item.state.context?.title?.toLowerCase(), data?.toLowerCase()) ||
      includes(
        item.state.context?.description?.toLowerCase(),
        data?.toLowerCase()
      )
  );

  return Promise.resolve(filteredItems);
}

// --------------------------------------------------------

async function add({ model }: AddressesContext, _event: AddressesEvents) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/addresses`),
    data: model,
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function update({ model }: AddressesContext, _event: AddressesEvents) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/addresses/${model.id}`),
    data: model,
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function remove({ model }: AddressesContext, _event: AddressesEvents) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/addresses/${model.id}`),
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function setDefault(
  { model }: AddressesContext,
  _event: AddressesEvents
) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/addresses/${model.id}`),
    data: { default: true },
    withAccessToken: true,
  }).then(({ data }) => data);
}
// --------------------------------------------------------

async function loadLookups({ model }: AddressContext, _event: AddressEvent) {
  const { fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance
  const countries = await fetchCountries();
  const country = getCountry(model?.country_id);
  const regions = await fetchRegions(model?.country_id || country?.id);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  // ---
  // lets start up/use our dependencies
  const addresses = useClientAddresses();
  const phones = useClientPhones();
  const emails = useClientEmails();
  const places = usePlaces();

  return Promise.all([
    addresses.isReady(),
    phones.isReady(),
    emails.isReady(),
    places.isReady(),
  ]).then(() => {
    places.reset();

    const address = addresses.getDefault()?.state?.context?.model;
    const email = emails.getDefault()?.state?.context?.model;
    const phone = phones.getDefault()?.state?.context?.model;

    return {
      countries,
      regions,
      types: AddressTypes,
      places,
      country,
      // ---
      emails,
      addresses,
      phones,
      // ---
      baseModel: {
        ...model,
        manualPlace: !!model?.id,
        companyDetails: false,
        type: first(AddressTypes)?.key,
        phone: phone?.phone,
        email: email?.id,
        place: address?.id,
        // address_1: address?.address_1,
        // address_2: address?.address_2,
        // city: address?.city,
        // postcode: address?.postcode,
        // region_id: address?.region_id,
        // state: address?.state,
        country_id: address?.country_id || country?.id,
      },
    };
  });
}

async function parse(
  { addresses, schema, model, regions, country, places }: AddressContext,
  _event: AddressEvent
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  if (!isEmpty(model)) {
    // let scheck to see if weve been given a place to lookup
    // if we have:
    //  1: get the place from our existing addressess by placeId
    //  2: get the place details from google
    //  4: update the model with the place details
    if (model?.place) {
      const existing = addresses.getItem(model.place);
      if (existing) {
        model.name ??= existing.name; // only update it if weve not already got a value
        model.address_1 = existing.address_1;
        model.address_2 = existing.address_2;
        model.city = existing.city;
        model.postcode = existing.postcode;
        model.region_id = existing.region_id;
        model.state = existing.state;
        model.country_id = existing.country_id;
      } else {
        const { getPlaceDetails } = places;
        const place = await getPlaceDetails(model.place);
        model = defaultsDeep(place, model);
      }
    }

    // lets check if the country has changed, ie: the regions dont match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country fro mthe address
    // this will in turn update the phone schema to match the country
    if (!some(regions, ["country_id", model.country_id])) {
      regions = await fetchRegions(model.country_id);

      country = getCountry(model.country_id);
    }

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the region_id is reset to null
    const region = find(regions, ["id", model?.region_id]);
    model.region_id = get(region, "id", undefined);

    // now lets check our phone number
    if (model?.phone) {
      const phonenumber = isString(model.phone)
        ? model?.phone
        : model?.phone?.number || model?.phone?.nationalNumber || "";

      const countryCode =
        model?.phone?.country || model?.phone_country_code || country?.code;
      const phone = parsePhoneNumber(phonenumber, countryCode) || model.phone;

      // now map the phone number to the model in the correct format with fallbacks
      model.phone = {
        number: phone?.number || model.phone?.number,
        nationalNumber: phone?.nationalNumber || model.phone?.nationalNumber,
        countryCallingCode:
          phone?.countryCallingCode || model.phone?.countryCallingCode,
        country: countryCode,
      };
    }

    // finally lets force a manual place if we are invalid:
    const isValid = await validate({ schema, model }, _event)
      .then(() => true)
      .catch(() => false);

    // force the manual place if we are have a place && are invalid
    // OR editing an existing address
    // OR the place value is our reserved word 'manual'
    if (
      (!model.place?.length && !isValid) ||
      !!model?.id ||
      model.place == "manual"
    ) {
      model.manualPlace = true;
    }

    // force the type as company if we have added company details
    if (model.companyDetails) model.type = 4; // company
  }

  return Promise.resolve({ model, regions, country });
}

async function validate(
  { schema, model }: AddressContext,
  _event: AddressEvent
) {
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
  load,
  loadLookups,
  validate,
  parse,
  setDefault,
  add,
  update,
  remove,
  filter: filterItems,
  authSubscription,
  isAuthenticated,
};
