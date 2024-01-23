// --- external
import { Loader } from "@googlemaps/js-api-loader";

// --- internal
import { useApi } from "../../api";
import { useSystem } from "../";
import { useSession } from "../../session";

// --- utils
import { useValidation } from "../../../utils";

// --- types
import type { PlaceEvent, PlaceContext, IAddress } from "./types";
import { some, first, defaultsDeep, isEmpty } from "lodash-es";

// --------------------------------------------------------
// ENUMS
export const AddressTypes = [
  { key: 1, value: "home" },
  { key: 2, value: "office" },
  { key: 3, value: "holiday" }
];
// --------------------------------------------------------
// HELPERS
const autocompleteApi = {};

async function doAdd(model: IAddress) {
  const { getUser } = useSession();
  const client = getUser();
  const { post, useUrl } = useApi();
  return post({
    url: useUrl(`clients/${client.id}/addresses`),
    data: model,
    withAccessToken: true
  }).then(({ data }: any) => data);
}

async function doUpdate(model: IAddress) {
  const { put, useUrl } = useApi();
  // todo

  return put({
    url: useUrl(`clients/addresses/${model.id}`),
    data: model,
    withAccessToken: true
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// async function getEnums({ field }: PlaceContext, _event: PlaceEvent) {
//   const { getConfig } = useBrand();

//   const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
//     BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
//   ).then(response =>
//     get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
//   );
// }

async function configureAutocomplete(
  _context: PlaceContext,
  _event: PlaceEvent
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
  autocompleteApi.sessionToken = new api.AutocompleteSessionToken();

  return Promise.resolve(true);
}

async function search(_context: PlaceContext, { data }: PlaceEvent) {
  debugger;

  return new Promise((resolve, reject) => {
    if (!autocompleteApi?.service)
      return reject("Autocomplete service not configured");

    // if we dont have any data, then just return an empty array
    if (!data?.length) resolve([]);

    autocompleteApi.service.getPlacePredictions(
      {
        input: data,
        sessionToken: autocompleteApi.sessionToken,
        fields: ["address_components"]
      },
      response => resolve(response)
    );
  });
}

async function loadConstants(_context: PlaceContext, { data }: PlaceEvent) {
  const { fetchCountries, fetchRegions, getDefaultCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance

  const countries = await fetchCountries();

  const regions = await fetchRegions();

  const baseModel = {
    country_id: getDefaultCountry(),
    type: first(AddressTypes)?.key,
    name: "default"
  };

  return new Promise((resolve, reject) => {
    if (countries && regions) {
      resolve({ countries, regions, baseModel });
    } else {
      reject("Failed to load countries and regions");
    }
  });
}

async function load({ baseModel }: PlaceContext, { data }: PlaceEvent) {
  // const { get, useUrl, useTime } = useApi();

  // if (data.id) {
  // return get({
  //     url: useUrl(path),
  //     withAccessToken: true,
  //     useCache: true,
  //     maxAge: useTime()?.DAY
  //   }).then(({ data }: any) => data);
  // }

  // for now lets create an empty model with our default country/presets
  const model = defaultsDeep({}, data, baseModel);

  return new Promise((resolve, reject) => {
    resolve(model);
  });
}

async function validate(
  { schema, model, regions }: PlaceContext,
  { data }: any
) {
  // This NOT only validates the model,
  // but also updates the regions list based on the selected country

  // ---

  // lets check if the country has changed
  if (
    !isEmpty(data) &&
    (model.country_id != data.country_id ||
      !some(regions, ["country_id", data.country_id]))
  ) {
    //  this means we have a mismatch between the country and the regions
    const { fetchRegions } = useSystem();
    regions = await fetchRegions(data.country_id);
    data.region_id = null;
  }
  const { validate } = useValidation();

  // if weve not been given changed data, then just validate the model
  // by setting the data to the model, we can ensure that the regions list is updated & valid
  data ??= model;

  // because we are possibly mutating the regions list and the model/data
  // we need to return the updated values as part of the promise
  // regardless of whether the validation passes or fails
  return new Promise((resolve, reject) => {
    const errors = validate(schema, data);
    if (errors?.length) {
      reject({ error: errors, model: data, regions });
    } else {
      resolve({ model: data, regions });
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  configureAutocomplete,
  search,
  load,
  loadConstants,
  validate,
  save: async ({ model }) => (model?.id ? doUpdate(model) : doAdd(model))
};
