// --- external

// --- internal
import { useApi, useSystem, useSession } from "../../";

// --- utils
import { useValidation } from "../../../utils";

// --- types
import type { EmailEvent, EmailContext } from "./types.d";
import type { ClientListingsEvents, ClientListingsContext } from "../types.d";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  _context: ClientListingsContext,
  { data }: ClientListingsEvents
) {
  const { get, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return get({
    url: useUrl(`clients/${clientId}/emails`, {
      // with: [].join(),
      limit: 0
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true
  }).then(({ data }) => data);
}

async function loadLookups({ model }: EmailContext, { data }: EmailEvent) {
  // we dont have any lookups for emails, so just return null
  return Promise.resolve(null);
}

// --------------------------------------------------------

async function add({ model }: EmailContext, _event: EmailEvent) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/emails`),
    data: model,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function update({ model }: EmailContext, _event: EmailEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    data: model,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function setDefault({ model }: EmailContext, _event: EmailEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    data: { default: true },
    withAccessToken: true
  }).then(({ data }) => data);
}

async function remove({ model }: EmailContext, _event: EmailEvent) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/emails/${model.id}`),
    withAccessToken: true
  }).then(({ data }) => data);
}

// --------------------------------------------------------

async function parse({ model }: PhoneContext, _event: PhoneEvent) {
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
  load,
  loadLookups,
  parse,
  validate,
  setDefault,
  add,
  update,
  remove
};
