// --- internal
import {
  useQuery,
  useSystem,
  useSession,
  useFeedback,
  useClientPhones,
  useClientEmails,
  useClientAddresses,
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
  useCollection,
} from "../../../utils";
import { mapCompanies, mapCompany, mapICompany } from "./mappers";
import { invalidateQueryByKey } from "../../query";
import { get, isString, isEmpty, omitBy } from "lodash-es";

// --- types
import type { ICompany } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { Company, CompanyModel, CompanyContext } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "companies"];
const { addError, addSuccess } = useFeedback();

async function load() {
  const { meta, user } = useSession();
  const { get, useUrl } = useQuery();

  return get<ICompany[], Company[]>({
    queryKey,
    url: useUrl(`clients/${user.value?.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
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
    select: mapCompanies,
    staleTime: useTime().DAY,
  });
}

function loadList(params?: Partial<QueryParams>) {
  const { meta, user } = useSession();
  const { list, useUrl } = useQuery();

  return list<ICompany[], Company[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`clients/${user.value?.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
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
    select: mapCompanies,
    staleTime: useTime().DAY,
  });
}

async function loadLookups({
  model,
  schema,
}: CompanyContext): Promise<CompanyContext> {
  const phones = useClientPhones();
  const emails = useClientEmails();
  const addresses = useClientAddresses();

  const { getCountry } = useSystem();
  const defaultCountry = getCountry();

  await Promise.allSettled([
    phones.isReady(),
    emails.isReady(),
    addresses.isReady(),
  ]);

  const baseModel: CompanyModel = {
    emailId: model?.emailId || emails.default.value?.id,
    addressId: model?.addressId || addresses.default.value?.id,
    phoneId: model?.phoneId || phones.default.value?.id,
    phone: model?.phone ?? phones.default.value?.phone ?? undefined,
    default: model?.default ?? false,
    name: model?.name ?? "",
    regNumber: model?.regNumber ?? "",
    vatNumber: model?.vatNumber ?? "",
  };

  const safeModel = useModelParser<CompanyModel>(schema, model, baseModel, {
    allowExtraProps: false,
  });

  return Promise.resolve({
    emails: emails.data.value || [],
    phones: phones.data.value || [],
    addresses: addresses.data.value || [],
    country: defaultCountry,
    // ---
    model: safeModel,
    baseModel: safeModel,
  } as CompanyContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: CompanyModel) {
  const { meta, user } = useSession();
  const { post, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }
  return post<ICompany>({
    url: useUrl(`clients/${user.value?.id}/companies`),
    data: mapICompany(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function update(id: Company["id"], data: CompanyModel) {
  const { meta, user } = useSession();
  const { put, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<ICompany>({
    url: useUrl(`clients/${user.value?.id}/companies/${id}`),
    data: mapICompany(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function ensure(model: CompanyModel): Promise<CompanyModel> {
  const mapping = omitBy(model, isEmpty);
  const companies = await load();
  const { findOne } = useCollection<Company>(companies);
  const found = findOne(mapping);

  if (found) return Promise.resolve(found);
  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        "[headless] Failed to ensure (add) company",
        responseCodes.Unprocessable_Entity
      );
    // NB: Remember to refresh our machines so we have the new data
    // refresh();
    return mapCompany(raw);
  });
}

function remove(companyId: Company["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${user.value?.id}/companies/${companyId}`),
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
          : error?.title || "We experienced an error removing this company",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully removed company");
    },
    withAccessToken: true,
  });
}

function setDefault(companyId: Company["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<ICompany>("PUT", {
    url: useUrl(`clients/${user.value?.id}/companies/${companyId}`),
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
            "We experienced an error setting this company as default",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully set company as default");
    },
    withAccessToken: true,
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema }: CompanyContext,
  { data }: AnyEventObject
) {
  const safeModel = useModelParser<CompanyModel>(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---

  return Promise.resolve({ model: safeModel });
}

async function validate({ schema, model }: Partial<CompanyContext>) {
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          "[headless] Invalid Company Model",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { error: errors }
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
   * The query key used for caching and identifying company-related queries.
   * @type {QueryKey}
   */
  queryKey,

  //--- queries
  /**
   * Loads the company list.
   * @returns {Promise<Company[]>} A promise that resolves to the list of companys
   */
  loadList,

  //--- mutations
  /**
   * Removes a company by its ID.
   * @param {Company["id"]} companyId - The ID of the company to remove.
   * @returns {Promise<null>} A promise that resolves when the company is removed
   */
  remove,

  /**
   * Sets a company as the default company.
   * @param {Company["id"]} companyId - The ID of the company to set as default.
   * @returns {Promise<ICompany>} A promise that resolves to the updated company
   */
  setDefault,
};

export const useClientCompanyServices = () => {
  return {
    // --- methods

    /**
     * Adds a company.
     * @param {Partial<CompanyContext>} param0 - The company context containing the model to add.
     * @returns {Promise<any>} The result of the add operation.
     */
    add: async ({ model }: Partial<CompanyContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Add Company failed: model provided",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { model }
          )
        );
      // return add(model);
      return ensure(model);
    },

    /**
     * Ensures a company exists.
     * @param {Partial<CompanyContext>} param0 - The company context containing the model to ensure.
     * @returns {Promise<any>} The ensured company model, which will either be the existing company or a new one created.
     */
    ensure: async ({ model }: Partial<CompanyContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Ensure Company failed: model provided",
            responseCodes.Unprocessable_Entity,
            { model }
          )
        );
      return ensure(model);
    },

    /**
     * Loads lookups for the company form.
     * @param {CompanyContext} context - The company context.
     * @returns {Promise<CompanyContext>} The loaded lookups.
     */
    loadLookups,

    /**
     * Parses a company context.
     * @param {CompanyContext} context - The company context.
     * @param {AnyEventObject} event - The event object.
     * @returns {Promise<any>} The parsed company context.
     */
    parse,

    /**
     * Refreshes the company list.
     * @param {Partial<QueryParams>} params - Optional query params.
     * @returns {Promise<any>} The refreshed company list.
     */
    refresh: loadList,

    /**
     * Updates a company.
     * @param {Partial<CompanyContext>} param0 - The company context containing id and model.
     * @returns {Promise<any>} The result of the update operation.
     */
    update: async ({ id, model }: Partial<CompanyContext>) => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Update Company failed: No id or model provided",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { id, model }
          )
        );
      return update(id, model);
    },

    /**
     * Validates a company model.
     * @param {Partial<CompanyContext>} param0 - The company context containing schema and model.
     * @returns {Promise<any>} The validated model.
     */
    validate,
  };
};
