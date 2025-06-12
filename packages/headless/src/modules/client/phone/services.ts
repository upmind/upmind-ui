// --- external
import { ref } from "vue";
import parsePhoneNumber, { CountryCode } from "libphonenumber-js";

// --- internal
import { useQuery, useSystem, useSession, useFeedback } from "../..";

// --- utils
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
  useTime,
  UserIsNotAuthenticatedError,
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapIPhone, mapPhones } from "./mapper";
import { get, isEmpty, isNil, isString, first } from "lodash-es";

// --- types
import { PhoneTypes } from "./types";
import type { IPhone } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { QueryListParams } from "../..";
import type { Phone, PhoneModel, PhoneContext } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "phones"];
const { addError, addSuccess } = useFeedback();

function loadList(params?: QueryListParams) {
  const { query, useUrl } = useQuery();
  const { meta, user } = useSession();

  return query<IPhone[], Phone[]>({
    queryKey: [...queryKey, params],
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated || !user.value?.id) {
          resolve(true);
        } else {
          reject(new UserIsNotAuthenticatedError());
        }
      }),
    url: useUrl(`clients/${user.value?.id}/emails`, {
      ...(params || ref({ pagination: { limit: 0, offset: 0 } })),
    }),
    withAccessToken: true,
    // --- options
    select: mapPhones,
    staleTime: useTime().DAY,
  });
}

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.getQueryData<Phone[]>(queryKey);
  if (isNil(cached)) throw new CacheIsStaleError();
  return cached;
}

/**
 * Load the lookups for the phone form
 * @param {PhoneContext} _context
 * @returns {Promise<{PhoneContext}>}
 */
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
    type: first(PhoneTypes)?.key || 1,
  };

  const safeModel = useModelParser<PhoneModel>(schema, model, baseModel, {
    allowExtraProps: false,
  });

  return Promise.resolve({
    types: PhoneTypes,
    country,
    model: safeModel,
    baseModel: safeModel,
  } as PhoneContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: PhoneModel) {
  const { getUserId } = useSession();
  const { post, useUrl } = useQuery();

  const clientId = await getUserId();

  return post<IPhone>({
    url: useUrl(`clients/${clientId}/phones`),
    data: mapIPhone(data),
    withAccessToken: true,
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error adding this phone",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully added phone");
    },
  });
}

async function update(id: Phone["id"], data: PhoneModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IPhone>({
    url: useUrl(`clients/${clientId}/phones/${id}`),
    data: mapIPhone(data),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error updating this phone",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully updated phone");
    },
    withAccessToken: true,
  });
}

async function remove(phoneId: Phone["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  return del<null>({
    url: useUrl(`clients/${clientId}/phones/${phoneId}`),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error removing this phone",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess() {
      invalidateQueryByKey(queryKey)();
      addSuccess("Successfully removed phone");
    },
    withAccessToken: true,
  });
}

async function setDefault(phoneId: Phone["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IPhone>({
    url: useUrl(`clients/${clientId}/phones/${phoneId}`),
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
      invalidateQueryByKey(queryKey)(data);
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
  if (!safeModel?.phone) return Promise.resolve({ model: safeModel, country });

  const phoneNumber = isString(safeModel.phone)
    ? safeModel?.phone
    : ((safeModel?.phone?.number || safeModel?.phone?.nationalNumber) ?? "");

  const countryCode: CountryCode = (safeModel?.phone?.country ||
    data?.country?.code ||
    country?.code ||
    "") as CountryCode;
  const phone = parsePhoneNumber(phoneNumber, countryCode) || safeModel.phone;

  // now map the phone number to the model in the correct format with fallbacks
  safeModel.phone = {
    number: phone?.number || safeModel.phone?.number,
    nationalNumber: phone?.nationalNumber || safeModel.phone?.nationalNumber,
    countryCallingCode:
      phone?.countryCallingCode || safeModel.phone?.countryCallingCode,
    country: phone?.country || safeModel.phone?.country || country?.code || "",
  };

  if (!!safeModel.phone?.country && safeModel.phone.country !== country?.code) {
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
  queryKey,
  //--- queries
  loadList,
  loadCached,

  //--- mutations
  remove,
  setDefault,
};

export const useClientPhoneServices = () => {
  return {
    loadLookups,
    add: async (context: PhoneContext) => {
      if (!context.model?.phone)
        return Promise.reject("No phone model provided");
      return add(context.model);
    },
    update: async (context: PhoneContext) => {
      if (!context.id) return Promise.reject("No phone id provided");
      if (!context.model?.phone)
        return Promise.reject("No phone model provided");

      return update(context.id, context.model);
    },
    parse,
    validate,
    refresh: loadList,
  };
};
