// --- internal
import {
  useQuery,
  useBrand,
  useSystem,
  useSession,
  useFeedback,
  type QueryParams,
} from "../..";

// --- utils
import {
  useTime,
  useValidation,
  useModelParser,
  CacheIsStaleError,
  NotAuthenticatedError,
  DetailedError,
  responseCodes,
  useCollection,
} from "../../../utils";
import { mapAddress, mapAddresses, mapIAddress } from "./mappers";
import { invalidateQueryByKey } from "../../query";
import { get, isString, isEmpty, omitBy, find, some } from "lodash-es";

// --- types
import { BrandConfigKeys, type IAddress } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { Address, AddressModel, AddressContext } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "addresses"];
const { addError, addSuccess } = useFeedback();

async function load() {
  const { meta, user } = useSession();
  const { get, useUrl } = useQuery();

  return get<IAddress[], Address[]>({
    queryKey,
    url: useUrl(`clients/${user.value?.id}/addresses`, {
      with: ["region", "country"].join(),
    }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated && !!user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    select: mapAddresses,
    staleTime: useTime().DAY,
  });
}

function loadList(params?: Partial<QueryParams>) {
  const { meta, user } = useSession();
  const { list, useUrl } = useQuery();

  return list<IAddress[], Address[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`clients/${user.value?.id}/addresses`, {
      with: ["region", "country"].join(),
    }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated && !!user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    select: mapAddresses,
    staleTime: useTime().DAY,
  });
}

async function loadLookups({
  model,
  schema,
}: AddressContext): Promise<AddressContext> {
  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  await isReady().catch(error => Promise.reject(error));
  const countries = await fetchCountries();
  const country = getCountry(model?.countryId);
  const regions = await fetchRegions(model?.countryId || country?.id);

  const { ensureConfig } = useBrand();
  const config = await ensureConfig([
    BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
  ]);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  const baseModel: AddressModel = {
    countryId: country?.id,
    address1: "",
    city: "",
    postcode: "",
  };

  const safeModel = useModelParser<AddressModel>(schema, model, baseModel);

  return Promise.resolve({
    regions,
    country,
    countries,
    config,
    // ---
    model: safeModel,
    baseModel: safeModel,
  } as AddressContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: AddressModel) {
  const { meta, user } = useSession();
  const { post, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }
  return post<IAddress>({
    url: useUrl(`clients/${user.value?.id}/addresses`),
    data: mapIAddress(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function update(id: Address["id"], data: AddressModel) {
  const { meta, user } = useSession();
  const { put, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IAddress>({
    url: useUrl(`clients/${user.value?.id}/addresses/${id}`),
    data: mapIAddress(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function ensure(model: AddressModel): Promise<Address> {
  const mapping = omitBy(model, isEmpty);
  const addresses = await load();
  const { findOne } = useCollection<Address>(addresses);
  const found = findOne(mapping);
  if (found) return Promise.resolve(found);

  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        "[headless] Failed to ensure address",
        responseCodes.Unprocessable_Entity,
        { model }
      );
    // NB: Remember to refresh our machines so we have the new data
    // refresh();
    return mapAddress(raw);
  });
}

function remove(addressId: Address["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${user.value?.id}/addresses/${addressId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated || !user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error removing this address",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully removed address");
    },
    withAccessToken: true,
  });
}

function setDefault(addressId: Address["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<IAddress>("PUT", {
    url: useUrl(`clients/${user.value?.id}/addresses/${addressId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated || !user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    data: { default: true },
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title ||
            "We experienced an error setting this address as default",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully set address as default");
    },
    withAccessToken: true,
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { regions, country, schema }: AddressContext,
  { data }: AnyEventObject
) {
  // We need to check and potentially update the region list based on the selected country (if it's changed)
  const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel = useModelParser<AddressModel>(
    schema,
    get(data, "model", data)
  );

  // ---

  // first let's check we have a valid country,
  // fallback to the default country if not set or invalid
  country = getCountry(safeModel?.countryId);
  safeModel.countryId = country.id;

  // let's check if the country has changed, i.e.: the regions don't match
  // if so, then we need to fetch the regions for the new country
  // AND update our 'default' country to match the country from the address
  // this will in turn update the phone schema to match the country
  if (!some(regions, ["countryId", safeModel?.countryId])) {
    regions = await fetchRegions(safeModel.countryId);
    country = getCountry(safeModel.countryId);
  }

  // now let's check our region list to see if we have a match
  // if so, then we need to update the safeModel with the new region id
  // otherwise the regionId is reset to null
  const region = find(regions, ["id", safeModel?.regionId]);
  safeModel.regionId = get(region, "id");

  return Promise.resolve({ model: safeModel, regions, country });
}

async function validate({ schema, model }: Partial<AddressContext>) {
  if (!schema) return Promise.resolve(model);

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

export default {
  /**
   * The query key used for caching and identifying address-related queries.
   * @type {QueryKey}
   */
  queryKey,

  //--- queries
  /**
   * Loads the address list.
   * @returns {Promise<Address[]>} A promise that resolves to the list of addresses
   */
  loadList,

  //--- mutations
  /**
   * Removes a address by its ID.
   * @param {Address["id"]} addressId - The ID of the address to remove.
   * @returns {Promise<null>} A promise that resolves when the address is removed
   */
  remove,

  /**
   * Sets a address as the default address.
   * @param {Address["id"]} addressId - The ID of the address to set as default.
   * @returns {Promise<IAddress>} A promise that resolves to the updated address
   */
  setDefault,
};

export const useClientAddressServices = () => {
  return {
    // --- methods

    /**
     * Adds a address.
     * @param {Partial<AddressContext>} param0 - The address context containing the model to add.
     * @returns {Promise<any>} The result of the add operation.
     */
    add: async ({ model }: Partial<AddressContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Add Address failed: model provided",
            responseCodes.Unprocessable_Entity,
            { model }
          )
        );
      // return add(model);
      return ensure(model);
    },

    /**
     * Ensures a address exists.
     * @param {Partial<AddressContext>} param0 - The address context containing the model to ensure.
     * @returns {Promise<any>} The ensured address model, which will either be the existing address or a new one created.
     */
    ensure: async ({ model }: Partial<AddressContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Ensure Address failed: model provided",
            responseCodes.Unprocessable_Entity,
            { model }
          )
        );
      return ensure(model);
    },

    /**
     * Loads lookups for the address form.
     * @param {AddressContext} context - The address context.
     * @returns {Promise<AddressContext>} The loaded lookups.
     */
    loadLookups,

    /**
     * Parses a address context.
     * @param {AddressContext} context - The address context.
     * @param {AnyEventObject} event - The event object.
     * @returns {Promise<any>} The parsed address context.
     */
    parse,

    /**
     * Refreshes the address list.
     * @param {Partial<QueryParams>} params - Optional query params.
     * @returns {Promise<any>} The refreshed address list.
     */
    refresh: loadList,

    /**
     * Updates a address.
     * @param {Partial<AddressContext>} param0 - The address context containing id and model.
     * @returns {Promise<any>} The result of the update operation.
     */
    update: async ({ id, model }: Partial<AddressContext>) => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Update Address failed: No id or model provided",
            responseCodes.Unprocessable_Entity,
            { id, model }
          )
        );
      return update(id, model);
    },

    /**
     * Validates a address model.
     * @param {Partial<AddressContext>} param0 - The address context containing schema and model.
     * @returns {Promise<any>} The validated model.
     */
    validate,
  };
};
