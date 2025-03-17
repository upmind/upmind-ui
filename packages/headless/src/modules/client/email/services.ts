// --- external

// --- internal
import {
  PaginatedParams,
  useQuery,
  useQueryPaginated,
  useSession,
} from "../..";

// --- utils
import { useValidation } from "../../../utils";

// --- types
import type { EmailContext } from "./types";
import type { IEmail } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function loadAll() {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  // TODO: check if we get `IEmail` from this request
  return get<IEmail[]>({
    url: useUrl(`clients/${client.id}/emails`, {
      limit: 0,
    }),
    queryKey: ["clients", client.id, "emails", { limit: 0 }],
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }) => data);
}

async function loadPaged(paginationParams: PaginatedParams) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<IEmail[]>({
    url: useUrl(`clients/${client.id}/emails`),
    queryKey: ["clients", client.id, "emails", { limit: 0 }],
    withAccessToken: true,
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => data);
}

async function loadLookups(_context: EmailContext) {
  // we dont have any lookups for emails, so just return null
  return Promise.resolve(null);
}

// -----------------------------------------------------------------------------

async function add(model: IEmail) {
  const { post, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post<IEmail>({
    url: useUrl(`clients/${clientId}/emails`),
    data: {
      type: model.type,
      email: model.email,
    },
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function update(model: IEmail) {
  const { put, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    data: {
      type: model.type,
      email: model.email,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function remove(emailId: IEmail["id"]) {
  const { del, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function setDefault(emailId: IEmail["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(({ data }) => data);
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
  //--- queries
  loadAll,
  loadLookups,
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
