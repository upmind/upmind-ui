// --- external
import { Loader } from "@googlemaps/js-api-loader";

// --- internal
import { useApi } from "../api";
import { useSystem } from "..";
import { useSession } from "../session";

// --- utils
import { usePlaceParser } from "./utils";
import { useValidation } from "../../utils";
import { some, first, isEmpty, find, get } from "lodash-es";

// --- types
import type {
  AddressEvent,
  AddressContext,
  AddressesEvents,
  AddressesContext
} from "./types";

// --------------------------------------------------------
// ENUMS
export const AddressTypes = [
  { key: 1, value: "home" },
  { key: 2, value: "office" },
  { key: 3, value: "holiday" }
];
// --------------------------------------------------------

const autocompleteApi = {};

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

async function load(_context: AddressesContext, { data }: AddressesEvents) {
  const { get, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return get({
    url: useUrl(`clients/${clientId}/addresses`, {
      // with: ["country", "region"].join(),
      limit: 0
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true
  }).then(({ data }) => data);
}

async function add({ model }: AddressesContext, _event: AddressesEvents) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/addresses`),
    data: model,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function update({ model }: AddressesContext, _event: AddressesEvents) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/addresses/${model.id}`),
    data: model,
    withAccessToken: true
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
    withAccessToken: true
  }).then(({ data }) => data);
}

async function remove({ model }: AddressesContext, _event: AddressesEvents) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/addresses/${model.id}`),
    withAccessToken: true
  }).then(({ data }) => data);
}

// --------------------------------------------------------

async function configureAutocomplete(
  _context: AddressContext,
  _event: AddressEvent
) {
  const loader = new Loader({
    apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
    version: "weekly"
  });

  if (!isEmpty(autocompleteApi)) return Promise.resolve(true);

  const api = await loader.importLibrary("places").catch(error => {
    return Promise.reject(error);
  });

  autocompleteApi.places = new api.PlacesService(document.createElement("div"));
  autocompleteApi.service = new api.AutocompleteService();
  autocompleteApi.AutocompleteSessionToken = api.AutocompleteSessionToken;
  autocompleteApi.sessionToken = new autocompleteApi.AutocompleteSessionToken();
  autocompleteApi.statuses = api.PlacesServiceStatus;

  return Promise.resolve(true);
}

async function search(_context: AddressContext, { data }: AddressEvent) {
  return new Promise((resolve, reject) => {
    if (!autocompleteApi?.service)
      return reject("Autocomplete service not configured");

    // if we dont have any data, then just return an empty array
    if (!data?.search?.length) resolve([]);

    autocompleteApi.service.getAddressPredictions(
      {
        input: data?.search,
        sessionToken: autocompleteApi.sessionToken,
        fields: ["address_components"]
      },
      (result, status) => {
        if (status === autocompleteApi.statuses.OK) {
          resolve(result);
        } else if (status === autocompleteApi.statuses.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      }
    );
  });
}

async function loadAddressDetails(
  _context: AddressContext,
  { data }: AddressEvent
) {
  return new Promise((resolve, reject) => {
    if (!autocompleteApi?.service)
      reject("Autocomplete service not configured");

    // if we dont have any data, then just return an empty array
    if (!data?.address?.length) reject(null);

    autocompleteApi.places.getDetails(
      {
        placeId: data?.address,
        sessionToken: autocompleteApi.sessionToken,
        fields: ["address_components", "name"]
      },
      (result, status) => {
        autocompleteApi.sessionToken =
          new autocompleteApi.AutocompleteSessionToken();

        console.log("loadAddressDetails", "callback", { result, status });

        if (status === autocompleteApi.statuses.OK) {
          usePlaceParser(result).then(address => {
            resolve(address);
          });
        } else if (status === autocompleteApi.statuses.ZERO_RESULTS) {
          resolve({});
        } else {
          reject(status);
        }
      }
    );
  });
}

async function loadConstants(
  { model }: AddressContext,
  { data }: AddressEvent
) {
  const { fetchCountries, fetchRegions, getDefaultCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance

  const countries = await fetchCountries();
  const regions = await fetchRegions(model?.country_id);

  const baseModel = {
    ...model,
    country_id: getDefaultCountry(),
    type: first(AddressTypes)?.key
  };

  return new Promise((resolve, reject) => {
    if (countries && regions) {
      resolve({ countries, regions, baseModel });
    } else {
      reject("Failed to load countries and regions");
    }
  });
}

async function validate({ schema, model, regions }: AddressContext, _event) {
  // This NOT only validates the model,
  // but also potentially updates the regions list based on the selected country ( if its changed )

  // ---

  // NB:only do these checks if we have data
  if (!isEmpty(model)) {
    const { fetchRegions } = useSystem();

    // lets check if the country has changed or the regions dont match
    // if so, then we need to fetch the regions for the new country
    if (!some(regions, ["country_id", model.country_id])) {
      regions = await fetchRegions(model.country_id);
    }

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the region_id is reset to null
    const region = find(regions, ["id", model?.region_id]);
    model.region_id = get(region, "id", null);
  }
  // ---
  // Now validate the model as per normal
  const { validate } = useValidation();

  // because we are possibly mutating the regions list and the model/data
  // we need to return the updated values as part of the promise
  // regardless of whether the validation passes or fails
  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject({ error: errors, model, regions });
    } else {
      resolve({ model, regions });
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  configureAutocomplete,
  search,
  loadAddressDetails,
  load,
  loadConstants,
  validate,
  setDefault,
  add,
  update,
  remove
};
