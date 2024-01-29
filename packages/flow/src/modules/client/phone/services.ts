// --- external

// --- internal
import { useApi, useSystem, useSession } from "../..";

// --- utils
import { useValidation } from "../../../utils";

// --- types
import type { PhoneEvent, PhoneContext } from "./types";
import type { ClientListingsEvents, ClientListingsContext } from "../types";

// --------------------------------------------------------
//  ENUMS
export const PhoneTypes: any[] = [
  { key: 1, value: "mobile" },
  { key: 2, value: "home" },
  { key: 3, value: "office" },
  { key: 4, value: "personal" }
];

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
    url: useUrl(`clients/${clientId}/phones`, {
      // with: [].join(),
      limit: 0
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true
  }).then(({ data }) => data);
}

async function loadLookups({ model }: PhoneContext, { data }: PhoneEvent) {
  // we dont have any lookups for emails, so just return null
  return Promise.resolve(null);
}

// --------------------------------------------------------

async function add({ model }: PhoneContext, _event: PhoneEvent) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/phones`),
    data: model,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function update({ model }: PhoneContext, _event: PhoneEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/phones/${model.id}`),
    data: model,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function setDefault({ model }: PhoneContext, _event: PhoneEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/phones/${model.id}`),
    data: { default: true },
    withAccessToken: true
  }).then(({ data }) => data);
}

async function remove({ model }: PhoneContext, _event: PhoneEvent) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/phones/${model.id}`),
    withAccessToken: true
  }).then(({ data }) => data);
}

// --------------------------------------------------------

async function validate({ schema, model }: PhoneContext, _event: PhoneEvent) {
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
  validate,
  setDefault,
  add,
  update,
  remove
};
