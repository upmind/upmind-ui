/** @internal */
import parsePhoneNumber, { type CountryCode } from "libphonenumber-js";
import { useFeedback } from "../feedback";
import { useQuery } from "../query";
import { invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import { mapIPhone, mapPhone, mapPhones } from "./mapper";
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
import { get, isString, isEmpty, omitBy, isArray } from "lodash-es";
import type { QueryParams } from "../query";
import type { Phone, PhoneModel, PhoneContext } from "./client-phone.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IPhone } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "phones"];

function loadList(params: Partial<QueryParams> = { pagination: { limit: 0 } }) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { list, useUrl } = useQuery();

  return list<IPhone[], Phone[]>({
    ...(params as any),
    queryKey: [...queryKey, { client: client.value?.id }],
    url: useUrl(`clients/${client.value?.id}/phones`),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    select: mapPhones,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!client.value?.id
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
  const { t } = useI18n();
  const { isReady, ensureCountries, getCountry } = useSystem();
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
  const country = getCountry(model?.phone?.country);
  if (!countries) {
    return Promise.reject(
      new DetailedError(
        t("error.countries_load_failed"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    );
  }
  const baseModel: PhoneModel = {
    phone: {
      number: null,
      nationalNumber: null,
      countryCallingCode: null,
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
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { post, useUrl } = useQuery();

  if (!isAuthenticated.value || !client.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }
  return post<IPhone>({
    mutationKey: ["client", "phones", "add"],
    url: useUrl(`clients/${client.value?.id}/phones`),
    data: mapIPhone(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function update(id: Phone["id"], data: PhoneModel) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { put, useUrl } = useQuery();

  if (!isAuthenticated.value || !client.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IPhone>({
    mutationKey: ["client", "phones", id],
    url: useUrl(`clients/${client.value?.id}/phones/${id}`),
    data: mapIPhone(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function ensure(model: PhoneModel): Promise<Phone> {
  const { t } = useI18n();
  const { data, promise } = loadList();
  await promise.value.finally(); // wait for the query to resolve
  const { findOne } = useCollection<Phone>(
    isArray(data.value) ? data.value : []
  );

  // foe phones we map agains id or the actual phone number
  const mapping = omitBy(model, isEmpty);
  const found = findOne(mapping);
  if (found) return Promise.resolve(found);

  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        t("error.client_phone_not_available"),
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
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${client.value?.id}/phones/${phoneId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value || !client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    onError(error: any) {
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_phone_delete_failed"),
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.phone_removed"));
    },
    withAccessToken: true
  });
}

function setDefault(phoneId: Phone["id"]) {
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<IPhone>("PUT", {
    url: useUrl(`clients/${client.value?.id}/phones/${phoneId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value || !client.value?.id) {
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
          : error?.title || t("error.client_phone_set_default_failed"),
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.phone_set_default"));
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
    phone?.country || safeModel?.phone?.country || country?.code || null;

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
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_phone_validation_failed"),
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
  const { t } = useI18n();

  return {
    loadLookups,

    ensure: async ({ model }: Partial<PhoneContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.client_phone_not_available"),
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
            t("error.client_phone_not_available"),
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
            t("error.client_phone_not_available"),
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
