// --- external

// --- internal
import { useQuery } from "../../..";

// --- utils
import { get } from "lodash-es";
import { useValidation } from "../../../utils";

// --- types
import type { FieldsContext } from "./types";
import type { AnyEventObject } from "xstate";
import { IBasket } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function load(_context: FieldsContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("basket_fields"),
    queryKey: ["basket", "fields"],
  }).then(data => ({ fields: data }));
}

async function update(
  { basketId, model, controller }: FieldsContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useQuery();
  // rebuild the model with ALL custom fields present, including nullish values
  const data = {
    notes: model?.notes,
    custom_fields: get(model, "customFields"),
  };
  // get returns a promise so we can pass it directly back to the machine
  return put<IBasket>({
    url: useUrl(`/orders/${basketId}`),
    init: { signal: controller?.signal },
    data,
    withAccessToken: true,
  }).then(({ data }) => data);
}

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
    if (!schema) return resolve(model);

    const errors = validate(schema, model);
    if (errors?.length) {
      reject({ error: errors });
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  update,
};
