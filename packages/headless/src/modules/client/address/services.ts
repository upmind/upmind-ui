// --- internal
import { useQuery, useSystem, useSession, useQueryPaginated } from "../..";

// --- utils
import {
  defaultsDeep,
  find,
  first,
  get,
  isEmpty,
  isNil,
  set,
  some,
} from "lodash-es";
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapAddresses, mapIAddress } from "./mappers";

// --- types
import type {
  QueryResponse,
  PaginatedParams,
  IAddressWithRelations,
} from "../..";
import { AddressTypes } from "./types";
import type { QueryKey } from "@tanstack/query-core";
import type { IAddress } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { Address, AddressContext, AddressModel } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "addresses"];

async function loadAll({ allowStale = true } = {}) {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IAddressWithRelations[]>({
    url: useUrl(`clients/${client.id}/addresses`, {
      with: ["region", "country"].join(),
      limit: 0,
    }),
    queryKey,
    allowStale,
    withAccessToken: true,
    revalidateIfStale: true,
    transformResponse: (response: any) =>
      set(response, "data", mapAddresses(response?.data ?? [])),
  }).then(({ data }) => data);
}

async function loadPaged(
  paginationParams: PaginatedParams,
  { allowStale = true } = {}
) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IAddressWithRelations[]>({
    url: useUrl(`clients/${client.id}/addresses`, {
      with: ["region", "country"].join(),
    }),
    queryKey: [...queryKey, { ...paginationParams }],
    allowStale,
    withAccessToken: true,
    transformResponse: (response: any) =>
      set(response, "data", mapAddresses(response?.data ?? [])),
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => data ?? []);
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedAddresses =
    queryClient.getQueryData<QueryResponse<IAddressWithRelations[]>>(queryKey);
  if (isNil(cachedAddresses)) throw new CacheIsStaleError();
  return cachedAddresses.data;
}

/**
 * Load the lookups for the address form
 * @param {AddressContext} context
 * @returns {Promise<AddressContext>}
 */
async function loadLookups({ model }: AddressContext): Promise<AddressContext> {
  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  await isReady().catch(error => Promise.reject(error));
  const countries = await fetchCountries();
  const country = getCountry(model?.countryId);
  const regions = await fetchRegions(model?.countryId || country?.id);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  return Promise.resolve({
    types: AddressTypes,
    regions,
    country,
    countries,
    // ---
    model: model ?? {},
    baseModel: defaultsDeep(model ?? {}, {
      type: first(AddressTypes)?.key,
      countryId: country?.id,
    }),
  } as AddressContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: AddressModel) {
  const { getUserId } = useSession();
  const { post, useUrl } = useQuery();

  const clientId = await getUserId();

  return post<IAddress>({
    url: useUrl(`clients/${clientId}/addresses`),
    data: mapIAddress(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function update(id: Address["id"], data: AddressModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IAddress>({
    url: useUrl(`clients/${clientId}/addresses/${id}`),
    data: mapIAddress(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function remove(addressId: Address["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  return del<null>({
    url: useUrl(`clients/${clientId}/addresses/${addressId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function setDefault(addressId: Address["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IAddress>({
    url: useUrl(`clients/${clientId}/addresses/${addressId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { regions, country, baseModel, schema }: AddressContext,
  { data }: AnyEventObject & { data: AddressModel }
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel: AddressModel = useModelParser(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---

  // first lets check we have a valid country,
  // fallback to the default country if not set or invalid
  country = getCountry(safeModel?.countryId ?? baseModel?.countryId);
  safeModel.countryId = country.id;

  // let's check if the country has changed, ie: the regions don't match
  // if so, then we need to fetch the regions for the new country
  // AND update our 'default' country to match the country from the address
  // this will in turn update the phone schema to match the country
  if (!some(regions, ["countryId", safeModel?.countryId])) {
    regions = await fetchRegions(safeModel.countryId);
    country = getCountry(safeModel.countryId);
  }

  // now lets check our regions list to see if we have a match
  // if so, then we need to update the safeModel with the new region id
  // otherwise the regionId is reset to null
  const region = find(regions, ["id", safeModel?.regionId]);
  safeModel.regionId = get(region, "id");

  return Promise.resolve({ model: safeModel, regions, country });
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
  refresh: async () => loadAll({ allowStale: false }),

  loadAllFromCache,
  //--- mutations

  remove,
  setDefault,
};

export const useClientAddressServices = () => {
  return {
    loadLookups,
    add: async (context: AddressContext) => {
      if (isEmpty(context.model))
        return Promise.reject("No address model provided");
      return add(context.model);
    },
    update: async (context: AddressContext) => {
      if (!context.id) return Promise.reject("No address id provided");
      if (isEmpty(context.model))
        return Promise.reject("No address model provided");

      return update(context.id, context.model);
    },
    parse,
    validate,
    refresh: async () => loadAll({ allowStale: false }),
  };
};
