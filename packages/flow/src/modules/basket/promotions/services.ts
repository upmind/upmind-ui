// --- external

// --- internal
import { useApi } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { get } from "lodash-es";

// --- types
import type { PromotionsEvent, PromotionsContext } from "./types.d";

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
  { basket_id, model }: PromotionsContext,
  _event: PromotionsEvent
) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl(`/orders/${basket_id}/promotions`),
    data: { promocode: model?.code },
    withAccessToken: true
  });
}

async function remove(
  { basket_id }: PromotionsContext,
  { data }: PromotionsEvent
) {
  const id = get(data, "id", data);

  if (!id)
    return Promise.reject("No Promotion provided to remove from basket_id");

  const { del, useUrl } = useApi();

  return del({
    url: useUrl(`/orders/${basket_id}/promotions/${id}`),
    withAccessToken: true
  });
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
  remove
};
