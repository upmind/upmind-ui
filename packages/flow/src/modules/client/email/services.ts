// --- external

// --- internal
import { useApi, useSession } from "../../";

// --- utils
import { useValidation } from "../../../utils";
import { includes, reduce, get, isEmpty, isEqual, find } from "lodash-es";

// --- types
import type { EmailEvent, EmailContext } from "./types.d";
import type { ClientListingsEvents, ClientListingsContext } from "../types.d";

// --------------------------------------------------------
const { authSubscription, isAuthenticated } = useSession();

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  _context: ClientListingsContext,
  _event: ClientListingsEvents
) {
  const { get, useUrl } = useApi();
  const { isAuthenticated, getUserId } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const clientId = await getUserId();

  return get({
    url: useUrl(`clients/${clientId}/emails`, {
      limit: 0,
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true,
  }).then(({ data }) => data);
}

async function filterItems(
  { raw }: ClientListingsContext,
  { data }: ClientListingsEvents
) {
  if (!data?.length)
    return Promise.reject({ error: "No data provided for filtering" });

  const filteredItems = reduce(
    raw,
    (result, item) => {
      const matches =
        includes(
          item.state.context?.title?.toLowerCase(),
          data?.toLowerCase()
        ) ||
        includes(
          item.state.context?.description?.toLowerCase(),
          data?.toLowerCase()
        );

      if (matches) {
        const model = get(item, "state.context.model");
        result.push(model);
      }

      return result;
    },
    []
  );

  return Promise.resolve(filteredItems);
}

async function findItem(
  { raw }: ClientListingsContext,
  { data }: { data: string }
) {
  if (isEmpty(data))
    return Promise.reject({ error: "No data provided for filtering" });

  const found = find(
    raw,
    item =>
      isEqual(item.state.context.model.id, data) ||
      isEqual(item.state.context.model.email, data)
  );

  return new Promise((resolve, reject) => {
    if (!found) reject();
    resolve(found);
  });
}

// --------------------------------------------------------

async function add({ model }: EmailContext, _event: EmailEvent) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/emails`),
    data: {
      email: model.email,
      type: model.type,
    },
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function update({ model }: EmailContext, _event: EmailEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    data: {
      email: model.email,
      type: model.type,
    },
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function remove({ model }: EmailContext, _event: EmailEvent) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function setDefault({ model }: EmailContext, _event: EmailEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    data: { default: true },
    withAccessToken: true,
  }).then(({ data }) => data);
}

// --------------------------------------------------------

async function loadLookups(_context: EmailContext, _event: EmailEvent) {
  // we dont have any lookups for emails, so just return null
  return Promise.resolve(null);
}

async function parse({ model }: EmailContext, _event: EmailEvent) {
  // ---
  return Promise.resolve({ model });
}

async function validate({ schema, model }: EmailContext, _event: EmailEvent) {
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

// --------------------------------------------------------
// EXPORTS

export default {
  find: findItem,
  load,
  loadLookups,
  parse,
  validate,
  setDefault,
  add,
  update,
  remove,
  filter: filterItems,
  authSubscription,
  isAuthenticated,
};
