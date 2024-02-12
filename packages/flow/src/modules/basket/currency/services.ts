// --- external

// --- internal
import { useApi, useBrand } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { find, set } from "lodash-es";

// --- types
import type { CurrencyEvent, CurrencyContext } from "./types";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load({ model }: CurrencyContext, _event: CurrencyEvent) {
  const { getCurrencies, getCurrency, isReady } = useBrand();

  await isReady();
  const currencies = getCurrencies();

  // set our base model to match the default brand currency
  const baseModel = getCurrency();

  // check if weve been given a currency, and ensure its a valid & fully hydrated
  if (model?.id) {
    model = find(currencies, ["id", model.id]);
  }

  return new Promise((resolve, reject) => {
    if (currencies?.length) {
      resolve({ currencies, baseModel, model });
    } else {
      reject("No Currencies Available");
    }
  });
}

// --------------------------------------------------------

async function update(
  { basketId, model }: CurrencyContext,
  _event: CurrencyEvent
) {
  const { put, useUrl } = useApi();

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}/currency`),
    data: {
      currency_code: model?.code
    },
    withAccessToken: true
  });
}

// --------------------------------------------------------

async function parse({ model }: CurrencyContext, _event: CurrencyEvent) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: CurrencyContext,
  _event: CurrencyEvent
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
