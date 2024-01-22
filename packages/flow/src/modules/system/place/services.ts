// --- internal
import { useApi } from "../../api";
import { useSystem } from "../";

// --- utils
import { useValidation } from "../../../utils";

// --- types
import type { PlaceEvent, PlaceContext } from "./types";
import { some } from "lodash-es";

// --------------------------------------------------------
// HELPERS

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

async function search({ field }: PlaceContext, { data }: PlaceEvent) {
  // if we have a hash, we can skip the request
  if (data?.hash) {
    return Promise.resolve({ ...field, value: data.hash });
  }

  if (!field?.field_type && !data.hash)
    return Promise.reject("No field type or hash provided");

  const { get, useUrl, useTime } = useApi();

  // const path = `${fieldPath({ field_type: field.field_type })}/${data.hash}`;
  const path = `images/${data.hash}`;

  debugger;

  return get({
    url: useUrl(path),
    withAccessToken: true,
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function loadConstants(_context: PlaceContext, { data }: PlaceEvent) {
  const { service, fetchCountries, fetchRegions } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance

  const countries = await fetchCountries();

  const regions = await fetchRegions();

  return new Promise((resolve, reject) => {
    if (countries && regions) {
      resolve({ countries, regions });
    } else {
      reject("Failed to load countries and regions");
    }
  });
}

async function load(_context: PlaceContext, { data }: PlaceEvent) {
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
  const { getDefaultCountry } = useSystem();
  const model = {
    country_id: getDefaultCountry()
  };

  return new Promise((resolve, reject) => {
    resolve(model);
  });
}

async function validate(
  { schema, model, countries, regions }: PlaceContext,
  { data }: any
) {
  // This NOT only validates the model,
  // but also updates the regions list based on the selected country
  if (
    model?.country_id !== data?.country_id ||
    !some(regions, ["country_id", model.country_id])
  ) {
    //  this means we have a mismatch between the country and the regions
    const { fetchRegions } = useSystem();
    regions = await fetchRegions(data.country_id);
    model.region_id = null;
  }
  const { validate } = useValidation();

  // because we are mutating the regions list and the data
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

async function update({ request }: any, _event: any) {
  const { post, useUrl } = useApi();
  // todo
  const path = "";

  return post({
    url: useUrl(path),
    data: request,
    withAccessToken: true
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  search,
  load,
  loadConstants,
  validate,
  update
};
