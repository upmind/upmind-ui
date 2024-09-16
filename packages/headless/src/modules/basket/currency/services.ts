// --- external

// --- internal
import { useApi, useBrand } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { find } from "lodash-es";

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
  } else {
    model = baseModel;
  }

  return new Promise(resolve => {
    resolve({ currencies, baseModel, model });
  });
}

// --------------------------------------------------------

async function update(
  { basket_id, model }: CurrencyContext,
  _event: CurrencyEvent
) {
  const { put, useUrl } = useApi();

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basket_id}/currency`),
    data: {
      currency_code: model?.code,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------

async function parse(
  { model, currencies }: CurrencyContext,
  _event: CurrencyEvent
) {
  // ---
  // if we have a valid currency, lets hydrate it base don the code.
  const currency = find(currencies, ["code", model?.code]);
  return Promise.resolve({ model: currency });
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
  update,
};
