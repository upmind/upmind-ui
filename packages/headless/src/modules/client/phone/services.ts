import parsePhoneNumber, { CountryCode } from "libphonenumber-js";

// --- internal
import {
  useQuery,
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
import { mapIPhone, mapPhone, mapPhones } from "./mapper";
import { invalidateQueryByKey } from "../../query";
import { get, isString, isEmpty, omitBy } from "lodash-es";

// --- types
import type { IPhone } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { Phone, PhoneModel, PhoneContext } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "phones"];
const { addError, addSuccess } = useFeedback();

async function load() {
  const { meta, user } = useSession();
  const { get, useUrl } = useQuery();

  return get<IPhone[], Phone[]>({
    queryKey,
    url: useUrl(`clients/${user.value?.id}/phones`),
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
    select: mapPhones,
    staleTime: useTime().DAY,
  });
}

function loadList(params?: Partial<QueryParams>) {
  const { meta, user } = useSession();
  const { list, useUrl } = useQuery();

  return list<IPhone[], Phone[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`clients/${user.value?.id}/phones`),
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
    select: mapPhones,
    staleTime: useTime().DAY,
  });
}

async function loadLookups({
  model,
  schema,
}: PhoneContext): Promise<PhoneContext> {
  const { isReady, fetchCountries, getCountry } = useSystem();
  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  await isReady().catch(error => Promise.reject(error));
  const countries = await fetchCountries();
  const country = getCountry(model?.phone?.country);
  if (!countries) {
    return Promise.reject("Failed to load countries");
  }
  const baseModel: PhoneModel = {
    phone: {
      number: "",
      nationalNumber: "",
      countryCallingCode: "",
      country: country.code,
    },
  };

  const safeModel = useModelParser<PhoneModel>(schema, model, baseModel, {
    allowExtraProps: false,
  });

  return Promise.resolve({
    country,
    model: safeModel,
    baseModel: safeModel,
  } as PhoneContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: PhoneModel) {
  const { meta, user } = useSession();
  const { post, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }
  return post<IPhone>({
    url: useUrl(`clients/${user.value?.id}/phones`),
    data: mapIPhone(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function update(id: Phone["id"], data: PhoneModel) {
  const { meta, user } = useSession();
  const { put, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IPhone>({
    url: useUrl(`clients/${user.value?.id}/phones/${id}`),
    data: mapIPhone(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function ensure(model: PhoneModel): Promise<PhoneModel> {
  const mapping = omitBy(model, isEmpty);
  const phones = await load();
  const { findOne } = useCollection<Phone>(phones);
  const found = findOne(mapping);
  if (found) return Promise.resolve(found);

  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        "[headless] Failed to ensure (add) phone",
        responseCodes.Unprocessable_Entity
      );
    // NB: Remember to refresh our machines so we have the new data
    // refresh();
    return mapPhone(raw);
  });
}

function remove(phoneId: Phone["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${user.value?.id}/phones/${phoneId}`),
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
          : error?.title || "We experienced an error removing this phone",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully removed phone");
    },
    withAccessToken: true,
  });
}

function setDefault(phoneId: Phone["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<IPhone>("PUT", {
    url: useUrl(`clients/${user.value?.id}/phones/${phoneId}`),
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
            "We experienced an error setting this phone as default",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully set phone as default");
    },
    withAccessToken: true,
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema, country }: PhoneContext,
  { data }: AnyEventObject
) {
  const safeModel = useModelParser<PhoneModel, Phone>(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---
  if (!safeModel) return Promise.resolve({ model: safeModel, country });

  const phoneNumber =
    (safeModel?.phone?.number || safeModel?.phone?.nationalNumber) ?? "";

  const countryCode: CountryCode = (safeModel?.phone?.country ||
    data?.country?.code ||
    country?.code ||
    "") as CountryCode;

  const phone = parsePhoneNumber(phoneNumber, countryCode);

  // now map the phone number to the model in the correct format with fallbacks

  safeModel.phone.number = phone?.number || safeModel?.phone?.number;

  safeModel.phone.nationalNumber =
    phone?.nationalNumber || safeModel?.phone?.nationalNumber;

  safeModel.phone.countryCallingCode =
    phone?.countryCallingCode || safeModel?.phone?.countryCallingCode;

  safeModel.phone.country =
    phone?.country || safeModel?.phone?.country || country?.code || "";

  if (
    !!safeModel?.phone?.country &&
    safeModel.phone.country !== country?.code
  ) {
    const { getCountry } = useSystem();
    // we have change countries in the form, so we need to get our new country
    country = getCountry(safeModel.phone.country);
  }

  return Promise.resolve({ model: safeModel, country });
}

async function validate({ schema, model }: Partial<PhoneContext>) {
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
// EXPORTS

export default {
  /**
   * The query key used for caching and identifying phone-related queries.
   * @type {QueryKey}
   */
  queryKey,

  //--- queries
  /**
   * Loads the phone list.
   * @returns {Promise<Phone[]>} A promise that resolves to the list of phones
   */
  loadList,

  //--- mutations
  /**
   * Removes a phone by its ID.
   * @param {Phone["id"]} phoneId - The ID of the phone to remove.
   * @returns {Promise<null>} A promise that resolves when the phone is removed
   */
  remove,

  /**
   * Sets a phone as the default phone.
   * @param {Phone["id"]} phoneId - The ID of the phone to set as default.
   * @returns {Promise<IPhone>} A promise that resolves to the updated phone
   */
  setDefault,
};

export const useClientPhoneServices = () => {
  return {
    // --- methods

    /**
     * Adds a phone.
     * @param {Partial<PhoneContext>} param0 - The phone context containing the model to add.
     * @returns {Promise<any>} The result of the add operation.
     */
    add: async ({ model }: Partial<PhoneContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Add Phone failed: model provided",
            responseCodes.Unprocessable_Entity,
            { model }
          )
        );
      // return add(model);
      return ensure(model);
    },

    /**
     * Ensures a phone exists.
     * @param {Partial<PhoneContext>} param0 - The phone context containing the model to ensure.
     * @returns {Promise<any>} The ensured phone model, which will either be the existing phone or a new one created.
     */
    ensure: async ({ model }: Partial<PhoneContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Ensure Phone failed: model provided",
            responseCodes.Unprocessable_Entity,
            { model }
          )
        );
      return ensure(model);
    },

    /**
     * Loads lookups for the phone form.
     * @param {PhoneContext} context - The phone context.
     * @returns {Promise<PhoneContext>} The loaded lookups.
     */
    loadLookups,

    /**
     * Parses a phone context.
     * @param {PhoneContext} context - The phone context.
     * @param {AnyEventObject} event - The event object.
     * @returns {Promise<any>} The parsed phone context.
     */
    parse,

    /**
     * Refreshes the phone list.
     * @param {Partial<QueryParams>} params - Optional query params.
     * @returns {Promise<any>} The refreshed phone list.
     */
    refresh: loadList,

    /**
     * Updates a phone.
     * @param {Partial<PhoneContext>} param0 - The phone context containing id and model.
     * @returns {Promise<any>} The result of the update operation.
     */
    update: async ({ id, model }: Partial<PhoneContext>) => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Update Phone failed: No id or model provided",
            responseCodes.Unprocessable_Entity,
            { id, model }
          )
        );
      return update(id, model);
    },

    /**
     * Validates a phone model.
     * @param {Partial<PhoneContext>} param0 - The phone context containing schema and model.
     * @returns {Promise<any>} The validated model.
     */
    validate,
  };
};
