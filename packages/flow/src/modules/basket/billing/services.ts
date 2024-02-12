// --- external

// --- internal
import { useApi } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { useModelParser } from "./utils";

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
  const { get, useUrl } = useApi();

  return get({
    url: useUrl("basket_fields")
  }).then(({ data }) => ({ fields: data }));
}

// --------------------------------------------------------

async function update(
  { basketId, fields, model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  const { put, useUrl } = useApi();
  // rebuild the model with ALL custo mfields present, including nullish values
  const data = useModelParser({ fields }, model);

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}`),
    data,
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
  return Promise.resolve({ model });
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
