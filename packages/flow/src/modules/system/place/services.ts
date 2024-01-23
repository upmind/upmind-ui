// --- external
import { Loader } from "@googlemaps/js-api-loader";

// --- internal
import { useApi } from "../../api";
import { useSystem } from "../";
import { useSession } from "../../session";

// --- utils
import { useParsePlace } from "./utils";
import { useValidation } from "../../../utils";
import { some, first, defaultsDeep, isEmpty, find, get } from "lodash-es";

// --- types
import type { PlaceEvent, PlaceContext, IAddress } from "./types";

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
  autocompleteApi.AutocompleteSessionToken = api.AutocompleteSessionToken;
  autocompleteApi.sessionToken = new autocompleteApi.AutocompleteSessionToken();
  autocompleteApi.statuses = api.PlacesServiceStatus;

  return Promise.resolve(true);
}

async function search(_context: PlaceContext, { data }: PlaceEvent) {
  return new Promise((resolve, reject) => {
    if (!autocompleteApi?.service)
      return reject("Autocomplete service not configured");

    // if we dont have any data, then just return an empty array
    if (!data?.search?.length) resolve([]);

    autocompleteApi.service.getPlacePredictions(
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

async function loadPlaceDetails(_context: PlaceContext, { data }: PlaceEvent) {
  return new Promise((resolve, reject) => {
    if (!autocompleteApi?.service)
      reject("Autocomplete service not configured");

    // if we dont have any data, then just return an empty array
    if (!data?.place?.length) reject(null);

    autocompleteApi.places.getDetails(
      {
        placeId: data?.place,
        sessionToken: autocompleteApi.sessionToken,
        fields: ["address_components"]
      },
      (result, status) => {
        autocompleteApi.sessionToken =
          new autocompleteApi.AutocompleteSessionToken();

        if (status === autocompleteApi.statuses.OK) {
          useParsePlace(result).then(place => {
            resolve(place);
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

async function validate({ schema, model, regions }: PlaceContext, _event: any) {
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
  loadPlaceDetails,
  load,
  loadConstants,
  validate,
  save: async ({ model }) => (model?.id ? doUpdate(model) : doAdd(model))
};
