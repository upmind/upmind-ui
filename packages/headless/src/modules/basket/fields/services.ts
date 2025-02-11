// --- external

// --- internal
import { useApi } from "../../..";

// --- utils
import { useValidation, useFieldsModelParser } from "../../../utils";
import { get } from "lodash-es";

// --- types
import type { FieldsContext } from "./types";
import type { AnyEventObject } from "xstate";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: FieldsContext, _event: AnyEventObject) {
  const { get, useUrl } = useApi();

  return get({
    url: useUrl("basket_fields"),
  }).then(({ data }: any) => ({ fields: data }));
}

// --------------------------------------------------------

async function update(
  { basketId, model }: FieldsContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useApi();
  // rebuild the model with ALL custo mfields present, including nullish values
  const data = {
    notes: model?.notes,
    custom_fields: get(model, "customFields"),
  };
  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}`),
    data,
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------

async function parse({ model }: FieldsContext, _event: AnyEventObject) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: FieldsContext,
  _event: AnyEventObject
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
  update,
};
