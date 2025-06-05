// --- external

// --- internal
import { useQuery } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { get, isEmpty, some, trim } from "lodash-es";

// --- types
import type { PromotionsContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load(_context: PromotionsContext, _event: AnyEventObject) {
  // Promotions dont have any initial state to load, so we can pass through an empty object
  return Promise.resolve({});
}

async function add(
  { basketId, model, promotions }: PromotionsContext,
  _event: AnyEventObject
) {
  const { post, useUrl } = useQuery();

  if (!model?.promocode)
    return Promise.reject(
      new Error("No Promocode provided to add to basketId")
    );
  if (some(promotions, { promocode: model?.promocode }))
    return Promise.reject(new Error("Promocode already exists in basketId"));

  return post({
    url: useUrl(`/orders/${basketId}/promotions`),
    data: { promocode: trim(model?.promocode) },
    withAccessToken: true,
  });
}

async function remove(
  { basketId }: PromotionsContext,
  { data }: AnyEventObject
) {
  const id = get(data, "id", data);

  if (!id)
    return Promise.reject(
      new Error("No Promotion provided to remove from basketId")
    );

  const { del, useUrl } = useQuery();

  return del({
    url: useUrl(`/orders/${basketId}/promotions/${id}`),
    withAccessToken: true,
  });
}

async function parse({ model }: PromotionsContext, _event: AnyEventObject) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
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

    // HACK: we want promocode to be invalid if empty, but not necessarily have an error
    if (errors?.length || isEmpty(model?.promocode)) {
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
  add,
  remove,
};
