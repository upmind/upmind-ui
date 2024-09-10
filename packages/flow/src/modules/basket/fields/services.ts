// --- external

// --- internal
import { useApi } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { useModelParser } from "./utils";

// --- types
import type { FieldsEvent, FieldsContext } from "./types.d";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: FieldsContext, _event: FieldsEvent) {
  const { get, useUrl } = useApi();

  return get({
    url: useUrl("basket_fields"),
  }).then(({ data }: any) => ({ fields: data }));
}

// --------------------------------------------------------

async function update(
  { basket_id, fields, model }: FieldsContext,
  _event: FieldsEvent
) {
  const { put, useUrl } = useApi();
  // rebuild the model with ALL custo mfields present, including nullish values
  // @ts-ignore
  const data = useModelParser({ fields }, model);

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basket_id}`),
    data,
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------

async function parse({ model }: FieldsContext, _event: FieldsEvent) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate({ schema, model }: FieldsContext, _event: FieldsEvent) {
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
  update,
};
