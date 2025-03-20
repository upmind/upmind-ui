// --- external

// --- internal
import {
  useQuery,
  useSystem,
  useSession,
  PaginatedParams,
  useQueryPaginated,
} from "../..";
import { usePlaces } from "../places";
import { useClientAddresses } from "./useClientAddresses";

// --- utils
import {
  get,
  some,
  find,
  first,
  isNil,
  isEmpty,
  defaultsDeep,
} from "lodash-es";
import { mapAddress } from "./mappers";
import { CacheIsStaleError, useValidation } from "../../../utils";
import { invalidateQueryByKey } from "../../query/utils";

// --- types
import { AddressTypes } from "./types";
import type { IAddress } from "@upmind-automation/types";
import type { Address, AddressContext } from "./types";

// -----------------------------------------------------------------------------
// Queries

const queryKey = ["client", "addresses"];

async function loadAll() {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IAddress[]>({
    url: useUrl(`clients/${client.id}/addresses`, {
      with: ["region", "country"].join(),
      limit: 0,
    }),
    queryKey,
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }) => mapAddress(data ?? []));
}

async function loadPaged(paginationParams: PaginatedParams) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IAddress[]>({
    url: useUrl(`clients/${client.id}/addresses`, {
      with: ["region", "country"].join(),
    }),
    queryKey: [...queryKey, { ...paginationParams }],
    withAccessToken: true,
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => mapAddress(data ?? []));
}

async function loadLookups({ model }: AddressContext) {
  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance
  await isReady().catch(error => Promise.reject(error));
  const countries = await fetchCountries();
  const country = getCountry(model?.countryId);
  const regions = await fetchRegions(model?.countryId || country?.id);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  // ---
  // lets start up/use our dependencies
  const places = usePlaces();
  const addresses = useClientAddresses();

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
    .catch(() => Promise.reject("Failed to load lookups"));
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedAddresses = queryClient.getQueryData<IAddress>(queryKey);
  if (isNil(cachedAddresses)) throw new CacheIsStaleError();
  return mapAddress(cachedAddresses ?? []);
}

// -----------------------------------------------------------------------------
// Mutations

async function add(address: Address) {
  const { getUserId } = useSession();
  const { post, useUrl } = useQuery();

  const clientId = await getUserId();

  post<IAddress>({
    url: useUrl(`clients/${clientId}/addresses`),
    data: address,
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "addresses"]));
}

async function update(address: Address) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  put<IAddress>({
    url: useUrl(`clients/${clientId}/addresses/${address?.id}`),
    data: address,
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "addresses"]));
}

async function remove(addressId: Address["id"]) {
  const { del, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  del<IAddress>({
    url: useUrl(`clients/${clientId}/addresses/${addressId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "addresses"]));
}

async function setDefault(addressId: Address["id"]) {
  const { put, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  put<IAddress>({
    url: useUrl(`clients/${clientId}/addresses/${addressId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "addresses"]));
}

// -----------------------------------------------------------------------------

async function parse(
  // { addresses, schema, model, regions, country, places }: AddressContext,
  { addresses, schema, model, regions, country, places }: AddressContext
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
      const existing = await addresses.getOne(model?.place);
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
    }

    // lets check if the country has changed, ie: the regions dont match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country fro mthe address
    // this will in turn update the phone schema to match the country
    if (!some(regions, ["countryId", model!.countryId])) {
      regions = await fetchRegions(model!.countryId);

      country = getCountry(model!.countryId);
    }

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the regionId is reset to null
    const region = find(regions, ["id", model!.regionId]);
    model!.regionId = get(region, "id");

    // finally lets force a manual place if we are invalid:
    const isValid = await validate({ schema, model })
      .then(() => true)
      .catch(() => false);

    // force the manual place if we are have a place && are invalid
    // OR editing an existing address
    // OR the place value is our reserved word 'manual'
    if (
      (!!model!.place?.length && !isValid) ||
      !!model?.id ||
      model!.place == "manual"
    ) {
      model!.manualPlace = true;
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
