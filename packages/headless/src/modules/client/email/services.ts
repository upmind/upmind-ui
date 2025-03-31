// --- internal
import { useQuery, useSession, useQueryPaginated } from "../..";

// --- utils
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
} from "../../../utils";
import { isNil, isEmpty, get } from "lodash-es";
import { mapEmails, mapIEmail } from "./mappers";
import { invalidateQueryByKey } from "../../query/utils";

// --- types
import type { IEmail } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/query-core";
import type { AnyEventObject } from "xstate";
import type { QueryResponse, PaginatedParams } from "../..";
import type { Email, EmailModel, EmailContext } from "./types";

// -----------------------------------------------------------------------------

const queryKey: QueryKey = ["client", "emails"];

async function loadAll({ allowStale = true } = {}) {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IEmail[]>({
    url: useUrl(`clients/${client.id}/emails`, {
      limit: 0,
    }),
    queryKey,
    allowStale,
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }) => mapEmails(data ?? []));
}

async function loadPaged(
  paginationParams: PaginatedParams,
  { allowStale = true } = {}
) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IEmail[]>({
    url: useUrl(`clients/${client.id}/emails`),
    queryKey: [...queryKey, { ...paginationParams }],
    allowStale,
    withAccessToken: true,
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => mapEmails(data ?? []));
}

async function loadLookups(_context: EmailContext) {
  // we don't have any lookups for emails, so just return null
  return Promise.resolve(null);
}

function loadAllFromCache() {
  const { queryClient } = useQuery();

  const cachedEmails =
    queryClient.getQueryData<QueryResponse<IEmail>>(queryKey);

  if (isNil(cachedEmails)) throw new CacheIsStaleError();

  return mapEmails(cachedEmails.data ?? []);
}

// -----------------------------------------------------------------------------

async function add(data: EmailModel) {
  const { getUserId } = useSession();
  const { post, useUrl } = useQuery();

  const clientId = await getUserId();

  return post<IEmail>({
    url: useUrl(`clients/${clientId}/emails`),
    data: mapIEmail(data),
    withAccessToken: true,
  })
    .then(invalidateQueryByKey(queryKey))
    .then(({ data }) => mapEmails(data));
}

async function update(id: Email["id"], data: EmailModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${id}`),
    data: mapIEmail(data),
    withAccessToken: true,
  })
    .then(invalidateQueryByKey(queryKey))
    .then(({ data }) => mapEmails(data));
}

async function remove(emailId: Email["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  return del<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey));
}

async function setDefault(emailId: Email["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    data: { default: true },
    withAccessToken: true,
  })
    .then(invalidateQueryByKey(queryKey))
    .then(({ data }) => mapEmails(data));
}

// -----------------------------------------------------------------------------

async function parse(
  { baseModel, schema }: EmailContext,
  { data }: AnyEventObject & { data: EmailContext }
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

async function validate({ schema, model }: EmailContext) {
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

  //--- session
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};

export const useClientEmailServices = () => {
  return {
    loadLookups,
    add: async (context: EmailContext) => {
      if (isEmpty(context.model))
        return Promise.reject("No email model provided");
      return add(context.model);
    },
    update: async (context: EmailContext) => {
      if (!context.id) return Promise.reject("No email id provided");
      if (isEmpty(context.model))
        return Promise.reject("No email model provided");

      return update(context.id, context.model);
    },
    parse,
    validate,
    refresh: async () => loadAll({ allowStale: false }),
  };
};
