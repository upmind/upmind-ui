/** @internal */
import { BrandConfigKeys, type IAddress } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useFeedback } from "../feedback";
import { useQuery } from "../query";
import { invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import {
  mapAddress,
  mapAddresses,
  mapIAddressData
} from "./client-address.mappers";
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useCollection,
  useModelParser,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { get, isString, isEmpty, find, some, pick, isArray } from "lodash-es";
import type { QueryParams } from "../query";
import type {
  Address,
  AddressModel,
  AddressContext
} from "./client-address.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "addresses"];

function loadList(params: Partial<QueryParams> = { pagination: { limit: 0 } }) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { sessionId: clientId } = useActiveSession().useContext();
  const { list, useUrl } = useQuery();

  return list<IAddress[], Address[]>({
    ...(params as any),
    queryKey: [...queryKey, { client: clientId.value }],
    url: useUrl(`clients/${clientId.value}/addresses`, {
      with: ["region", "country"].join()
    }),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!clientId.value) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    withAccessToken: true,
    // --- options
    select: mapAddresses,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => !!(isAuthenticated.value && !!clientId.value)
  });
}

async function loadLookups({
  model,
  schema
}: AddressContext): Promise<AddressContext> {
  const { t } = useI18n();
  const { isReady, ensureCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  await isReady().catch(error =>
    Promise.reject(
      new DetailedError(
        t("error.system_not_available"),
        responseCodes.Unauthorized,
        ErrorOrigin.Headless,
        error
      )
    )
  );
  const countries = await ensureCountries();
  const country = getCountry(model?.address?.countryId);
  const regions = await fetchRegions(model?.address?.countryId || country?.id);

  const { ensureConfig } = useBrand();
  const config = await ensureConfig([
    BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS
  ]);

  if (!countries || !regions) {
    const message = !countries
      ? t("error.countries_not_available")
      : t("error.regions_not_available");

    return Promise.reject(
      new DetailedError(message, responseCodes.No_Content, ErrorOrigin.Headless)
    );
  }

  const baseModel: AddressModel = {
    address: {
      countryId: country?.id,
      address1: null,
      city: null,
      postcode: null
    }
  };

  const safeModel = useModelParser<AddressModel>(schema, model, baseModel);

  return Promise.resolve({
    regions,
    country,
    countries,
    config,
    // ---
    model: safeModel,
    baseModel: safeModel
  } as AddressContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: AddressModel) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { sessionId: clientId } = useActiveSession().useContext();
  const { post, useUrl } = useQuery();

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }
  return post<IAddress>({
    mutationKey: ["client", "addresses", "add"],
    url: useUrl(`clients/${clientId.value}/addresses`),
    data: mapIAddressData(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function update(id: Address["id"], data: AddressModel) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { sessionId: clientId } = useActiveSession().useContext();
  const { put, useUrl } = useQuery();

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IAddress>({
    mutationKey: ["client", "addresses", id],
    url: useUrl(`clients/${clientId.value}/addresses/${id}`),
    data: mapIAddressData(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function ensure(model: AddressModel): Promise<Address> {
  const { t } = useI18n();
  const { data, promise } = loadList();
  await promise.value.finally(); // wait for the query to resolve
  const { findOne } = useCollection<Address>(
    isArray(data.value) ? data.value : []
  );

  // We only need to check if we have an address with the matching id
  const mapping = pick(model, "id");
  const found = isEmpty(mapping) ? undefined : findOne(mapping);
  if (found) return Promise.resolve(found);

  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        t("error.client_address_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
      );
    // NB: Remember to refresh our machines so we have the new data
    // refresh();

    return mapAddress(raw);
  });
}

function remove(addressId: Address["id"]) {
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { sessionId: clientId } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${clientId.value}/addresses/${addressId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value || !clientId.value) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    onError(error: any) {
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_address_update_failed"),
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_removed"));
    },
    withAccessToken: true
  });
}

function setDefault(addressId: Address["id"]) {
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { sessionId: clientId } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<IAddress>("PUT", {
    url: useUrl(`clients/${clientId.value}/addresses/${addressId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value || !clientId.value) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    data: { default: true },
    onError(error: any) {
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_address_set_default_failed"),
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_set_default"));
    },
    withAccessToken: true
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

  // first let's check we have a valid country,
  // fallback to the default country if not set or invalid
  country = getCountry(safeModel.address?.countryId);
  safeModel.address.countryId = country.id;

  // let's check if the country has changed, i.e.: the regions don't match
  // if so, then we need to fetch the regions for the new country
  // AND update our 'default' country to match the country from the address
  // this will in turn update the phone schema to match the country
  // TODO: Regions should be mapped to camelcase, e.g country_id => countryId
  if (!some(regions, ["country_id", safeModel?.address?.countryId])) {
    regions = await fetchRegions(safeModel.address.countryId);
    country = getCountry(safeModel.address.countryId);
  }

  // now let's check our region list to see if we have a match
  // if so, then we need to update the safeModel with the new region id
  // otherwise the regionId is reset to null
  const region = find(regions, ["id", safeModel?.address?.regionId]);
  safeModel.address.regionId = get(region, "id");

  return Promise.resolve({ model: safeModel, regions, country });
}

async function validate({ schema, model }: Partial<AddressContext>) {
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_address_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
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
  setDefault
};

export const useClientAddressServices = () => {
  const { t } = useI18n();

  return {
    // --- methods

    /**
     * Adds a address.
     * @param {Partial<AddressContext>} param0 - The address context containing the model to add.
     * @returns {Promise<any>} The result of the add operation.
     */
    add: async ({ model }: Partial<AddressContext>): Promise<any> => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.client_address_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        );
      // return add(model);
      return add(model);
    },

    /**
     * Ensures a address exists.
     * @param {Partial<AddressContext>} param0 - The address context containing the model to ensure.
     * @returns {Promise<any>} The ensured address model, which will either be the existing address or a new one created.
     */
    ensure: async ({ model }: Partial<AddressContext>): Promise<any> => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.client_address_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
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
    update: async ({ id, model }: Partial<AddressContext>): Promise<any> => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.client_address_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
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
    validate
  };
};
