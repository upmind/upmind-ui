// --- internal
import {
  useQuery,
  useSession,
  PaginatedParams,
  useQueryPaginated,
} from "../..";

// --- utils
import { isNil } from "lodash-es";
import { mapEmail } from "./mapper";
import { invalidateQueryByKey } from "../../query/utils";
import { CacheIsStaleError, useValidation } from "../../../utils";

// --- types
import type { Email, EmailContext } from "./types";
import type { IEmail } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const queryKey = ["client", "emails"];

async function loadAll() {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IEmail[]>({
    url: useUrl(`clients/${client.id}/emails`, {
      limit: 0,
    }),
    queryKey,
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }) => mapEmail(data ?? []));
}

async function loadPaged(paginationParams: PaginatedParams) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IEmail[]>({
    url: useUrl(`clients/${client.id}/emails`),
    queryKey: [...queryKey, { ...paginationParams }],
    withAccessToken: true,
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => mapEmail(data ?? []));
}

async function loadLookups(_context: EmailContext) {
  // we dont have any lookups for emails, so just return null
  return Promise.resolve(null);
}

function loadAllFromCache() {
  const { queryClient } = useQuery();

  const cachedEmails = queryClient.getQueryData<IEmail>(queryKey);

  if (isNil(cachedEmails)) throw new CacheIsStaleError();

  return mapEmail(cachedEmails ?? []);
}

// -----------------------------------------------------------------------------

async function add(model: Email) {
  const { post, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  post<IEmail>({
    url: useUrl(`clients/${clientId}/emails`),
    data: {
      type: model.type,
      email: model.email,
    },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "emails"]));
}

async function update(model: Email) {
  const { put, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    data: {
      type: model.type,
      email: model.email,
    },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "emails"]));
}

async function remove(emailId: Email["id"]) {
  const { del, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  del<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "emails"]));
}

async function setDefault(emailId: Email["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "emails"]));
}

// -----------------------------------------------------------------------------

async function parse({ model }: EmailContext) {
  return Promise.resolve({ model });
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
  loadLookups,
  loadAllFromCache,
  //--- mutations
  add,
  update,
  remove,
  setDefault,
  //--- utils
  parse,
  validate,
  //--- session
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
