// --- external

// --- internal
import { useApi } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { useModelParser } from "./utils";

// --- types
import type { PromotionsEvent, PromotionsContext } from "./types";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: PromotionsContext, _event: PromotionsEvent) {
  const { get, useUrl } = useApi();

  return get({
    url: useUrl("basket_promotions")
  }).then(({ data }) => ({ promotions: data }));
}

// --------------------------------------------------------

async function update(
  { basketId, promotions, model }: PromotionsContext,
  _event: PromotionsEvent
) {
  const { put, useUrl } = useApi();
  // rebuild the model with ALL custo mpromotions present, including nullish values
  const data = useModelParser({ promotions }, model);

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}`),
    data,
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
  update
};
