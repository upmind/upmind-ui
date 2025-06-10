// --- internal
import { useClientPhones } from "../phone";
import { useClientEmails } from "../email";
import { useClientAddresses } from "../address";
import { invalidateQueryByKey } from "../../query";
import {
  useQuery,
  useSession,
  useClientCompanies,
  useSystem,
  useFeedback,
} from "../..";

// --- utils
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
} from "../../../utils";
import { get, set, isEmpty, isNil, isString } from "lodash-es";
import { mapCompanies, mapICompany } from "./mappers";
import { get, isNil, isEmpty, isString } from "lodash-es";

// --- types
import type { ICompany } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/query-core";
import type { AnyEventObject } from "xstate";
import type { CompanyContext, Company } from "./types";
import type { PaginatedParams, QueryResponse, CompanyModel } from "../..";
import { parsePhoneNumber } from "libphonenumber-js";
import { useSchema } from "./schemas";

// -----------------------------------------------------------------------------
// Queries

const queryKey: QueryKey = ["client", "companies"];
const { addError, addSuccess } = useFeedback();

async function loadAll() {
  const { getAsync, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return getAsync<ICompany[], Company[]>({
    url: useUrl(`clients/${client.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
      limit: 0,
    }),
    select: data => mapCompanies(data ?? []),
    queryKey,
    withAccessToken: true,
  });
}

async function loadPaged(params: PaginatedParams) {
  const { getAsync, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return getAsync<ICompany[], Company[]>({
    url: useUrl(`clients/${client.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
      ...params,
    }),
    select: data => mapCompanies(data ?? []),
    queryKey: [...queryKey, { ...params }],
    withAccessToken: true,
  });
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedCompanies = queryClient.getQueryData<Company[]>(queryKey);
  if (isNil(cachedCompanies)) throw new CacheIsStaleError();
  return cachedCompanies;
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
  const { getAll: getPhones, getDefault: getDefaultPhone } = useClientPhones();
  const { getAll: getEmails, getDefault: getDefaultEmail } = useClientEmails();
  const { getAll: getCompanies } = useClientCompanies();
  const { getAll: getAddresses, getDefault: getDefaultAddress } =
    useClientAddresses();

  const { getCountry } = useSystem();
  const defaultCountry = getCountry();

  const [phones, emails, addresses] = await Promise.all([
    getPhones(),
    getEmails(),
    getAddresses(),
    getCompanies(),
  ]);

  const defaultAddress = await getDefaultAddress();
  const defaultPhone = await getDefaultPhone();
  const defaultEmail = await getDefaultEmail();

  const baseModel: CompanyModel = {
    emailId: model?.emailId || defaultEmail?.id,
    addressId: model?.addressId || defaultAddress?.id,
    phoneId: model?.phoneId || defaultPhone?.id,
    phone: model?.phone || defaultPhone?.phone,
    default: model?.default ?? false,
    name: model?.name ?? "",
    regNumber: model?.regNumber ?? "",
    vatNumber: model?.vatNumber ?? "",
  };

  const safeModel = useModelParser<CompanyModel>(schema, model, baseModel, {
    allowExtraProps: false,
  });

  return {
    emails,
    phones,
    addresses,
    country: defaultCountry,
    // ---
    model: safeModel,
    baseModel: safeModel,
  } as CompanyContext;
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: CompanyModel) {
  const { getUserId } = useSession();
  const { post, useUrl } = useQuery();

  const clientId = await getUserId();

  return post<ICompany>({
    url: useUrl(`clients/${clientId}/companies`),
    data: mapICompany(data),
    withAccessToken: true,
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error adding this company",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully added company");
    },
  });
}

async function update(id: Company["id"], data: CompanyModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<ICompany>({
    url: useUrl(`clients/${clientId}/companies/${id}`),
    data: mapICompany(data),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error updating this company",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully updated company");
    },
    withAccessToken: true,
  });
}

async function remove(companyId: Company["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  return del<null>({
    url: useUrl(`clients/${clientId}/companies/${companyId}`),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error removing this company",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess() {
      invalidateQueryByKey(queryKey)();
      addSuccess("Successfully removed company");
    },
    withAccessToken: true,
  });
}

async function setDefault(companyId: Company["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<ICompany>({
    url: useUrl(`clients/${clientId}/companies/${companyId}`),
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
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully set company as default");
    },
    withAccessToken: true,
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema }: CompanyContext,
  { data }: AnyEventObject & { data: CompanyModel }
) {
  const safeModel = useModelParser(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---

  return Promise.resolve({ model: safeModel });
}

async function validate({ schema, model }: Partial<CompanyContext>) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);
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
  refresh: loadAll,

  loadAllFromCache,
  //--- mutations

  remove,
  setDefault,
};

export const useClientCompanyServices = () => {
  return {
    loadLookups,
    add: async (context: Partial<CompanyContext>) => {
      if (isEmpty(context.model))
        return Promise.reject("No company model provided");
      return add(context.model);
    },
    update: async (context: Partial<CompanyContext>) => {
      if (!context.id) return Promise.reject("No company id provided");
      if (isEmpty(context.model))
        return Promise.reject("No company model provided");

      return update(context.id, context.model);
    },
    parse,
    validate,
    refresh: loadAll,
  };
};
