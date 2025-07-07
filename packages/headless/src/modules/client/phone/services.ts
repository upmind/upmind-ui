import parsePhoneNumber, { CountryCode } from "libphonenumber-js";

// --- internal
import {
  useQuery,
  useSystem,
  useSession,
  useFeedback,
  type QueryParams
} from "../..";

// --- utils
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser,
  NotAuthenticatedError,
  useCollection
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapIPhone, mapPhone, mapPhones } from "./mapper";
import { get, isEmpty, isString, omitBy } from "lodash-es";
// ---

// --- types
import type { IPhone } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { Phone, PhoneModel, PhoneContext } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "phones"];
const { addError, addSuccess } = useFeedback();

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
    staleTime: useTime().DAY
  });
}

/**
 * Load the lookups for the phone form
 * @param {PhoneContext} _context
 * @returns {Promise<{PhoneContext}>}
 */
async function loadLookups({
  model,
  schema
}: PhoneContext): Promise<PhoneContext> {
  const { isReady, fetchCountries, getCountry } = useSystem();
  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  await isReady().catch(error =>
    Promise.reject(
      new DetailedError(
        "System not ready",
        responseCodes.Unauthorized,
        ErrorOrigin.Headless,
        error
      )
    )
  );
  const countries = await fetchCountries();
  const country = getCountry(model?.phone?.country);
  if (!countries) {
    return Promise.reject(
      new DetailedError(
        "Failed to load countries",
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    );
  }
  const baseModel: PhoneModel = {
    phone: {
      number: "",
      nationalNumber: "",
      countryCallingCode: "",
      country: country.code
    }
  };

  const safeModel = useModelParser<PhoneModel>(schema, model, baseModel);

  return Promise.resolve({
    country,
    model: safeModel,
    baseModel: safeModel
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
    withAccessToken: true
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
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function ensure(model: PhoneModel): Promise<Phone> {
  const mapping = omitBy(model, isEmpty);
  const existing = await loadList().promise.value.then(
    ({ data }) => data || []
  );
  const { findOne } = useCollection<Phone>(existing);
  const found = findOne(mapping);
  if (found) return Promise.resolve(found);
  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        "Failed to ensure phone",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
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
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully removed phone");
    },
    withAccessToken: true
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
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully set phone as default");
    },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { schema, country }: PhoneContext,
  { data }: AnyEventObject
) {
  const safeModel = useModelParser<PhoneModel, Phone>(
    schema,
    get(data, "model", data)
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
      reject(
        new DetailedError(
          "Phone validation failed",
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
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadList,

  //--- mutations
  remove,
  setDefault
};

export const useClientPhoneServices = () => {
  return {
    loadLookups,

    ensure: async ({ model }: Partial<PhoneContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "Ensure Phone failed: model provided",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        );
      return ensure(model);
    },

    add: async ({ model }: Partial<PhoneContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "Add Phone failed: model provided",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        );
      return add(model);
    },
    update: async ({ id, model }: Partial<PhoneContext>) => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "Update Phone failed: No id or model provided",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { id, model }
          )
        );

      return update(id, model);
    },
    parse,
    validate,
    refresh: loadList
  };
};
