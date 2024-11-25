// --- external

// --- internal
import { useApi, useClientUnifiedAddresses, useSession } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
// --- types
import type { BillingDetailsEvent, BillingDetailsContext } from "./types";

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  _context: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  const { isAuthenticated } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const { isReady, getItems } = useClientUnifiedAddresses();

  return isReady().then(() => {
    const addresses = getItems();
    return { addresses };
  });
}

// --------------------------------------------------------
async function update(
  { basketId, model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  const { put, useUrl } = useApi();

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}`),
    data: {
      address_id: model?.addressId || null,
      company_id: model?.companyId || null,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------

async function parse(
  { model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
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
  parse,
  validate,
  update,
};
