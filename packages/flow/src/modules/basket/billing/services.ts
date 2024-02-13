// --- external

// --- internal
import { useApi } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { omitBy, isNil } from "lodash-es";
// --- types
import type { BillingDetailsEvent, BillingDetailsContext } from "./types";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  _context: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  // we dont need to do anything here as we are not loading any data
  return new Promise(resolve => {
    resolve({});
  });
}

// --------------------------------------------------------
async function update(
  { basket_id, model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  const { put, useUrl } = useApi();

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basket_id}`),
    data: {
      address_id: model?.address_id || null,
      company_id: model?.company_id || null
    },
    withAccessToken: true
  });
}

// --------------------------------------------------------

async function parse(
  { model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model: omitBy(model, isNil) });
}

async function validate(
  { schema, model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
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
  parse,
  validate,
  update
};
