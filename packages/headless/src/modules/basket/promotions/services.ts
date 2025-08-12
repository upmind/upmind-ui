// --- external

// --- internal
import { useQuery } from "../../..";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../../utils";
import { get, isEmpty, some, trim } from "lodash-es";

// --- types
import type { PromotionsContext } from "./types";
import type { AnyEventObject } from "xstate";
import { IBasketPromotion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function load(_context: PromotionsContext, _event: AnyEventObject) {
  // Promotions don't have any initial state to load, so we can pass through an empty object
  return Promise.resolve({});
}

async function add(
  { basketId, model, promotions }: PromotionsContext,
  _event: AnyEventObject
) {
  const { post, useUrl } = useQuery();

  if (!model?.promocode)
    return Promise.reject(
      new DetailedError(
        "No Promocode provided to add to basketId",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  if (some(promotions, { promocode: model?.promocode }))
    return Promise.reject(
      new DetailedError(
        "Promocode already exists in basketId",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  return post<IBasketPromotion[]>({
    url: useUrl(`/orders/${basketId}/promotions`),
    data: { promocode: trim(model?.promocode) },
    withAccessToken: true
  });
}

async function remove(
  { basketId }: PromotionsContext,
  { data }: AnyEventObject
) {
  const id = get(data, "id", data);

  if (!id)
    return Promise.reject(
      new DetailedError(
        "No Promotion provided to remove from basketId",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const { del, useUrl } = useQuery();

  return del({
    url: useUrl(`/orders/${basketId}/promotions/${id}`),
    withAccessToken: true
  });
}

async function parse(
  { model, schema }: PromotionsContext,
  _event: AnyEventObject
) {
  // ---
  model = useModelParser(schema, model);

  // we don't have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: PromotionsContext,
  _event: AnyEventObject
) {
  //---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model);

    if (errors?.length) {
      reject(
        new DetailedError(
          "Promotion validation failed",
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
  add,
  remove
};
