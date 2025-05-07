// --- external

// --- internal
import { useQuery, useSystem, useSession, useBrand } from "../..";
import { usePlaces } from "../places";
import { useClientAddresses } from ".";

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
  pick,
  isEqual,
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import { AddressTypes } from "./types";
import type { AddressContext, AddressesContext, IAddressData } from "./types";
import { isString } from "xstate/lib/utils";
import { BrandConfigKeys } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// async function getEnums({ field }: AddressContext,) {
//   const { getConfig } = useBrand();

//   const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
//     BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
//   ).then(response =>
//     get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
//   );
// }

export async function invalidateAddresses(context: object) {
  const { queryClient } = useQuery();

  return queryClient
    .resetQueries({ queryKey: ["clients", "addresses"], exact: false }) // companies needs to invalidate ALL client libs
    .then(() => context);
}

async function load(_context: AddressesContext) {
  const { get, useUrl } = useQuery();

  // prepare our brand settings
  const { ensureConfig } = useBrand();
  ensureConfig([BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS]);

  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get({
    url: useUrl(`clients/${client.id}/addresses`, {
      limit: 0,
      with: ["region", "country"].join(),
    }),
    queryKey: [
      "clients",
      "addresses",
      {
        limit: 0,
        with: ["region", "country"].join(),
      },
    ],
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }: any) => parseAddress(data));
}

async function filterItems(
  { raw }: AddressesContext,
  { data }: AnyEventObject
) {
  if (!data?.length)
    return Promise.reject({ error: "No data provided for filtering" });

  const filteredItems = filter(
    raw,
    item =>
      includes(
        item.getSnapshot().context?.title?.toLowerCase(),
        data?.toLowerCase()
      ) ||
      includes(
        item.getSnapshot().context?.description?.toLowerCase(),
        data?.toLowerCase()
      )
  );

  return Promise.resolve(filteredItems);
}

async function findItem({ raw }: AddressesContext, { data }: AnyEventObject) {
  if (isEmpty(data))
    return Promise.reject({ error: "No data provided for filtering" });

  const value = pick(data, [
    "address1",
    "address2",
    "city",
    "postcode",
    "regionId",
    "countryId",
  ]);
  // same here
  const found = find(raw, item => {
    const id = item.getSnapshot().context.model.id;
    const model = pick(item.getSnapshot().context.model, [
      "address1",
      "address2",
      "city",
      "postcode",
      "regionId",
      "countryId",
    ]);

    const matchId = isEqual(id, isString(data) ? data : data.id);
    const matchModel = isEqual(model, value);
    return matchId || matchModel;
  });

  return new Promise((resolve, reject) => {
    if (!found) reject();
    resolve(found);
  });
}

// -----------------------------------------------------------------------------

async function add({ model }: AddressContext) {
  const { post, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/addresses`),
    data: model,
    withAccessToken: true,
  })
    .then(invalidateAddresses)
    .then(({ data }: any) => data);
}

async function update({ model }: AddressContext) {
  const { put, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/addresses/${model?.id}`),
    data: model,
    withAccessToken: true,
  })
    .then(invalidateAddresses)
    .then(({ data }: any) => data);
}

async function remove({ model }: AddressContext) {
  const { del, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/addresses/${model?.id}`),
    withAccessToken: true,
  })
    .then(invalidateAddresses)
    .then(({ data }: any) => data);
}

async function setDefault({ model }: AddressContext) {
  const { put, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/addresses/${model?.id}`),
    data: { default: true },
    withAccessToken: true,
  })
    .then(invalidateAddresses)
    .then(({ data }: any) => data);
}
// -----------------------------------------------------------------------------

async function loadLookups({ model }: AddressContext) {
  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance
  await isReady().catch(error => Promise.reject(error));
  const countries = await fetchCountries();
  const country = getCountry(model?.countryId);
  const regions = await fetchRegions(model?.countryId || country?.id);

  if (!countries || !regions) {
    return Promise.reject(new Error("Failed to load countries and regions"));
  }

  // ---
  // lets start up/use our dependencies
  const addresses: any = useClientAddresses();
  const places = usePlaces();

  return Promise.all([addresses.isReady(), places.isReady()])
    .then(() => {
      places.reset();

      return {
        countries,
        regions,
        types: AddressTypes,
        places,
        country,
        // ---
        addresses,
        // ---
        baseModel: {
          ...model,
          manualPlace: !!model?.id,
          type: first(AddressTypes)?.key,
          place: null,
          countryId: country?.id,
        },
      };
    })
    .catch(() => Promise.reject(new Error("Failed to load lookups")));
}

async function parse(
  // { addresses, schema, model, regions, country, places }: AddressContext,
  { addresses, schema, model, regions, country, places }: any
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  if (!isEmpty(model)) {
    // let's check to see if we've been given a place to lookup
    // if we have:
    //  1: get the place from our existing addresses by placeId
    //  2: get the place details from google
    //  4: update the model with the place details
    if (model?.place) {
      const existing = addresses.getItem(model.place);
      if (existing) {
        model.name ??= existing.name; // only update it if weve not already got a value
        model.address1 = existing.address1;
        model.address2 = existing.address2;
        model.city = existing.city;
        model.postcode = existing.postcode;
        model.regionId = existing.regionId;
        model.state = existing.state;
        model.countryId = existing.countryId;
      } else {
        const { getPlaceDetails } = places;
        const place = await getPlaceDetails(model.place);
        model = defaultsDeep(place, model);
      }
      model.place = undefined; // we dont need this anymore
    }

    // lets check if the country has changed, ie: the regions dont match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country fro mthe address
    // this will in turn update the phone schema to match the country
    if (!some(regions, ["countryId", model.countryId])) {
      regions = await fetchRegions(model.countryId);

      country = getCountry(model.countryId);
    }

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the regionId is reset to null
    const region = find(regions, ["id", model?.regionId]);
    model.regionId = get(region, "id");

    // finally lets force a manual place if we are invalid:
    const isValid = await validate({ schema, model })
      .then(() => true)
      .catch(() => false);

    // force the manual place if we are have a place && are invalid
    // OR editing an existing address
    // OR the place value is our reserved word 'manual'
    if (
      (!!model.place?.length && !isValid) ||
      !!model?.id ||
      model.place == "manual"
    ) {
      model.manualPlace = true;
    }
  }

  return Promise.resolve({ model, regions, country });
}

async function validate({ schema, model }: Partial<AddressContext>) {
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
  find: findItem,
  load,
  loadLookups,
  validate,
  parse,
  setDefault,
  add,
  update,
  remove,
  filter: filterItems,
  isAuthenticated: () =>
    useSession().isAuthenticated().then(invalidateAddresses),
};
