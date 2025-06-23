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
  ErrorOrigin,
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapAddresses, mapIAddress } from "./mappers";
import { find, first, get, isEmpty, isNil, isString, some } from "lodash-es";

// --- types
import { AddressTypes } from "./types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import { BrandConfigKeys, type IAddress } from "@upmind-automation/types";
import type { Address, AddressContext, AddressModel } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "addresses"];
const { addError, addSuccess } = useFeedback();

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

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.getQueryData<Address[]>(queryKey);
  if (isNil(cached)) throw new CacheIsStaleError();
  return cached;
}

/**
 * Load the lookups for the address form
 * @param {AddressContext} context
 * @returns {Promise<AddressContext>}
 */
async function loadLookups({
  model,
  schema,
}: AddressContext): Promise<AddressContext> {
  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  await isReady().catch(error =>
    Promise.reject(
      new DetailedError(
        "[headless] System not ready",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { error }
      )
    )
  );
  const countries = await fetchCountries();
  const country = getCountry(model?.countryId);
  const regions = await fetchRegions(model?.countryId || country?.id);

  const { ensureConfig } = useBrand();
  const config = await ensureConfig([
    BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
  ]);

  if (!countries || !regions) {
    return Promise.reject(
      new DetailedError(
        "[headless] Failed to load address lookups",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { countries, regions }
      )
    );
  }

  const baseModel: AddressModel = {
    // type: first(AddressTypes)?.key || 1, // deprecated
    countryId: country?.id,
    address1: "",
    city: "",
    postcode: "",
  };

  const safeModel = useModelParser<AddressModel>(schema, model, baseModel, {
    allowExtraProps: false,
  });

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
  { regions, country, baseModel, schema }: AddressContext,
  { data }: AnyEventObject
) {
  // We need to check and potentially update the region list based on the selected country (if it's changed)
  const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel = useModelParser<AddressModel>(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---

  // first let's check we have a valid country,
  // fallback to the default country if not set or invalid
  country = getCountry(safeModel?.countryId ?? baseModel?.countryId);
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
      reject(
        new DetailedError(
          "[headless] Invalid Address Model",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { model, schema, errors }
        )
      );
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  queryKey,
  //--- queries
  loadList,
  loadCached,

  //--- mutations
  remove,
  setDefault,
};

export const useClientAddressServices = () => {
  return {
    loadLookups,
    add: async ({ model }: Partial<AddressContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Add Address failed: model provided",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { model }
          )
        );
      return add(model);
    },
    update: async ({ id, model }: Partial<AddressContext>) => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Update Address failed: No id or model provided",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { id, model }
          )
        );

      return update(id, model);
    },
    parse,
    validate,
    refresh: loadList,
  };
};
