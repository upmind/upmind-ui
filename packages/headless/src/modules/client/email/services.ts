// --- external

// --- internal
import { useApi, useSession } from "../..";

// --- utils
import { useValidation } from "../../../utils";
import { includes, reduce, get, isEmpty, isEqual, find } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { EmailContext, EmailsContext } from "./types";

// -----------------------------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: EmailsContext) {
  const { get, useUrl } = useApi();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get({
    url: useUrl(`clients/${client.id}/emails`, {
      limit: 0,
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true,
  }).then(({ data }: any) => data);
}

async function filterItems({ raw }: EmailsContext, { data }: AnyEventObject) {
  if (!data?.length)
    return Promise.reject({ error: "No data provided for filtering" });

  const filteredItems = reduce(
    raw,
    (result, item) => {
      const matches =
        includes(
          item.getSnapshot().context?.title?.toLowerCase(),
          data?.toLowerCase()
        ) ||
        includes(
          item.getSnapshot().context?.description?.toLowerCase(),
          data?.toLowerCase()
        );

      if (matches) {
        const model = get(item.getSnapshot, "context.model");
        // @ts-ignore
        result.push(model);
      }

      return result;
    },
    []
  );

  return Promise.resolve(filteredItems);
}

async function findItem({ raw }: EmailsContext, { data }: { data: string }) {
  if (isEmpty(data))
    return Promise.reject({ error: "No data provided for filtering" });

  const found = find(
    raw,
    item =>
      isEqual(item.getSnapshot().context.model.id, data) ||
      isEqual(item.getSnapshot().context.model.email, data)
  );

  return new Promise((resolve, reject) => {
    if (!found) reject();
    resolve(found);
  });
}

// -----------------------------------------------------------------------------

async function add({ model }: EmailContext) {
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
  }).then(({ data }: any) => data);
}

async function update({ model }: EmailContext) {
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
  }).then(({ data }: any) => data);
}

async function remove({ model }: EmailContext) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function setDefault({ model }: EmailContext) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    data: { default: true },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// -----------------------------------------------------------------------------

async function loadLookups(_context: EmailContext) {
  // we dont have any lookups for emails, so just return null
  return Promise.resolve(null);
}

async function parse({ model }: EmailContext) {
  // ---
  return Promise.resolve({ model });
}

async function validate({ schema, model }: EmailContext) {
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
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
