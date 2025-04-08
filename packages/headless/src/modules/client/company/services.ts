// --- internal
import { useClientPhones } from "../phone";
import { useClientEmails } from "../email";
import { useClientAddresses } from "../address";
import { invalidateQueryByKey } from "../../query";
import { useQuery, useSession, useQueryPaginated } from "../..";

// --- utils
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
} from "../../../utils";
import { get, set, isEmpty, isNil } from "lodash-es";
import { mapCompanies, mapICompany } from "./mappers";

// --- types
import type { ICompany } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/query-core";
import type { AnyEventObject } from "xstate";
import type { CompanyContext, Company } from "./types";
import type { PaginatedParams, QueryResponse, CompanyModel } from "../..";

// -----------------------------------------------------------------------------
// Queries

const queryKey: QueryKey = ["client", "companies"];

async function loadAll({ allowStale = true } = {}) {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<Company[]>({
    url: useUrl(`clients/${client.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
      limit: 0,
    }),
    queryKey,
    allowStale,
    withAccessToken: true,
    revalidateIfStale: true,
    transformResponse: (response: any) =>
      set(response, "data", mapCompanies(response?.data ?? [])),
  }).then(({ data }) => data);
}

async function loadPaged(
  paginationParams: PaginatedParams,
  { allowStale = true } = {}
) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<Company[]>({
    url: useUrl(`clients/${client.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
    }),
    queryKey: [...queryKey, { ...paginationParams }],
    allowStale,
    withAccessToken: true,
    transformResponse: (response: any) =>
      set(response, "data", mapCompanies(response?.data ?? [])),
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => mapCompanies(data ?? []));
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedCompanies =
    queryClient.getQueryData<QueryResponse<Company[]>>(queryKey);
  if (isNil(cachedCompanies)) throw new CacheIsStaleError();
  return cachedCompanies.data;
}

/**
 * Load the lookups for the company form
 * @param {CompanyContext} context
 * @returns {Promise<CompanyContext>}
 */
async function loadLookups({ model }: CompanyContext): Promise<CompanyContext> {
  // let's start up/use our dependencies
  const emails = useClientEmails();
  const phones = useClientPhones();
  const addresses = useClientAddresses();

  return Promise.all([
    emails.getAll().then(emails.isReady),
    phones.getAll().then(phones.isReady),
    addresses.getAll().then(addresses.isReady),
  ]).then(async () => {
    const [defaultEmail, defaultPhone, defaultAddress] = await Promise.all([
      emails.getDefault(),
      phones.getDefault(),
      addresses.getDefault(),
    ]);

    return {
      emails,
      phones,
      addresses,
      baseModel: {
        ...model,
        emailId: defaultEmail?.id,
        addressId: defaultAddress?.id,
        phone: {
          number: defaultPhone?.nationalNumber,
          country: defaultPhone?.country,
          nationalNumber: defaultPhone?.nationalNumber,
          countryCallingCode: defaultPhone?.countryCallingCode,
        },
      },
    };
  });
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
  }).then(invalidateQueryByKey(queryKey));
}

async function update(id: Company["id"], data: CompanyModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<ICompany>({
    url: useUrl(`clients/${clientId}/companies/${id}`),
    data: mapICompany(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function remove(companyId: Company["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  return del<null>({
    url: useUrl(`clients/${clientId}/companies/${companyId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function setDefault(companyId: Company["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<ICompany>({
    url: useUrl(`clients/${clientId}/companies/${companyId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
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
  refresh: async () => loadAll({ allowStale: false }),

  loadAllFromCache,
  //--- mutations

  remove,
  setDefault,
};

export const useClientCompanyServices = () => {
  return {
    loadLookups,
    add: async (context: CompanyContext) => {
      if (isEmpty(context.model))
        return Promise.reject("No company model provided");
      return add(context.model);
    },
    update: async (context: CompanyContext) => {
      if (!context.id) return Promise.reject("No company id provided");
      if (isEmpty(context.model))
        return Promise.reject("No company model provided");

      return update(context.id, context.model);
    },
    parse,
    validate,
    refresh: async () => loadAll({ allowStale: false }),
  };
};
