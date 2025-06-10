// --- external
import { ref } from "vue";

// --- internal
import {
  useQuery,
  useSession,
  useSystem,
  useFeedback,
  useClientPhones,
  useClientEmails,
  useClientAddresses,
} from "../..";

// --- utils
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
  useTime,
  UserIsNotAuthenticatedError,
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapCompanies, mapICompany } from "./mappers";
import { get, isEmpty, isNil, isString } from "lodash-es";

// --- types
import type { ICompany } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { QueryListParams } from "../..";
import type { CompanyContext, Company, CompanyModel } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "companies"];
const { addError, addSuccess } = useFeedback();

function loadList(params?: QueryListParams) {
  const { get, useUrl } = useQuery();
  const { meta, user } = useSession();

  return get<ICompany[], Company[]>({
    queryKey: [...queryKey, params],
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated || !user.value?.id) {
          resolve(true);
        } else {
          reject(new UserIsNotAuthenticatedError());
        }
      }),
    url: useUrl(`clients/${user.value!.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
      ...(params || ref({ pagination: { limit: 0, offset: 0 } })),
    }),
    withAccessToken: true,
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

  const defaultAddress = addresses.getDefault();
  const defaultPhone = phones.getDefault();
  const defaultEmail = emails.getDefault();

  const baseModel: CompanyModel = {
    emailId: model?.emailId || defaultEmail?.id,
    addressId: model?.addressId || defaultAddress?.id,
    phoneId: model?.phoneId || defaultPhone?.id,
    phone: model?.phone ?? defaultPhone?.phone ?? undefined,
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
  { data }: AnyEventObject
) {
  const safeModel = useModelParser<CompanyModel>(
    schema,
    get(data, "model", data),
    baseModel,
    {
      allowExtraProps: false,
    }
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
      reject({ error: errors });
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
    refresh: loadList,
  };
};
