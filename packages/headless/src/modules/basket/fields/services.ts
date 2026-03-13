// --- external
import { asyncDebounce } from "@tanstack/pacer";

// --- internal
import { useI18n, useQuery } from "../../..";

// --- utils
import { mapCustomField } from "../../client/customFields/mappers";
import {
  DetailedError,
  ErrorOrigin,
  isModelShape,
  responseCodes,
  useModelParser,
  useTime,
  useValidation
} from "../../../utils";
import { get, map } from "lodash-es";

// --- types
import type { IBasket, ICustomField } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { FieldsContext, FieldsModel } from "./types";
import type { CustomField } from "../../client";

// -----------------------------------------------------------------------------

async function load(
  { schema, model, baseModel }: FieldsContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();

  const safeModel = useModelParser<FieldsModel>(schema, model, baseModel);

  return get<ICustomField[], CustomField[]>({
    url: useUrl("basket_fields"),
    queryKey: ["basket", "fields"],
    select: data => map(data, mapCustomField) as CustomField[]
  }).then(data => ({
    fields: data,
    model: safeModel,
    baseModel: safeModel
  }));
}

async function parse(
  { baseModel, model, schema }: FieldsContext,
  { data }: AnyEventObject
) {
  const fieldsKeys: (keyof FieldsModel)[] = ["notes", "customFields"];

  const safeData = isModelShape<FieldsModel>(data, fieldsKeys)
    ? data
    : isModelShape<FieldsModel>(get(data, "model"), fieldsKeys)
      ? get(data, "model")
      : undefined; // it's a basket or unknown shape — fall back to context.model
  const safeModel = useModelParser<FieldsModel>(
    schema,
    safeData ?? model,
    baseModel,
    { allowExtraProps: false }
  );
  return Promise.resolve({ model: safeModel });
}

async function validate(
  { schema, model }: FieldsContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.basket_fields_validation_failed"),
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

async function update(
  { basketId, model }: FieldsContext,
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
    mutationKey: ["basket", "fields"],
    url: useUrl(`/orders/${basketId}`),
    data,
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  update: asyncDebounce(
    (context: FieldsContext, _event: AnyEventObject) => update(context, _event),
    {
      wait: useTime().SECOND,
      leading: false
      // onSuccess: result => {
      //   return result;
      // },
      // onError: error => {
      //   throw error;
      // }
    } // prevent rapid currency changes
  )
};
