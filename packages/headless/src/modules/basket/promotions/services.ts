// --- external

// --- internal
import { useApi } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { get, some } from "lodash-es";

// --- types
import type { PromotionsEvent, PromotionsContext } from "./types";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: PromotionsContext, _event: PromotionsEvent) {
  // Promotions dont have any initial state to load, so we can pass through an empty object
  return Promise.resolve({});
}

// --------------------------------------------------------

async function add(
  { basketId, model, promotions }: PromotionsContext,
  _event: PromotionsEvent
) {
  const { post, useUrl } = useApi();

  if (!model?.promocode)
    return Promise.reject("No Promocode provided to add to basketId");
  if (some(promotions, { promocode: model?.promocode }))
    return Promise.reject("Promocode already exists in basketId");

  return post({
    url: useUrl(`/orders/${basketId}/promotions`),
    // @ts-ignore
    data: { promocode: model?.promocode },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function remove(
  { basketId }: PromotionsContext,
  { data }: PromotionsEvent
) {
  const id = get(data, "id", data);

  if (!id)
    return Promise.reject("No Promotion provided to remove from basketId");

  const { del, useUrl } = useApi();

  return del({
    url: useUrl(`/orders/${basketId}/promotions/${id}`),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------

async function parse({ model }: PromotionsContext, _event: PromotionsEvent) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: PromotionsContext,
  _event: PromotionsEvent
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
  add,
  remove,
};
