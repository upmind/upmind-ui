// --- external

// --- internal
import { useQuery } from "../../..";

// --- utils
import { get } from "lodash-es";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../../utils";

// --- types
import type { FieldsContext, FieldsModel } from "./types";
import type { AnyEventObject } from "xstate";
import { IBasket } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function load(
  { schema, model, baseModel }: FieldsContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();

  const safeModel = useModelParser<FieldsModel>(schema, model, baseModel);

  return get({
    url: useUrl("basket_fields"),
    queryKey: ["basket", "fields"]
  }).then(data => ({
    fields: data,
    model: safeModel,
    baseModel: safeModel
  }));
}

async function update(
  { basketId, model, controller }: FieldsContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useQuery();
  // rebuild the model with ALL custom fields present, including nullish values
  const data = {
    notes: model?.notes,
    custom_fields: get(model, "customFields")
  };
  // get returns a promise so we can pass it directly back to the machine
  return put<IBasket>({
    url: useUrl(`/orders/${basketId}`),
    init: { signal: controller?.signal },
    data,
    withAccessToken: true
  });
}

async function parse({ model, schema }: FieldsContext, _event: AnyEventObject) {
  // ---
  model = useModelParser<FieldsModel>(schema, model);

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
      reject(
        new DetailedError(
          "Fields validation failed",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
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
  update
};
