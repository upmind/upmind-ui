// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useApi, useSystem, useSession } from "../../";
import { usePlaces } from "../places";

// --- utils
import { useValidation } from "../../../utils";
import {
  some,
  first,
  isEmpty,
  find,
  get,
  includes,
  filter,
  defaultsDeep
} from "lodash-es";

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
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" }
];
// --------------------------------------------------------

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

async function loadLookups({ model }: AddressContext, _event: AddressEvent) {
  const { fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance

  const countries = await fetchCountries();
  const defaultCountry = getCountry();
  const regions = await fetchRegions(model?.country_id);

  const baseModel = {
    ...model,
    country_id: defaultCountry?.id,
    type: first(AddressTypes)?.key
  };

  // ---
  // set up our autocomplete places
  const places = usePlaces();
  // lets wait for them to be ready and loaded before we continue
  await waitFor(places.service, state => !state.matches("loading"));
  places.reset();

  // ---
  return new Promise((resolve, reject) => {
    if (countries && regions) {
      resolve({
        countries,
        regions,
        baseModel,
        types: AddressTypes,
        places: usePlaces
      });
    } else {
      reject("Failed to load countries and regions");
    }
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
async function parse({ model, regions }: AddressContext, _event: AddressEvent) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )

  const { fetchRegions } = useSystem();

  if (!isEmpty(model)) {
    // let scheck to see if weve been given a place to lookup
    // if we have, then get the place details and update the model
    if (model?.place) {
      const { getPlaceDetails } = usePlaces();
      const place = await getPlaceDetails(model.place);
      model = defaultsDeep(place, model);
    }

    // lets check if the country has changed, ie: the regions dont match
    // if so, then we need to fetch the regions for the new country
    if (!some(regions, ["country_id", model.country_id])) {
      regions = await fetchRegions(model.country_id);
    }

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the region_id is reset to null
    const region = find(regions, ["id", model?.region_id]);
    model.region_id = get(region, "id", undefined);
  }

  return Promise.resolve({ model, regions });
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
  filter: filterItems
};
