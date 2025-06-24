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
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapCompanies, mapICompany } from "./mappers";
import { get, isEmpty, isNil, isString } from "lodash-es";

// --- types
import type { ICompany } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { CompanyContext, Company, CompanyModel } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "companies"];
const { addError, addSuccess } = useFeedback();

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
        if (meta.value.isAuthenticated || !user.value?.id) {
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

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.getQueryData<Company[]>(queryKey);
  if (isNil(cached)) throw new CacheIsStaleError();
  return cached;
}

/**
 * Load the lookups for the company form
 * @param {CompanyContext} context
 * @returns {Promise<CompanyContext>}
 */
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
  queryKey,
  //--- queries
  loadList,
  loadCached,

  //--- mutations
  remove,
  setDefault,
};

export const useClientCompanyServices = () => {
  return {
    loadLookups,
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
      return add(model);
    },
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
    parse,
    validate,
    refresh: loadList,
  };
};
